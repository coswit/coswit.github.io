## 安装

安装

```bash
npm install -g opencode-ai
```

## 配置

### config

OpenCode 按以下顺序加载配置，优先级从低到高（后加载的覆盖先加载的）：

| 优先级    | 位置                               | 说明                                   |
| :-------- | :--------------------------------- | :------------------------------------- |
| 1（最低） | 远程 `.well-known/opencode`        | 远程组织默认配置（通过 Auth 机制获取） |
| 2         | `~/.config/opencode/opencode.json` | 全局用户配置                           |
| 3         | `OPENCODE_CONFIG` 环境变量         | 自定义配置文件路径                     |
| 4         | `./opencode.json`                  | 项目根目录配置                         |
| 5         | `./.opencode/opencode.json`        | 项目 .opencode 目录配置                |
| 6         | `OPENCODE_CONFIG_CONTENT` 环境变量 | 内联配置内容（JSON 字符串）            |

OpenCode 支持三种作用域的规则，满足不同场景：

| 作用域       | 位置                                   | 适用场景           |
| :----------- | :------------------------------------- | :----------------- |
| **全局规则** | `~/.config/opencode/AGENTS.md`         | 所有项目通用的偏好 |
| **项目规则** | 项目根目录 `AGENTS.md`                 | 项目特定的规范     |
| **配置文件** | `opencode.json` 的 `instructions` 字段 | 引用多个规则文件   |

规则按以下顺序加载，后加载的会**补充**（不是覆盖）前面的：

```
1. 全局 ~/.config/opencode/AGENTS.md
2. 全局 ~/.claude/CLAUDE.md（兼容模式）
3. 项目目录向上查找 AGENTS.md / CLAUDE.md
4. 配置文件 instructions 指定的文件
```

如果你的规则分散在多个文件，可以用配置文件统一引用：

```bash
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

### Agent

| Agent   | 类型     | 擅长                                           | 默认权限                                                 |
| :------ | :------- | :--------------------------------------------- | :------------------------------------------------------- |
| Build   | Primary  | 全能开发（默认主 Agent）                       | 全能（可读写文件、执行命令）                             |
| Plan    | Primary  | 分析代码、规划方案、审查建议                   | 受限（默认禁止编辑，仅 `.opencode/plans/*.md` 允许写入） |
| Explore | Subagent | 快速找到文件、搜索代码、回答代码库问题         | 只读（可搜索、浏览代码）                                 |
| General | Subagent | 复杂研究、多步骤任务、不确定能否快速找到答案时 | 多任务执行（可用 Todo 工具）                             |

### 文件配置

```bash
~/.config/opencode/
├── opencode.json       # 全局配置
├── opencode.jsonc       
├── AGENTS.md           # 全局规则
├── agent/              # 全局 Agent
├── command/            # 全局命令
└── plugin/             # 全局插件
项目目录/
├── opencode.json       # 项目配置（优先级 4）
├── AGENTS.md           # 项目规则
└── .opencode/
    ├── opencode.json   # 项目配置（优先级 5，推荐）
    ├── agent/          # 项目 Agent
    ├── command/        # 项目命令
    └── plugin/         # 项目插件
```

### 模型配置

在`opencode.jsonc`中的配置：

- `permission.edit`：文件编辑权限
  - `"allow"`：允许编辑
  - `"deny"`：禁止编辑
  - 也可以指定路径规则，如 `{ "*": "deny", ".opencode/plans/*.md": "allow" }`

```bash
{
  "plugin": [
  // "oh-my-openagent@latest"
  ],
  "$schema": "https://opencode.ai/config.json",
  "agent": {
    // Build Agent 配置
    "build": {
      "mode": "primary",
      "model": "deepseek/deepseek-v4-pro",
	  // 控制随机性（0-1），值越低越专注
      "temperature": 0.3,
      "permission": {
        "edit": "allow",
        "bash": "allow"
      }
    },
    // Plan Agent 配置
    "plan": {
      "mode": "primary",
      "model": "volcengine-plan/glm-5.1",
      "temperature": 0.1,
      "permission": {
        "edit": {
          "*": "deny",                    // 禁止编辑所有源代码
          ".opencode/plans/*.md": "allow" // 只允许编辑计划文件
        },
        "bash": "allow"
      }
    }
  }
}
```

## 命令

leader键：ctrl+x

| 命令             | 功能       |
| ---------------- | ---------- |
| `/undo`  `/redo` | 撤销、重做 |
| leader + b       | 侧边栏控制 |
| leader + t       | 主题切换   |
| leader + l       | 会话查看   |

参考命令：

```bash
/connect
# 凭证
opencode auth login
opencode auth logout
opencode auth list

# 查看可用模型
opencode models
opencode models deepseek

# 统计
opencode stats
# 显示消耗最高的 5 个模型
opencode stats --models 5
```