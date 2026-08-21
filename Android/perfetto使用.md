# Perfetto 使用

Perfetto 是 Android 10+ 取代 systrace 的系统级跟踪工具（systrace/atrace 已废弃）。核心组成：

- **设备端**：`traced` / `traced_probes` 服务（负责采集）+ `perfetto` 命令行工具（用户接口），trace 为 protobuf 格式；
- **UI**：[ui.perfetto.dev](https://ui.perfetto.dev) 打开/在线录制 trace；
- **trace_processor**：把 trace 解析成可用 SQL 查询的数据库（UI 内嵌 + 独立 shell）。

## track抓取

启动一个 20 秒钟的跟踪，收集指定的数据源信息，并将跟踪文件保存到`/data/misc/perfetto-traces/trace_file.perfetto-trace`

```shell
#1. 首先执行命令
adb shell perfetto -o /data/misc/perfetto-traces/trace_file.perfetto-trace -t 20s sched freq idle am wm gfx view binder_driver hal dalvik camera input res memory

# 2. 操作手机，复现场景，比如滑动或者启动等

#3. 将 trace 文件 pull 到本地
adb pull /data/misc/perfetto-traces/trace_file.perfetto-trace
```

- 简单模式下的 `sched freq am wm ...` 参数本质上是启用对应的 atrace category 与 ftrace 事件；
- 抓取过程中 `Ctrl+C`（发送 SIGINT）可提前结束并正常落盘。

### 配置文件模式

需要精细控制（buffer 大小、采样周期、指定应用 atrace、heapprofd 等）时用 pbtxt（protobuf text format，配置的文本表示）：

```
# /data/local/tmp/trace_config.pbtx
duration_ms: 20000

buffers {
  size_kb: 65536
}

data_sources {
  config {
    name: "linux.ftrace"
    ftrace_config {
      ftrace_events: "sched_switch"
      ftrace_events: "sched_wakeup"
      atrace_categories: "gfx"
      atrace_categories: "view"
      atrace_apps: "com.example.app"   # 只记录指定应用的自定义 trace 点
    }
  }
}
```

```shell
adb push trace_config.pbtx /data/local/tmp/
adb shell perfetto -c /data/local/tmp/trace_config.pbtx --txt \
  -o /data/misc/perfetto-traces/trace.perfetto-trace
```

注意：pbtxt 文本配置必须加 `--txt`，否则只认二进制 protobuf。

### 长时间跟踪

```
duration_ms: 0                 # 不限时长
write_into_file: true          # 直接写入输出文件
file_write_period_ms: 1000     # 定期落盘，防止丢数据
```

```shell
adb shell perfetto -c /data/local/tmp/trace_config.pbtx --txt \
  -o /data/misc/perfetto-traces/long.perfetto-trace -d   # -d 后台 detach 运行
# 需要停止时向进程发 SIGINT，让其 flush 落盘
adb shell 'kill -INT $(pidof perfetto)'
```

- 长跟踪注意文件大小（可配 `max_file_size_kb` 限制上限，到达后停止记录并落盘）；
- 大部分环形 buffer 数据源在 write_into_file 模式下改为流式写文件。

### UI 在线录制

ui.perfetto.dev → **Record new trace** → 通过 WebUSB 直连设备（需要 Chrome + USB 调试），图形化勾选 probe（CPU / GPU / Memory / Android apps / Battery 等）后自动生成配置并抓取，适合不想手写配置的场景。

Android 9 及以下无 `perfetto` 命令：用 perfetto 仓库的 `tools/record_android_trace.py`，或退回 `atrace` / systrace。

## 常用数据源速查

| 简单模式参数 | 内容 | 典型场景 |
|---|---|---|
| sched | CPU 调度（sched_switch/wakeup） | 线程状态、调度延迟、唤醒链 |
| freq | CPU 各核频率 | 功耗、卡顿归因（频率没上去） |
| idle | CPU idle 状态 | 功耗、唤醒源分析 |
| am / wm | ActivityManager / WindowManager 跟踪点 | 启动流程、ANR、窗口切换 |
| gfx / view | 渲染与 View 系统跟踪点 | 掉帧、measure/layout 耗时 |
| binder_driver | binder 事务与锁 | 跨进程调用耗时 |
| hal | HAL（Hardware Abstraction Layer）跟踪点 | 相机等 HAL 层耗时 |
| dalvik | ART（Android Runtime）GC / JIT（Just-In-Time 编译）/ 堆 | GC 抖动、内存分析 |
| memory | 系统内存计数器（meminfo/vmstat/PSI，Pressure Stall Information） | 内存趋势 |
| camera / input / res / audio | 各子系统 atrace 点 | 对应场景 |
| process_stats（需配置） | 进程 RSS（Resident Set Size）等计数器 | 应用内存趋势 |
| heapprofd（需配置） | native 堆采样 | native 泄漏定位 |
| android.java_heap_dump（需配置） | Java 堆快照 | 对象级分析 |

## UI 操作

- 打开 trace：ui.perfetto.dev → Open trace file；
- 快捷键：`W/S` 缩放、`A/D` 左右平移、`Shift+W/Shift+S` 垂直缩放、`F` 聚焦选中区，按 `?` 查看完整列表；
- 点击 slice 后下方面板展开 Details（args、调用栈层级）；顶部选择进程/线程过滤轨道；
- 超大 trace 用网页（WASM，WebAssembly）打开会卡甚至崩溃，建议用本地 `trace_processor_shell`（见下）；
- 左下角 **Query (SQL)** 页面可直接对当前 trace 跑 SQL。

perfetto目前提供两种标记类型,标记的方式分别为:

- 点击最上方的时间轨道即可添加时间点标记.
- 而通过按住鼠标左键选中一块区域然后点击"shift+m"即可添加常驻区域标记:

### 时间戳

```
parent_tms=1719212453068
```

形如上面的 13 位数字是墙钟毫秒时间戳（epoch ms）。而 trace 内部的 `ts` 单位是**纳秒**，且基于单调时钟（从开机起算），与 logcat 的墙钟时间不能直接比较。对齐方法：用当前墙钟时间减去系统已运行时长得到开机时刻，再与 trace 时间相加：

```shell
date +%s%3N && adb shell cat /proc/uptime   # 两者相减 ≈ 开机时刻(ms)
```

trace 时间(ms) + 开机时刻(ms) ≈ logcat 时间(ms)。更精确的对齐建议直接在关键操作前后打 marker（见上），再用 marker 与 logcat 互相印证。

## trace_processor 与 SQL

### 命令行用法

```shell
# 交互式查询
trace_processor_shell trace.perfetto-trace

# 执行 SQL 文件输出结果
trace_processor_shell trace.perfetto-trace -q query.sql

# 单条查询
trace_processor_shell trace.perfetto-trace --query-string "select count(*) from slice"
```

### 常用表

| 表 | 内容 |
|---|---|
| slice | 所有跟踪点切片（track_id / ts / dur / name / depth） |
| thread / process | 线程、进程信息（utid / upid） |
| thread_track | 线程轨道，slice 与 thread 关联的桥梁 |
| sched | CPU 维度的调度片段 |
| thread_state | 线程状态（Running / Runnable / Sleeping / Uninterruptible…） |
| counter | 计数器轨道（内存、频率、RSS 等时序值） |
| actual_frame_timeline_slice | 帧时间线（掉帧/jank 分类） |

### 常用查询

主线程最耗时的 slice：

```sql
SELECT s.name, s.ts, s.dur/1e6 AS dur_ms
FROM slice s
JOIN thread_track tt ON s.track_id = tt.id
JOIN thread t ON t.utid = tt.utid
JOIN process p ON p.upid = t.upid
WHERE t.is_main_thread AND p.name = 'com.example.app'
ORDER BY s.dur DESC
LIMIT 20;
```

应用各线程的 CPU 状态分布（看调度等待/IO 等待）：

```sql
SELECT t.name AS thread, s.state, SUM(s.dur)/1e6 AS total_ms
FROM thread_state s
JOIN thread t USING(utid)
JOIN process p USING(upid)
WHERE p.name = 'com.example.app'
GROUP BY thread, s.state
ORDER BY total_ms DESC;
```

主线程调度延迟（Runnable 但拿不到 CPU 的时长）：

```sql
SELECT SUM(s.dur)/1e6 AS runnable_ms
FROM thread_state s
JOIN thread t USING(utid)
WHERE t.is_main_thread
  AND t.upid = (SELECT upid FROM process WHERE name = 'com.example.app')
  AND s.state = 'R';
```

binder 调用耗时 top（限定目标应用线程）：

```sql
SELECT s.name, COUNT(*) AS cnt,
       SUM(s.dur)/1e6 AS total_ms, MAX(s.dur)/1e6 AS max_ms
FROM slice s
JOIN thread_track tt ON s.track_id = tt.id
JOIN thread t ON t.utid = tt.utid
JOIN process p ON p.upid = t.upid
WHERE s.name LIKE 'binder%' AND p.name = 'com.example.app'
GROUP BY s.name
ORDER BY total_ms DESC
LIMIT 20;
```

掉帧查询（帧时间线，需开启 gfx 相关数据源）：

```sql
SELECT ts, dur/1e6 AS frame_ms, jank_bucket, jank_type
FROM actual_frame_timeline_slice
WHERE jank_bucket != 'None'
LIMIT 50;
```

## 常见分析场景

### 启动分析

- `am` 数据源能看到 ActivityTaskManager 的 slice（startActivity → activityStart → 首帧）；
- 冷启动看进程 fork、Application/onCreate、首帧渲染各段耗时；配合 `adb shell am start -W` 的输出互相印证。

### 卡顿 / 掉帧

- 主线程轨道看消息处理耗时，`binder_driver` 看跨进程等待；
- `thread_state` 区分：Running（计算密集）、Runnable（等 CPU，调度延迟）、Sleeping（等锁/binder）、Uninterruptible（IO）；
- 帧时间线的 jank 分类：App Deadline Missed（应用侧超时）、SurfaceFlinger Scheduling、Prediction Error、Display HAL 等，先分类再下钻。

### ANR

- 找到主线程输入事件超时前的时间窗，看主线程当时的 slice 与 thread_state；
- 常见归因：主线程 binder 同步调用耗时、锁等待、密集计算、IO。

### 内存分析

- `memory` / `process_stats` 数据源看内存随时间的曲线，与操作时间轴对齐找拐点；
- **heapprofd**（native 堆采样）配置示例：

  ```
  data_sources {
    config {
      name: "android.heapprofd"
      target_buffer: 0
      heapprofd_config {
        process_cmdline: "com.example.app"
        sampling_interval_bytes: 4096
        all_heaps: true
        block_client: true        # buffer 满时阻塞被测进程，保证数据完整
      }
    }
  }
  ```

- 抓完后 UI 中出现 Flamegraph 轨道，按调用栈聚合看分配量，持续增长的栈即泄漏嫌疑；原理与完整方法见 [Android内存分析](Android内存分析.md)。
- 实测非 debug（非 debuggable）进程无法被 Perfetto 抓取分析，heapprofd 等采样只对 debug 包生效；release 场景改用 `dumpsys meminfo` 观测趋势，或 KOOM 等进程内自采集方案，见 [Android内存分析](Android内存分析.md)。

### 功耗

- `freq` / `idle` 看大核占用与休眠情况；
- 结合 `sched_wakeup` 链找频繁唤醒源的进程/线程；支持 power rails 的设备可看实际电流；
- 部分厂商 ROM 的 trace 自带 DDR（物理内存）频率/带宽轨道：高内存带宽负载会拉高 DDR 频率、影响功耗与整机流畅度。

## 参考

- [Perfetto 官方文档](https://perfetto.dev/docs/)
- [Recording traces with perfetto](https://perfetto.dev/docs/quickstart/android-tracing)
- [trace_processor SQL 查询](https://perfetto.dev/docs/analysis/sql-tables)
- [Native heap profiler](https://perfetto.dev/docs/data-sources/native-heap-profiler)
- [Perfetto 内存分析案例](https://perfetto.dev/docs/case-studies/memory)
- [值得一看的 Perfetto 分析进阶](https://zhuanlan.zhihu.com/p/566475728)
- [Perfetto 基本使用](https://sharpcj.github.io/posts/Android-%E6%80%A7%E8%83%BD%E5%88%86%E6%9E%90%E5%B7%A5%E5%85%B7-Perfetto-%E7%9A%84%E5%9F%BA%E6%9C%AC%E4%BD%BF%E7%94%A8/)
