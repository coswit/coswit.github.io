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
