## 基本

安装

```bash
# 添加 unstable PPA 源（版本通常较新）
sudo add-apt-repository ppa:neovim-ppa/stable
# 更新软件列表
sudo apt update
# 安装 Neovim
sudo apt install neovim
```

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

`tmux`兼容异常处理

```bash
# ERROR: escape-time (500) is higher than 300ms
# ERROR: $TERM should be "screen-256color" or "tmux-256color" in tmux

# 在 ~/.tmux.conf中增加配置
set -sg escape-time 10 
set -g default-terminal "tmux-256color"

# 重新加载
tmux source-file ~/.tmux.conf
```

