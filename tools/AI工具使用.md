## OpenCode

### 安装配置

安装

```bash
npm install -g opencode-ai
```

模型配置

```bash
/connect
opencode auth login
#删除
opencode auth logout
```

Antigravity权限添加：

```bash
# ntigravity-auth安装
npm install opencode-antigravity-auth
```

#### 使用

leader键：ctrl+x

| 命令             | 功能       |
| ---------------- | ---------- |
| `/undo`  `/redo` | 撤销、重做 |
| leader + b       | 侧边栏控制 |
| leader + t       | 主题切换   |
| leader + l       | 会话查看   |

参考命令：

```bash
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

### 在wsl2中使用Antigravity 

```

```

