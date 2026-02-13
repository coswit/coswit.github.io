## 安装

安装，基于Linux库安装，可能版本较低，不支持LazyVim.

```bash
# 安装 Neovim
sudo apt install neovim
# 更新软件列表
sudo apt update
# 添加 unstable PPA 源（版本通常较新）
sudo add-apt-repository ppa:neovim-ppa/stable
```

下载最新版本

```bash
curl -LO https://github.com/neovim/neovim/releases/latest/download/nvim-linux-x86_64.tar.gz
sudo rm -rf /opt/nvim-linux-x86_64
sudo tar -C /opt -xzf nvim-linux-x86_64.tar.gz

export PATH="$PATH:/opt/nvim-linux-x86_64/bin"
```

## LazyVim

安装[LazyVim](https://lazyvim-github-io.vercel.app/zh-Hans/installation)插件管理器

```bash
# 需要
mv ~/.config/nvim ~/.config/nvim.bak

# 可选，但建议
mv ~/.local/share/nvim ~/.local/share/nvim.bak
mv ~/.local/state/nvim ~/.local/state/nvim.bak
mv ~/.cache/nvim ~/.cache/nvim.bak

# 下载
git clone https://github.com/LazyVim/starter ~/.config/nvim
# 启动
nvim
# 检查
:checkhealth
```

nvim文件夹的结构如下：

```
📂 ~/.config/nvim
├── 📂 lua/**config files**
└── 🌑 init.lua
```

`init.lua` 是 nvim 的入口文件，类似于 vim 的 `.vimrc` 文件。

`init.lua` 中可以使用 `require(module_name)` 包含其他的配置脚本，那么 nvim 会去找到 `./lua/module_name.lua` 并逐行解释运行。



### `tmux`兼容异常处理

```bash
# ERROR: escape-time (500) is higher than 300ms
# ERROR: $TERM should be "screen-256color" or "tmux-256color" in tmux

# 在 ~/.tmux.conf中增加配置
set -sg escape-time 10 
set -g default-terminal "tmux-256color"

# 重新加载
tmux source-file ~/.tmux.conf
```

### 配置

行数配置

```lua
vim.opt.number = true
vim.opt.relativenumber = false
```

## lazyvim插件

Language Server Protocol (LSP)
