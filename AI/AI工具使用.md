## Claude Code

安装：

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

### cc-switch

```bash
# wsl配置，设置-高级-配置文件目录
\\wsl$\Ubuntu\home\你的用户名\.claude
\\wsl.localhost\Ubuntu-24.04\home\zhengjing\.claude
```

## Antigravity 

### [clash-for-linux-install](https://github.com/nelvko/clash-for-linux-install)

```bash
# 订阅代理添加
clashsub add url
# 订阅代理使用
clashsub ls 
clashsub use id

#tun模式开启、关闭
clashtun on
clashtun off

sudo setcap cap_net_admin=+ep /home/zhengjing/clashctl/bin/mihomo
# 确认启用成功tun，有类似utun网卡，且获得了 IP 地址（如 198.18.0.1）
ip addr

# 开启代理
clashon
clashoff
```

Antigravity权限添加：

```bash
# antigravity-auth安装
npm install opencode-antigravity-auth
```

## Superpowers 

Superpowers 的核心就是这 7 个步骤，按顺序执行：

1. brainstorming（头脑风暴-） ↓  需求探索
2. using-git-worktrees（创建独立工作区） ↓
3. writing-plans（写实施计划） ↓
4. subagent-driven-development（子代理开发） ↓
5. [test-driven-development](https://zhida.zhihu.com/search?content_id=270380962&content_type=Article&match_order=1&q=test-driven-development&zhida_source=entity)（测试驱动开发） ↓
6. requesting-code-review（代码审查） ↓
7. finishing-a-development-branch（完成分支）
