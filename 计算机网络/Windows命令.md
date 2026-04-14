## ipconfig

```bash
ipconfig
ipconfig /all
# 查看DNS缓存
ipconfig /displaydns
```

## tracert

查看路由路径：``

```bash
tracert baidu.com
tracert -d 8.8.8.8     # 不解析主机名（更快）
tracert -h 15 8.8.8.8  # 最大跳数 15
tracert -w 1000 8.8.8.8 # 每次回复等待 1000ms
```

## netstat-网络连接与统计

- `netstat -a` – 所有连接与监听端口。
- `netstat -n` – 以数字形式显示地址和端口（不解析域名）。
- `netstat -b` – 显示关联的可执行程序（需要管理员权限）。
- `netstat -o` – 显示进程 PID。
- `netstat -e` – 以太网统计（收发包字节数）。
- `netstat -r` – 显示路由表（同 `route print`）。
- `netstat -s` – 按协议统计（IP、ICMP、TCP、UDP 等）。
- `netstat -p tcp` – 只显示 TCP 连接。

```bash
# 查看端口占用、连接
netstat -ano
# 查看某端口
netstat -ano | findstr 8080
# 要据pid
tasklist | findstr PID
```

## nslookup

DNS查询：

```bash
nslookup baidu.com                 # 默认用系统 DNS
nslookup baidu.com 1.1.1.1         # 指定 DNS 服务器
nslookup -type=mx baidu.com        # 查询 MX 记录（type 支持 A, AAAA, CNAME, PTR, TXT, NS 等）
nslookup -type=ptr 8.8.8.8         # 反向查找域名
```

**交互模式**（直接输入 `nslookup` 进入）：

```bash
> server 8.8.8.8
> set q=mx
> gmail.com
> exit
```

## arp

- `route print` – 显示路由表（IPv4 和 IPv6）。
- `route print 192.*` – 匹配指定模式的路由。
- `route add 0.0.0.0 mask 0.0.0.0 192.168.1.1` – 添加默认网关。
- `route add 10.0.0.0 mask 255.0.0.0 10.0.0.1 metric 2` – 添加特定网段路由。
- `route delete 10.0.0.0` – 删除路由。
- `route change 10.0.0.0 mask 255.0.0.0 10.0.0.254` – 修改路由的网关。

> 添加永久路由需加 `-p` 参数（否则重启丢失）。