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

apt 代理配置，写入 `/etc/apt/apt.conf.d/95proxy`（放 apt.conf.d 目录下的独立文件，不动主配置）：

```bash
Acquire::http::Proxy "http://proxy.hk.*.com:8080/";
Acquire::https::Proxy "http://proxy.hk.*.com:8080/";
Acquire::ftp::Proxy "ftp://proxy.hk.*.com:8080/";
```

验证是否生效：

```bash
apt-config dump | grep -i proxy
```

### 换源

```bash
cd /etc/apt/

# 留个 source 备份
sudo mv sources.list sources.list.backup

# 使用源
sudo vim sources.list
```

写入（根据 ubuntu 版本号自己查，如果源的版本和 ubuntu 版本不一致，那么后续更新就会发生依赖问题。e.g. Ubuntu 20.04 对应 focal-XXX 的源；focal 已于 2025 年 5 月停止官方支持，新装建议 22.04 起步，这里以 focal 为例仅示意格式）：

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

Ubuntu 24.04 起源换成 deb822 格式，配置在 `/etc/apt/sources.list.d/ubuntu.sources`，不再使用 sources.list，直接 sed 替换地址即可：

```bash
sudo sed -i 's@//archive.ubuntu.com@//mirrors.tuna.tsinghua.edu.cn@g' /etc/apt/sources.list.d/ubuntu.sources
sudo sed -i 's@//security.ubuntu.com@//mirrors.tuna.tsinghua.edu.cn@g' /etc/apt/sources.list.d/ubuntu.sources
```

移除自带的包（因为可能和国内源的软件有冲突；新版本中该包已更名为 ubuntu-pro-client）：

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
export all_proxy="socks5://<WINDOWS_IP>:<PORT>"

# 有帐号
export http_proxy="http://username:passwd@proxy.*.com:port"
```

WINDOWS_IP 是 Windows 侧 vEthernet (WSL) 虚拟网卡的地址，可以动态获取（端口需要看代理软件使用的端口）：

```bash
# 从 resolv.conf 的 nameserver 取，默认 NAT 模式下它就是 Windows 侧地址
export hostip=$(cat /etc/resolv.conf | grep -oP '(?<=nameserver\ ).*')
export https_proxy="http://${hostip}:7897"
export http_proxy="http://${hostip}:7897"

# 或者从默认路由取网关地址
export hostip=$(ip route show default | awk '{print $3}')
```

注意：开启 `dnsTunneling` 或镜像模式后，resolv.conf 里的 nameserver 是 WSL 内部地址（如 10.255.255.254），第一种方法拿到的是错误 IP，此时改用 `ip route` 或直接走下面的镜像模式。

在 Windows 11 中，也可通过镜像模式代理：在 Windows 中编辑 `%UserProfile%\.wslconfig`，写入：

```ini
[wsl2]
networkingMode=mirrored
firewall=true
# 关闭自动代理，避免干扰 WSL 内的 TUN；不需要手动控制时设 true，让 WSL 自动继承 Windows 的系统代理
autoProxy=false
# 开启 DNS 隧道，让 WSL 的 DNS 请求更稳定地传给 Linux 内部处理
dnsTunneling=true
```

镜像模式下 WSL 与 Windows 共享网络栈，wsl 中直接用 `127.0.0.1` 访问 Windows 侧的代理端口：

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

### ssh 代理

在 `~/.ssh/config` 配置：

```bash
Host github.com
    Hostname ssh.github.com
    Port 443
    User git
    ProxyCommand nc -v -x 172.19.16.1:7897 %h %p
```

### gradle 代理

在 `gradle.properties` 文件中配置代理：

```properties
systemProp.http.proxyHost=proxy.*.com
systemProp.http.proxyPort=port
systemProp.https.proxyHost=proxy.*.com
systemProp.https.proxyPort=port

systemProp.http.proxyUser=username
systemProp.http.proxyPassword=password
systemProp.https.proxyUser=username
systemProp.https.proxyPassword=password
```

### 排查

可能的错误定位：

```bash
# WSL 内查看 Windows 侧网关 IP（即上面要配置的 WINDOWS_IP）
cat /etc/resolv.conf | grep -oP '(?<=nameserver\ ).*'
ip route show default

# 测试基础网络连通性
ping 8.8.8.8

# 查看域名转化为 IP
nslookup github.com
```

Windows 侧（PowerShell）排查：

```powershell
# 查看 WSL 自身的 IP，Windows 访问 WSL 里的服务时用
wsl hostname -I

# 查看 vEthernet (WSL) 网卡 IP，即 WSL 代理配置里的 WINDOWS_IP
ipconfig
```

测试：

```bash
# 测试 HTTPS 连接
curl -v https://github.com

# 测试 SSH 连接
ssh -T git@github.com
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
apt search --names-only "openjdk-.*jre$"
# 安装多版本
sudo apt install openjdk-11-jdk
sudo apt install openjdk-17-jre
# 安装完整的 Java 版本
sudo apt install openjdk-21-jdk -y
# 版本切换，选择对应的版本；java 和 javac 要分别切，只切 java 的话 javac 仍是旧版本
sudo update-alternatives --config java
sudo update-alternatives --config javac

# JAVA_HOME
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
export PATH=$JAVA_HOME/bin:$PATH
```

## Python

3.8 python 版本安装（3.8 已于 2024 年 10 月停止官方支持，示例仅示意流程，可用版本以 PPA 页面为准）：

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

永久代理，在 `~/.config/pip/pip.conf`（旧位置 `~/.pip/pip.conf` 仍兼容），Windows 中该文件在 `%APPDATA%\pip\pip.ini`：

```ini
[global]
timeout = 1000
# proxy = http://[username:password@]proxyserver:port
proxy = http://172.19.16.1:7897
index-url = https://pypi.tuna.tsinghua.edu.cn/simple

[install]
trusted-host = pypi.tuna.tsinghua.edu.cn
```

临时代理：

```bash
# 配置
pip install --proxy http://172.19.16.1:7897 <package_name>
# 取消
pip install --proxy "" <package_name>
```

## zsh 与 oh-my-zsh

ubuntu 安装 zsh：

```bash
sudo apt install zsh
```

[oh-my-zsh 安装](https://github.com/ohmyzsh/ohmyzsh)：

```bash
wget https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh
sh install.sh
```

安装插件：

```bash
# 高亮关键词（与 fast-syntax-highlighting 二选一，同时启用会冲突）
git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting

# 自动补全
git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions

# 更加丰富的高亮（zsh-syntax-highlighting 的 fork，二选一）
git clone https://github.com/zdharma-continuum/fast-syntax-highlighting.git ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/plugins/fast-syntax-highlighting
```

在 `~/.zshrc` 中配置插件：

```bash
# 高亮插件只保留一个，且官方建议放在最后加载
plugins=(
  git
  zsh-autosuggestions
  zsh-syntax-highlighting
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

## Nerd Fonts 字体

Nerd Fonts 在常用字体上打补丁加入图标字形，oh-my-posh、powerlevel10k 等提示符主题都依赖这些图标。项目主页：<https://github.com/ryanoasis/nerd-fonts#font-installation>

安装注意：字体是终端（宿主机）的 UI 设置，不随 shell 配置走——WSL 场景下字体要装在 Windows 侧、在 Windows Terminal 里选择，装在 Linux 内部的话终端是看不到的。

### 通过 oh-my-posh 安装

装了 oh-my-posh 的话一条命令搞定，Windows / Linux 通用：

```bash
# 官方推荐 Meslo
oh-my-posh font install meslo

# 查看所有可安装的字体名
oh-my-posh font list

# 也可以直接从 zip 或 URL 安装
oh-my-posh font install ./CascadiaCode.zip
```

### 手动安装

从 Releases 下载对应字体的 zip：<https://github.com/ryanoasis/nerd-fonts/releases>

Windows：解压后全选 `.ttf` 右键「为所有用户安装」，再到 Windows Terminal 设置 → 外观 → 字体中选择。

Linux：解压到字体目录后刷新缓存：

```bash
mkdir -p ~/.local/share/fonts
unzip JetBrainsMono.zip -d ~/.local/share/fonts/
fc-cache -fv
```

### 从仓库按需安装

仓库全量 clone 较大、下载慢，可用 sparse-checkout 只拉需要的字体：

```bash
# 只下载提交历史和树对象，不下载文件内容（blob）
git clone --filter=blob:none --sparse git@github.com:ryanoasis/nerd-fonts
cd nerd-fonts

# 配置稀疏检出路径（例如只想要 JetBrains Mono 字体）
git sparse-checkout set patched-fonts/JetBrainsMono

# 检出文件后安装该字体，脚本会把 ttf 装到 ~/.local/share/fonts/ 并刷新缓存
./install.sh JetBrainsMono
```

## 参考

- <https://kirigaya.cn/blog/article?seq=28>
- <https://www.taurusxin.com/windows-terminal/>
- <https://www.poloxue.com/posts/2023-10-20-zsh-theme-powerlevel10k/>
- <https://ohmyposh.dev/docs/installation/linux>
