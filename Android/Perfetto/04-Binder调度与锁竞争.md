## 导读：Binder 为什么值得单独分析

Binder 承载着 Android 大部分系统服务与应用的交互，也常常是性能瓶颈的源头。可以把 Binder 粗暴理解成**跨进程的函数调用**：你在 A 进程里像调本地接口一样写代码，真正的调用与数据传输由 Binder 完成。它由四个组件协作：

| 组件 | 职责 |
|---|---|
| Client | 通过 IBinder.transact() 发起调用，把 Parcel 序列化数据写入内核 |
| Service（Server） | 通常在 system_server 等进程中，通过 Binder.onTransact() 读取 Parcel 执行业务 |
| Binder Driver | 内核模块 /dev/binder，负责线程池调度、缓冲区管理、优先级继承 |
| Thread Pool | 服务端的一组 Binder 线程；**按需创建**，Java 层默认上限约 15 个工作线程（不含主线程），Native 侧 ProcessState 默认也是 15 |

Android 采用多进程架构隔离应用、提升安全与稳定性，访问系统能力（相机、位置、通知）必须跨进程。传统 IPC 各有短板：Socket 开销大且缺少身份校验；Pipe 只支持父子进程单向通信；共享内存需要额外同步且没有访问控制。Binder 在内核层补齐三个关键能力：**身份与权限**（基于 UID/PID 校验调用方）、**同步与异步调用**（同步等返回是最常见模式；Oneway 异步发完即返回，适合通知类场景）、**优先级继承**（高优先级 Client 调低优先级 Server 时临时提升 Server，避免优先级反转）。

## 一次 Binder 调用在 Perfetto 里的样子

以 App 启动阶段的 `IActivityManager#attachApplication()` 为例（App 把自己「挂到」system_server 的一次同步调用），完整链路：

```text
App 进程 Proxy 侧：getService() 拿到 BinderProxy 代理 → 参数写入 Parcel → transact()
Binder 驱动：事务排入 system_server 的 Binder 线程队列 → 唤醒一个空闲线程（如 Binder:1460_5）
system_server Stub 侧：ActivityManagerService 被唤醒，读取参数进入处理
返回：结果写回 Parcel → 驱动唤醒原 App 线程 → App 线程从 waitForResponse() 返回
```

在 Trace 上的指纹：Android Binder / Transactions 轨道上出现事务切片（能解析到 AIDL 信息时名为 `AIDL::java::IActivityManager::attachApplication::client/server`）；App 线程在 thread_state 上处于 S（同步调用等待返回），blocked_function 多为 binder_thread_read / epoll_wait / ioctl(BINDER_WRITE_READ)；system_server 侧对应 Binder 线程出现 Running 切片；Perfetto 还会用 **Flow 箭头**把 Client 的 transact 与 Server 的处理线程连起来：

<img src="/Android/Perfetto/images/10-01.webp" width="800" alt="一次同步 Binder 调用在 Perfetto 中的完整呈现" />

## 观测准备：数据源与推荐配置

> 说明：UI 里的 Android Binder / Transactions、Android Binder / Oneway Calls 轨道，以及 PerfettoSQL 标准库的 android.binder / android.monitor_contention 模块，都是 trace processor 侧基于原始事件解析聚合出来的，**不是需要额外开启的录制数据源**。录制侧真正需要的是 linux.ftrace 与 linux.process_stats。

| 数据源 | 作用 | 开销 |
|---|---|---|
| linux.ftrace（binder/*） | 内核层 Binder 事件：事务开始、服务端收到、缓冲区分配（诊断 TransactionTooLarge）、优先级继承 | 低 |
| linux.ftrace（sched/*） | 调度事件，串联 Client 与 Server 线程的唤醒链 | 中 |
| linux.ftrace（atrace: dalvik 等） | Framework 切片 + ART 的 Java Monitor Contention（锁竞争） | 低-中 |
| linux.process_stats | PID/TID 到进程名/线程名的映射，UI 与 SQL 过滤都靠它 | 极低，建议常开 |

推荐配置模板（保存为 binder_config.pbtx，Android 11+ 开箱即用；Android 9/10 需先 `setprop persist.traced.enable 1`）：

```protobuf
buffers {
  size_kb: 65536
  fill_policy: RING_BUFFER
}
duration_ms: 15000

data_sources {
  config {
    name: "linux.ftrace"
    ftrace_config {
      # Binder 核心事件
      ftrace_events: "binder/binder_transaction"           # 事务开始
      ftrace_events: "binder/binder_transaction_received"  # 服务端收到事务
      ftrace_events: "binder/binder_transaction_alloc_buf" # 缓冲区分配，诊断 TransactionTooLarge
      ftrace_events: "binder/binder_set_priority"          # 优先级继承
      # 调度事件：串联 Client 与 Server 线程
      ftrace_events: "sched/sched_switch"
      ftrace_events: "sched/sched_waking"
      ftrace_events: "sched/sched_wakeup"
      ftrace_events: "sched/sched_blocked_reason"          # 阻塞原因
      # atrace 类别：dalvik 采集 Java Monitor Contention
      atrace_categories: "binder_driver"
      atrace_categories: "sched"
      atrace_categories: "am"
      atrace_categories: "wm"
      atrace_categories: "dalvik"
      # atrace_apps: "com.example.app"   # 需要应用侧 Trace 点时指定包名
      symbolize_ksyms: true
      compact_sched {
        enabled: true
      }
    }
  }
}
data_sources {
  config {
    name: "linux.process_stats"
    process_stats_config {
      scan_all_processes_on_start: true
    }
  }
}
```

两个备注：binder_lock/binder_locked/binder_unlock 三个事件只存在于 4.14 之前的老内核（Binder 改为细粒度锁后已删除），现代设备开了也没数据；老内核全局锁的等待分析已被 dalvik 的 monitor contention 信号取代。抓取三步：

```bash
adb push binder_config.pbtx /data/local/tmp/
adb shell perfetto --txt -c /data/local/tmp/binder_config.pbtx \
  -o /data/misc/perfetto-traces/trace.pftrace
# 操作手机复现问题
adb pull /data/misc/perfetto-traces/trace.pftrace .
```

打开 ui.perfetto.dev 拖入文件后，在 Tracks → Add new track 里搜索 Binder 添加 **Android Binder / Transactions** 与 **Android Binder / Oneway Calls**，搜索 Lock 添加 **Thread / Lock contention**（有数据时）。

### 两个辅助工具

**am trace-ipc**（系统自带，零配置无需 root）：追踪 Java 层 Binder 调用堆栈，`adb shell am trace-ipc start` → 操作 → `am trace-ipc stop --dump-file /data/local/tmp/ipc-trace.txt` → pull。输出按进程分组列出调用栈与次数（Count），适合快速回答「调了哪些服务、各调了多少次」。与 Perfetto 配合：Perfetto 看时间线与线程关系，trace-ipc 补「具体哪个 Java 调用点发起」。

**binder-trace**（开源，基于 Frida 动态注入，需 root 或模拟器 + frida-server）：实时拦截解析 Binder 消息，能看到接口、方法与部分参数，被称为「Binder 的 Wireshark」，适合安全研究、逆向等「看消息内容」的场景。日常性能排查仍以 Perfetto + am trace-ipc 为主。

## 步骤一：定位事务耗时，拆解三段延迟

拿到 Trace 不要大海捞针。定位目标事务的三种方式：知道发起进程就直接在 Transactions 轨道找 App 作为 Client 的区域；知道接口名按 `/` 搜索 AIDL 接口名、方法名或完整 slice 名（如 `AIDL::java::IActivityManager::attachApplication::server`）；排查 UI 卡顿时先看主线程 thread_state 上的长 S 段——主线程长时间不执行代码，多半就是在等 Binder 返回，那里就是起点。

选中事务后，用 android_binder_txns 表统一理解三段关键耗时（UI 版本间字段名有差异时，以 SQL 为准）：

- **client_dur**：客户端端到端耗时（同步调用时基本就是「我等这次返回」的时间）
- **server_dur**：服务端从开始处理到发出 reply 的时长
- **dispatch_dur = server_ts - client_ts**：从客户端发起到服务端真正开始处理的延迟（含排队、线程可用性、调度影响）

找出最慢同步事务的查询（直接在 UI 的 Query 页运行）：

```sql
INCLUDE PERFETTO MODULE android.binder;
SELECT
  aidl_name,
  method_name,
  client_process,
  client_thread,
  client_dur / 1e6 AS client_ms,
  server_process,
  server_thread,
  server_dur / 1e6 AS server_ms,
  (server_ts - client_ts) / 1e6 AS dispatch_ms
FROM android_binder_txns
WHERE is_sync
ORDER BY client_dur DESC
LIMIT 20;
```

<img src="/Android/Perfetto/images/10-02.webp" width="760" alt="SQL 拆解最慢事务的三段耗时" />

三段耗时的关系决定深挖方向：**client_dur 长而 server_dur 短**，慢在派发/排队（dispatch_dur 大），去看服务端线程池与调度（步骤二）；**server_dur 本身就长**，跳到服务端 Binder 线程看它在干嘛——跑业务、等锁还是等 I/O（步骤三）。

## 步骤二：评估线程池与 Oneway 队列

### 线程池规模：按需增长，没有单一固定数字

每个服务端进程在驱动里维护线程池，实际线程数按负载增减，上限由内核 max_threads 与用户态 ProcessState 配置共同决定。普通应用上限通常 15 左右（libbinder 默认值）；**system_server 启动时显式把上限调高到 31**。厂商 ROM 会按自己的负载模型调整（几十条都有可能），所以不要死记数字——在 Perfetto 里展开进程，数有多少个 `Binder:xxx_y` 线程轨道、看它们的活跃度，以此评估规模与繁忙度。

### 「Binder 耗尽」的三种含义，别混着谈

| 资源限制 | 机制 | Trace/日志表现 | 解法方向 |
|---|---|---|---|
| 线程池耗尽 | 所有 Binder 工作线程处于忙碌状态，无空闲线程可被驱动唤醒 | Client 长时间停在 S（调用栈停在 ioctl(BINDER_WRITE_READ)/epoll_wait）；大量事务 dispatch_dur 显著偏大 | 查服务端处理慢或等锁的根因；system_server 打满会放大为全局卡顿甚至 ANR |
| 事务缓冲区耗尽 | 每进程在驱动里约 1MB 的共享缓冲区承载传输中的 Parcel | binder_transaction_alloc_buf 失败日志；TransactionTooLargeException；后续事务排队失败 | 控制单次数据量（拆包、分页、流式），大数据改 SharedMemory/文件/ParcelFileDescriptor；**不是多开线程** |
| 引用表/对象超限 | 驱动为每进程维护引用表与节点对象 | 少见；长期持有大量 Binder 引用不释放 | 更多是内存/稳定性问题，而非 UI 卡顿 |

分析时带着这个判断框架：**现在的慢，是因为线程池被打满，还是事务过大/缓冲区用光？**前者看线程数与 thread_state、看 dispatch_dur；后者看单次事务大小、并发量与 TransactionTooLarge 相关日志。

### Oneway 调用的识别与风险

同步（Two-way）与异步（Oneway）在 Perfetto 上区别明显：同步调用 Client 阻塞等待（thread_state 为 S），有 transaction → reply 的完整 Flow；Oneway 发完即返回，Flow 只有单向 transaction、没有 reply，slice 名可能带 [oneway] 标记，SQL 里用 `android_binder_txns.is_sync = 0` 过滤。

Oneway 的两个关注点：服务端队列深度（同一 IBinder 上的 Oneway 堆积，后续请求执行时机被不断延后）；批量发送尖峰（短时间大量 Oneway 在服务端 Binder 线程上形成密集短切片）：

<img src="/Android/Perfetto/images/10-03.webp" width="760" alt="Oneway 请求在服务端排队" />

特别注意：system_server 的 Binder 线程还要处理系统内部调用（ActivityManagerService 调 WindowManagerService、后者再调 SurfaceFlinger 等）。某个「行为不端」的 App 短时间疯狂发 Oneway，可能塞满某个系统服务的 Oneway 队列，拖慢其他 App 的异步回调，造成全局性卡顿。

## 步骤三：排查锁竞争

服务端 Binder 线程处理你的请求期间长时间处于 S/D，说明它在等资源——等锁或等 I/O。SystemServer 里大量服务共享全局状态（WindowManagerService 的 mGlobalLock、ActivityManagerService 的内部锁等），都用 synchronized 保护，锁竞争是 SystemServer 最常见的瓶颈来源。

**Java 锁（Monitor Contention）**：Binder 线程状态为 S 且 blocked_function 含 futex 相关符号（如 futex_wait），基本可确定在等 Java 锁。Lock contention 轨道会把竞争可视化：连线标出 Owner（持锁线程，如 android.display）与 Waiter（等锁线程，如 Binder:123_1），点击 Contention slice 还能在 Details 看到锁对象的类名（如 com.android.server.wm.WindowManagerGlobalLock）：

<img src="/Android/Perfetto/images/10-04.webp" width="760" alt="Lock contention 轨道标出 Owner 与 Waiter" />

用标准库的 android_monitor_contention 表做统计（由 ART 的 monitor contention slice 解析而来，别手工解析 slice 名字符串）：

```sql
INCLUDE PERFETTO MODULE android.monitor_contention;
SELECT
  process_name,
  blocked_thread_name AS waiter_thread,
  blocking_thread_name AS owner_thread,
  (dur / 1e6) AS dur_ms,
  (waiter_count + 1) AS waiter_threads,
  short_blocked_method,
  short_blocking_method,
  blocked_src,
  blocking_src
FROM android_monitor_contention
WHERE process_name = 'system_server'
ORDER BY dur DESC
LIMIT 50;
```

<img src="/Android/Perfetto/images/10-05.webp" width="760" alt="monitor contention 统计结果" />

查不到数据时确认两点：抓取配置的 atrace_categories 包含 dalvik；问题场景中确实发生了 monitor contention。

**Native 锁（Mutex/RwLock）**相对少见：表现形式类似（S/D），但调用栈出现的是 __mutex_lock、pthread_mutex_lock、rwsem 等 native 符号，需结合 sched_blocked_reason 事件看具体等什么，属于进阶内容。

## 平台新特性与开发者建议

| 特性 | 版本 | 内容 |
|---|---|---|
| Binder Freeze | Android 12+ | Cached 进程被冻结后几乎不获得 CPU；对其同步 Binder 调用会被拒绝并可能触发目标进程终止；Oneway 事务通常先缓冲、解冻后处理 |
| Frozen-callee 回调策略 | Android 16（API 36） | RemoteCallbackList 新增 Builder 与 frozen callee policy（DROP / ENQUEUE_MOST_RECENT / ENQUEUE_ALL），控制目标进程冻结期间回调的堆积方式，降低解冻后的抖动 |
| Heavy Hitter Watcher | 版本相关 | 识别短时间内占比异常高的 Binder 调用热点，启用方式与阈值依设备配置而定 |

给开发者的三条建议：**Oneway** 只在确实不需要返回值与完成时机时使用（日志、状态通知），把同步调用硬改 Oneway 只会把等待转移到服务端队列并引入时序问题；**大数据传输**别走 Binder（尤其 Bitmap），单进程缓冲区约 1MB，容易 TransactionTooLargeException，改用 SharedMemory、文件或 ParcelFileDescriptor；**主线程**不要调用耗时不可控的 Binder 服务，必须调用时放后台线程、完成后再回主线程更新 UI。

## 来源

- [Android Perfetto 系列 10：Binder 调度与锁竞争](https://www.androidperformance.com/2025/11/16/Android-Perfetto-10-Binder/)
