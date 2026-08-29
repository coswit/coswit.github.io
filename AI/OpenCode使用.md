# OpenCode 使用笔记

个人使用的 OpenCode（[opencode.ai](https://opencode.ai)）速查笔记，基于官方文档（2026-08）与自己的配置实践整理。OpenCode 是开源的终端 AI 编程客户端（TUI），也是 oh-my-openagent 插件的宿主。

## 安装

```bash
# npm（也可用 bun / pnpm / yarn / Homebrew / winget 等）
npm install -g opencode-ai

# 启动（在项目目录下）
opencode
```

升级用 `opencode upgrade`，卸载用 `opencode uninstall`（可加 `--keep-config` / `--keep-data`）。

## 配置

### 配置文件加载顺序

OpenCode 按以下顺序加载配置，优先级从低到高（后加载的覆盖先加载的）：

| 优先级 | 位置 | 说明 |
| :--- | :--- | :--- |
| 1（最低） | 远程 `.well-known/opencode` | 远程组织默认配置（通过 Auth 机制获取） |
| 2 | `~/.config/opencode/opencode.json` | 全局用户配置 |
| 3 | `OPENCODE_CONFIG` 环境变量 | 自定义配置文件路径 |
| 4 | `./opencode.json` | 项目根目录配置 |
| 5 | `./.opencode/opencode.json` | 项目 .opencode 目录配置 |
| 6 | `OPENCODE_CONFIG_CONTENT` 环境变量 | 内联配置内容（JSON 字符串） |

### 规则（AGENTS.md / CLAUDE.md）

三种作用域：

| 作用域 | 位置 | 适用场景 |
| :--- | :--- | :--- |
| **全局规则** | `~/.config/opencode/AGENTS.md` | 所有项目通用的偏好 |
| **项目规则** | 项目根目录 `AGENTS.md` | 项目特定的规范 |
| **配置文件** | `opencode.json` 的 `instructions` 字段 | 引用多个规则文件 |

规则按以下顺序加载，后加载的会**补充**（不是覆盖）前面的：

```text
1. 全局 ~/.config/opencode/AGENTS.md
2. 全局 ~/.claude/CLAUDE.md（兼容模式）
3. 项目目录向上查找 AGENTS.md / CLAUDE.md
4. 配置文件 instructions 指定的文件
```

规则分散在多个文件时，用配置统一引用：

```json
// opencode.json
{
  "instructions": [
    "CONTRIBUTING.md",
    "docs/coding-standards.md",
    ".cursor/rules/*.md",
    "~/my-rules/common.md"
  ]
}
```

### 文件布局

```text
~/.config/opencode/
├── opencode.json / opencode.jsonc   # 全局配置（jsonc 支持注释）
├── AGENTS.md                        # 全局规则
├── agent/                           # 全局自定义 Agent
├── command/                         # 全局自定义命令
└── plugin/                          # 全局插件

项目目录/
├── opencode.json                    # 项目配置
├── AGENTS.md                        # 项目规则
└── .opencode/
    ├── opencode.json                # 项目配置（优先级更高，推荐）
    ├── agent/                       # 项目 Agent
    ├── command/                     # 项目命令
    └── plugin/                      # 项目插件
```

凭证单独存在 `~/.local/share/opencode/auth.json`（由 `opencode auth login` 写入）。

### Agent

| Agent | 类型 | 擅长 | 默认权限 |
| :--- | :--- | :--- | :--- |
| Build | primary | 全能开发（默认主 Agent） | 全能（可读写文件、执行命令） |
| Plan | primary | 分析代码、规划方案、审查建议 | 受限（默认禁止编辑） |
| Explore | subagent | 快速找文件、搜代码、答代码库问题 | 只读 |
| General | subagent | 复杂研究、多步骤任务 | 多任务执行 |

Tab 键在 Build / Plan 模式间切换（Plan 模式禁止改动，先出实施方案）。自定义 Agent 用 `opencode agent create`（可指定 `--mode`、`--permissions`、`-m` 模型）或在 `agent/` 目录放 Markdown 定义。

### 模型配置示例

`opencode.json` 的 `agent` 字段按 Agent 覆盖模型、温度与权限。下面是我的个人配置（模型按需三选一，`//` 注释仅 jsonc 可用）：

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": [
    // "oh-my-openagent@latest"
  ],
  "agent": {
    // Build Agent 配置
    "build": {
      "mode": "primary",
      // 主模型三选一：高速档 / 深度档 / 极速档
      "model": "zhipuai-coding-plan/glm-5.2-highspeed[1m]:max",
      // "model": "deepseek/deepseek-v4-pro:max",
      // "model": "deepseek/deepseek-v4-flash:max",
      // 控制随机性（0-1），值越低越专注，越高越有创造性
      "temperature": 0.3,
      "permission": {
        "edit": "allow",
        "bash": "allow"
      }
    },
    // Plan Agent：只允许写计划文件，禁改源代码
    "plan": {
      "mode": "primary",
      "model": "zhipuai-coding-plan/glm-5.2",
      "temperature": 0.1,
      "permission": {
        "edit": {
          ".opencode/plans/*.md": "allow",
          "*": "deny"
        },
        "bash": "allow"
      }
    },
    "debug": {
      "mode": "primary",
      "model": "zhipuai-coding-plan/glm-5.2",
      "temperature": 0.1,
      "permission": { "edit": "allow", "bash": "allow" }
    },
    "brainstorming": {
      "mode": "primary",
      "model": "zhipuai-coding-plan/glm-5.2",
      "temperature": 0.5,
      "permission": { "edit": "allow", "bash": "allow" }
    }
  }
}
```

`permission.edit` 取值 `ask` / `allow` / `deny`，或按路径细配（如上 Plan 只放行 `.opencode/plans/*.md`）；`permission.bash` 还能按命令配，如 `{ "git": "allow", "rm": "deny" }`。

## 常用快捷键（TUI）

**leader 键**：`ctrl+x`（可在 keybinds 配置里改，默认按下后等 2 秒，`leader_timeout` 可调）。

| 快捷键 | 功能 |
| :--- | :--- |
| `ctrl+x c` | 压缩会话（compact） |
| `ctrl+x e` | 打开外部编辑器（$EDITOR） |
| `ctrl+x q` | 退出 |
| `ctrl+x x` | 导出会话为 Markdown |
| `ctrl+x m` | 模型列表 |
| `ctrl+x n` | 新会话 |
| `ctrl+x r` | 重做（redo） |
| `ctrl+x l` | 会话列表 |
| `ctrl+x t` | 主题切换 |
| `ctrl+x u` | 撤销（undo） |
| `ctrl+t` | 循环切换模型变体（推理档） |
| `ctrl+k` | 搜索 |
| `Tab` | Build / Plan 模式切换 |

输入前缀：

| 前缀 | 作用 |
| :--- | :--- |
| `/` | 斜杠命令 |
| `@` | 模糊搜索项目文件，文件内容自动入上下文（`@alias/` 可插配置的引用根） |
| `!` | 前缀 shell 命令，输出作为工具结果进入对话 |

## 常用斜杠命令

| 命令 | 功能 |
| :--- | :--- |
| `/connect` | 添加 provider + API Key |
| `/init` | 分析项目并生成根目录 AGENTS.md（建议提交进 Git） |
| `/undo` / `/redo` | 撤销 / 重做（靠 Git 还原文件改动，需在 Git 仓库中） |
| `/new`（`/clear`） | 新会话 |
| `/sessions`（`/resume` / `/continue`） | 会话列表 / 切换 |
| `/compact`（`/summarize`） | 压缩当前会话 |
| `/models` | 模型列表 |
| `/themes` | 主题列表 |
| `/editor` | 用外部编辑器写长 prompt |
| `/share` / `/unshare` | 生成 / 取消会话分享链接 |
| `/export` | 导出会话 Markdown |
| `/details` | 切换工具执行详情显示 |
| `/thinking` | 显示 / 隐藏 thinking 块 |
| `/help` | 帮助 |
| `/exit`（`/quit` / `/q`） | 退出 |

## CLI 命令

```bash
# 凭证
opencode auth login          # 配置 API Key（选 provider，OAuth 或粘贴 Key）
opencode auth logout
opencode auth list

# 模型
opencode models              # 列出全部可用模型 provider/model
opencode models deepseek     # 按提供商过滤
opencode models --refresh    # 刷新模型缓存
opencode models --verbose    # 带成本与元数据

# 统计
opencode stats               # token 用量与花费
opencode stats --models 5    # 消耗最高的 5 个模型
opencode stats --days 7      # 按天

# 会话
opencode session list
opencode session delete <sessionID>
opencode export [sessionID] --sanitize

# 非交互执行（脚本用）
opencode run "解释这个项目" --format json

# 其他
opencode serve               # 无头 HTTP API 服务
opencode web                 # 带 Web UI 的服务
opencode attach              # 把 TUI 接到运行中的 serve/web 后端
opencode mcp add / list      # MCP 服务器管理
opencode plugin <module> -g  # 安装插件
opencode pr <number>         # 拉取并 checkout GitHub PR 分支后启动
opencode upgrade             # 升级
```

TUI 启动也有常用 flag：`opencode -c`（继续最近会话）、`-s`（指定会话）、`-m`（指定模型）、`--auto`（自动批准非拒绝权限）。
