
### dmpsys

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

#### trace

```
parent_tms=1719212453068
```

### adb

```shell
$ adb help
$ adb root
$ adb -s <deviceName> <command> #指定设备执行command

# Get device android version
$ adb shell getprop ro.build.version.release 

$ adb push [source] [destination]    # Copy files from your computer to your phone.
$ adb pull [device file location] [local file location] #Copy files from your phone to your computer.

# Adb Server
$ adb kill-server
$ adb start-server 

$ adb shell input text 'content'

# 查看包名
$ adb shell pm list packages | egrep "magic"

$ run-as <package> cat <file>
```

#### devices

```shell
$ adb usb
$ adb devices   //show devices attached
$ adb devices -l #包含product/mode
$ adb connect ip_address_of_device

$ adb -d #连到usb设备上
$ adb -e #连到模拟器上
```

#### logcat

```shell
# 通过包名获取pid
$ adb shell pidof -s com.hihonor.magicvoice
$ adb logcat --pid= #按pid过滤

$ adb logcat -c # clear // The parameter -c will clear the current logs on the device.
$ adb logcat -d > [path_to_file] # Save the logcat output to a file on the local system.
$ adb bugreport > [path_to_file] # Will dump the whole device information like dumpstate, dumpsys and logcat output.
```

#### install

```shell
adb -e install path/to/app.apk
-d                        - directs command to the only connected USB device...
-e                        - directs command to the only running emulator...
-s <serial number>        ...
-p <product name or path> ...

#Install the given app on all connected devices.
$ adb devices | tail -n +2 | cut -sf 1 | xargs -IX adb -s X install -r com.myAppPackage 

# 安装到指定路径
 -p: partial application install (install-multiple only)
$ adb install  -p com.hihonor.voiceengine recommend-release.apk

#-t允许安装测试版本 -r重新安装 -g安装时授予运行时权限
 -d: allow version code downgrade (debuggable packages only)
 -r: replace existing application
 -g: grant all runtime permissions
$ adb install -d -t -r -g
```

#### uninstall

```shell
$ adb uninstall com.myAppPackage
$ adb uninstall <app .apk name>
$ adb uninstall -k <app .apk name> # "Uninstall .apk withour deleting data"

$ adb shell pm uninstall com.example.MyApp
$ adb shell pm clear [package] # Deletes all data associated with a package.
$ adb devices | tail -n +2 | cut -sf 1 | xargs -IX adb -s X uninstall com.myAppPackage
```

#### update

```shell
$ adb install -r yourApp.apk  #  -r means re-install the app and keep its data on the device.
$ adb install –k <.apk file path on computer> # -k keep the data and cache directories
```

#### am(Activity Manager)

```shell
#-n指定组件名启动
$ adb shell am start -n com.hihonor.lens/.settings.LensSettingsActivity

$ adb shell am start -a android.intent.action.VIEW
$ adb shell am broadcast -a 'my_action'

$ adb shell am start -a android.intent.action.CALL -d tel:+972527300294 # Make a call

#Open send sms screen with phone number and the message:
$ adb shell am start -a android.intent.action.SENDTO -d sms:+972527300294   --es  sms_body "Test --ez exit_on_sent false
```

#### 截屏、录屏

```shell
$ adb shell screencap  /sdcard/screenshot.png
-p: outputs in png format
$ adb shell screencap -p /sdcard/screenshot.png
$ adb shell screencap -p | sed 's/\r$//' > screen.png

# (press Control + C to stop)
$ adb shell screenrecord /sdcard/record.mp4
```

#### pm

```shell
# 包名查询
$ adb shell pm list packages | grep name
#按包名查找安装位置
$ adb shell pm path com.mypkg

# Reset permissions
$ adb shell pm reset-permissions -p your.app.package 
$ adb shell pm grant [packageName] [ Permission]  #Grant a permission to an app. 
$ adb shell pm revoke [packageName] [ Permission]   #Revoke a permission from an app.

adb shell list packages (list package names)
adb shell list packages -r (list package name + path to apks)
adb shell list packages -3 (list third party package names)
adb shell list packages -s (list only system packages)
adb shell list packages -u (list package names + uninstalled
```

参考：[Google官方参考文档](https://developer.android.com/tools/adb?hl=zh-cn#pm)

#### wm

Window manager

```shell
$ adb shell wm size # 显示分辨率
$ adb shell wm size 2048x1536 #设置分辨率
$ adb shell wm density 288

# And reset to default
$ adb shell wm size reset
$ adb shell wm density reset
```

monkey

```shell
$ adb shell monkey -p com.myAppPackage -v 10000 -s 100 # monkey tool is generating 10.000 random events on the real device
```



https://www.automatetheplanet.com/adb-cheat-sheet/
