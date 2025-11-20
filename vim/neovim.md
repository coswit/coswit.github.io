## 基本

### 安装

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

### LazyVim

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

## 快捷键

### 基本操作

| 快捷键               | 描述                                |
| :------------------- | ----------------------------------- |
| `<leader><leader>`   | 搜索                                |
| `<leader>ff`         | 搜索                                |
| `<leader>ft`         | 打开`terminal`                      |
| `ctrl /`             | 打开` / `隐藏` `terminal            |
| `ctrl ww`            | 焦点在各窗口之间切换                |
| `ctrl w` + `h/j/k/l` | 焦点移动到 ⬅️/⬇️/⬆️/➡️ 侧窗口           |
| `hift h`             | 移动到 ⬅️ 侧 buffer 标签             |
| `shift l`            | 移动到 ➡️ 侧 buffer 标签             |
| `shift k`            | 浮窗显示函数文档                    |
| `<leader>qq`         | 退出 nvim (quit all)                |
| `s` + 任意字符串     | 快速搜索定位，类似 vimium 的搜索    |
| `<leader>cd`         | 在 lsp 警告提示上执行可以看完整信息 |
| `<leader>xx`         | 可以在窗口中查看所有 lint 提示信息  |
| `<leader>cs`         | 显示函数/类大纲                     |
| `<leader>n`          | 查看 notify （通知消息） 历史       |
| `<leader>l`          | 打开 `lazy.vim` 窗口                |

### 文件管理器

| 快捷键               | 描述                            |
| -------------------- | ------------------------------- |
| `<leader>e`          | 打开或关闭文件管理器            |
| `Esc`                | 隐藏文件管理器                  |
| `shift h`            | 控制隐藏文件显示                |
| `a`                  | `add`新建文件或文件夹 （/结尾） |
| `c`                  | `copy` 文件                     |
| `m`                  | `move` 文件 / 重命名            |
| `r`                  | `rename`重命名文件              |
| `d`                  | `delete` 删除文件 / 目录        |
| `shift v` 选中后 `y` | 多选文件 / 目录                 |
| `shift h`            | 显示隐藏文件                    |

### jetbrains 对照

| 快捷键              | 描述                         | jetbrains 快捷键  |
| ------------------- | ---------------------------- | ----------------- |
| `gd`                | 跳转到定义处                 | `cmd b`           |
| `gr`                | 显示引用                     | `cmd b`           |
| `ctrl o / ctrl + i` | 跳转回原处                   | `cmd opt <- / ->` |
| `<leader>/`         | 全局关键字搜索               | `cmd shift f`     |
| `<leader>sg`        | 全局关键字搜索               | cmd shift f       |
| `<leader>cr`        | 变量名重构                   | `shift f6`        |
| `zM`                | 折叠所有函数体               | `cmd shift -`     |
| `zR`                | 展开所有函数体               | `cmd shift +`     |
| `za`                | 折叠/打开当前函数体          | `cmd -`           |
| `zo`                | 展开当前函数体               | `cmd +`           |
| `zc`                | 折叠当前函数体               | -                 |
| `gc`                | `多行` 注释/取消注释         | `cmd /`           |
| `gcc`               | `单行` 注释/取消注释         | `cmd /`           |
| `:%s/old/new/g`     | 当前文件替换                 | `cmd r`           |
| `<leader>sr`        | 批量查找替换                 | `shift cmd r`     |
| `<leader>sr \c`     | 退出替换窗口                 | -                 |
| `<leader>sr \r`     | 执行 `replace`               | -                 |
| `<leader>sr \s`     | 执行 `sync`，效果同`replace` | -                 |
