## 基本语法

```batch
@echo off
:: 关闭回显功能，直到出现 echo on

:: chcp 65001 将 CMD 的编码更改为 UTF-8
chcp 65001
```

## 变量

```batch
:: set 定义变量，等号两边不要加空格
set name=hello
:: 引用变量用 %%
echo %name%

:: set /a 算术运算
set /a num=1+2

:: set /p 从用户输入读取
set /p input=请输入:
```

### setlocal

`set` 默认是全局的，会污染调用者的环境。`setlocal` 让脚本内的变量只在脚本内生效，遇到 `endlocal` 或脚本结束时恢复：

```batch
@echo off
setlocal
set tmp_var=only_in_this_script
echo %tmp_var%
endlocal
:: 这里再引用 %tmp_var% 就是空的了
```

### 常用系统变量

| 变量 | 含义 |
| :--- | :--- |
| `%CD%` | 当前目录 |
| `%USERPROFILE%` | 用户主目录（C:\Users\xxx） |
| `%APPDATA%` | 应用数据目录 |
| `%TEMP%` | 临时目录 |
| `%DATE%` | 当前日期 |
| `%TIME%` | 当前时间 |
| `%ERRORLEVEL%` | 上一条命令的返回码，0 表示成功 |
| `%0` `%1` `%2` | 脚本名、第 1/2 个参数 |

## 字符串截取

语法 `%变量:~起始,长度%`，起始从 0 数，可为负数（从末尾数）：

```batch
set str=HelloWorld
echo %str:~0,5%     :: Hello，从第 0 位取 5 个字符
echo %str:~5%       :: World，从第 5 位取到末尾
echo %str:~0,-5%    :: Hello，去掉末尾 5 个字符

:: 时间 %time% 形如 " 9:30:15.12"，前两位是小时（可能带前导空格）
echo %time:~0,2%    :: 小时
echo %time:~3,2%    :: 分钟
echo %time:~6,2%    :: 秒

:: 替换语法 %变量:旧=新%
echo %str:World=CMake%
```

## if 与 for

```batch
:: 字符串比较，/i 忽略大小写
if "%var%"=="hello" echo equal
if /i "%var%"=="Hello" echo equal-ignore-case

:: 数值比较用专门符号：EQU 等于、NEQ 不等、LSS 小于、LEQ 小于等于、GTR 大于、GEQ 大于等于
if %num% GEQ 10 echo big

:: 判断文件/目录是否存在
if exist "file.txt" echo found
if not exist "dir\" echo dir not found

:: 判断上一条命令是否成功
some_command
if %ERRORLEVEL%==0 echo success
if errorlevel 1 echo failed
```

```batch
:: 遍历列表
for %%i in (a b c) do echo %%i

:: 遍历数字区间（1 2 3 4 5）
for /l %%i in (1,1,5) do echo %%i

:: 遍历目录下的文件
for %%f in (*.txt) do echo %%f

:: 递归遍历子目录（d=目录）
for /d /r . %%d in (*) do echo %%d
```

注意：脚本中写 `%%i`，在命令行直接敲的时候只写一个 `%i`。

## 函数

```batch
call :func
goto :eof

:func
echo this is a bat func
goto :eof
```

bat 中没有真正的函数，用标签 `:func` 加 `call` 调用模拟，`goto :eof` 表示函数结束返回。

## 参数与延时

```batch
:: 脚本参数：脚本名 xx.bat a b 调用时，%1 是 a，%2 是 b
echo first arg: %1
echo second arg: %2

:: 延时 5 秒（-t 后接秒数；命令行直接运行时会显示倒计时，加 >nul 隐藏）
timeout /t 5 /nobreak >nul

:: 老系统没有 timeout 时，用 ping 模拟延时约 5 秒
ping -n 6 127.0.0.1 >nul
```

## 记录

### android 日志抓取

```batch
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
adb pull   /data/log/android_logs         %Folder%/android_logs
adb pull   /data/log/bt                   %Folder%/android_logs
adb pull   /sdcard/android_logs           %Folder%/android_logs_SD
adb pull   /sdcard/bt                     %Folder%/android_logs_SD
adb pull   /sdcard/diag_logs              %Folder%/diaglogs
adb pull   /sdcard/LogService             %Folder%/LogService
adb pull   /data/log/archive              %Folder%/archive
adb pull   /data/log/dropbox              %Folder%/log_dropbox
adb pull   /data/log/hilogs               %Folder%/hilogs

pause
```

### android 常用

```batch
adb wait-for-device
adb remount
pause
adb shell reboot
```
