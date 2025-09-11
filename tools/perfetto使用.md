### track抓取

启动一个 20 秒钟的跟踪，收集指定的数据源信息，并将跟踪文件保存到`/data/misc/perfetto-traces/trace_file.perfetto-trace`

```shell
#1. 首先执行命令
adb shell perfetto -o /data/misc/perfetto-traces/trace_file.perfetto-trace -t 20s sched freq idle am wm gfx view binder_driver hal dalvik camera input res memory

# 2. 操作手机，复现场景，比如滑动或者启动等

#3. 将 trace 文件 pull 到本地
adb pull /data/misc/perfetto-traces/trace_file.perfetto-trace
```



perfetto目前提供两种标记类型,标记的方式分别为:

- 点击最上方的时间轨道即可添加时间点标记.
- 而通过按住鼠标左键选中一块区域然后点击"shift+m"即可添加常驻区域标记:

### 时间戳

```
parent_tms=1719212453068
```

