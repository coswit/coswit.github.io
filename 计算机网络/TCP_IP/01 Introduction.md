> 参考书籍：*TCP/IP Illustrated, Volume 1: The Protocols* (2nd Edition, Kevin R. Fall & W. Richard Stevens, 2011)

## 1. 架构原则（Architectural Principles）

Internet 的基本设计原则（源自 RFC 1958 *Architectural Principles of the Internet* 等经典文献）：

- **分组交换（Packet Switching）**：数据被切分为有限长度的**分组（packet）**，采用存储转发（store-and-forward）传输，无需为通信预留线路（区别于电路交换 circuit switching）。带宽按需复用，同一链路可交替承载多路通信，链路空闲时不占用资源。
- **无连接的数据报（Connectionless Datagram）服务**：每个 IP 数据报（datagram）独立选路，网络本身不保存连接状态，网络节点出错只影响经过它的分组，而非整个通信。
- **端到端论证（End-to-End Argument）**（[SRC84]）：把功能放在系统底层实现代价高且不完整，只有在端系统上实现才能保证正确性。因此 TCP/IP 把可靠性、流控、拥塞控制、安全等复杂功能放在**端主机（end host）**实现，网络核心（路由器）尽量简单——"智能在边缘，哑的网络（smart ends, dumb middle）"。
- **命运共享（Fate Sharing）**（[Clark88]）：将相关状态放在共同经历失效的通信端点上。两端通信状态存放在端系统，即使中间网络设备崩溃重启，通信仍可恢复（对比：状态放在网络中间设备上，设备崩溃则通信中断）。
- **标准化分层与模块化**：协议按层组织，各层只依赖下层提供的服务接口，便于独立演进（如链路技术从以太网换到 Wi-Fi，上层协议无感知）。

### 名字、地址与路由（Names, Addresses, Routes）

互联网中三个基本概念（[Shoc78]）：

| 概念 | 含义 | 例子 |
| ---- | ---- | ---- |
| **Name（名字）** | 人类可读、与位置无关的标识 | `www.example.com` |
| **Address（地址）** | 与位置（拓扑）相关的标识 | `93.184.216.34`、`2606:2800:220:1:...` |
| **Route（路由）** | 到达某个地址的路径 | 路由表中的下一跳（next hop） |

- Name 通过 **DNS**（第 11 章）映射为 Address，Address 通过路由协议映射为 Route。
- 地址同时承担"身份"与"位置"双重角色，这是后期移动性、多宿主（multihoming）等问题的根源。

## 2. 分层与封装（Layering and Encapsulation）

### TCP/IP 协议族分层

TCP/IP 协议族通常按 4 层（对照 OSI 7 层模型）理解：

| TCP/IP 层 | 功能 | 典型协议 | OSI 对应 |
| ---- | ---- | ---- | ---- |
| **Application（应用层）** | 用户功能 | HTTP, SMTP, DNS, SSH | 5/6/7 层 |
| **Transport（运输层）** | 端到端通信（进程到进程） | TCP, UDP, SCTP, DCCP | 4 层 |
| **Internet/Network（网络层）** | 主机到主机、全局地址与选路 | IPv4/IPv6, ICMP, 路由协议 | 3 层 |
| **Link（链路层）** | 相邻节点间传输 | Ethernet, Wi-Fi, PPP, MPLS | 1/2 层 |

层间交互模型有两种：

- **分层模型（layered）**：严格上下传递。适合描述协议栈实现。
- **参考模型（reference）**：实际中 ICMP 等协议与 IP 同层"旁挂"，ARP 直接架在链路层上，OSI 严格分层并不能完全描述 TCP/IP。

> **沙漏模型（hourglass / narrow waist）**：IP 是协议族的"细腰"——上层应用无限多样、下层链路技术无限多样，中间收敛为一个无连接的 IP。任何应用跑在任何链路上，这种异构包容性是 Internet 成功的关键。

### 封装（Encapsulation）

应用数据发送时逐层加头部（header）：

```
应用数据
  → [TCP头 | 应用数据]            (段 segment)
    → [IP头 | TCP头 | 应用数据]   (IP数据报 packet/datagram)
      → [以太网帧头 | IP头 | ... | 帧尾]  (帧 frame)
```

- 每一层都会在数据前加上自己的头部；链路层有时还会加尾部（如 Ethernet 的 CRC）。
- **多路复用与分用（Multiplexing / Demultiplexing）**：发送端多协议共用下层通道；接收端依靠头部中的类型字段分用：
  - Ethernet 帧的 **EtherType** 字段区分 IPv4(0x0800)/IPv6(0x86DD)/ARP(0x0806)；
  - IP 头部的 **Protocol** 字段区分 TCP(6)/UDP(17)/ICMP(1) 等；
  - TCP/UDP 头部的 **端口号** 区分应用进程。

### MTU 与分片

- 每种链路技术限制帧中可承载的上层报文最大长度，即 **MTU**（Maximum Transmission Unit）。Ethernet 的 MTU 为 **1500 字节**。
- 当 IP 数据报超过出口链路 MTU 时会被切分为多个**分片（fragment）**（IPv4 可在任何路由器分片，IPv6 只允许源主机分片，详见第 5、10 章）。
- 路径上最小的 MTU 称为 **Path MTU（路径 MTU）**，可通过 PMTU Discovery 探测（第 8、10 章）。

## 3. TCP/IP 协议族中的协议与所在章节

```
           应用层        SMTP  DNS  HTTP  FTP  SNMP  DHCP  ...
                        \  |    |  /     /
        运输层            TCP        UDP
                          \        /
        网络层       ICMP  IGMP/MLD  ARP  IP(v4/v6)   路由协议
                          \    |    /      /
        链路层         Ethernet / Wi-Fi / PPP / MPLS ...
```

- **ARP / DHCP / ICMP / IGMP / MLD** 等"辅助协议"分别承担地址解析、自动配置、控制与差错报告、组播管理等功能。

## 4. 端口号（Port Numbers）

TCP 与 UDP 用 16 bit **端口号**标识应用（进程到进程的复用/分用）。由 IANA ([IANA-PN]) 分为三段：

| 范围 | 类别 | 说明 |
| ---- | ---- | ---- |
| 0–1023 | **Well-known（熟知端口）** | 服务器常用，如 FTP(21) SSH(22) SMTP(25) DNS(53) HTTP(80) HTTPS(443) |
| 1024–49151 | **Registered（注册端口）** | 注册给特定应用，如 MySQL(3306) PostgreSQL(5432) |
| 49152–65535 | **Dynamic / Private（动态/私有端口）** | 客户端临时使用（ephemeral ports） |

- 各系统临时端口范围不同：Linux 通常为 32768–60999，Windows 较新版本为 49152–65535。
- 一条 TCP 连接由四元组唯一标识：**{源 IP, 源端口, 目的 IP, 目的端口}**，因此同一服务器端口可同时服务大量客户端。
- Unix 系统中 1024 以内的端口绑定需要特权（root/Administrator）。
- `/etc/services`（Linux）保存常用端口映射。

## 5. 互联网与互连网（Internetworks / The Internet）

- **internetwork（互连网）**：用路由器（router）连接多个网络构成的更大网络（internet 小写）。
- **The Internet（互联网）**：全球范围的、使用 TCP/IP 协议族的互联系统（大写 I），由 ISP、IXP、内容提供商网络、家庭/企业网络等构成。
- **路由器（router）**：工作在网络层，连接多个链路，按最长前缀匹配转发分组；**交换机（switch/bridge）** 工作在链路层；**集线器（hub）** 是纯物理层设备（现已基本淘汰）。
- 历史里程碑：1969 ARPANET；1974–1983 TCP/IP 协议逐步成形（1983-01-01 ARPANET 切换 TCP/IP，"flag day"）；1983 DNS 引入；1991–1995 商业化与 Web 兴起；2011 年 6 月 World IPv6 Day，IPv6 进入实用阶段。

## 6. 本书实例环境

书中实验基于 Unix（如 Linux/FreeBSD/NetBSD）系统，常用工具：

- `ping`、`traceroute`（或 `tracepath`、`paris-traceroute`）：ICMP 与路径探测
- `tcpdump` / Wireshark：抓包分析（书中的主要观察手段）
- `ifconfig` / `ip addr`、`netstat` / `ss`、`nslookup` / `dig`：查看网络配置与状态

> 本书贯穿"用真实抓包观察协议行为"的方法论：协议不是纸上的状态机，而是线路上真实的报文交互。

关键 RFC：791(IP)、2460/8200(IPv6)、793(TCP)、768(UDP)、792/4443(ICMP)、1034/1035(DNS)、1122/1123(主机需求)、1812(路由器需求)。

## 7. 针对 Internet 的攻击（Attacks on the Internet）

后续各章会讨论具体攻击手段，概述如下：

- **嗅探（packet sniffing）**：链路层明文传输可被窃听 → 引出加密需求（第 18 章 TLS/IPsec）。
- **IP 欺骗（spoofing）**：伪造源地址发送分组 → TCP 用三次握手 + 校验和对抗。
- **DoS / DDoS（拒绝服务）**：如 SYN flood（第 13 章）、ICMP/IGMP flood（第 8、9 章）。
- **中间人（MITM）**：ARP 欺骗、DNS 缓存投毒（第 11 章）等。
- **劫持与注入**：伪造报文注入已有连接。

## 8. 要点回顾

- TCP/IP 核心设计：分组交换、无连接数据报、端到端原则、命运共享。
- 分层 + 封装 + 每层的类型字段实现多路分用。
- 端口号按 0–1023 / 1024–49151 / 49152–65535 三段划分。
- MTU 限制单帧载荷，Ethernet MTU = 1500 字节；超长 IP 报文需分片。
