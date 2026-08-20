# Android 内存分析

> 常见内存问题的分析方法、工具与原理。Perfetto 相关的抓取操作见 [perfetto使用](perfetto使用.md)。

## 内存指标基础

### VSS / RSS / PSS / USS

| 指标 | 含义 |
|---|---|
| VSS（Virtual Set Size） | 虚拟地址空间大小，mapping 了但不一定真正占物理内存 |
| RSS（Resident Set Size） | 实际占用的物理内存，共享库按全量计入，多进程统计会重复 |
| PSS（Proportional Set Size） | 私有内存 + 共享内存按共享进程数分摊，**评估单个进程实际内存占用的首选指标** |
| USS（Unique Set Size） | 进程独占（Private）部分，进程被杀后能真正释放的量 |

- 判断应用内存是否超标看 **PSS**；判断杀掉进程能换回多少内存看 **USS**。
- 开启 ZRAM（Compressed RAM，基于内存的压缩交换设备）/Swap 后页面被压缩换出，RSS 下降但占用 ZRAM 空间，因此还有 SwapPSS（换出页折算的 PSS）一项参与总量统计。

### dumpsys meminfo

```shell
adb shell dumpsys meminfo <package|pid>          # 普通输出
adb shell dumpsys meminfo --checkin <package>    # 机器可读格式，适合脚本定时采集对比
```

输出要点：

- **App Summary**：Java Heap / Native Heap / Code / Stack / Graphics 各自的 PSS，以及 TOTAL PSS、TOTAL SWAP PSS —— 先看这里确定是哪块内存出了问题。
- **Objects 区**：Views、ViewRootImpl、AppContexts、Activities、Assets 等计数。反复进出页面后 Activities / Views 持续增长不回落，基本可以判定泄漏。
- 详细表格（Dalvik Heap、Native Heap、.so mmap、.apk mmap、Graphics 等）用于进一步定位增长落在哪个区域。

原理：

- 数据来源是内核的 `/proc/<pid>/smaps`（新版走 `smaps_rollup`）：每个 mapping 记录了 Private_Clean/Dirty、Pss、Swap 等字段。
- dumpsys 按 mapping 的路径/属性把它归类成 Dalvik Heap、Native Heap、.so mmap、Graphics 等行；Graphics/Gfx 部分来自 gralloc（Graphics Allocator）/dmabuf（DMA-BUF，图形缓冲共享句柄）的厂商统计（mtrack）。
- 应用内等价接口：`Debug.getMemoryInfo()`。

### showmap / smaps

```shell
adb shell showmap <pid>              # 按 mapping 逐行列出 RSS/PSS
adb shell cat /proc/<pid>/smaps      # 原始数据
```

用途：dumpsys 归类后若确定是 Native Heap 或某类 mmap 增长，用 showmap 进一步看具体是哪个 so、哪段匿名内存在涨。32 位进程还要注意 VSS——虚拟地址空间耗尽时 RSS 不高也会 malloc 失败。

### 内存问题分类

| 问题 | 典型表现 | 主要工具 |
|---|---|---|
| Java 泄漏 | 已销毁对象无法回收，PSS 缓慢上涨 | Memory Profiler / MAT / LeakCanary |
| Native 泄漏 | Native Heap PSS 持续上涨 | heapprofd / malloc debug / ASan |
| 内存抖动 | 频繁 GC（Garbage Collection，垃圾回收），内存曲线锯齿状，伴随卡顿 | Allocation tracking |
| Java OOM（Out Of Memory） | OutOfMemoryError（超出 Java 堆上限） | heap dump |
| Native 耗尽 | 32 位进程 malloc 失败、mmap 失败 | showmap 看 VSS 分布 |
| 整机低内存 | lmkd（Low Memory Killer Daemon）按 oom_adj（OOM 调整分数）杀掉 cached 进程 | 事件日志 / dumpsys activity oom |

## Java 堆分析

### Memory Profiler（Android Studio）

典型分析流程：

1. 执行复现路径（如反复进出某个 Activity 十几次）；
2. 点击 **Force GC**；
3. 点击 **Heap Dump** 抓取快照；
4. 按 Arrange by package / class 查看可疑对象实例数——例如已 destroy 的 Activity 还存在多个实例；
5. 选中对象后在右侧 **References** 面板沿引用链向上找 GC Root，定位持有者。

概念区分：

- **Shallow Size**：对象自身占用的内存；
- **Retained Size**：该对象被 GC 时可以一并释放的总内存（含它引用的对象），排查大头时优先看这个。

“Record allocations（Java/Kotlin Allocation Tracking）”可以记录一段时间内的所有分配及其调用栈，是分析**内存抖动**的入口。

### 手动获取 hprof（Heap Profile，Java 堆快照文件格式）

```shell
adb shell am dumpheap <pid> /data/local/tmp/heap.hprof
adb pull /data/local/tmp/heap.hprof
```

```java
// 代码中触发，注意 dump 期间进程会长时间暂停（Stop The World）
Debug.dumpHprofData(absPath);
```

- 用独立 MAT 分析前需要先用 SDK platform-tools 的 `hprof-conv` 转换（Android Studio 导入时会自动处理）。
- 线上直接 dump 全量 hprof 会冻结应用数秒，因此线上方案（KOOM 等）都用 **fork 子进程去 dump**，主进程不停顿。

### MAT（Eclipse Memory Analyzer）

- **Histogram**：按类统计实例数与 Retained Heap，配合两次 dump 的增量对比（Compare to another histogram）；
- **Dominator Tree**：按 Retained Heap 排序直接找内存大头；
- **Path to GC Roots**（排除 weak/soft reference）：求最短泄漏引用链；
- **Leak Suspects**：自动生成的泄漏猜测报告。

### LeakCanary / shark

原理概要：通过 `registerActivityLifecycleCallbacks` 监听，在 `onDestroy` 后把 Activity 装入带 key 的 `WeakReference` 并关联 `ReferenceQueue`；触发 GC 后引用仍未进入队列即判定泄漏，然后 dump hprof 用自研的 **shark** 解析出最短引用链并通知。详细源码分析见 [Android监测](Android监测.md)。

定位与适用面：LeakCanary 适合线下 debug（每次泄漏都要全量 dump + 解析）；线上监控一般用 KOOM / Matrix —— 阈值或定时触发、子进程 dump、解析时只裁剪保留引用链相关数据。

### 内存抖动

- 成因：大量短生命周期的小对象（onDraw 中创建对象、循环内拼接字符串、自动装箱、频繁创建 Bitmap/byte[] 等），导致高频 young GC；
- 表现：Memory Profiler 曲线呈锯齿状、logcat 中 art tag 的 GC 日志密集、Perfetto 里 dalvik 轨道 GC slice 频繁；
- 危害：CC（Concurrent Copying）GC 虽并发，仍会与主线程竞争 CPU，且部分阶段需要短暂挂起线程，造成卡顿；
- 定位：Allocation tracking 找分配热点栈，治理高频分配点（对象复用、缓存、避免在热路径分配）。

## Native 堆分析

### heapprofd（Perfetto native heap profiler）

- Android 10+ 内置，**采样式** native 堆分析器，默认每 4096 字节采样一次，开销低，可长时间跟踪；
- 原理：拦截目标进程的 malloc/free，按采样间隔记录分配/释放与调用栈（unwinding），进程通过共享内存把数据发给 heapprofd 守护进程，结果按调用栈聚合；
- 产出：调用栈火焰图 / 按调用栈聚合的分配量。持续增长的调用栈即泄漏点；
- 具体抓取配置见 [perfetto使用](perfetto使用.md#内存分析)。

### malloc debug（bionic 自带）

```shell
# Android 10+ 推荐 wrap 方式给应用开启（记录分配 backtrace）
adb shell setprop wrap.<package> '"LIBC_DEBUG_MALLOC_OPTIONS=backtrace"'
# 重启应用复现问题后，导出 native 堆信息
adb shell am dumpheap -n <pid> /data/local/tmp/native.txt
adb pull /data/local/tmp/native.txt
```

- 原理：用封装的 malloc/calloc/realloc/free 替代原始实现，记录每次分配的 backtrace，dump 时输出所有未释放块及其堆栈；
- 全量记录、开销明显，只适合线下调试；系统进程可用 `libc.debug.malloc.options` 系统属性开启。

### libmemunreachable

```shell
adb shell memunreachable -t <pid>   # 需要 debuggable 进程，执行期间进程长时间暂停
```

- 原理：一个"不精确的 mark & sweep GC"——从寄存器、线程栈、全局变量等 GC Root 出发扫描整个地址空间，标记可达的 native 内存，剩下未被标记的即泄漏候选；
- 零侵入（无需重编译、平时零开销），但单次分析很慢。

### ASan / HWASan / GWP-ASan / MTE

| 工具 | 原理 | 适用 |
|---|---|---|
| ASan（AddressSanitizer） | 编译插桩 + shadow memory（影子内存，每 8 字节真实内存用 1 字节影子标记可访问性），读写前检查 | 线下精确检测越界（out-of-bounds）/UAF（Use-After-Free，释放后使用）/double-free（重复释放）；NDK（Native Development Kit）用 wrap.sh 集成；内存约 2 倍、CPU 明显变慢 |
| HWASan（Hardware-assisted AddressSanitizer） | 硬件辅助（ARM TBI，Top-Byte-Ignore，指针顶部字节做标签），随机标签命中率高 | 平台开发，需刷专用系统镜像，开销低于 ASan |
| GWP-ASan（基于 Guarded Page Allocator） | 系统内置的**抽样**检测器，只对部分分配做隔离保护 | 无需重编译、线上可用，崩溃时直接给出越界/UAF 堆栈 |
| MTE（Memory Tagging Extension） | ARMv9 硬件内存标签，访问时硬件比对标签 | Android 12+ 逐步支持（如 Pixel 8 起），近乎零开销的 UAF/越界检测 |

另外 LeakSanitizer（通常随 ASan 启用）在进程退出时扫描堆，报告泄漏大小与分配堆栈。

### 线上 Native 监控方案

- **KOOM（快手开源）**：通过 PLT（Procedure Linkage Table）/Inline Hook 代理 malloc/calloc/realloc/free，全局采集分配与堆栈，周期性或阈值触发分析；Java 泄漏部分用 fork 子进程 dump hprof 避免冻结主进程，解析时对 hprof 做裁剪。
- **Matrix（微信）**：类似的 hook + 定期分析思路。
- 与官方工具的差别：低开销常驻、采样率可配、dump 不冻结主进程，适合线上灰度。

## 系统级内存观测

### /proc/meminfo 与 ZRAM

- **MemAvailable** 比 MemFree 更能反映真实可用内存（包含可回收的 cache/buffer 估计值）；
- ZRAM 是压缩内存盘作 swap，`SwapTotal/SwapFree` 反映其用量；换出的页按压缩后大小计入 SwapPSS；
- 注意 **MADV_FREE**（madvise 系统调用选项之一）行为：分配器（Scudo/glibc）释放内存后内核可以延迟回收，表现为 free 不会立即上涨，属正常现象，不要误判为泄漏。

### lmkd 与 oom_adj

- 整机内存紧张时 lmkd 按 oom_adj_score 从高到低杀进程（cached 进程最先）；
- ```shell
  adb shell dumpsys activity oom    # 查看各进程 adj
  ```
- 应用侧通过 `onTrimMemory()` / `ComponentCallbacks2` 提前释放缓存，通过 `ActivityManager.getMemoryInfo()` 感知低内存状态。

### Perfetto memory 数据源

- `memory`（整机 meminfo/vmstat/PSI 计数器，PSI = Pressure Stall Information，资源压力滞留指标）、`process_stats`（进程 RSS）、`android.mem.lmk`（lmkd 杀进程事件）等可以随 trace 一起记录，与 CPU/渲染时间轴对齐，做"内存上涨与某操作的因果关联"分析。

## 分析思路总结

1. **先看总量与趋势**：脚本定时采集 `dumpsys meminfo --checkin`，确定增长的是 Java Heap、Native Heap、Graphics 还是 mmap；
2. **Java 增长**：heap dump → 找到异常对象与引用链（LeakCanary / MAT / Memory Profiler）；
3. **Native 增长**：heapprofd 看分配调用栈，或 malloc debug 精确线下复现；区分是代码泄漏还是分配器缓存（MADV_FREE）；
4. **Graphics 增长**：检查 Bitmap 尺寸与解码格式、纹理、SurfaceView/GL 资源，配合 `dumpsys gfxinfo`；
5. **内存不涨但出问题**：区分 Java 堆上限（large heap / 设备限制）导致的 OOM、32 位地址空间耗尽、整机低内存被 lmkd 杀三类情形。

## 参考

- [调试原生内存使用问题（Android AOSP 官方）](https://source.android.com/docs/core/tests/debug/native-memory)
- [Native heap profiler - Perfetto 官方](https://perfetto.dev/docs/data-sources/native-heap-profiler)
- [Perfetto 内存分析案例](https://perfetto.dev/docs/case-studies/memory)
- [捕获堆转储 - Android Studio 官方](https://developer.android.com/studio/profile/capture-heap-dump?hl=zh-cn)
- [dumpsys meminfo 的原理和应用](https://blog.csdn.net/feelabclihu/article/details/105534175)
- [Android Meminfo 输出详解指南](https://github.com/Gracker/Android-App-Memory-Analysis/blob/master/docs/zh/proc_meminfo_interpretation_guide.md)
- [Android Native 内存泄漏检测方案详解](https://zhuanlan.zhihu.com/p/705901017)
- [KOOM - 快手 Android 内存优化开源方案](https://github.com/KwaiAppTeam/KOOM)
