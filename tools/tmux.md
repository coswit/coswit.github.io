# tmux

#### 基本操作

会话管理

```shell
#新建会话
$ tmux new -s <session-name>
#分离，执行后，就会退出当前 Tmux 窗口，但是会话和里面的进程仍然在后台运行。
$ tmux detach

#查看
$ tmux ls
$ tmux list-session

#接入,使用会话编号或名称
$ tmux attach -t 0
$ tmux attach -t <session-name>

#杀死
$ tmux kill-session -t 0
$ tmux kill-session -t <session-name>

#切换
$ tmux kill-session -t <session-name>
$ tmux switch -t <session-name>

#重命名
$ tmux rename-session -t 0 <new-name>
```

窗格管理

```shell
#上下分离
$ tmux split-window
#左右分离
$ tmux split-window -h

#光标上移
$ tmux select-pane -U
#光标下移
$ tmux select-pane -D
#光标左移
$ mux select-pane -L
#光标右移
$ tmux select-pane -R

#窗格上移
$ tmux swap-pane -U
#窗格下移
$ tmux swap-pane -D

#将当前窗格拆分为一个独立窗口
$ Ctrl+b !
#当前窗格全屏显示，再使用一次会变回原来大小
$ Ctrl+b z
```

#### 快捷键

| 快捷键        | 说明         | 快捷键      | 说明         |
| ---------- | ---------- | -------- | ---------- |
| Ctrl+b     | 前置快捷键      | Ctrl+b ? | 帮助         |
| Ctrl+b c   | 新建会话       | Ctrl+b x | 关闭会话       |
| Ctrl+b d   | 分离当前会话     | Ctrl+b $ | 重命名当前会话    |
| Ctrl+b s   | 列出所有会话     | Ctrl+b ， | 窗口重命名      |
| Ctrl+b %   | 窗格左右划分     | Ctrl+b " | 窗格上下划分     |
| Ctrl+b 方向键 | 光标切换       |          |            |
| Ctrl+b {   | 与上一个窗格交换位置 | Ctrl+b } | 与下一个窗格交换位置 |

#### 其他

滚屏配置：

```shell
vim ~/.tmux.conf
#加入下述代码
setw -g mode-keys vi

tmux source-file ~/.tmux.conf
```

在tmux中进行command切换文件夹后会自动自动重名窗口，解决方法：

```shell
#在~/.tmux.conf文件中加入下面配置
set-option -g allow-rename off

#如果是zsh，需要在.zshrc中加入
DISABLE_AUTO_TITLE=true
```

参考：[Tmux 使用教程](https://www.ruanyifeng.com/blog/2019/10/tmux.html)
