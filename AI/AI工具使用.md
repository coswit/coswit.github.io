# AI 工具使用

各类 AI 编程工具的安装与使用备忘，随用随记。

## Claude Code

Anthropic 官方 CLI 编程助手。安装：

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

### cc-switch

用于在多个 Claude Code 供应商配置之间快速切换。WSL 环境下，在 Windows 侧访问 WSL 里的 `.claude` 配置目录（设置 → 高级 → 配置文件目录填下面路径）：

```text
\\wsl$\Ubuntu\home\你的用户名\.claude
\\wsl.localhost\Ubuntu-24.04\home\zhengjing\.claude
```

## clash-for-linux-install

Linux / WSL 环境的 clash 代理方案（[nelvko/clash-for-linux-install](https://github.com/nelvko/clash-for-linux-install)），给需要外网的 AI 工具提供代理。

订阅管理：

```bash
# 添加订阅
clashsub add url
# 查看订阅列表
clashsub ls
# 切换订阅
clashsub use id
```

TUN 模式（接管全局流量，需要 mihomo 有网络权限）：

```bash
# 开启 / 关闭 TUN
clashtun on
clashtun off

# 首次需授权 mihomo 创建网卡
sudo setcap cap_net_admin=+ep /home/zhengjing/clashctl/bin/mihomo
# 确认 TUN 生效：应出现 utun 网卡并拿到 IP（如 198.18.0.1）
ip addr
```

代理开关：

```bash
clashon    # 开启代理
clashoff   # 关闭代理
```

## Antigravity

OpenCode 接入 Google Gemini 的 Antigravity 配额认证插件：

```bash
# 安装 opencode-antigravity-auth
npm install opencode-antigravity-auth
```

装完把插件加入 `opencode.json` 的 `plugin` 数组，再 `opencode auth login`（Provider 选 Google，方式选 OAuth with Google (Antigravity)）即可在 OpenCode 里用 `google/antigravity-*` 系列模型。

## Superpowers

一套 Claude Code 的工作流技能（[superpowers](https://github.com/obra/superpowers)），核心是下面 7 个步骤按顺序执行：

1. **brainstorming**（头脑风暴）——需求探索，把模糊想法问清楚；
2. **using-git-worktrees**（创建独立工作区）——在独立 worktree 里干活，不污染主分支；
3. **writing-plans**（写实施计划）——把方案落成可执行的计划文档；
4. **subagent-driven-development**（子代理开发）——由子 Agent 按计划逐项实现；
5. [**test-driven-development**](https://zhida.zhihu.com/search?content_id=270380962&content_type=Article&match_order=1&q=test-driven-development&zhida_source=entity)（测试驱动开发）——先写测试再写实现；
6. **requesting-code-review**（代码审查）——完成后发起审查；
7. **finishing-a-development-branch**（完成分支）——合并收尾、清理工作区。
