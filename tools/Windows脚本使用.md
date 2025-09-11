### 基本语法

```shell
# 关闭回显功能，直到出现echo on
@echo off
# echo 将CMD的编码更改为UTF-8
chcp 65001
```

### 函数

```
:func
echo this is a bat func
goto:eof
```

### 记录

android日志抓取

```shell
echo 当前时间是：%time% 即 %time:~0,2%点%time:~3,2%分%time:~6,2%秒%time:~9,2%厘秒

set hh=%time:~0,2%
if "%hh:~0,1%"==" " (set "hh=%hh:~1,1%")

set date_time="%date:~0,4%%date:~5,2%%date:~8,2%_%hh%%time:~3,2%"
set Folder="Logs_%date_time%"
mkdir %Folder%
cd %Folder%
mkdir dropbox
mkdir tombstones
mkdir corefile
mkdir apanic
mkdir android_logs
mkdir diaglogs
mkdir LogService
mkdir archive
mkdir log_dropbox
mkdir hilogs
cd ..

::adb shell  dmesg > %Folder%/dmesg.txt
::adb shell  logcat -v time -d -b radio > %Folder%/logcat_ril.txt
::rem adb shell  logcat -v time -d -b radio AT > %Folder%/logcat_at.txt
::adb shell  logcat -v time -d > %Folder%/logcat.txt
::adb shell  cat /data/ShutdownCaller > %Folder%/ShutdownCaller.txt

::adb shell  bugreport > %Folder%/bug_report.txt

adb pull   /data/dontpanic/apanic_console %Folder%/apanic/apanic_console.txt
adb pull   /data/dontpanic/apanic_threads %Folder%/apanic/apanic_threads.txt
adb pull   /data/system/dropbox           %Folder%/dropbox
adb pull   /data/corefile                 %Folder%/corefile
adb pull   /data/tombstones               %Folder%/tombstones
adb pull   /data/anr                      %Folder%/anr 
adb pull   /data/log/android_logs                           %Folder%/android_logs
adb pull   /data/log/bt                          %Folder%/android_logs
adb pull   /sdcard/android_logs				%Folder%/android_logs_SD
adb pull   /sdcard/bt				%Folder%/android_logs_SD
adb pull   /sdcard/diag_logs                            %Folder%/diaglogs
adb pull   /sdcard/LogService             %Folder%/LogService
adb pull   /data/log/archive              %Folder%/archive
adb pull   /data/log/dropbox           %Folder%/log_dropbox
adb pull   /data/log/hilogs           %Folder%/hilogs

pause
```

android常用

```shell
adb wait-for-device
adb remount
pause
adb shell reboot
```

