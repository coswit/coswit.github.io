> 差错报告与查询协议：ping、traceroute、PMTUD，以及 IPv6 的邻居发现（ND）与组播侦听发现（MLD）。

## 1. 概述

- **ICMP** 是 IP 层的"控制与差错信使"（RFC 792 / RFC 4443），报文封装在 IP 内：IPv4 Protocol=1，IPv6 Next Header=58。
- 用途：差错报告（目的地不可达、超时、参数错误）、网络探询（echo）、控制（重定向、PMTUD）。
- 规则：**不对 ICMP 差错报文再产生 ICMP 差错报文**；差错报文尽可能携带触发它的原数据报头部与开头若干字节（IPv4 通常 8 B，足够含 TCP/UDP 端口）。
- **差错报文限速（rate limiting）**：路由器对 ICMP 差错的生成有速率上限（RFC 1812），防止差错风暴；限额被攻击流量耗尽时，真实的 PMTUD 信号也可能发不出来。
- 严格说 ICMP 是"与 IP 同层的伴生协议"，而非严格的上下层关系。

## 2. ICMPv4 报文

报文 = Type(1B) + Code(1B) + Checksum(2B) + 内容（依类型而定）。

### 常用类型

| Type | 名称 | 说明 |
| ---- | ---- | ---- |
| 0 / 8 | **Echo Reply / Echo Request** | ping 使用的回显请求/应答（数据区原样返回，ID + 序号匹配） |
| 3 | **Destination Unreachable** | 不可达，见 code 表 |
| 4 | Source Quench | 拥塞时抑制源速率——**已废弃**（造成恶化，由 TCP 拥塞控制取代） |
| 5 | **Redirect** | 告知主机"更短的下一跳"（同链路另一路由器），主机更新路由缓存 |
| 9 / 10 | Router Advertisement / Solicitation | 路由器发现（IRDP，基本被 DHCP/ND 取代） |
| 11 | **Time Exceeded** | code 0 = TTL 减到 0（**traceroute** 的原理）；code 1 = 分片重组超时 |
| 12 | Parameter Problem | IP 头部参数错误（指针指向出错字节） |
| 13 / 14 | Timestamp / Reply | 时间戳请求/应答（很少用） |
| 17 / 18 | Address Mask Request / Reply | 掩码请求（已废弃，由 DHCP 承担） |

### Type 3 Destination Unreachable 常用 Code

| Code | 含义 |
| ---- | ---- |
| 0 / 1 | 网络不可达 / 主机不可达 |
| 2 / 3 | 协议不可达 / **端口不可达**（UDP 常见：目的端口无人监听） |
| 4 | **Fragmentation Needed and DF Set** —— PMTUD 的核心信号（携带"下一跳 MTU"） |
| 5 | Source Route Failed（源路由失败，历史） |
| 13 | Communication Administratively Filtered（被防火墙策略丢弃） |

- 主机不可达 vs 网络不可达：路由器能区分时报告网络级；无法区分时报告主机级。最终一跳路由器报告主机不可达；主机自身端口无监听时（UDP/TCP）报告**端口不可达**。

### ping 与 traceroute

```bash
ping -c 3 example.com          # ICMP Echo (8/0), 测 RTT 与丢包
traceroute example.com         # 发 TTL=1,2,3... 的包:
#  TTL 到 0 的路由器回 ICMP Time Exceeded(11/0), 依次暴露每一跳;
#  到达目的主机时回 Echo Reply(TCP/UDP 模式则回端口不可达), 探测结束
```

- traceroute 默认每跳 3 个探测包；Linux 默认发 UDP 高端口包（也可 `-I` 用 ICMP、`-T` 用 TCP）。
- 返回的 ICMP 差错报文源地址 = **发现问题的那台路由器**的出接口地址。

## 3. ICMPv6 报文

### 分类规则（比 IPv4 更规整）

- **1–127：差错报文（Error Messages）**

| Type | 名称 |
| ---- | ---- |
| 1 | Destination Unreachable（code 0 无路由 / 1 管理禁止 / 3 地址不可达 / 4 **端口不可达**） |
| 2 | **Packet Too Big**——PMTUD 专用，携带下一跳 MTU（IPv6 路由器不分片，超限即丢并回此报文） |
| 3 | Time Exceeded（0 跳数超限 / 1 重组超时） |
| 4 | Parameter Problem |

- **128 及以上：信息报文（Informational）**

| Type | 名称 | 用途 |
| ---- | ---- | ---- |
| 128 / 129 | Echo Request / Reply | ping |
| 130 / 131 / 132 | MLD 查询 / 报告 / 结束（对应 IGMP，第 9 章） | |
| 133 / 134 | **RS / RA**（Router Solicitation / Advertisement） | 路由器发现、SLAAC、下发默认路由（第 6 章） |
| 135 / 136 | **NS / NA**（Neighbor Solicitation / Advertisement） | 地址解析（替代 ARP）、DAD、可达性检测（第 4 章） |
| 137 | Redirect | 重定向 |
| 143 | MLDv2 报告（对应 IGMPv3） | |

### ICMPv6 与 ICMPv4 的关键差异

- ICMPv6 承担了更多职责：**ND（替代 ARP + 路由器发现）、MLD（组播管理）、PMTUD** 都构建其上。
- **校验和必算**，且伪头部（第 10 章概念）包含 IPv6 的源/目的地址；携带 ICMPv6 差错转发时源地址可能被换，需重新计算。
- RFC 4890 指导防火墙：**必须放行 Packet Too Big 与 Parameter Problem**，否则 PMTUD 断裂形成黑洞。

## 4. PMTUD（Path MTU Discovery）

发现路径上最小 MTU，避免低效分片：

```
1. 源主机发送 MTU 大小(如 1500B)且 DF=1 的包 (IPv6 隐含 DF)
2. 中间某路由器出口 MTU 更小(如 1492) → 丢弃, 回 ICMP:
     IPv4: Type3 Code4 (含下一跳 MTU)   IPv6: Type2 (含 MTU)
3. 源主机调小发送尺寸后重发; 逐步收敛到 Path MTU
4. 定期(如 5~10 分钟 或路由变化)抬高试探, 适应路径变化
```

- 失败模式：ICMP 被防火墙吞掉 → "小包通、大包挂"的 **PMTUD 黑洞**；TCP 的应对见第 12/15 章（如 MSS 限制、PLPMTUD）。
- **PLPMTUD（Packetization-Layer PMTUD，RFC 4821）**：不依赖 ICMP，由运输层（TCP）靠 ACK 探测确认大包能否通过。

## 5. 针对 ICMP 的攻击

- **ICMP flood / Ping of death**（历史：超长 echo 分片溢出缓冲区，现代系统已修复）。
- **Smurf 反射放大**：把源地址伪造成受害者，ping 广播地址放大流量。
- **ICMP 重定向欺骗**：伪造 Redirect 篡改主机路由 → MITM。
- 对策：限速、过滤重定向/掩码响应、禁止定向广播转发；但**不要一刀切封死 PMTUD 相关报文**。

## 6. 要点回顾

- ICMP 报文 = Type + Code + Checksum + 内容；差错报文携带原报文头部片段；差错不再触发差错。
- 记住：0/8 echo、3 不可达(3/4=端口不可达)、5 重定向、11 超时(traceroute)、Type3 Code4 = PMTUD。
- ICMPv6：差错 1–4（2 = Packet Too Big），信息 128+（echo、ND：RS/RA/NS/NA、MLD）。
- PMTUD 依赖 ICMP Too Big 被正确送达；封 ICMP 前请三思。
