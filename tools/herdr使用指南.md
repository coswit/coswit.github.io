## 简介

Herdr 是一个终端工作区管理器（terminal workspace manager）：真实终端进程在后台服务器中持续运行，客户端可以随时分离、重连，窗格和智能体不中断。与 tmux、zellij 相比有两个鲜明特点：

- **鼠标原生**：点击窗格、拖动边框、右键菜单即可完成一切，键盘快捷键是可选的一层
- **为并行智能体而生**：自动检测窗格中的 AI 编程智能体（claude、codex、opencode 等），侧边栏跨工作区汇总 working、blocked、done 状态，哪个项目需要关注一目了然

从 tmux 迁移几乎零成本：默认前缀同为 `ctrl+b`，窗格持久保留，分离与重连的行为符合预期。

## 安装

```bash
# Linux / macOS
curl -fsSL https://herdr.dev/install.sh | sh

# Windows（PowerShell）
powershell -ExecutionPolicy Bypass -c "irm https://herdr.dev/install.ps1 | iex"

# Windows（端点安全软件拦截无文件命令时，命令提示符）
curl.exe -fsSLo install.cmd https://herdr.dev/install.cmd && install.cmd && del install.cmd

# Homebrew / mise / Nix
brew install herdr
mise use -g herdr
nix run github:herdrdev/herdr/v0.x.y   # 标签替换为最新发布版
```

更新与通道：

```bash
herdr update               # 手动更新（仅适用于自带安装器管理的安装）
herdr channel show         # 查看当前通道：stable 或 preview
herdr channel set preview  # 启用预览通道（更早拿到修复，但可能回归）
herdr channel set stable   # 切回稳定通道
```

Homebrew、mise、Nix 安装请用各自的包管理器更新。Windows 手动下载时保留完整解压目录（`herdr.exe` 依赖同目录的 ConPTY 运行时），不要只复制 exe。

## 核心概念

层级结构：会话（session） > 工作区（workspace） > 标签页（tab） > 窗格（pane）。

| 概念 | 说明 |
| --- | --- |
| 会话 | 持久的 Herdr 服务器命名空间，默认 `herdr` 命令连接默认会话 |
| 工作区 | 最顶层项目容器，建议每个活跃项目一个；侧边栏状态由其内部智能体汇总 |
| 标签页 | 工作区内的一种布局，可按 agents、logs、server 等用途划分 |
| 窗格 | 一个真实终端，可分割、重命名，客户端分离后保留 |
| 智能体 | Herdr 在窗格内识别出的进程，无需安装集成即可检测多数主流智能体 |

优先使用工作区；只有在需要完全独立的窗格、socket 和运行时状态时才使用命名会话。

智能体状态：

| 状态 | 含义 |
| --- | --- |
| `blocked` | 需要输入、审批或决策 |
| `working` | 正在运行 |
| `done` | 已完成，还没有查看 |
| `idle` | 已完成或在等待，且已被查看过 |
| `unknown` | 无法有把握地判断 |

架构上是客户端 + 后台服务器：服务器拥有窗格和进程状态，客户端只是连接服务器的终端 UI。`prefix+q` 分离（或直接关掉终端窗口）后服务器继续运行，再次运行 `herdr` 即重连。要真正结束会话并停止窗格，运行 `herdr server stop`。

键盘侧有三种模式：终端模式（按键发给窗格）、前缀模式（按下前缀键后等待动作键）、导航模式（`prefix+w` 打开的常驻工作区导航界面）。

## 鼠标操作

Herdr 鼠标优先，以下操作全部不需要快捷键：

- 点击窗格、标签页、工作区、智能体行即可聚焦
- 拖动分割边框调整窗格大小
- 右键打开上下文菜单（分割窗格、新建标签页等）
- 拖选文本，松开即复制到剪贴板，不需要 Ctrl+C；双击选中一个词，按住第二次点击并拖动会按整词扩展
- Ctrl+点击打开窗格内的链接（OSC 8 超链接及 http/https URL），需要终端把带修饰键的点击传给 Herdr

不喜欢鼠标捕获时可关闭（关闭后点击、拖动等鼠标操作一并失效）：

```toml
[ui]
mouse_capture = false
```

Windows Terminal 会抢先打开从可见文本检测到的 URL，要让 Herdr 或插件优先处理，在其 `settings.json` 中设置 `"experimental.detectURLs": false`。

## 快捷键

默认前缀 `ctrl+b`，按下后下一个按键发给 Herdr 而不是终端。`prefix+?` 查看所有生效的绑定，帮助面板里按 `/` 可筛选。

### 先学这五个

| 动作 | 按键 |
| --- | --- |
| 新建标签页 | `prefix+c` |
| 向右 / 向下分割 | `prefix+v` / `prefix+minus` |
| 在窗格间移动 | `prefix+h/j/k/l` |
| 工作区导航 | `prefix+w` |
| 分离并让一切继续运行 | `prefix+q` |

### 窗格

| 动作 | 按键 |
| --- | --- |
| 缩放聚焦的窗格 | `prefix+z` |
| 关闭窗格 | `prefix+x` |
| 交换窗格 | `prefix+shift+h/j/k/l` |
| 调整大小模式 | `prefix+r` |
| 复制模式 | `prefix+[` |

### 标签页

| 动作         | 按键                      |
| ---------- | ----------------------- |
| 下一个 / 上一个  | `prefix+n` / `prefix+p` |
| 跳转到标签页 1–9 | `prefix+1..9`           |
| 重命名        | `prefix+shift+t`        |
| 关闭         | `prefix+shift+x`        |

### 工作区与会话

| 动作 | 按键 |
| --- | --- |
| 新建工作区 | `prefix+shift+n` |
| 重命名工作区 | `prefix+shift+w` |
| 关闭工作区 | `prefix+shift+d` |
| Goto 选择器 | `prefix+g` |
| 切换侧边栏 | `prefix+b` |

Goto 选择器（`prefix+g`）按工作区分组列出所有智能体和终端，`/` 搜索名称、智能体类型、分支或路径，`b/w/i/d` 筛选 blocked、working、idle、done 状态的智能体，`a` 重新显示全部。

### 复制模式

`prefix+[` 进入：`h/j/k/l`、tmux 风格的 `w/b/e` 和 `{`/`}` 移动；`/` 或 `?` 向前、向后搜索（查询包含大写字母时区分大小写），`n`/`N` 重复搜索；`v` 或空格开始选择，`y` 或回车复制，`q` 或 Esc 退出。复制模式不会暂停窗格进程——停留在底部时继续跟随输出。鼠标拖选可以直接复制，无需进入复制模式。

### 免前缀快捷键

动作可绑定到不需要前缀的直接组合键。官方梳理主流终端与桌面环境后推荐 `ctrl+alt` 修饰键系：几乎无冲突，不受 macOS option 组合行为影响：

```toml
[keys]
focus_pane_left = ["prefix+h", "ctrl+alt+h"]
focus_pane_down = ["prefix+j", "ctrl+alt+j"]
focus_pane_up = ["prefix+k", "ctrl+alt+k"]
focus_pane_right = ["prefix+l", "ctrl+alt+l"]
new_tab = ["prefix+c", "ctrl+alt+c"]
split_vertical = ["prefix+v", "ctrl+alt+d"]
split_horizontal = ["prefix+minus", "ctrl+alt+shift+d"]
zoom = ["prefix+z", "ctrl+alt+z"]
```

少数已被占用的组合需要避开：

| 组合键 | 占用者 |
| --- | --- |
| `ctrl+alt+方向键` | GNOME 工作区切换，Ghostty 和 Konsole 默认键位 |
| `ctrl+alt+t` | Ubuntu、Fedora 的启动终端 |
| `ctrl+alt+l` / `ctrl+alt+a` | KDE 锁屏、注意力窗口 |
| `ctrl+alt+s` / `ctrl+alt+u` | Konsole |
| `ctrl+alt+f1..f12` | Linux 虚拟控制台切换 |

## 智能体

支持方式有两种：**由 Herdr 支持**（识别进程并读取屏幕，如 claude、codex、copilot、cursor、opencode、pi、droid、devin、kimi、kilo、qwen、grok 等），或**由智能体自身支持**（自己上报状态，如 Crush、Kiro CLI、Muse Code、Prime Agent，无需安装任何东西）。其他智能体照常运行，只是显示为普通终端。

安装集成后，Herdr 服务器重启能回到同一个会话：

```bash
herdr integration install claude
herdr integration install codex
herdr integration install opencode
herdr integration status
```

状态判定：Herdr 读取窗格的实时底部缓冲区，按检测清单规则判定 idle、working、blocked；有集成上报状态时优先采用上报。blocked 检测刻意从严——只有匹配到已知的审批、提问界面才标记，陌生提示可能回退为 idle，自动化发送输入前先检查窗格。排查误判：

```bash
herdr agent explain w1:p1                                    # 解释实时判定过程
herdr agent explain --file screen.txt --agent codex --json   # 解释一份离线屏幕样本
```

在 VM 或沙箱包装器下运行时，用环境变量指定智能体类型：`HERDR_AGENT=claude fence -- claude`。

常用命令：

```bash
herdr agent list                        # 列出所有智能体
herdr agent rename w1:p1 reviewer       # 重命名显示名（--clear 清除）
herdr agent focus reviewer              # 跳转并聚焦
herdr agent read reviewer --lines 50    # 读输出，行数行为同 pane read
herdr agent prompt reviewer "fix the failing test"   # 提交提示
herdr agent prompt reviewer "..." --wait --until blocked --timeout 120000
herdr agent wait reviewer --until idle --timeout 60000
herdr agent attach reviewer             # 直接附加到单个智能体终端（--takeover 抢占输入）
herdr agent start api-tests --kind claude --pane w1:p2   # 在已有 shell 窗格中启动智能体
```

## 命令

大多数命令输出 JSON，适合脚本化自动化。

### 启动与状态

```bash
herdr                        # 启动或连接默认会话
herdr --session <name>       # 连接命名会话
herdr --remote workbox       # 通过 SSH 连接远程机器，使用本地按键绑定
herdr status                 # 查看状态
herdr --default-config       # 打印完整默认配置
herdr completion zsh         # 生成 shell 补全（bash/fish/powershell/elvish）
```

### 服务器与会话

```bash
herdr server stop            # 结束会话并停止所有窗格
herdr server reload-config   # 不重启窗格应用新配置
herdr session list           # 列出会话
herdr session attach work    # 接入命名会话
herdr session stop work      # 停止命名会话（默认会话写 default）
```

### 工作区 / 标签页 / 窗格

```bash
herdr workspace list
herdr workspace create --cwd ~/project --label api --no-focus   # 不抢占焦点地创建
herdr workspace rename <id> <label>
herdr workspace close <id> [--group]

herdr worktree list
herdr worktree create --branch review --base main   # 创建 Git worktree 检出并作为工作区打开
herdr worktree remove --workspace <id>

herdr tab list [--workspace <id>]
herdr tab create [--label TEXT]     # 不指定 --workspace 时用活动工作区
herdr tab focus <tab_id>
herdr tab rename <tab_id> <label>
herdr tab close <tab_id>           # 关闭最后一个标签页会连带关闭工作区

herdr pane list
herdr pane split <pane_id> --direction right --ratio 0.5
herdr pane zoom [<pane_id>|--current] --toggle
herdr pane resize --direction left --amount 5
herdr pane move <pane_id> --new-tab
herdr pane close <pane_id>
```

### 读取与输入

```bash
herdr pane read <pane_id> --source visible --ansi
herdr pane read <pane_id> --source recent-unwrapped --lines 120
herdr pane send-text <pane_id> "npm test"
herdr pane send-keys <pane_id> enter ctrl+c
herdr pane run <pane_id> "npm test"   # 文本 + 回车原子提交，发命令优先用它
```

读取来源：

| 来源 | 含义 |
| --- | --- |
| `visible` | 当前渲染的屏幕，适合 UI 反馈循环 |
| `recent` | 带终端折行的最近回滚内容 |
| `recent-unwrapped` | 不带软折行的最近回滚内容，最适合日志 |
| `detection` | 智能体屏幕检测使用的底部缓冲区快照 |

### 等待输出

```bash
herdr pane wait-output <pane_id> --match "build succeeded"
herdr pane wait-output <pane_id> --regex "^FAIL" --timeout 30000
```

`--match` 匹配单行字面子串，`--regex` 用 Rust 正则逐行匹配；已存在的输出也能立即匹配。普通命令和服务器用 `pane wait-output`，编程智能体用 `agent wait`。

### SSH 机器

```bash
herdr machine add workbox --label "Build machine"
herdr machine list
herdr machine status
herdr machine reconnect workbox
herdr --machine "Build machine" agent list   # 把 API 命令发送到已保存的机器
```

### 环境变量

| 变量 | 用途 |
| --- | --- |
| `HERDR_CONFIG_PATH` | 覆盖配置文件路径 |
| `HERDR_SESSION` | 为 CLI 命令选择命名会话 |
| `HERDR_SOCKET_PATH` | 覆盖底层 socket 路径 |
| `HERDR_ENV` | 在 Herdr 管理的窗格进程内为 1 |
| `HERDR_PANE_ID` / `HERDR_TAB_ID` / `HERDR_WORKSPACE_ID` | 运行中窗格进程的公开 ID |
| `HERDR_LOG` | 日志过滤，如 `HERDR_LOG=herdr=debug` |
| `HERDR_DISABLE_SOUND` | 即使启用了声音也禁用播放 |

## 配置

配置文件位置：

```text
Linux / macOS：~/.config/herdr/config.toml
Windows：%APPDATA%\herdr\config.toml
```

无需配置文件即可使用；要自定义时可以从完整默认配置开始：

```bash
herdr --default-config > ~/.config/herdr/config.toml
```

编辑后重载（不重启窗格）：`herdr server reload-config`。

### 按键绑定

```toml
[keys]
prefix = "ctrl+a"                      # 换前缀；也接受数组，如 ["ctrl+space", "ctrl+s"]
next_tab = ["prefix+n", "ctrl+alt+]"]  # 一个动作可绑定多个键
switch_tab = "prefix+1..9"             # 索引跳转
```

直接绑定 `n` 这类无修饰的普通键会拦截输入，除非有意设置直接快捷键，否则用 `prefix+n`；`navigate_workspace_*` 等导航模式内的绑定例外。

### 自定义命令

```toml
[[keys.command]]
key = "prefix+alt+g"
type = "popup"          # popup 会话级弹窗；pane 临时窗格；shell 后台运行
command = "lazygit"
description = "run lazygit"
width = "80%"
height = "80%"
```

弹窗不改变标签页布局，命令退出即关闭。命令收到 `HERDR_ACTIVE_PANE_ID`、`HERDR_ACTIVE_PANE_CWD` 等上下文环境变量；Windows 上经 `cmd.exe /d /c` 执行，环境变量要用 `%VAR%` 语法。

### 主题与界面

```toml
[theme]
name = "catppuccin"        # 跟随宿主终端 ANSI 调色板则用 "terminal"
auto_switch = true         # 跟随宿主终端明暗外观自动切换
light_name = "catppuccin-latte"
dark_name = "catppuccin"

[ui]
tab_bar_position = "bottom"    # 标签栏放底部
status_indicators = "symbols"  # 智能体状态用形状 + 颜色区分
```

### 通知与声音

```toml
[ui.toast]
delivery = "herdr"          # herdr 应用内 / terminal 外层终端 / system 系统通知 / off
delay_seconds = 1

[ui.toast.herdr]
position = "bottom-right"

[ui.sound]
done_path = "sounds/done.mp3"
request_path = "sounds/request.mp3"

[ui.sound.agents]
droid = "off"               # 按智能体覆盖：default / on / off
```

活动标签页的弹出通知会被抑制。

### 其他常用项

```toml
[terminal]
default_shell = "nu"        # 新窗格 shell；未设置时 Unix 用 $SHELL，Windows 用 pwsh 或 powershell
new_cwd = "follow"          # 新窗格工作目录：follow 跟随来源 / home / current / 固定路径
shell_mode = "auto"         # macOS 以登录 shell 启动，其他平台非登录

[session]
resume_agents_on_restore = true   # 服务器重启后恢复受支持智能体的会话
startup_per_agent_delay_ms = 100  # 自动恢复错峰启动

[worktrees]
directory = "~/.herdr/worktrees"  # Git worktree 检出根目录：<dir>/<repo>/<branch-slug>

[experimental]
switch_ascii_input_source_in_prefix = true  # macOS/Windows 前缀模式临时切到 ASCII 输入源
```

## 常见问题

shell 框架在 Herdr 窗格内自动连接外层 tmux，会让智能体检测失效、终端尺寸递归缩小，启动条件里加入 `HERDR_ENV` 检查：

```bash
if [[ -z ${TMUX:-} && ${HERDR_ENV:-} != 1 ]]; then
  tmux new-session -A -s my-session
fi
```

智能体显示 idle 但实际停在审批界面：blocked 检测从严，未入库的提示界面会回退 idle，用 `herdr agent explain <target>` 查看判定依据。

日志位置（自动轮转，报告问题时附上当前与轮转后的文件）：`~/.config/herdr/herdr.log`、`herdr-client.log`、`herdr-server.log`。

## 参考

- [官方文档（中文）](https://herdr.dev/zh-cn/tui/docs/)，基于 0.9.5 版整理
- [安装](https://herdr.dev/zh-cn/tui/docs/install/) · [快速开始](https://herdr.dev/zh-cn/tui/docs/quick-start/) · [核心概念](https://herdr.dev/zh-cn/tui/docs/concepts/) · [键盘](https://herdr.dev/zh-cn/tui/docs/keyboard/)
- [智能体](https://herdr.dev/zh-cn/tui/docs/agents/) · [CLI 参考](https://herdr.dev/zh-cn/tui/docs/cli-reference/) · [配置](https://herdr.dev/zh-cn/tui/docs/configuration/) · [配置参考](https://herdr.dev/zh-cn/tui/docs/config-reference/)
- [GitHub：herdrdev/herdr](https://github.com/herdrdev/herdr)
