> 名字空间、资源记录、解析流程、报文格式、反向解析与安全。

## 1. 概述

- **DNS（RFC 1034/1035）** 是 Internet 的"电话簿"：把人类可读的**域名**（如 `www.example.com`）映射为 IP 地址（A/AAAA 记录），另承载邮件路由（MX）、别名（CNAME）、服务发现（SRV）等。
- 特性：**分布式、层次化数据库** + **带缓存的应用层协议**（主要跑 UDP 53，长应答/区域传送用 TCP 53）。
- DNS 是"客户端"（stub resolver，系统库）→ **递归解析器（recursive resolver）**（ISP/公共 DNS，如 8.8.8.8）→ **权威服务器（authoritative servers）** 的三级结构。

## 2. 名字空间与服务器层次

```
                 . (root, 根)
     ┌───────────┼─────────────┐
    com         org           cn ...       (TLD 顶级域)
   ┌──┴───┐                  ┌┴──┐
example  google            baidu qq        (二级域/注册域)
  │
 www  mail ...                              (主机/子域)
```

- **根服务器**：全球 13 个"字母"（a~m.root-servers.net），以 Anycast 扩展为数百个实例；根区由 IANA 管理。
- **区域（zone）**：DNS 授权的管理单元，是域名树的连续子树；每个区域有 **SOA**（权威起点）与 **NS**（该区域的权威服务器）。
- **委托（delegation）**：父区域用 NS 记录把子域交给下级管理——这是 DNS 可扩展性的根基。
- **Glue 记录**：委托时提供子域权威服务器 A/AAAA（否则鸡生蛋死锁）。
- **根提示（root hints）**：递归解析器内置 13 台根服务器的地址清单，是一切递归解析的起点。

## 3. 资源记录（Resource Records）

每条 RR 的格式：**{Owner(域名), TYPE, CLASS=IN, TTL, RDATA}**

| TYPE | 名称 | RDATA 内容 |
| ---- | ---- | ---- |
| **A** (1) | 地址 | IPv4 地址 |
| **AAAA** (28) | 地址 | IPv6 地址 |
| **NS** (2) | 名字服务器 | 该区域的权威服务器域名 |
| **CNAME** (5) | 规范名 | 别名 → 规范名（真正拥有 A 记录的名字） |
| **PTR** (12) | 指针 | 反向解析：IP → 域名 |
| **MX** (15) | 邮件交换 | 邮件服务器 + 优先级（小者优先） |
| **TXT** (16) | 文本 | 任意文本（SPF、DKIM 公钥、域名验证） |
| **SRV** (33) | 服务定位 | `{优先级 权重 端口 目标}`，如 `_sip._tcp` |
| **SOA** (6) | 权威起始 | 主服务器、管理员邮箱、序列号、刷新/重试/过期/最小 TTL |
| **OPT** (41) | EDNS0 | 伪记录：宣告 UDP 缓冲区大小、扩展响应码（RFC 6891） |

- **TTL**：该记录可被缓存的秒数—— balances 一致性与负载。
- **CNAME 规则**：CNAME 指向的名字不得再与其他记录类型共存（根/区域顶点不能用 CNAME）。

## 4. DNS 解析流程

### 递归 vs 迭代

```
Stub(DNS库)   递归解析器(8.8.8.8)        根服务器     .com TLD    example.com 权威
   │─ www.example.com? ─▶│
   │                     │──?──▶ 根  ──"去问 .com" (NS+glue)──▶│
   │                     │───────────?──▶ .com ──"去问 example.com NS"──▶
   │                     │────────────────────?──▶ 权威 ──"A = 93.184.216.34"
   │ ◀─ 93.184.216.34 ──│ (缓存, 按 TTL)
```

- 客户端 → 递归解析器是**递归查询**（RD=1，"你帮我查到底"）；
- 递归解析器 → 根/TLD/权威是**迭代查询**（"告诉我下一步问谁"）。
- 解析器沿途缓存每级 NS 与结果记录；**否定缓存**（NXDOMAIN + SOA minimum TTL）同样生效，避免重复请求不存在的名字。

## 5. DNS 报文格式

```
 0                    15 16                   31
+---------+---------+------------------------+
|       ID        | QR|Opcode|AA|TC|RD|RA|Z|RCODE|
+-----------------+--------------------------+
| QDCOUNT | ANCOUNT | NSCOUNT | ARCOUNT      |
+---------+---------+---------+--------------+
| Question: QNAME(labels) | QTYPE | QCLASS   |
+--------------------------------------------+
| Answer / Authority / Additional (RR 列表)   |
```

| 头部字段 | 含义 |
| ---- | ---- |
| **QR** | 0 查询 / 1 应答 |
| **AA** | 权威应答（来自该区域的权威服务器） |
| **TC** | **截断**——应答超过 UDP 限制被截断，客户端应改用 TCP 53 重查 |
| **RD / RA** | 期望递归 / 服务器支持递归 |
| **RCODE** | 0=NOERROR、2=SERVFAIL、3=**NXDOMAIN**（名字不存在）、5=REFUSED |

- **QNAME** 标签编码：长度前缀，`\x03www\x07example\x03com\x00`。
- 应答的 RCODE=NOERROR 且 Answer 区为空 = "名字存在但无该类型记录"（NODATA）；NXDOMAIN = "名字本身不存在"。

### 查询方式与缓存

- **EDNS0（OPT 伪记录）**：把 UDP 载荷从 512 B 提到常见 1232–4096 B，是 DNSSEC 前提。
- 应答超限：TC=1 → TCP 重试；区域传送（**AXFR** 全量 / **IXFR** 增量）一律 TCP。

## 6. 反向解析（Reverse DNS）

- IPv4：地址倒序 + `in-addr.arpa`：`93.184.216.34` → `34.216.184.93.in-addr.arpa PTR`
- IPv6：32 个 nibble 倒序 + `ip6.arpa`：
  `2001:db8::1` → `1.0.0...0.8.b.d.0.1.0.0.2.ip6.arpa PTR`
- 用途：邮件反垃圾（验证发送方）、日志可读性、安全溯源；PTR 与正向记录可不一致（需双Verify）。

## 7. DNS 安全

### 攻击面

| 攻击 | 手法 |
| ---- | ---- |
| **缓存投毒（cache poisoning）** | 伪造"权威应答"抢在真应答前抵达解析器；Kaminsky 攻击可对任意域并发猜测 TXID |
| 欺骗/中间人 | 线路劫持 + 伪造应答 |
| 反射放大 DoS | 利用 UDP 53 + 伪造源地址放大流量 |
| 软件漏洞 | bind 历史 RCE |

### 缓解与加固

- **随机化**：事务 ID（16 bit）+ 源端口随机化 + 0x20 大小写混合编码，增大猜测难度。
- **DNSSEC**（第 18 章）：对区域签名，解析器可验证应答真实性（防投毒），见 18 章。
- **TSIG**：主从之间区域传送的共享密钥签名。
- DNS over TLS/HTTPS（DoT/DoT 853、DoH 443）：加密客户端到递归解析器的链路（防窃听/篡改，2011 年书成书后普及）。

## 8. 常用工具

```bash
dig +short www.example.com A           # 查询 A 记录
dig @8.8.8.8 example.com MX            # 指定服务器查 MX
dig -x 93.184.216.34                   # 反向解析
dig +dnssec www.example.com            # 请求 DNSSEC 记录
dig +tcp www.example.com               # 强制 TCP
nslookup www.example.com               # 旧式工具
host -t ns example.com
cat /etc/resolv.conf                   # 客户端 DNS 配置 (nameserver/search)
```

## 9. 要点回顾

- DNS = 层次委托的分布式数据库 + 高性能缓存；客户端 → 递归解析器（递归）→ 根/TLD/权威（迭代）。
- 核心记录：A/AAAA、CNAME、MX、NS、PTR、SOA、SRV、TXT、OPT(EDNS0)。
- 报文头记住 QR/AA/**TC**/RD/RA/RCODE；TC=1 转 TCP；NXDOMAIN vs NODATA。
- 反向：`in-addr.arpa` / `ip6.arpa` + PTR。
- 安全：随机化 TXID/端口 → DNSSEC 签名验证 → DoT/DoH 加密传输。
