

## adb

Android Debug Bridge：启动`adb`时，会检查是否已在运行，没有，则会启动server进程，与本地TCP端口5037绑定：

```bash
# 启动
adb start-server 
# kill
adb kill-server
```
devices

```shell
adb usb
adb devices   //show devices attached
adb devices -l # 包含product/mode
adb connect ip_address_of_device

adb -d #连到usb设备上
adb -e #连到模拟器上
```

```bash
adb help
adb root

#指定设备执行command
adb -s <deviceName> <command> 

adb push [source] [destination]   
adb pull [device file] [local] 

# 显示点击指针，关闭为0
adb shell settings put system show_touches 1

# 输入
adb shell input text 'content'
```

```bash
# 以<package>（应用包名）的身份运行后续命令，临时获取该应用的文件访问权限（仅限 /data/data/<package>/下的私有文件）
run-as <package> cat <file>

# 查看应用私有文件
run-as com.example.app cat /data/data/com.example.app/databases/app.db
```

### am

```shell
# -n指定组件名启动
adb shell am start -n com.wt.emode/.MainActivity
adb shell am start -n com.hihonor.lens/.settings.LensSettingsActivity

adb shell am start -a android.intent.action.VIEW
adb shell am broadcast -a 'my_action'

# Make a call
adb shell am start -a android.intent.action.CALL -d tel:+972527300294 

#Open send sms screen with phone number and the message:
adb shell am start -a android.intent.action.SENDTO -d sms:+972527300294   --es  sms_body "Test --ez exit_on_sent false
```

### 截屏、录屏

```shell
$ adb shell screencap  /sdcard/screenshot.png

# -p: outputs in png format
$ adb shell screencap -p /sdcard/screenshot.png
$ adb shell screencap -p | sed 's/\r$//' > screen.png

# (press Control + C to stop)
$ adb shell screenrecord /sdcard/record.mp4
```

### pm

list

```bash
# 包名查询
adb shell pm list packages | grep name

pm list packages -r # list package name + path to apks
pm list packages -3 (list third party package names)
pm list packages -s (list only system packages)
pm list packages -u (list package names + uninstalled

# 按包名查找安装位置
pm path com.mypkg
# user
pm list users
# 功能
list features
```

Permission

```shell
# 授权 
pm grant [packageName] [ Permission]
# 撤消应用的指定权限
pm revoke [packageName] [ Permission] 
# 重置
pm reset-permissions -p your.app.package 
```

```bash
# 清空缓存
pm clear pkgName

# 删除数据，cmd 是一个特殊的 Shell 命令入口，用于访问 Android 系统提供的 隐藏 API 或系统服务
adb shell cmd package clear pkgName
# 或者直接删除目录
adb shell rm -rf /data/data/pkgname
```

参考：[Google官方参考文档](https://developer.android.com/tools/adb?hl=zh-cn#pm)



### logcat

```shell
# 通过包名获取pid
$ adb shell pidof -s com.hihonor.magicvoice

#按pid过滤
$ adb logcat --pid= 
# clear // The parameter -c will clear the current logs on the device.
$ adb logcat -c 
# Save the logcat output to a file on the local system.
$ adb logcat -d > [path_to_file] 

# Will dump the whole device information like dumpstate, dumpsys and logcat output.
$ adb bugreport > [path_to_file] 
```

### install

```bash
adb -e install path/to/app.apk
-d  - directs command to the only connected USB device...
-e  - directs command to the only running emulator...
-s <serial number>        ...
-p <product name or path> ...

# 安装到指定路径
 -p: partial application install (install-multiple only)
$ adb install  -p com.hihonor.voiceengine recommend-release.apk
```

```bash
$ adb install -d -t -r -g

# -t允许安装测试版本 -r重新安装 -g安装时授予运行时权限
 -d: allow version code downgrade (debuggable packages only)
 -r: replace existing application
 -g: grant all runtime permissions
```

组合：

```shell
# Install the given app on all connected devices.
$ adb devices | tail -n +2 | cut -sf 1 | xargs -IX adb -s X install -r com.myAppPackage 
```

### uninstall

```shell
$ adb uninstall com.myAppPackage
$ adb uninstall <app .apk name>
 # "Uninstall .apk withour deleting data"
$ adb uninstall -k <app .apk name>

$ adb shell pm uninstall com.example.MyApp
 # Deletes all data associated with a package.
$ adb shell pm clear [package]
$ adb devices | tail -n +2 | cut -sf 1 | xargs -IX adb -s X uninstall com.myAppPackage
```

### update

```shell
#  -r means re-install the app and keep its data on the device.
$ adb install -r yourApp.apk 
# -k keep the data and cache directories
$ adb install –k <.apk file path on computer> 
```


### wm

Window manager

```shell
$ adb shell wm size # 显示分辨率
$ adb shell wm size 2048x1536 # 设置分辨率
$ adb shell wm density 288

# And reset to default
$ adb shell wm size reset
$ adb shell wm density reset
```

monkey

```shell
# monkey tool is generating 10.000 random events on the real device
$ adb shell monkey -p com.myAppPackage -v 10000 -s 100 
```
https://www.automatetheplanet.com/adb-cheat-sheet/

### 其他

```bash
# Get device android version
$ adb shell getprop ro.build.version.release 

# 查看CPU型号
adb shell getprop ro.product.cpu.abi

adb shell settings get system HARDWARE_ID
```

## dmpsys

```bash
$ dumpsys activity #查询AMS服务相关信息
$ dumpsys window #查询WMS服务相关信息
$ dumpsys cpuinfo #查询CPU情况
$ dumpsys meminfo #查询内存情况

#查看当前运行activity
$ dumpsys activity top | grep ACTIVITY

#SurfaceFlinger
$ dumpsys SurfaceFlinger

# 查看焦点所在activity
$ adb shell dumpsys window | grep mCurrentFocus

# 查看对应包名的Service
$ adb shell dumpsys activity services com.wt.phonelink

# 查看对应包名信息
$ adb shell dumpsys package com.huawei.dmsdpdevice | grep versionName
```

参考：[dumpsys命令用法](http://gityuan.com/2016/05/14/dumpsys-command/)

## trace

```
parent_tms=1719212453068
```
