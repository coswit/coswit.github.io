## wsl2

### 安装

以管理员身份打开 Windows Terminal：

```powershell
# 开启 VM 组件，开启后需要重启电脑
Enable-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform

# 查看可用版本
wsl --list --online

# 安装 Ubuntu 指定版本（Ubuntu-20.04 已于 2025 年 5 月底停止官方支持，新装建议 22.04 及以上）
wsl --install -d Ubuntu-20.04

# 设置为 wsl2
wsl --set-default-version 2

# 更新 wsl 本体到最新版本
wsl --update

# 终止所有运行中的 wsl 实例
wsl --shutdown
```

### 配置

wsl 使用 adb：

```bash
sudo ln -s /home/user_name/platform-tools/adb.exe /usr/bin/adb
sudo ln -s /home/user_name/platform-tools/fastboot.exe /usr/bin/fastboot
```

```powershell
# 查看 wsl 版本
wsl --list --verbose
```

### 备份与迁移

```powershell
# 查看已安装的发行版名称
wsl --list

# 导出为 tar 备份
wsl --export Ubuntu-20.04 D:\backup\ubuntu.tar

# 导入到新位置（迁移到其他磁盘时也用这个）
wsl --import Ubuntu-new D:\wsl\Ubuntu-new D:\backup\ubuntu.tar

# 注销（删除）发行版，注意先备份
wsl --unregister Ubuntu-20.04
```

### .wslconfig 资源限制

WSL2 默认可能占用过多内存，在 `%USERPROFILE%\.wslconfig` 中限制：

```ini
[wsl2]
# 分配给 WSL2 的最大内存
memory=8GB
# CPU 核数
processors=4
# 交换空间大小，设为 0 禁用 swap
swap=2GB
```

修改后需 `wsl --shutdown` 重启 WSL 生效。

## 开发配置

### git

下载：前往 <https://git-scm.com/download/win>

Windows Terminal 中 git-bash 的乱码问题：将 profile 的 commandline 从 `$GIT_INSTALL_DIR\bin\bash.exe` 修改为 `$GIT_INSTALL_DIR\usr\bin\bash.exe --login -i`。

wsl2 中的显示问题：

```bash
# 修复 git status 等命令的中文路径显示
git config --global core.quotepath false

# 设置提交信息的编码
git config --global i18n.commitEncoding utf-8
```

### Java

安装 Java：<https://www.oracle.com/hk/java/technologies/downloads/>

### python

- <https://github.com/adang1345/PythonWindows>
- <https://www.python.org/downloads/>

## 代理

### windows 防火墙放开代理端口

将 Clash 的代理端口（如 7897）在防火墙放开，以管理员身份打开 cmd / PowerShell 执行：

```powershell
netsh advfirewall firewall add rule name="Open Port 7897" dir=in action=allow protocol=TCP localport=7897
```

Clash 配置：

1. Windows 客户端开启 `Allow LAN`（允许局域网连接）
2. 端口查看：Clash 设置 → 端口设置（默认 HTTP: 7897, SOCKS5: 7891）

scoop 代理：

```powershell
scoop config proxy 127.0.0.1:7897
```

### Windows 11 镜像模式

在 Windows 下打开记事本，创建或编辑文件 `%USERPROFILE%\.wslconfig`（例如 `C:\Users\你的用户名\.wslconfig`），写入以下内容并保存：

```ini
[wsl2]
networkingMode=mirrored
autoProxy=true
```

这是官方目前最推荐、体验最丝滑的方式。开启后，WSL2 与 Windows 共享网络栈，在 WSL 中使用 `127.0.0.1` 即可直接访问 Windows 的代理端口。

## 进程查找与终止

### 按名称或 PID 查找进程

```powershell
# 按名称查找（不带 .exe 后缀）
Get-Process -Name chrome

# 支持通配符模糊匹配
Get-Process -Name "*chrome*"

# 按 PID 查找
Get-Process -Id 1234

# cmd 风格的写法，tasklist 配合 findstr 过滤（映像名要带 .exe）
tasklist | findstr chrome.exe
```

### 查看进程详情

同名进程较多时（如 java、node 各起好几个），光靠名称分不清哪个是目标，需要进一步看路径和命令行：

```powershell
# 查看 PID、可执行文件路径、启动时间
Get-Process -Name java | Select-Object Id, Path, StartTime

# 查看完整命令行，是区分同名进程的关键
Get-CimInstance Win32_Process -Filter "Name='java.exe'" |
    Select-Object ProcessId, CommandLine
```

### 按端口查找进程

开发时端口被占用（如 8080 被上次没退干净的服务占着），先找到占用端口的 PID：

```powershell
# 传统方式，输出最后一列就是 PID
netstat -ano | findstr :8080

# PowerShell 原生方式，更直观
Get-NetTCPConnection -LocalPort 8080 |
    Select-Object LocalAddress, LocalPort, State, OwningProcess
```

### 终止进程

```powershell
# PowerShell：按名称 / 按 PID 强制结束
Stop-Process -Name notepad -Force
Stop-Process -Id 1234 -Force

# cmd 风格：/IM 按映像名（要带 .exe），/PID 按 PID，/F 强制结束
taskkill /IM notepad.exe /F
taskkill /PID 1234 /F

# /T 连同整个子进程树一起结束
taskkill /PID 1234 /T /F
```

端口被占用的经典组合，一条命令完成「查 PID → kill」：

```powershell
Stop-Process -Id (Get-NetTCPConnection -LocalPort 8080).OwningProcess -Force
```

注意：

- kill 前先用 `Get-Process -Id <pid>` 核对进程名与路径，确认不是系统关键进程再动手，避免误杀
- `taskkill` 不加 `/F` 只是向窗口发送关闭消息（WM_CLOSE），控制台程序往往无响应，实际使用一般直接加 `/F`
- 结束系统进程或其他用户的进程，需要以管理员身份运行终端

## Windows Terminal

安装（Win11 一般自带，Win10 手动装）：

```powershell
winget install Microsoft.WindowsTerminal
```

基础配置：打开设置（`Ctrl+,`）→ 选择 JSON 文件，或直接编辑 `%LOCALAPPDATA%\Packages\Microsoft.WindowsTerminal_8wekyb3d8bbwe\LocalState\settings.json`。常用配置项：

- **默认配置文件**：`defaultProfile` 指定启动时打开哪个 shell（如 PowerShell 7、bash）
- **默认起始目录**：profile 中的 `startingDirectory`
- **外观**：`colorScheme`（配色方案）、字号、`useAcrylic`（亚克力透明）
- **快捷键**：`keybindings` / `actions` 自定义按键

## winget

Windows 官方包管理器，常用命令：

```powershell
# 搜索
winget search <name>
# 安装
winget install <name>
# 升级单个包
winget upgrade <name>
# 列出可升级的包
winget upgrade
# 全部升级
winget upgrade --all
# 卸载
winget uninstall <name>
# 列出已安装
winget list
# 代理
winget install <name> --proxy http://127.0.0.1:7897
# 导出已安装软件清单（重装系统 / 迁移机器时备份）
winget export -o D:\backup\packages.json
# 根据清单批量安装
winget import -i D:\backup\packages.json
```

## powershell7

### 安装

- 方式一：从 Releases 下载对应 msi 文件进行安装：<https://github.com/PowerShell/PowerShell/releases>
- 方式二：通过 winget 进行安装：`winget install Microsoft.PowerShell`

更新使用：

```powershell
winget upgrade Microsoft.PowerShell

# winget 代理
winget upgrade Microsoft.PowerShell --proxy http://127.0.0.1:7897
```

或者直接使用微软提供的在线安装脚本，`-UseMSI` 会下载并运行标准的 Windows 程序，并自动替换旧版保留所有设置：

```powershell
iex "& { $(irm https://aka.ms/install-powershell.ps1) } -UseMSI"
```

### 快捷键配置

在 PowerShell7 中实现 Linux bash 的快捷键。因为 PowerShell 中用的是 Windows 模式，Linux 用的是 Emacs 模式，切换 Emacs 模式：在终端输入 `notepad $PROFILE`，在文件中加入：

```powershell
Set-PSReadLineOption -EditMode Emacs
```

如果只想在当前 shell 中生效，则执行上述命令。如果只想修改单个命令，则使用：

```powershell
Set-PSReadLineKeyHandler -Key "Ctrl+e" -Function EndOfLine
```

如果想要让 oh-my-posh 也实现一样的功能，需要增加如下配置：

```powershell
oh-my-posh init pwsh | Invoke-Expression

# 1. 确保使用的是 Emacs 模式（提供 Ctrl+A, Ctrl+E 等基础体验）
Set-PSReadLineOption -EditMode Emacs

# 2. 重新定义 Ctrl+e：强制接受所有预测并跳转行尾
Set-PSReadLineKeyHandler -Key "Ctrl+e" -ScriptBlock {
    # 尝试采纳当前的预测建议（全量采纳）
    [Microsoft.PowerShell.PSConsoleReadLine]::AcceptSuggestion()
    # 强制将光标移动到整行的末尾
    [Microsoft.PowerShell.PSConsoleReadLine]::EndOfLine()
}

# 设置预测来源为历史记录
Set-PSReadLineOption -PredictionSource History

# 设置预测文本的显示方式为列表或内联（内联最像 Linux）
Set-PSReadLineOption -PredictionViewStyle InlineView

# 设置常用别名
Set-Alias grep findstr
Set-Alias touch New-Item
Set-Alias cat Get-Content
Set-Alias rm Remove-Item
Set-Alias mv Move-Item
Set-Alias mkdir New-Item

function wk { cd D:\workspaces }
function gs { git status }

function proxy {
    $env:HTTP_PROXY = "http://127.0.0.1:7897"
    $env:HTTPS_PROXY = "http://127.0.0.1:7897"
    Write-Host "Proxy ON" -ForegroundColor Green
}

function unproxy {
    $env:HTTP_PROXY = $null
    $env:HTTPS_PROXY = $null
    Write-Host "Proxy OFF" -ForegroundColor Red
}
```

### 历史与预测

历史记忆由 PSReadLine 模块提供（PowerShell 7 内置），跨会话持久保存。

历史预测——输入时显示灰色的历史建议：

```powershell
# 预测来源：历史记录
Set-PSReadLineOption -PredictionSource History

# 显示方式：InlineView 单行灰字（类似 fish）/ ListView 下拉列表
Set-PSReadLineOption -PredictionViewStyle InlineView
```

- InlineView：灰色建议出现在光标右侧，`→` 或 `End` 整条采纳，`Ctrl+→` 逐词采纳
- ListView：下方弹出历史列表，`↓` 进入列表选择，`→` 采纳；`F2` 在两种视图间切换

插件预测——在历史之外挂载预测插件（PSReadLine 2.2+）：

```powershell
# CompletionPredictor 把 Tab 补全候选也变成灰色预测
Install-Module CompletionPredictor
Set-PSReadLineOption -PredictionSource HistoryAndPlugin
```

历史搜索：

- `Ctrl+r` 向后搜索历史，`Ctrl+s` 向前搜索
- 输入 `#关键字` 后按 Tab，从历史记录中补全整条命令

历史文件——跨会话“记忆”的载体：

```powershell
# 查看历史文件路径
Get-PSReadLineOption | select HistorySavePath
# 默认在 %APPDATA%\Microsoft\Windows\PowerShell\PSReadLine\ConsoleHost_history.txt

# 历史条数上限（默认 4096）
Set-PSReadLineOption -MaximumHistoryCount 8192
```

注意 `Get-History`（别名 `h`）只显示**当前会话**执行过的命令，`Invoke-History 5`（别名 `r 5`）重跑第 5 条；它与 PSReadLine 的交互历史是两套体系。`Clear-History` 只清当前会话，要彻底清空记忆需删除历史文件。

### oh-my-posh

参考文档：<https://ohmyposh.dev/docs>

配置 powershell，安装 powershell 插件：

```powershell
# 允许运行 Install-Module 脚本
set-executionpolicy remotesigned

# 更新最新版本的 PSReadLine，为了自动补全
Install-Module PSReadLine -Force

# 创建 powershell 的初始化脚本，点击确认创建即可
notepad $profile

# 安装几个插件
Install-Module posh-git
Install-Module Terminal-Icons
```

安装 oh-my-posh：

```powershell
winget install JanDeDobbeleer.OhMyPosh --source winget --scope machine --force
```

字体安装：

```powershell
oh-my-posh font install meslo
```

在 PowerShell7 中使用下面命令创建空白配置文件：

```powershell
New-Item -Path $PROFILE -Type File -Force
# 配置文件位于 ~\Documents\PowerShell
```

找到 `~\Documents\PowerShell\Microsoft.PowerShell_profile.ps1` 文件，编辑打开，写入：

```powershell
oh-my-posh init pwsh | Invoke-Expression
```

## scoop

安装：

```powershell
# 要求 powershell 版本 5.1 以上，查看版本
$PSVersionTable.PSVersion

# 安装
irm get.scoop.sh | iex
```

相关命令：

```powershell
scoop install avidemux
scoop install clash-verge-rev
scoop install qemu
scoop uninstall filezilla

scoop search qemu
scoop update
```

版本相关：

```powershell
# 安装指定版本
scoop install git@2.19.0.windows.1
# 切换版本
scoop reset terraform@0.12.11
```

### java 版本

```powershell
scoop install openjdk11
scoop install openjdk17
scoop install corretto8-jdk
# 版本切换
scoop reset openjdk21
```

代理：

```powershell
# 配置代理
scoop config proxy 127.0.0.1:7897
# 查看代理
scoop config
# 去掉代理
scoop config rm proxy
```

帮助：

```powershell
scoop help <command>
```

### 源添加

```powershell
# 源查看
scoop bucket list
# 查看官方已知的源
scoop bucket known
# 删除
scoop bucket rm <名称>

# 增加 main 外的源
scoop bucket add extras
scoop bucket add java
# 增加其他版本
scoop bucket add versions

# 国内源
scoop bucket add extras-cn https://github.com/Scoopforge/Extras-CN
```

### scoop update 报 dubious ownership 错误

`scoop update` 报 `fatal: detected dubious ownership in repository at 'C:/Users/xxx/scoop/apps/scoop/current'`，原因是 scoop 目录（主程序或 buckets）被管理员用户所有，git 的安全检查拒绝操作。给对应目录加 `safe.directory` 例外即可：

```powershell
# 主程序目录
git config --global --add safe.directory C:/Users/用户名/scoop/apps/scoop/current

# 各 bucket 目录（按实际报错的路径添加）
git config --global --add safe.directory C:/Users/用户名/scoop/buckets/main
git config --global --add safe.directory C:/Users/用户名/scoop/buckets/extras
git config --global --add safe.directory C:/Users/用户名/scoop/buckets/nerd-fonts
```

这种所有权状态通常是某次用管理员权限运行 scoop 造成的，平时建议用普通用户权限使用 scoop。

