## apt

```bash
sudo apt install <package_name>
sudo apt remove <package_name>

# 彻底卸载软件包（包括配置文件）
sudo apt purge <package_name>
apt search <package_name>

# 查看已安装的软件包
apt list --installed

# 清理不再需要的软件包
sudo apt autoremove

# 查看软件包信息
apt show <package_name>
```

apt 代理配置，在 `vi /etc/apt/apt.conf` 文件中：

```bash
Acquire::http::proxy "http://proxy.hk.*.com:8080/";
Acquire::ftp::proxy "ftp://proxy.hk.*.com:8080/";
Acquire::https::proxy "https://proxy.hk.*.com:8080/";
```

### 换源

```bash
cd /etc/apt/

# 留个 source 备份
sudo mv sources.list sources.list.backup

# 使用源
sudo vim sources.list
```

写入（根据 ubuntu 版本号自己查，如果源的版本和 ubuntu 版本不一致，那么后续更新就会发生依赖问题。e.g. Ubuntu20.04 对应 focal-XXX 的源）：

```bash
deb http://mirrors.aliyun.com/ubuntu/ focal main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ focal main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ focal-security main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ focal-security main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ focal-updates main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ focal-updates main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ focal-proposed main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ focal-proposed main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ focal-backports main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ focal-backports main restricted universe multiverse

deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ focal main restricted universe multiverse
# deb-src https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ focal main restricted universe multiverse
deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ focal-updates main restricted universe multiverse
# deb-src https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ focal-updates main restricted universe multiverse
deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ focal-backports main restricted universe multiverse
# deb-src https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ focal-backports main restricted universe multiverse
deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ focal-security main restricted universe multiverse
# deb-src https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ focal-security main restricted universe multiverse
```

移除自带的包（因为可能和国内源的软件有冲突）：

```bash
sudo apt remove ubuntu-advantage-tools
```

更新：

```bash
sudo apt update
sudo apt upgrade
```

## 编译环境

C++ 编译环境配置：

```bash
sudo apt update
sudo apt install gdb
gdb --version
sudo apt install cmake
cmake --version
sudo apt install build-essential
gcc --version
g++ --version
make --version
```

opencv 安装：

```bash
apt install libopencv-dev
```

## 代理

### wsl2 代理

在 `~/.bashrc` 或 `~/.zshrc` 中添加，或者直接执行临时添加：

```bash
export http_proxy="http://<WINDOWS_IP>:<PORT>"
export https_proxy="http://<WINDOWS_IP>:<PORT>"

# 有帐号
export http_proxy="http://username:passwd@proxy.*.com:port"

export all_proxy="socks5://<WINDOWS_IP>:<PORT>"
export all_proxy="http://172.19.16.1:7897"
```

或者通过动态获取配置，端口需要看代理软件使用的端口：

```bash
export hostip=$(cat /etc/resolv.conf | grep -oP '(?<=nameserver\ ).*')
export https_proxy="http://${hostip}:7897"
export http_proxy="http://${hostip}:7897"
```

在 Windows 11 中，也可通过镜像模式代理：在 Windows 中编辑 `%UserProfile%\.wslconfig`，写入：

```bash
[wsl2]
networkingMode=mirrored
firewall=true
# 关闭自动代理，避免干扰 WSL 内的 TUN
autoProxy=false
# 开启 DNS 隧道，让 WSL 的 DNS 请求更稳定地传给 Linux 内部处理
dnsTunneling=true
```

然后在 wsl 中配置：

```bash
export https_proxy='http://127.0.0.1:7897'
export http_proxy='http://127.0.0.1:7897'
```

### git 代理

```bash
# 配置
git config --global http.proxy http://username:passwd@proxy.*.com:port
git config --global https.proxy http://username:passwd@proxy.*.com:port
# 取消配置
git config --global --unset http.proxy
git config --global --unset https.proxy
```

npm 的代理清理：

```bash
npm config delete proxy
```

### 排查

可能的错误定位：

```bash
# bash 中查看要配置的 ip
cat /etc/resolv.conf | grep -oP '(?<=nameserver\ ).*'

# 在 powershell 中，查看 ip
wsl hostname -I

# 测试基础网络连通性
ping 8.8.8.8

# 查看域名转化为 IP
nslookup github.com
```

测试：

```bash
# 测试 HTTPS 连接
curl -v https://github.com

# 测试 SSH 连接
ssh -T git@github.com
```

### ssh 代理

在 `~/.ssh/config` 配置：

```bash
Host github.com
    Hostname ssh.github.com
    Port 443
    User git
    ProxyCommand nc -v -x 172.19.16.1:7897 %h %p
```

### Android 使用代理

在 `gradle.properties` 文件中配置代理：

```bash
systemProp.http.proxyHost=proxy.*.com
systemProp.http.proxyPort=port
systemProp.https.proxyHost=proxy.server
systemProp.https.proxyPort=port

systemProp.http.proxyUser=username
systemProp.http.proxyPassword=password
systemProp.https.proxyUser=username
systemProp.https.proxyPassword=password
```

## ssh key

生成密钥的基础步骤（默认用于 GitHub/GitLab 等的 SSH 免密登录）：

```bash
# 一路回车使用默认路径 ~/.ssh/id_ed25519；-C 是备注，一般写邮箱
ssh-keygen -t ed25519 -C "your_email@example.com"

# 查看公钥内容，复制到 GitHub → Settings → SSH keys
cat ~/.ssh/id_ed25519.pub

# 测试连接
ssh -T git@github.com
```

老系统不支持 ed25519 时用 `ssh-keygen -t rsa -b 4096`。同一台机器配多个账号时，用 `-f` 指定不同的密钥文件，并在 `~/.ssh/config` 中区分 Host。

## ufw 防火墙

Ubuntu 默认防火墙管理工具：

```bash
# 查看状态
sudo ufw status
# 启用 / 禁用
sudo ufw enable
sudo ufw disable

# 放行端口
sudo ufw allow 22
# 放行指定协议
sudo ufw allow 7897/tcp
# 删除规则
sudo ufw delete allow 22
```

## Java

jdk 安装：

```bash
# 查看可安装版本
apt --names-only search "openjdk-.*jre$"
# 安装多版本
sudo apt install openjdk-11-jdk
sudo apt install openjdk-17-jre
# 安装完整的 Java 版本
sudo apt install openjdk-21-jdk -y
# 版本切换，选择对应的版本
sudo update-alternatives --config java

# JAVA_HOME
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
export PATH=$JAVA_HOME/bin:$PATH
```

## Python

3.8 python 版本安装：

```bash
# 安装必备组件：运行以下命令以安装 software-properties-common，这是添加 PPA 所需的工具
sudo apt install software-properties-common
# 添加 Deadsnakes PPA：这个 PPA 包含了多个 Python 版本
sudo add-apt-repository ppa:deadsnakes/ppa
sudo apt update
sudo apt install python3.8
```

pip 安装：

```bash
sudo apt install python3-pip
pip --version
pip3 install <package_name>
```

永久代理，在 `~/.pip/pip.conf`，Windows 中该文件在 `C:\Users\username\pip\pip.ini`：

```bash
[global]
timeout = 1000
# proxy = http://[username:password@]proxyserver:port
proxy = http://172.19.16.1:7897
index-url = http://mirrors.tuna.tsinghua.edu.cn/pypi/web/simple/

[install]
trusted-host = mirrors.tuna.tsinghua.edu.cn
```

临时代理：

```bash
# 配置
pip install --proxy http://172.19.16.1:7897
pip install --proxy https://172.19.16.1:7897
# 取消
pip install --proxy "" package_name
```

## zsh 与 ohmyzsh

ubuntu 安装 zsh：

```bash
sudo apt install zsh
```

[ohmyzsh 安装](https://github.com/ohmyzsh/ohmyzsh)：

```bash
wget https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh
sh install.sh
```

安装插件：

```bash
cd ~/.oh-my-zsh/custom/plugins/

# 高亮关键词
git clone https://github.com/zsh-users/zsh-syntax-highlighting.git $ZSH_CUSTOM/plugins/zsh-syntax-highlighting

# 自动补全
git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions

# 更加丰富的高亮
git clone https://github.com/zdharma-continuum/fast-syntax-highlighting.git ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/plugins/fast-syntax-highlighting
```

在 `~/.zshrc` 中配置插件：

```bash
plugins=(
  git
  zsh-autosuggestions
  zsh-syntax-highlighting
  fast-syntax-highlighting
)
```

在 `~/.zshrc` 中配置主题：

```bash
# 默认使用 robbyrussell，常用 agnoster、Bullet-train
ZSH_THEME="agnoster"
```

### powerlevel10k 主题

参考：<https://github.com/romkatv/powerlevel10k>

下载：

```bash
git clone --depth=1 https://github.com/romkatv/powerlevel10k.git ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k
```

在 `~/.zshrc` 中配置：

```bash
ZSH_THEME="powerlevel10k/powerlevel10k"
```

重新进入配置向导：

```bash
p10k configure
```

## NerdFont 字体

下载：<https://github.com/ryanoasis/nerd-fonts#font-installation>

### Windows 安装

powershell 安装：

```powershell
Install-PSResource -Name NerdFonts
Import-Module -Name NerdFonts
```

Windows PowerShell：

```powershell
./install.ps1
```

### Linux 安装

全部字体安装，较大，下载慢，可按需选择安装：

```bash
git clone https://github.com/ryanoasis/nerd-fonts.git --depth 1

./install.sh
```

安装部分字体：

```bash
# 只下载提交历史和树对象，不下载文件内容（blob）
git clone --filter=blob:none --sparse git@github.com:ryanoasis/nerd-fonts

# 配置稀疏检出路径（例如只想要 JetBrains Mono 字体）
git sparse-checkout set patched-fonts/JetBrainsMono

git checkout

# 查看结果
ls ~/.local/share/fonts/
```

## 参考

- <https://kirigaya.cn/blog/article?seq=28>
- <https://www.taurusxin.com/windows-terminal/>
- <https://www.poloxue.com/posts/2023-10-20-zsh-theme-powerlevel10k/>
- <https://ohmyposh.dev/docs/installation/linux>
