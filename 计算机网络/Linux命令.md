## ip

```bash
# 查看ip
ip addr
ip a 

# 管理网络接口
ip link
ip link set eth0 up # 开启网卡

# 路由管理
ip route
ip route show # 查看默认网关
```
### arp

```bash
# arp位置
/proc/net/arp

# 显示ARP映射表
ip neigh show

# 删除ARP缓存
ip neigh delete [IP] dev [dev]

# 输出格式
arp -n

arp -a
```

arp的flag含义：

| **标志 (Flag)** | **对应缩写**       | **含义**                                                     |
| --------------- | ------------------ | ------------------------------------------------------------ |
| **0x2**         | **C (Completed)**  | **已完成**。表示 ARP 请求已得到响应，IP 和 MAC 地址的映射是有效的。 |
| **0x1**         | **I (Incomplete)** | **未完成**。表示正在尝试解析该 IP，但尚未收到响应（或请求已发送但还在等待）。 |
| **0x4**         | **M (Permanent)**  | **永久 (Static)**。手动添加的静态 ARP 条目，不会因为超时而自动删除。 |
| **0x8**         | **P (Published)**  | **发布 (Proxy ARP)**。表示本地主机将为该 IP 回应 ARP 请求（通常用于 ARP 代理）。 |
| **0x10**        | **U (Uobsolete)**  | **已废弃**。条目不再有效，即将被清理。                       |

### ip rule

`ip rule` 是 **策略路由（Policy-Based Routing, PBR）** 的核心。Linux 内核维护了一个策略路由数据库。当你发送或接收一个数据包时，内核会按照规则的 **优先级（Priority）** 从低到高（数字越小优先级越高）依次匹配。

可以通过 `ip rule show` 查看当前系统的规则，通常会看到以下三条：

- **0: from all lookup local**: 匹配本地回环地址、广播地址。
- **32766: from all lookup main**: 匹配普通路由表（即 `ip route` 查看的内容）。
- **32767: from all lookup default**: 通常为空，作为最后的兜底。

命令语法

```bash
ip rule [add|del] [SELECTORS] [ACTION]
```

常用选择器 (SELECTORS)

- **`from [ADDR]`**: 根据源地址匹配。
- **`to [ADDR]`**: 根据目的地址匹配。
- **`iif [NAME]`**: 根据入网卡（Incoming Interface）匹配。
- **`fwmark [MARK]`**: 根据防火墙标记（iptables/nftables 打的标签）匹配。

常用动作 (ACTION)

- **`lookup [TABLE_ID]`**: 跳到指定的路由表查询。
- **`prohibit`**: 丢弃该包，并向发送者发送 ICMP 不可达。
- **`unreachable`**: 丢弃该包。

```bash
# 显示路由优先级
ip rule list 
ip rule 

# 增加新的路由表
ip rule add from [IP] table [table name] 
# 源地址 10.1.1.1 使用表 10，优先级 1000。
ip rule add from 10.1.1.1 table 10 pref 1000

# 根据优先级删除规则
ip rule del priority 1000

# 慎用！会清空除默认规则外的所有规则。
ip rule flush

# 刷新路由缓存
ip route flush cache
```

示例：

```bash
ip rule add from all lookup main prio 22000 
ip route add 172.30.2.0/24 dev chba0 src 172.30.1.2 table local_network 
ip address add 172.30.1.2/24 dev chba0
ip route add 172.30.1.0/24 dev chba0 proto static table local_network
ip rule delete table main
```

### ip route

`ip route` 是 `iproute2` 工具包中用于操作 **内核路由表** 的命令。如果说 `ip rule` 是决定“查哪张表”，那么 `ip route` 就是决定“在这个表里，数据包具体该往哪走”。

```bash
# 查看，可简化为 ip r
ip route show
```

输出：

```bash
default via 192.168.1.1 dev eth0 proto dhcp metric 100 
192.168.1.0/24 dev eth0 proto kernel scope link src 192.168.1.10 metric 100 
172.17.0.0/16 dev docker0 proto kernel scope link src 172.17.0.1
```

解释：

- **`default`**: 默认路由。当目标地址匹配不到其他精确规则时，走默认。
- **`via`**: 下一跳的网关地址。
- **`dev`**: 出口网卡接口（Device）。
- **`proto`**: 路由的来源（如 `kernel` 是内核自动发现，`static` 是手动添加，`dhcp` 是自动获取）。
- **`scope link`**: 表示该网段直接连接在物理网卡上，不需要经过网关。
- **`src`**: 指定发送包时的源 IP 地址。
- **`metric`**: 路由开销/优先级。**数字越小，优先级越高**。

常见命令：

```bash
# 去往 10.0.0.x 网段的数据包，通过 eth0 发给网关 192.168.1.1
ip route add 10.0.0.0/24 via 192.168.1.1 dev eth0
# 添加默认网关
ip route add default via 192.168.1.1

# 删除路由
ip route del 10.0.0.0/24
ip route del default

# 修改路由
ip route change default via 192.168.1.254

# 路由查询
ip route get 8.8.8.8

# 指定源 IP (Source Selection)
# 在有多个 IP 的服务器上，如果希望访问外部服务时显示特定的 IP，可以在路由中指定
ip route add 1.1.1.1 via 192.168.1.1 src 192.168.1.50

# 永久失效（Blackhole/Prohibit）
# 彻底封死某个 IP 段，可以设置“黑洞”路由，数据包会被内核静默丢弃，不返回错误
ip route add blackhole 10.10.10.0/24

# 指定路由表，Linux 可以有 255 张路由表。
# 如果操作非主表（main 表），需要指定 table 参数
ip route add default via 10.0.0.1 table 100
```

路由匹配原则：最长前缀匹配

```bash
# 如果要访问 192.168.1.10：它同时匹配以上两条。
# 但由于 /25（255.255.255.128）比 /24（255.255.255.0）更精确（前缀更长），内核会选择 第 2 条。
192.168.1.0/24 via 10.0.0.1
192.168.1.0/25 via 10.0.0.2
```

## ss

Socket Statistics，网络工具，直接从内核的 Userspace（用户空间）读取数据，性能远超 `netstat`。常用命令：

```bash
# 查看所有正在监听的端口，
ss -ntulp
#说明
-n (numeric)：不解析服务名（直接显示端口号，如 80 而非 http）
-t (tcp)：显示 TCP 连接。
-u (udp)：显示 UDP 连接。
-l (listening)：仅显示正在监听（等待连接）的服务。
-p (processes)：显示是哪个进程（PID）在占用该端口。

ss -at
#说明
-a (all)：显示监听和已建立的所有连接。

# 摘要统计，有多少个 TCP 连接、多少个正在等待、多少个 UDP 在使用
ss -s
```

## traceroute

追踪数据包到达目的地所经过的跳数（路由路径）

```bash
traceroute google.com
```

## tcpdump

```bash
tcpdump [选项] [表达式]
```

| **选项**       | **说明**                                                     |
| -------------- | ------------------------------------------------------------ |
| **`-i`**       | 指定网络接口（如 `-i eth0`）。使用 `-i any` 抓取所有接口。   |
| **`-n`**       | 不解析主机名（显示 IP 而不是域名）。                         |
| **`-nn`**      | 不解析端口号（显示 80 而不是 http）。                        |
| **`-X`**       | 以十六进制和 ASCII 形式打印数据包内容（适合查看应用层载荷）。 |
| **`-v / -vv`** | 输出更详细的信息（如 TTL、ID、总长度等）。                   |
| **`-c`**       | 抓取指定数量的数据包后退出（如 `-c 10`）。                   |
| **`-w`**       | 将原始包写入文件（`.pcap`）                                  |
| **`-r`**       | 从文件中读取数据包进行分析。                                 |
| **`-s`**       | 设置抓取的快照长度（`-s 0` 表示抓取完整包，防止长包被截断）。 |

```bash
tcpdump -i any -w traffic.pcap
```

## nllookup/dig

需要安装**`dnsutils`** 软件包：

```
sudo apt install dnsutils
```

命令：

```bash
nllookup google.com
```

### dig命令：

DNS lookup utility

```
dig [@DNS服务器] [域名] [查询类型] [选项]
```

- **@DNS服务器**: 可选。指定用哪个 DNS 代理查询（如 `@8.8.8.8`）。
- **查询类型**: 如 `A` (默认), `MX`, `NS`, `TXT`, `AAAA`, `CNAME`, `ANY` 等。
- **选项**: 控制输出的精简程度和行为（如 `+short`, `+trace`）。

输出结果，如`dig google.com`解释：

1. **HEADER (头部)**: 显示查询的状态（如 `status: NOERROR` 表示解析成功）。
2. **QUESTION SECTION (问题部分)**: 确认你查询的内容。
3. **ANSWER SECTION (回答部分)**: **这是最重要的部分**，显示域名对应的 IP 地址及 TTL（缓存存活时间）。
4. **AUTHORITY SECTION (权威部分)**: 显示负责该域名的名称服务器。
5. **ADDITIONAL SECTION (附加部分)**: 显示这些名称服务器的 IP 等信息。
6. **统计信息**: 耗时、时间戳、响应服务器地址和数据包大小。

具体命令：

```bash
# 只需要IP
dig baidu.com +short

# 查看详细解析路径 (排查 DNS 污染)
dig google.com +trace

# 反向查询
dig -x 8.8.8.8 +short

#
dig @8.8.8.8 google.com
```

`dig @8.8.8.8 google.com`，验证代理劫持，如果配置了透明代理，返回的 IP 延迟极低或属于代理服务器的伪装 IP，说明请求被成功拦截。

开启TUN模式时：

```bash
; <<>> DiG 9.18.39-0ubuntu0.24.04.3-Ubuntu <<>> @8.8.8.8 google.com
; (1 server found)
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 63287
;; flags: qr aa rd ra ad; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; MBZ: 0x0001, udp: 1232
; COOKIE: 35d86bb6b2bedbac (echoed)
;; QUESTION SECTION:
;google.com.                    IN      A

;; ANSWER SECTION:
google.com.             1       IN      A       198.18.0.4

;; Query time: 0 msec
;; SERVER: 8.8.8.8#53(8.8.8.8) (UDP)
;; WHEN: Thu May 14 10:52:48 CST 2026
;; MSG SIZE  rcvd: 67
```

不开启时：

```bash
; <<>> DiG 9.18.39-0ubuntu0.24.04.3-Ubuntu <<>> @8.8.8.8 google.com
; (1 server found)
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 38886
;; flags: qr rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 512
;; QUESTION SECTION:
;google.com.                    IN      A

;; ANSWER SECTION:
google.com.             300     IN      A       142.251.45.142

;; Query time: 79 msec
;; SERVER: 8.8.8.8#53(8.8.8.8) (UDP)
;; WHEN: Thu May 14 10:58:26 CST 2026
;; MSG SIZE  rcvd: 55
```

解释：

1. DiG 9.18.39-0ubuntu0.24.04.3-Ubuntu <<>> @8.8.8.8 google.com：DIG版本及指定的DNS服务器8.8.8.8，查询目标为google.com。
2.  global options: +cmd：启用相关输出。
3. 头部信息（HEADER）
   - `opcode: QUERY` —— 执行操作，当前为查询。IQUERY反向查询，STATUS查询服务器状态，UPDATE动态更新DNS。
   - `status: NOERROR` —— 查询结果状态：成功。NXDOMAIN域名不存在，SERVFAIL-DNS 服务器错误，REFUSED被拒绝，FORMERR格式错误。
   - flags: qr aa rd ra ad：qr(response)响应报文，aa(Authoritative Answer)响应服务器是权威服务器，非正常情况，代理伪造。rd(recursion desired)递归期望（客户端要求递归）。ra(recursion available)递归可用（服务器支持递归）。ad验证数据（DNSSEC 相关)。
4. QUESTION SECTION：google.com. IN A —— 查询 google.com 的 A 记录。A：IPv4。AAAA：IPv6。
5. 回答段（ANSWER SECTION）：google.com. 1 IN A 198.18.0.4，TTL为1秒，解析到的IP
6. 附加段（ADDITIONAL）：OPT PSEUDOSECTION显示 EDNS（Extension DNS） 扩展。

