## 导读：从截图结论到可复查的证据

拿到一份卡顿 Trace，多数人的第一反应是打开 UI、框一段时间、看主线程、截图写结论。这处理眼前问题没问题，但回答不了追问：换一份 Trace 结论还成立吗？下个版本修完怎么确认没回归？这篇的路线只有一条：**把 UI 里的判断写成能复查的查询，批量跑多份 Trace，沉淀成稳定指标——前提是先搞清这份 Trace 的证据完不完整**。

工程上 SQL 分析分三类用法：临时排查（UI 里发现可疑段，用 SQL 查成时间、线程、进程、耗时等原始证据）、专项分析（几十份同类 Trace 输出同一组诊断字段）、回归检测（每个版本跑同一组查询，before/after 进报告或看板）。UI 依然有价值，SQL 的职责是把判断保存下来。

## Trace Processor 与 PerfettoSQL 入门

Trace Processor 是 Perfetto 的分析引擎，把 .perfetto-trace、Chrome trace、simpleperf protobuf 等解析成统一的 SQL 表；UI 里的很多轨道本身就是这些表查询出来的。命令行入口（官方现在统一为 trace_processor，一个 Python 包装脚本，首次运行按平台拉取原生可执行文件）：

```bash
# 下载并进入交互式 SQL 环境
curl -LO https://get.perfetto.dev/trace_processor
chmod +x ./trace_processor
./trace_processor interactive trace.perfetto-trace

# 批处理：加载、执行 SQL、打印结果
./trace_processor query trace.perfetto-trace \
  "SELECT ts, dur, name FROM slice LIMIT 5;"

# 大 Trace 让本地 UI 连接本机解析服务（配合 ui.perfetto.dev 弹框）
./trace_processor server http trace.perfetto-trace
```

旧的 trace_processor_shell、--httpd 入口仍有兼容层，但团队内建议统一子命令写法——同一个动作有两种写法，半年后就没人知道哪个是当前推荐路径。

### 把 Trace 当成几张表

入门不必背完整 schema，先记住这几类：

| 类型 | 常见表 | 用途 |
|---|---|---|
| 时间片 | slice | 有开始时间与时长的事件（ATrace、Track Event、派生切片） |
| 计数器 | counter、counter_track | 随时间变化的数值：频率、内存、功耗、业务计数 |
| 线程与进程 | thread、process | 名称、tid/pid、utid/upid |
| 轨道 | track、thread_track、process_track | 事件归属关系；UI 可视轨道不一定与之一一对应 |
| 调度状态 | thread_state、sched | 线程状态 / 实际占用 CPU 的 Running 区间 |
| CPU 采样 | perf_sample、cpu_profile_stack_sample | profiling 采样事实表 |
| 调用栈维表 | stack_profile_* | callsite、frame、mapping，与采样表配合 |
| 完整性 | stats | 数据丢失、解析异常、buffer 问题 |

### 四个容易踩的口径

- **身份归属**：tid/pid 系统里会复用，同一份 Trace 里也有多个同名线程；utid/upid 才是本次 Trace 内唯一的线程/进程实体，脚本里优先用它，线程名只用来读。
- **时间单位**：ts/dur 默认纳秒。临时查询 `/ 1e6` 转毫秒没问题，脚本里建议引入 time.conversion 模块用 time_to_ms()/time_from_ms() 把单位写进 SQL。
- **counter.value 没有统一单位**：CPU 频率、内存、power rail、业务计数不能按同一套 AVG 口径比较，要结合 counter_track 与采集配置解释。
- **stdlib 视图不是原始表**：thread_slice 这类名字来自 slices.with_context 标准库模块（提前关联好 slice/track/thread/process），查询前的 `INCLUDE PERFETTO MODULE ...` 不能漏。

SQL 报错先分三类再动手：INCLUDE 失败或模块不存在 → 本地 Trace Processor 太旧（先跑 --version 决定升级）；no such table/column → 漏了 INCLUDE 或 schema 演进（用 `PRAGMA table_info(table_name);` 确认列名）；查询成功但 0 行 → 数据没采到或窗口选错，这不是语法问题，回 stats 和采集配置。三类处理路径完全不同。

## 一次完整分析怎么写成 SQL

场景：UI 里发现目标窗口内主线程有明显停顿，现在把这次判断变成可复查的查询。顺序固定：**采集质量 → 窗口 → 线程 → 可疑点 → 调度状态**。

### 第一步：stats 体检决定结论语气

```sql
SELECT
  name, idx, severity, source, value,
  CASE
    WHEN severity = 'data_loss' AND LOWER(name) LIKE '%ftrace%' THEN 'sched_or_ftrace_degraded'
    WHEN LOWER(name) LIKE '%frame_timeline%' THEN 'frame_timeline_degraded'
    WHEN LOWER(name) LIKE '%track_event%' THEN 'track_event_degraded'
    WHEN severity IN ('error', 'data_loss') THEN 'metric_dependency_check_required'
    ELSE 'configuration_or_parser_context'
  END AS metric_impact_hint
FROM stats
WHERE value != 0
  AND (
    severity IN ('error', 'data_loss')
    OR LOWER(name) LIKE '%loss%'
    OR LOWER(name) LIKE '%drop%'
    OR LOWER(name) LIKE '%parse%'
  )
ORDER BY severity, source, name, idx;
```

出现 data_loss、parser error、buffer overrun 相关内容时，后面的判断都要降语气。注意影响范围是按数据源隔离的：ftrace loss 影响调度归因，但不一定让 App Track Event 不可用；FrameTimeline 缺失影响帧指标，但不一定影响 Binder/内存查询。做帧指标前还要确认 FrameTimeline 数据存在（查 actual/expected_frame_timeline_slice 行数），返回 0 行时报告写「帧指标不可用」，不要退回用 RenderThread 长 slice 冒充慢帧结论。

### 第二步：把目标窗口固定成字段

窗口不能停留在「UI 里框了一段」，脚本需要明确的 start_ts/end_ts。最稳的来源是 App 自己打的 Trace.beginSection() 或 Track Event 标记：

```sql
INCLUDE PERFETTO MODULE slices.with_context;
INCLUDE PERFETTO MODULE time.conversion;
SELECT
  name AS window_name,
  ts AS start_ts,
  ts + dur AS end_ts,
  time_to_ms(dur) AS duration_ms,
  process_name, thread_name
FROM thread_slice
WHERE process_name = 'com.example.app'
  AND name = 'feed_scroll'
  AND dur > 0
ORDER BY ts
LIMIT 10;
```

窗口也可以来自 FrameTimeline 的目标帧、输入事件或 UI 选区，但都要落成同样的 start_ts/end_ts 字段并写进报告。

### 第三步：不要只靠 main 找线程

`thread.name = 'main'` 在系统 Trace 里会误伤——每个 App 都可能有一个 main。先列出目标进程的线程，确认 upid/utid（注意多进程 App 有 :remote、:push、WebView sandbox、isolated process，UI 问题选承载 Activity/FrameTimeline 的进程，跨进程路径保留多个 upid，不要合并成「App 总耗时」）：

```sql
SELECT p.name AS process_name, p.upid, th.name AS thread_name,
       th.utid, th.is_main_thread
FROM process p JOIN thread th USING (upid)
WHERE p.name GLOB 'com.example.app*'
ORDER BY p.name, th.is_main_thread DESC, th.name;
```

### 第四步：长切片只是可疑点

查目标窗口内主线程与 RenderThread 超过 5ms 的切片（与窗口做交集，overlap 表示窗口内实际占用的部分）：

```sql
INCLUDE PERFETTO MODULE slices.with_context;
INCLUDE PERFETTO MODULE time.conversion;
WITH target_window(start_ts, end_ts) AS (
  VALUES (123000000000, 123500000000)
)
SELECT
  s.thread_name, s.name,
  time_to_ms(MAX(0, MIN(s.ts + s.dur, w.end_ts) - MAX(s.ts, w.start_ts))) AS overlap_ms,
  time_to_ms(s.dur) AS original_dur_ms
FROM thread_slice s
JOIN target_window w
WHERE s.process_name = 'com.example.app'
  AND (s.is_main_thread = 1 OR s.thread_name = 'RenderThread')
  AND s.dur > 0
  AND s.ts < w.end_ts AND s.ts + s.dur > w.start_ts
GROUP BY s.thread_name, s.name, s.dur
HAVING overlap_ms > time_from_ms(5)
ORDER BY overlap_ms DESC;
```

它对应 UI 里的「找主线程长任务」，只列可疑点：哪个线程、哪个切片、占多久。不直接给根因，也不能替代慢帧指标。

### 第五步：Runnable 不是 Running

长切片可能是代码执行了很久，也可能是切片跨过了等待时间，要下钻到调度状态：Running 是实际占用 CPU；R、R+ 是可运行但没在跑（R+ 通常代表被抢占后仍 runnable）。把各状态在窗口内的时间拆开统计：

```sql
INCLUDE PERFETTO MODULE time.conversion;
WITH target_window(start_ts, end_ts) AS (
  VALUES (123000000000, 123500000000)
),
state_in_window AS (
  SELECT
    th.name AS thread_name,
    CASE
      WHEN ts.state = 'Running' THEN 'running'
      WHEN ts.state GLOB 'R*' THEN 'runnable'
      WHEN ts.state = 'S' THEN 'interruptible_sleep'
      WHEN ts.state = 'D' THEN 'uninterruptible_blocked'
      ELSE 'other_' || ts.state
    END AS state_bucket,
    MAX(0, MIN(ts.ts + ts.dur, w.end_ts) - MAX(ts.ts, w.start_ts)) AS overlap_dur
  FROM thread_state ts
  JOIN thread th USING (utid)
  JOIN process p USING (upid)
  JOIN target_window w
  WHERE p.name = 'com.example.app'
    AND (th.is_main_thread = 1 OR th.name = 'RenderThread')
    AND ts.dur > 0
    AND ts.ts < w.end_ts AND ts.ts + ts.dur > w.start_ts
)
SELECT thread_name, state_bucket,
       time_to_ms(SUM(overlap_dur)) AS overlap_ms
FROM state_in_window
GROUP BY thread_name, state_bucket
ORDER BY thread_name, overlap_ms DESC;
```

解读边界：S 常见于正常 sleep 或 futex 等待，D 更接近不可中断等待，定责时结合 blocked reason、io_wait、waker 字段。出现长 Runnable 说明 CPU 竞争或调度延迟也要一起查，但它单独不能定责——CPU busy、cluster 解释要另查 sched.cpu、CPU idle/frequency/capacity 并限制在同一窗口。做调度分析前先确认窗口内有 thread_state/sched 数据（stats 有 ftrace loss 时输出 insufficient_sched_evidence，不能写「没有调度问题」）。

### 第六步：放进命令行

```bash
./trace_processor query -f queries/slow_slices.sql trace.perfetto-trace
```

到这一步，分析从截图变成了文本文件——可以评审、复用、进 CI（Continuous Integration，持续集成）。

## Python 批量与回归检测

一份 Trace 可以用 UI 慢慢看，多份 Trace 就该让脚本跑。`pip install perfetto` 后用 TraceProcessor 打开、tp.query() 执行。批量脚本的四件事：读 Trace → 读同名 .json 元数据（场景、窗口起止、包名）→ 跑质量门禁（上面的 stats 查询 + FrameTimeline 行数）→ 按同一窗口输出稳定字段到 CSV。

CI 上有两条纪律：固定 perfetto Python 包版本，并预热/缓存原生 Trace Processor 二进制（TraceProcessorConfig(bin_path=...) 可指定预下发的二进制），把 trace_processor --version、TraceConfig id、SQL package version 写进 metadata——否则一次工具升级就会让 before/after 的解析口径漂移。

Trace 数量上来后，手写循环可换官方 BatchTraceProcessor，同一份 SQL 按份返回或合并成一张带来源的表：

```python
import glob
from perfetto.batch_trace_processor.api import BatchTraceProcessor

files = glob.glob("traces/*.perfetto-trace")
with BatchTraceProcessor(files) as btp:
    result = btp.query_and_flatten(QUERY)   # QUERY 即上文窗口化 SQL
    print(result)
```

代价是内存与并发要受控：上百份大 Trace 先用少量样本试跑，确认内存与耗时再放量。

### 多 Trace 的输入契约

单份 Trace 定位一个现场，多份才能回答「优化有没有稳定变好」。每批 Trace 至少带这些字段（放文件名、metadata.json 或测试平台）：

| 字段 | 例子 | 用途 |
|---|---|---|
| trace_name | after-run03.perfetto-trace | 追溯原始文件 |
| scenario | feed_scroll_120hz | 区分场景 |
| group | before / after | 版本对比 |
| device / build | Pixel_8 / UP1A.xxx | 按机型与系统版本聚合 |
| config_id | ui_jank_v4 | 确认 TraceConfig 一致 |
| duration_ms / thermal_state | 30000 / nominal | 采集窗口与温控干扰 |
| trace_processor_version / sql_package_version | v49.0 / perf-v3 | 排除工具漂移 |

回归判定不要只比平均值：同时保留中位数、p95、最差值与每次原始值；5 组 before/after 只能发现明显退化，证明不了 1~2% 的变化。常见指标的方向性参考：FrameTimeline overrun 与 jank rate 越低越好（看 p95、worst、jank_type 分布与有效帧数）；launch duration 越低越好（起止点单独定义）；slow binder count 越低越好（也看是否集中在同一阶段）；CPU Running time 不一定（结合场景与帧窗口）；RSS/PSS 通常越低越好（看峰值与增长斜率）；功耗仅同设备同条件 A/B 才有意义。

### 从临时查询到稳定指标与 Trace Summary

临时 SQL 用来探索，进工程前补四组约束：**输出契约**（列名、单位、排序固定，dur > time_from_ms(5) 比裸写 5e6 可读）；**身份归属**（utid/upid 为准）；**目标窗口**（报告带 window_source/name/start_ms/dur_ms）；**数据质量**（每份带 stats 明细与降级字段 quality_grade/degrade_reason/fallback_used）。一个实用标准：查询结果能不能直接放进版本对比——还要人解释「这列上次叫 A 这次叫 B」，就还不是稳定指标。

需要接平台、看板、CI 时，把指标写进 Trace Summary（统一 TraceSummary protobuf，当前入口为 summarize 子命令），示例 spec：

```protobuf
metric_spec {
  id: "memory_per_process"
  dimensions: "process_name"
  value: "avg_rss_and_swap"
  unit: BYTES
  polarity: LOWER_IS_BETTER
  query {
    table {
      table_name: "memory_rss_and_swap_per_process"
    }
    referenced_modules: "linux.memory.process"
    group_by {
      column_names: "process_name"
      aggregates {
        column_name: "rss_and_swap"
        op: DURATION_WEIGHTED_MEAN
        result_column_name: "avg_rss_and_swap"
      }
    }
  }
}
```

```bash
./trace_processor summarize --metrics-v2 memory_per_process \
  trace.perfetto-trace spec.textproto
```

内存、启动、帧、Binder、CPU、功耗这类跨版本长期指标适合迁入 Trace Summary；临时排障继续直接写 SQL 即可。项目可先用 Python + CSV 起步，字段稳定后再迁。

## Trace 有数据，不代表证据完整

SQL 只能分析 Trace 里**还存在的证据**。Perfetto 不是无损录像机，写入路径为低开销做了异步化，任意一段跟不上都会丢数据：

| 阶段 | 位置 | 常见问题 |
|---|---|---|
| 数据源产生事件 | traced_probes、App/native 进程、heapprofd | 事件开太多、突发写入太密 |
| producer 共享内存 | 每个 producer 与 traced 之间（默认约 256KB，经验范围 128~512KB） | 大包突发，写入快过搬运 |
| central buffer | TraceConfig 的 buffers | RING 覆盖旧数据，DISCARD 丢新数据 |
| 输出文件与解析 | trace 文件、Trace Processor | 写文件不及时、排序或 clock 异常 |

linux.ftrace 还多一段内核 per-CPU buffer：内核事件先进各 CPU 的 buffer，再由 traced_probes 周期读取，开 sched/Binder/IRQ 及厂商 GPU 事件后这一段最容易出问题。增量状态（track descriptor、interned strings、进程/线程元数据）是跨阶段问题，一旦被覆盖或缺包，后续事件可能只剩 ID。

Buffers and dataflow 文档有个实用估算：**总写入速率 2MB/s 时，16MB central buffer 只能保留约 8 秒**。录 60 秒不代表每个 buffer 都保存了 60 秒数据——Trace 时间轴长度、buffer 可保留窗口、各类数据源的实际覆盖，是三件不同的事。一条 SQL 即可验收（对每类高频表看最早最晚事件，与 Trace 边界对比；RING_BUFFER 下高频源 min_ts 明显晚于 trace_start() 的那段，就是被覆盖掉的窗口）：

```sql
SELECT 'trace' AS source, trace_start() AS min_ts, trace_end() AS max_ts
UNION ALL SELECT 'sched', MIN(ts), MAX(ts + dur) FROM sched
UNION ALL SELECT 'slice', MIN(ts), MAX(ts + dur) FROM slice
UNION ALL SELECT 'counter', MIN(ts), MAX(ts) FROM counter;
```

典型的现场：UI 里能看到卡顿帧与主线程切片，但 stats 同时出现 ftrace_cpu_has_data_loss。这时要分清证据来源——Android 12+ 且启用 FrameTimeline 时，目标窗口内 expected/actual 完整且无 parser 异常，帧入口仍可信；但来自 ftrace 的 Choreographer/HWUI/RenderThread 切片与 Runnable/wakeup 结论都要降级，「没有看到 Runnable 等待」不能写成「没有调度问题」。

## 用 stats 给 Trace 做体检

这条体检 SQL 适合放在每个分析脚本开头（注意 SQL 里 severity 是小写的 error/data_loss/info，官方文档表格里的 kError 是记法差异）：

```sql
SELECT name, idx, severity, source, value
FROM stats
WHERE value != 0
  AND (
    severity IN ('error', 'data_loss')
    OR name IN (
      'traced_buf_chunks_overwritten',
      'traced_buf_chunks_discarded',
      'ftrace_setup_errors',
      'frame_timeline_event_parser_errors',
      'frame_timeline_unpaired_end_event',
      'config_write_into_file_no_flush',
      'traced_flushes_failed',
      'traced_final_flush_failed'
    )
    OR name GLOB 'clock_sync_failure*'
  )
ORDER BY name, idx;
```

读到非零项后追问三件事：丢在哪里、影响什么、下次怎么补。常见项的处置映射：

| stats 现象 | 影响的数据源 | 不能再回答的问题 | 处理 |
|---|---|---|---|
| ftrace_cpu_has_data_loss | sched、thread_state、wakeup、Binder 内核事件 | 不能写「没有 Runnable 等待」「没有调度阻塞」 | 调度归因降级，必要时复抓 |
| traced_buf_chunks_overwritten / discarded | 命中同一 buffer 的数据源 | 被覆盖窗口内的 marker、FrameTimeline、元数据 | 按 idx 定位 buffer，复抓或降级 |
| FrameTimeline 有行但目标窗口覆盖不全 | FrameTimeline | 不能证明帧指标完整 | 输出 frame_metrics_partial |
| clock_sync_failure* | 时间戳转换 | 精确时序、duration、跨线程排序 | 按时间语义不可信处理 |
| perf_* / heapprofd_* / meminfo_* | profiling、native 分配、内存口径 | 对应 profile 或内存结论 | 指标级降级 |

source 字段也要看：source = 'trace' 指采集或 trace 内容问题，回 TraceConfig/producer/设备能力；source = 'analysis' 偏 Trace Processor 导入解析阶段，看导入参数、解析器版本与 trace 格式。看到 parser error 不要默认只靠加 buffer 解决。

## 五类丢失的定位与解法

### ftrace 丢失：内核事件跟不上

ftrace_cpu_has_data_loss 说明 per-CPU buffer 到用户态读取这段丢了数据，典型原因是事件开太多或设备压力大时读取不及时。ftrace_cpu_overrun_* 只能辅助判断哪个 CPU overrun，不能精确还原丢失的时间段。影响范围：CPU 调度、Runnable、唤醒关系、Binder 内核事件的负向结论全部降级。调参方向：

```protobuf
data_sources {
  config {
    name: "linux.ftrace"
    target_buffer: 0
    ftrace_config {
      ftrace_events: "sched/sched_switch"
      ftrace_events: "sched/sched_waking"
      buffer_size_kb: 32768   # 增大内核每 CPU buffer
      drain_period_ms: 100    # 更频繁地读取
    }
  }
}
```

更有效的动作是**删事件**：滑动 jank 先只留 sched_switch、sched_waking、FrameTimeline 和 App marker；Binder 慢才开 binder events；Camera open 才加 Camera/GPU 事件。高频 ftrace 事件会挤掉同一层 per-CPU buffer 里的低频 kernel tracepoints。

### producer / TraceWriter 丢包：先定位再归因

traced_buf_trace_writer_packet_loss 是总信号，不要直接归因共享内存——可能来自突发写入，也可能与 sequence 缺包、buffer policy 相关，要结合 overwritten/discarded/sequence_packet_loss/patches_failed 与 buffer idx 一起看。注意 Android 常见的 android.os.Trace / androidx.tracing 走 atrace/ftrace 路径，优先看 ftrace loss；Perfetto SDK Track Event、自定义 DataSource、大块数据包才更直接对应共享内存。共享内存默认 256KB 扛不住「大包突发」——平均速率不高但一次写 2MB（截图类数据源）瞬时就能写爆。处理顺序：降低事件密度（热循环别每次迭代都打点）→ 拆小超大事件 → 确认瓶颈在 producer 侧突发时评估 shmem_size_hint_kb → 仅在阻塞开销可接受时用 BufferExhaustedPolicy::kStall 保护关键事件。

### central buffer 丢失：Ring 覆盖旧数据，Discard 丢新数据

两个统计项对应两种策略的丢法：traced_buf_chunks_overwritten（RING_BUFFER 写满覆盖旧数据）、traced_buf_chunks_discarded（DISCARD 写满丢新数据）。按 buffer idx 复盘时注意 idx 语义：traced_buf_* 的 idx 是 buffer 编号，ftrace CPU 统计的 idx 是 CPU id，报告里写清，别把 CPU 3 和 buffer 3 混淆。

最常见的问题是**混放**：scheduler tracing 每秒约 1 万个事件（约 1MB），内存统计 5 秒才写一次，同放一个 4MB buffer 时内存快照可能只剩一条甚至被挤光——而 Trace 打开时不会报「内存采样没工作」，它只是没留下证据。短 Trace 的解法是分 buffer：

```protobuf
buffers { size_kb: 131072 fill_policy: RING_BUFFER }  # 0: 高频 ftrace
buffers { size_kb: 32768  fill_policy: RING_BUFFER }  # 1: 低频元数据与日志

data_sources {
  config {
    name: "linux.ftrace"
    target_buffer: 0
    ftrace_config {
      ftrace_events: "sched/sched_switch"
      ftrace_events: "sched/sched_waking"
    }
  }
}
data_sources {
  config {
    name: "linux.process_stats"
    target_buffer: 1
    process_stats_config {
      scan_all_processes_on_start: true
    }
  }
}
```

FrameTimeline、SurfaceFlinger/Winscope、App SDK Track Event 也可以通过各自的 target_buffer 隔离；HWUI、Choreographer 等 atrace 切片跟随 linux.ftrace，只能靠减事件与加大 ftrace buffer 保护。分 buffer 只隔离 central buffer 竞争，修不了共享内存已写爆的问题。另外 android.log 数据源只支持 userdebug，生产 user build 不要默认期待它可用。

### 增量状态丢失：事件还在，名字和上下文缺了

上下文 packet（track descriptor、interned strings、进程/线程元数据）被覆盖或缺包时，后续事件只剩 ID 或无法完整解析，隐蔽表现是 UI 里只有 tid 没有进程名、Track Event 轨道名字缺失。优先查 traced_buf_sequence_packet_loss、traced_buf_incremental_sequences_dropped、interned_data_tokenizer_errors、track_hierarchy_missing_uuid 等统计项；tokenizer/interning 类更像后果，根因通常仍在 sequence 缺包、Ring 覆盖或写入突发。解法两招：周期重发描述信息（clear_period_ms 最好比 buffer 可保留窗口低一个数量级，buffer 留 60 秒则 5 秒清一次比 30 秒稳）；把低频元数据 target_buffer 到更不易覆盖的 buffer。

```protobuf
incremental_state_config {
  clear_period_ms: 5000
}
```

### 长 Trace：周期写文件与 flush

长时间抓取只加大内存 buffer 不够，要让数据周期落到文件：

```protobuf
duration_ms: 600000
write_into_file: true
file_write_period_ms: 2500
flush_period_ms: 10000
max_file_size_bytes: 2147483648
buffers {
  size_kb: 32768
  fill_policy: RING_BUFFER
}
```

file_write_period_ms 越短内存压力越小但 I/O 开销越高；Android 常见数据速率约 1~4MB/s，只能做初始估算，central buffer 大小粗算：`速率(MB/s) × file_write_period_ms / 1000 × 安全系数`，安全系数不低于 2（滑动、启动、Camera open 都会制造突发）。flush_period_ms（10~30 秒是常见范围）让 tracing service 周期请求数据源提交未写满的共享内存页，stats 出现 traced_flushes_failed / traced_final_flush_failed 时先写清可信度边界再查配置与 I/O 压力。已有无周期 flush 的长 Trace 导入时遇到 out-of-order，可一次性用 --full-sort 救急（费内存，离线分析用，不是采集配置的长期答案）；它修不了 clock 问题——clock_sync_failure* 命中时先按时间语义不可信处理。有明确触发点的问题优先用触发式抓取保留问题前后几十秒，比盲目长录压力小得多；长 Trace 的写文件 I/O 也可能与被测负载竞争同一存储路径，报告里区分 trace_quality_status 与 collection_perturbation_risk。

## 报告里怎么写可信度

有 data loss 的 Trace 不一定作废，但报告必须写边界。结构化字段先定下来（stat_name/idx/idx_semantics/severity/source/value/affected_evidence/affected_metrics/decision/next_config_action），自然语言模板：

> 完整性检查：stats 表存在 ftrace_cpu_has_data_loss，CPU 3 value=1。影响范围：sched/ftrace 事件可能缺失，线程状态占比与唤醒关系只能作为参考，不能写「没有 Runnable 等待」。仍可使用：目标窗口内 FrameTimeline expected/actual 覆盖完整且未命中同源 buffer loss；App Track Event 未见 packet/sequence/tokenizer 异常。下一次配置：减少 ftrace 事件，ftrace buffer 调到 32768KB，drain_period_ms 调到 100ms。

性能分析最怕把「没有看到」写成「没有发生」。每个关键结论都应附上证据来源 + 可信度 + 限制条件。

## 踩坑清单

- dur 为 -1 的 slice 是 Trace 结束时仍未闭合的事件，窗口交集与 SUM 前先过滤（dur > 0）；目标事件恰好未闭合要单独解释
- main、RenderThread、Binder:* 都可能重名，先 process_name/upid 再 thread_name/utid，报告输出 upid/utid
- R、R+ 是 Runnable，Running 才是实际运行；报告拆成 running/runnable/sleeping/uninterruptible 四个桶，别合成「线程忙」
- UI 可视轨道不一定对应单张原始表，报告写清数据来源（thread_slice、thread_state、actual_frame_timeline_slice）
- stats 有丢失时不写强结论；before/after 的 TraceConfig 不一致（config_id 不同）先复抓再比较
- 只留 report 不留原始 Trace、config、SQL 与 metadata，后续无法复跑——最低限度保留文件名、config id、SQL 版本与窗口来源

## 来源

- [Android Perfetto 系列 11：PerfettoSQL、Trace Processor 与回归检测](https://www.androidperformance.com/2026/05/04/Android-Perfetto-11-PerfettoSQL-TraceProcessor-Automation/)
- [Android Perfetto 系列 12：Trace 数据流与丢失排查](https://www.androidperformance.com/2026/05/04/Android-Perfetto-12-Trace-Dataflow-And-Loss/)
