## wsl2

### 安装

以管理员身份打开windows terminal

```bash
# 开启VM组件 开启后需要重启电脑
Enable-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform

# 查看可用版本
wsl --list --online

# 安装Ubuntu指定版本
wsl --install -d Ubuntu-20.04 

# 设置为wsl2
wsl --set-default-version 2
```

### 配置

wsl使用adb

```bash
sudo ln -s /home/user_name/platform-tools/adb.exe /usr/bin/adb
sudo ln -s /home/user_name/platform-tools/fastboot.exe /usr/bin/fastboot

#查看wsl版本
wsl --list --verbose
```

## 开发配置

### git

下载，前往 https://git-scm.com/download/win

wsl中配置git-bash中乱码问题，将commandline位置从`$GIT_INSTALL_DIR\\bin\\bash.exe`修改为了`$GIT_INSTALL_DIR\\usr\\bin\\bash.exe --login -i`

#### wls2中的显示问题

```bash
# 修复 git status 等命令的中文路径显示
git config --global core.quotepath false

# 设置提交信息的编码
git config --global i18n.commitEncoding utf-8
```

### Java

安装Java：https://www.oracle.com/hk/java/technologies/downloads/

### python

```bash
https://github.com/adang1345/PythonWindows
https://www.python.org/downloads/
```

### 代理

#### widows-vpn

window 防火墙 7890 端口放开。 在cmd 命令行执行：

```bash
netsh advfirewall firewall add rule name="Open Port 7897" dir=in action=allow protocol=TCP localport=7897
```

powershell代理：

```bash
scoop config proxy 127.0.0.1:7897
```

 Clash 配置

1. Windows 客户端开启 `Allow LAN`（允许局域网连接）
2. 端口查看：Clash 设置 → 端口设置（默认 HTTP:7897, SOCKS5:7891）

#### Windows11

在 Windows 下打开记事本，创建或编辑文件：%USERPROFILE%\.wslconfig（例如 `C:\Users\你的用户名\.wslconfig`）  写入以下内容并保存：

```bash
[wsl2]
networkingMode=mirrored
autoProxy=true
```

这是官方目前最推荐、体验最丝滑的方式。开启后，WSL2 与 Windows 共享网络栈，在 WSL 中使用 `127.0.0.1` 即可直接访问 Windows 的代理端口。

## powershell7 

### 安装

- 方式一：从 Releases 下载对应 msi 文件进行安装 ：https://github.com/PowerShell/PowerShell/releases

- 方式二：通过 winget 进行安装：winget install Microsoft.PowerShell。

更新使用：

```bash
winget upgrade Microsoft.PowerShell

# winget 代理
winget upgrade Microsoft.PowerShell --proxy http://127.0.0.1:7897
```

或者直接使用微软提供的在线安装角本，`-UseMSI`会下载并运行标准的Windows程序，并自动替换旧版保留所有设置：

```bash
iex "& { $(irm https://aka.ms/install-powershell.ps1) } -UseMSI"
```

### 快捷键配置

在PowerShell7中实现Linux bash的快捷键。因为PowerShell中用的是Windows模式，Linux用的是Emacs模式，切换Emacs模式：在终端输入`notepad $PROFILE`，在文件中加入：

```bash
Set-PSReadLineOption -EditMode Emacs
```

如果只想在当前shell中生效，则执行上述命令。如果只想修改单个命令，则使用：

```bash
Set-PSReadLineKeyHandler -Key "Ctrl+e" -Function EndOfLine
```

如果想要让ohmyposh也实现一样的功能，需要增加如下配置：

```bash
oh-my-posh init pwsh | Invoke-Expression

# 1. 确保使用的是 Emacs 模式（提供 Ctrl+A, Ctrl+E 等基础体验）
Set-PSReadLineOption -EditMode Emacs

# 2. 重新定义 Ctrl+e：强制接受所有预测并跳转行尾
Set-PSReadLineKeyHandler -Key "Ctrl+e" -ScriptBlock {
    # 尝试采纳当前的预测建议 (全量采纳)
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
function gs { git status}

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

### ohmyposh

参考文档：https://ohmyposh.dev/docs

配置 powershell，安装powershell插件

```bash
# 允许运行Install-Module脚本
set-executionpolicy remotesigned

# 更新最新版本的PSReadLine，为了自动补全
Install-Module PSReadLine -Force

# 创建powershell 的初始化脚本，点击确认创建即可
notepad $profile

# 安装几个插件
Install-Module posh-git
Install-Module Terminal-Icons
```

安装ohmyposh：

```bash
winget install JanDeDobbeleer.OhMyPosh --source winget --scope machine --force

 winget install JanDeDobbeleer.OhMyPosh -s winget
```

字体安装：

```bash
oh-my-posh font install meslo
```

在PowerShell7中使用下面命令创建空白配置文件：

```powershell
New-Item -Path $PROFILE -Type File -Force
# 
 ~\Documents\PowerShell
```

找到`~\Documents\PowerShell\Microsoft.PowerShell_profile.ps1`文件，编辑打开，写入

```
oh-my-posh init pwsh | Invoke-Expression
```

#### powerlevel10k主题

https://github.com/romkatv/powerlevel10k

- 下载

  ```shell
  git clone --depth=1 https://github.com/romkatv/powerlevel10k.git ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k
  ```

- 在`~/.zshrc`中配置

  ```shell
  ZSH_THEME="powerlevel10k/powerlevel10k"
  ```

- 重新进入配置向导：

  ```shell
  p10k configure
  ```

参考：https://www.poloxue.com/posts/2023-10-20-zsh-theme-powerlevel10k/

## scoop

安装：

```bash
# 要求powershell版本5.1以上，查看版本
$PSVersionTable.PSVersion

# 安装
irm get.scoop.sh | iex
```

相关命令：

```bash
scoop install curl
scoop uninstall git
scoop search ssh
scoop update
```

版本相关：

```bash
# 安装指定版本
scoop install git@2.19.0.windows.1
# 切换版本
scoop reset terraform@0.12.11
```

源：

```bash
# 增加main外的源
scoop bucket add extras

scoop bucket add java
```

代理：

```bash
# 配置代理
scoop config proxy 127.0.0.1:7897
# 查看代理
scoop config
# 去掉代理
scoop config rm proxy
```

### help

```bash
scoop help <command>
```

The current commands are (output from `scoop help`):

```bash
alias      Manage scoop aliases
bucket     Manage Scoop buckets
cache      Show or clear the download cache
cat        Show content of specified manifest. If available, `bat` will be used to pretty-print the JSON.
checkup    Check for potential problems
cleanup    Cleanup apps by removing old versions
config     Get or set configuration values
create     Create a custom app manifest
depends    List dependencies for an app, in the order they'll be installed
download   Download apps in the cache folder and verify hashes
export     Exports installed apps, buckets (and optionally configs) in JSON format
help       Show help for a command
hold       Hold an app to disable updates
home       Opens the app homepage
import     Imports apps, buckets and configs from a Scoopfile in JSON format
info       Display information about an app
install    Install apps
list       List installed apps
prefix     Returns the path to the specified app
reset      Reset an app to resolve conflicts
search     Search available apps
shim       Manipulate Scoop shims
status     Show status and check for new app versions
unhold     Unhold an app to enable updates
uninstall  Uninstall an app
update     Update apps, or Scoop itself
virustotal Look for app's hash or url on virustotal.com
which      Locate a shim/executable (similar to 'which' on Linux)
```
