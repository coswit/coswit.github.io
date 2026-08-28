## adb 基础

Android Debug Bridge：启动 `adb` 时，会检查是否已在运行，没有则会启动 server 进程，与本地 TCP 端口 5037 绑定：

```bash
# 启动
adb start-server
# 停止
adb kill-server
```

### devices

```bash
adb usb
# 列出已连接的设备
adb devices
# 包含 product/mode 详情
adb devices -l
adb connect ip_address_of_device

# 只连接 usb 设备
adb -d
# 只连接模拟器
adb -e
```

### 常用命令

```bash
adb help
adb root

# 指定设备执行 command
adb -s <deviceName> <command>

adb push [source] [destination]
adb pull [device file] [local]

# 显示点击指针，关闭为 0
adb shell settings put system show_touches 1

# 输入文本
adb shell input text 'content'
```

### 端口转发

```bash
# 将设备的端口转发到本地（访问本机 8080 即访问设备的 8080）
adb forward tcp:8080 tcp:8080
# 反向：设备访问自身 3000 时转到电脑的 3000
adb reverse tcp:3000 tcp:3000
# 查看并删除转发规则
adb forward --list
adb forward --remove tcp:8080
```

### run-as

```bash
# 以 <package>（应用包名）的身份运行后续命令，临时获取该应用的文件访问权限（仅限 /data/data/<package>/ 下的私有文件）
run-as <package> cat <file>

# 查看应用私有文件
run-as com.example.app cat /data/data/com.example.app/databases/app.db
```

## am

```bash
# -n 指定组件名启动
adb shell am start -n com.wt.emode/.MainActivity
adb shell am start -n com.hihonor.lens/.settings.LensSettingsActivity

adb shell am start -a android.intent.action.VIEW
adb shell am broadcast -a 'my_action'

# 打电话
adb shell am start -a android.intent.action.CALL -d tel:+972527300294

# 打开短信界面，带号码与内容
adb shell am start -a android.intent.action.SENDTO -d sms:+972527300294 --es sms_body "Test" --ez exit_on_sent false

# 杀死进程
adb shell am force-stop pkg
```

## 截屏与录屏

```bash
adb shell screencap /sdcard/screenshot.png

# -p: 输出 png 格式
adb shell screencap -p /sdcard/screenshot.png
adb shell screencap -p | sed 's/\r$//' > screen.png

# 录屏（按 Ctrl+C 停止）
adb shell screenrecord /sdcard/record.mp4

# 同时录视频和音频
adb shell cmd media_projection start -f 1 --audio-source 1 -d "ADB录屏-含系统音频"
adb shell cmd media_projection stop
```

## pm

### list

```bash
# 包名查询
adb shell pm list packages | grep name

# 列出包名 + apk 路径
pm list packages -r
# 只列出第三方包
pm list packages -3
# 只列出系统包
pm list packages -s
# 列出包名 + 已卸载的包
pm list packages -u

# 按包名查找安装位置
pm path com.mypkg
# 查看用户
pm list users
# 查看设备功能
pm list features
```

### Permission

```bash
# 授权
pm grant [packageName] [permission]
# 撤销应用的指定权限
pm revoke [packageName] [permission]
# 重置
pm reset-permissions -p your.app.package
```

### 清理

```bash
# 清空应用数据与缓存
pm clear pkgName

# cmd 是一个特殊的 Shell 命令入口，用于访问 Android 系统提供的隐藏 API 或系统服务
adb shell cmd package clear pkgName
# 或者直接删除目录（需 root）
adb shell rm -rf /data/data/pkgname
```

参考：[Google 官方参考文档](https://developer.android.com/tools/adb?hl=zh-cn#pm)

## logcat

```bash
# 通过包名获取 pid
adb shell pidof -s com.hihonor.magicvoice

# 按 pid 过滤
adb logcat --pid=<pid>

# 只输出 Error 及以上级别的日志
adb logcat *:E
# 按标签过滤
adb logcat -s MyTag

# -c 清除设备上的现有日志
adb logcat -c
# -d 输出后立即退出，配合重定向保存到本地文件
adb logcat -d > [path_to_file]

# 完整的设备信息转储（dumpstate、dumpsys 和 logcat 输出）
adb bugreport > [path_to_file]
```

## 应用安装与卸载

### install

```bash
adb -e install path/to/app.apk
# -d: 只发给唯一连接的 USB 设备
# -e: 只发给唯一运行的模拟器
# -s <serial number>: 指定设备序列号

# 常用组合
adb install -d -t -r -g app.apk
# -d: 允许版本号降级（仅 debuggable 包）
# -t: 允许安装测试版本
# -r: 重新安装并保留数据，替换已有应用
# -g: 安装时授予所有运行时权限
```

组合：给所有已连接设备安装：

```bash
adb devices | tail -n +2 | cut -sf 1 | xargs -IX adb -s X install -r com.myAppPackage
```

### uninstall

```bash
adb uninstall com.myAppPackage
# -k 卸载但保留数据和缓存目录
adb uninstall -k com.myAppPackage

adb shell pm uninstall com.example.MyApp
# 清除与包关联的所有数据
adb shell pm clear [package]

# 给所有已连接设备卸载
adb devices | tail -n +2 | cut -sf 1 | xargs -IX adb -s X uninstall com.myAppPackage
```

### update

```bash
# -r 重新安装并保留应用数据
adb install -r yourApp.apk
# -k 保留 data 和 cache 目录
adb install -k <.apk file path on computer>
```

## input 与 wm

### input

```bash
# 发送点击事件（坐标 x y）
adb shell input tap 100 200
# 滑动（x1 y1 → x2 y2，时长 ms）
adb shell input swipe 300 1000 300 500 300
# 发送按键
adb shell input keyevent KEYCODE_MEDIA_NEXT
```

常用 keyevent：

| keyevent | 功能 |
| :--- | :--- |
| KEYCODE_HOME | 回到桌面 |
| KEYCODE_BACK | 返回 |
| KEYCODE_POWER | 电源键 |
| KEYCODE_VOLUME_UP / KEYCODE_VOLUME_DOWN | 音量增/减 |
| KEYCODE_MEDIA_NEXT / KEYCODE_MEDIA_PREVIOUS | 多媒体下一曲/上一曲 |
| KEYCODE_MEDIA_PLAY_PAUSE | 播放/暂停 |

### wm（Window Manager）

```bash
adb shell wm size # 显示分辨率
adb shell wm size 2048x1536 # 设置分辨率
adb shell wm density 288 # 设置密度

# 恢复默认
adb shell wm size reset
adb shell wm density reset
```

### monkey

```bash
# 对指定应用产生 10000 个伪随机事件，-s 指定随机种子（便于复现）
adb shell monkey -p com.myAppPackage -v 10000 -s 100
```

### 其他

```bash
# 获取 Android 版本
adb shell getprop ro.build.version.release

# 查看 CPU 型号
adb shell getprop ro.product.cpu.abi

adb shell settings get system HARDWARE_ID
```

## dumpsys

```bash
dumpsys activity # 查询 AMS 服务相关信息
dumpsys window # 查询 WMS 服务相关信息

# 查看当前运行 activity
dumpsys activity top | grep ACTIVITY

# SurfaceFlinger
dumpsys SurfaceFlinger

# 查看焦点所在 activity
adb shell dumpsys window | grep mCurrentFocus

# 查看对应包名的 Service
adb shell dumpsys activity services com.wt.phonelink

# 查看对应包名信息
adb shell dumpsys package com.huawei.dmsdpdevice | grep versionName

# 查看系统广播
adb shell dumpsys activity broadcasts | egrep "FLY_SCREEN"
```

参考：[dumpsys 命令用法](http://gityuan.com/2016/05/14/dumpsys-command/)

### 内存与 CPU 分析

```bash
dumpsys cpuinfo # 查询 CPU 情况
dumpsys meminfo # 查询内存情况

dumpsys meminfo com.tinnove.renderserver
dumpsys cpuinfo | grep com.tinnove.renderserver
```

meminfo 各指标含义：

- **Pss Total（Proportional Set Size，按比例分摊内存）**：应用独占的内存，加上按比例分摊的共享内存。例如应用独占 50MB，并与另一个应用共享一个 10MB 的系统库（如 .so 动态库），则 PSS = 50MB + (10MB / 2) = 55MB。
- **Private Dirty（私有脏内存）**：应用独占且已被修改过的 RAM 内存。
- **Private Clean（私有干净内存）**：应用独占，但未被修改（或可以从磁盘直接恢复）的内存。
- **Rss Total（Resident Set Size，驻留内存大小）**：进程在物理内存（RAM）中分配的总页数（忽略共享分摊）。只要包含了这个应用用到的内存（哪怕是跟 100 个应用共享的库），都会全额算进来，因此 RSS 往往偏大，不能准确反映单个应用占用了多少系统资源。

## scrcpy

```bash
# 指定屏幕投屏（--display-id 可用 scrcpy --list-displays 查询）
scrcpy --display-id 1
# 指定屏幕录屏
scrcpy --record file.mp4 --display-id 1
```

## settings

```bash
settings put global KEY_STEER_FINISH_ACTIVITY 0
settings get global KEY_STEER_FINISH_ACTIVITY
```

## 参考

- [Google 官方 adb 文档](https://developer.android.com/tools/adb?hl=zh-cn)
- [adb cheat sheet](https://www.automatetheplanet.com/adb-cheat-sheet/)
