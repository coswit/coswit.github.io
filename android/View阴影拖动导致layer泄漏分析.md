### 发生背景

在8.0上，智慧视觉进行文字识别后，选中部分文字，进行拖动，会调用`View.startDragAndDrop`，触发离屏渲染，发生layer泄漏，导致layer中的buffer不能进行回收。当发生次数足够多，会导致内存不够用，出现闪屏。

### 表现

使用系统阴影效果导致的layer泄漏，导致内存不够用，出现闪屏。测过三方其他应用，只要使用阴影效果，就会出现泄漏。

### 分析

抓取，通过dumpsys命令，可以获取当前屏幕合成的状态信息，包括图层信息、显示配置、帧率、错误日志。使用角本抓取：

```powershell
@echo off

set INTERVAL=10

for /f "delims=" %%b in ('adb shell getprop ro.serialno') do set serialno=%%b
set SN=%serialno%
echo SN=%SN%

:Again
set time0=%time: =0%
set hour=%time0:~0,2%
set date_time=%date:~0,4%%date:~5,2%%date:~8,2%_%hour%%time:~3,2%%time:~6,2%

echo "execute command"
adb shell  dumpsys SurfaceFlinger  > %SN%_%date_time%.txt
echo %date_time%.txt
TIMEOUT /T   %INTERVAL%
goto Again
```

代码分析:surfaceControl在部分判断条件中，没有释放导致：

```java
 public final boolean startDragAndDrop(ClipData data, DragShadowBuilder shadowBuilder,
            Object myLocalState, int flags) {
     ....
     final SurfaceSession session = new SurfaceSession();
     final SurfaceControl surfaceControl = new SurfaceControl.Builder(session)
            .setName("drag surface")
            .setParent(root.getSurfaceControl())
            .setBufferSize(shadowSize.x, shadowSize.y)
            .setFormat(PixelFormat.TRANSLUCENT)
            .setCallsite("View.startDragAndDrop")
            .build();
    if (overrideInvScale != 1f) {
        final SurfaceControl.Transaction transaction = new SurfaceControl.Transaction();
        transaction.setMatrix(surfaceControl, 1 / overrideInvScale, 0, 0, 1 / overrideInvScale)
                .apply();
    }
    final Surface surface = new Surface();
    surface.copyFrom(surfaceControl);     
     
     
     surfaceControl.release();
 }
```



| 参数                | 作用                                                  |
| ------------------- | ----------------------------------------------------- |
| `ClipData`          | 传递拖放数据的容器（支持文本、URI、Intent等格式）。   |
| `DragShadowBuilder` | 定义拖动时的视觉效果（可自定义或使用默认阴影）。      |
| `localState`        | 本地状态对象（可选，用于存储临时数据）。              |
| `flags`             | 控制权限的标志，如 `DRAG_FLAG_GLOBAL`（跨应用拖放）。 |

分析记录

```
首次发生闪屏时间点
01-11 11:03:59.238  1332  3252 E SDM     : DRMAtomicReq::Commit: drmModeAtomicCommit failed with error 12 (Out of memory).
```

```
Offscreen Layers:
Layer drag surface#2345 pid:7001 uid:10047 handleAlive
Layer bbq-wrapper for drag surface#2345#2346 (contains buffer) pid:7001 uid:10047
Layer drag surface#2319 pid:7001 uid:10047 handleAlive
Layer bbq-wrapper for drag surface#2319#2320 (contains buffer) pid:7001 uid:10047
Layer drag surface#2306 pid:7001 uid:10047 handleAlive
Layer bbq-wrapper for drag surface#2306#2307 (contains buffer) pid:7001 uid:10047
Layer drag surface#2245 pid:7001 uid:10047 handleAlive
Layer bbq-wrapper for drag surface#2245#2246 (contains buffer) pid:7001 uid:10047
Layer drag surface#2225 pid:7001 uid:10047 handleAlive
Layer bbq-wrapper for drag surface#2225#2226 (contains buffer) pid:7001 uid:10047
```

```
01-11 11:03:56.986  1332  3252 E SDM     : DRMAtomicReq::Commit: drmModeAtomicCommit failed with error 12 (Out of memory).
01-11 11:03:56.986  1332  3252 E SDM     : HWDeviceDRM::AtomicCommit: AtomicCommit failed with error -12 crtc 143
01-11 11:03:56.986  1332  3252 I SDM     : HWDeviceDRM::DumpHWLayers: HWLayers Stack: layer_count: 9, app_layer_count: 9, gpu_target_index: 9
01-11 11:03:56.986  1332  3252 I SDM     : HWDeviceDRM::DumpHWLayers: LayerStackFlags = 0x18433,  blend_cs = {primaries = 12, transfer = 1}
01-11 11:03:56.986  1332  3252 I SDM     : HWDeviceDRM::DumpHWLayers: left_frame_roi: x = 0, y = 0, w = 1152, h = 2376
01-11 11:03:56.986  1332  3252 I SDM     : HWDeviceDRM::DumpHWLayers: right_frame_roi: x = 0, y = 0, w = 0 h = 0
01-11 11:03:56.986  1332  3252 I SDM     : HWDeviceDRM::DumpHWLayers: Dest scalar index 0 Mixer WxH 576x2376
01-11 11:03:56.986  1332  3252 I SDM     : HWDeviceDRM::DumpHWLayers: Panel ROI [0, 0, 672, 2772]
01-11 11:03:56.986  1332  3252 I SDM     : HWDeviceDRM::DumpHWLayers: Dest scalar Dst WxH 672x2772
01-11 11:03:56.986  1332  3252 I SDM     : HWDeviceDRM::DumpHWLayers: Dest scalar index 1 Mixer WxH 576x2376
01-11 11:03:56.986  1332  3252 I SDM     : HWDeviceDRM::DumpHWLayers: Panel ROI [672, 0, 1344, 2772]
01-11 11:03:56.986  1332  3252 I SDM     : HWDeviceDRM::DumpHWLayers: Dest scalar Dst WxH 672x2772
01-11 11:03:56.986  1332  3252 I SDM     : HWDeviceDRM::DumpHWLayers: ========================= HW_layer: 0 =========================
01-11 11:03:56.986  1332  3252 I SDM     : HWDeviceDRM::DumpHWLayers: src_width = 1152, src_height = 2384, src_format = 12, src_LayerBufferFlags = 0x0
01-11 11:03:56.986  1332  3252 I SDM     : HWDeviceDRM::DumpHWLayers: pipe = left_pipe, pipe_id = 115, z_order = 0, flags = 0x6
01-11 11:03:56.986  1332  3252 I SDM     : HWDeviceDRM::DumpHWLayers: src_rect: x = 0, y = 0, w = 576, h = 2376
01-11 11:03:56.986  1332  3252 I SDM     : HWDeviceDRM::DumpHWLayers: dst_rect: x = 0, y = 0, w = 576, h = 2376
01-11 11:03:56.986  1332  3252 I SDM     : HWDeviceDRM::DumpHWLayers: excl_rect: left = 0, top = 0, right = 24, bottom = 2376
01-11 11:03:56.986  1332  3252 I SDM     : HWDeviceDRM::DumpHWLayers: pipe = right_pipe, pipe_id = 128, z_order = 0, flags = 0x6
01-11 11:03:56.986  1332  3252 I SDM     : HWDeviceDRM::DumpHWLayers: src_rect: x = 576, y = 0, w = 576, h = 2376
01-11 11:03:56.986  1332  3252 I SDM     : HWDeviceDRM::DumpHWLayers: dst_rect: x = 576, y = 0, w = 576, h = 2376
01-11 11:03:56.986  1332  3252 I SDM     : HWDeviceDRM::DumpHWLayers: excl_rect: left = 1128, top = 0, right = 1152, bottom = 2376
01-11 11:03:56.986  1332  3252 I SDM     : HWDeviceDRM::DumpHWLayers: ========================= HW_layer: 1 =========================
01-11 11:03:56.986  1332  3252 I SDM     : HWDeviceDRM::DumpHWLayers: src_width = 1152, src_height = 2384, src_format = 12, src_LayerBufferFlags = 0x0
01-11 11:03:56.986  1332  3252 I SDM     : HWDeviceDRM::DumpHWLayers: pipe = left_pipe, pipe_id = 112, z_order = 1, flags = 0x2006
01-11 11:03:56.986  1332  3252 I SDM     : HWDeviceDRM::DumpHWLayers: src_rect: x = 0, y = 0, w = 1104, h = 2376
01-11 11:03:56.986  1332  3252 I SDM     : HWDeviceDRM::DumpHWLayers: dst_rect: x = 24, y = 0, w = 1104, h = 2376
01-11 11:03:56.986  1332  3252 I SDM     : HWDeviceDRM::DumpHWLayers: excl_rect: left = 0, top = 0, right = 0, bottom = 0 
```

