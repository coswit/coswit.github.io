> 主机如何自动获得 IP 地址、掩码、网关、DNS 等配置：DHCPv4、DHCPv6、SLAAC 与地址冲突检测。

## 1. 系统需要配置什么

一台主机联网至少需要：

- **IP 地址 + 子网掩码（前缀长度）**
- **默认路由器（default gateway）**
- **DNS 服务器地址**（+ 本地域名）
- 可选：NTP、BOOTP/DHCP 服务器、SIP 等

获取方式从手工静态配置 → BOOTP（RFC 951，静态映射表）→ **DHCP（RFC 2131/2132）** 动态租约，IPv6 还有 **SLAAC** 无状态自动配置。

## 2. DHCPv4

### 报文与工作流程

DHCP 是 BOOTP 的超集，使用 **UDP**：服务器 67 / 客户端 68。首次入网的典型四步（**DORA**）：

```
客户端                                   服务器
  │ ── DHCPDISCOVER (广播 src 0.0.0.0:68 → 255.255.255.255:67) ──▶ │
  │ ◀─ DHCPOFFER  (提供 IP/掩码/网关/DNS/租期...)                    │
  │ ── DHCPREQUEST (选定服务器, 广播) ──▶                             │
  │ ◀─ DHCPACK    (确认, 客户端可用)                                  │
```

DHCP 消息类型（Option 53）：

| 消息 | 方向 | 用途 |
| ---- | ---- | ---- |
| DHCPDISCOVER | C→S | 寻找可用的 DHCP 服务器 |
| DHCPOFFER | S→C | 提供地址与配置 |
| DHCPREQUEST | C→S | 请求使用某服务器提供的配置（也用于续租） |
| DHCPACK / DHCPNAK | S→C | 确认 / 拒绝（如租约失效、地址已分配他处） |
| DHCPDECLINE | C→S | 客户端检测到地址冲突，弃用 |
| DHCPRELEASE | C→S | 主动释放地址（正常下线） |
| DHCPINFORM | C→S | 已有 IP，只要其他配置参数（如 DNS） |

### BOOTP 报文字段（DHCP 沿用）

```
| op(1/2) | htype | hlen | hops |  xid (事务ID)  |
| secs    | flags(B=广播位) | ciaddr | yiaddr      |
| siaddr(服务器) | giaddr(中继) | chaddr(客户端MAC) |
| sname(64) | file(128) | options(变长, magic cookie 0x63825363) |
```

- 客户端尚无地址时：源 `0.0.0.0`，目的 `255.255.255.255`；`chaddr` 携带客户端 MAC；flags 的 **B 位** 置 1 时要求服务器**广播**应答（客户端此时可能收不到单播）。

### 常用选项（RFC 2132）

| 选项号 | 含义 |
| ---- | ---- |
| 1 | Subnet Mask |
| 3 | Router（默认网关列表） |
| 6 | Domain Name Server |
| 51 | Lease Time（IP 地址租期） |
| 53 | DHCP Message Type |
| 54 | Server Identifier |

### 租约（Lease）与续租定时器

地址是**租**给客户端的，带两个定时器：

```
T1 = 0.5 × lease   → 单播 DHCPREQUEST 向原服务器续租 (RENEWING)
T2 = 0.875 × lease → T1 未成功，广播 DHCPREQUEST 任意服务器 (REBINDING)
租期到             → 仍未成功，停止使用该地址，回到 DISCOVER (INIT)
```

客户端状态机：INIT → SELECTING（收 OFFER 后挑服务器）→ REQUESTING → **BOUND**（收 ACK）→ RENEWING（T1 到）→ REBINDING（T2 到）→（失败）回 INIT；重启后带原地址直接 REQUEST 称为 REBOOT。

### DHCP 中继（Relay Agent）

- 服务器与客户端不在同一链路时，路由器上的**中继代理**把客户端的广播 DISCOVER 单播转发给服务器（`giaddr` 记录客户端所在网段），服务器据此从正确的地址池分配，应答也经由中继转回。

## 3. IPv6 的自动配置

IPv6 有两类机制，由路由器通告（RA）中的标志位决定：

- **M 位（Managed）**=1：用 **DHCPv6**（有状态）获取地址。
- **O 位（Other Config）**=1：DHCPv6 只获取 DNS 等其他参数。
- **A 位**（RA 中每个前缀选项的 Autonomous 标志）=1：该前缀可用 **SLAAC**。

### SLAAC（Stateless Address Autoconfiguration，RFC 4862）

```
1. 主机生成链路本地地址  fe80::/64 + 接口标识符(EUI-64/随机)
2. DAD 检测冲突 (对自身地址发 NS, 等待 NA)
3. 收到 RA (默认周期通告或响应 RS 触发), 获得全局前缀 (A=1)
4. 前缀(64bit) + 接口标识符(64bit) → 全局地址; 再次 DAD
5. RA 同时给出默认路由器与 MTU; DNS 通常由 RDNSS 选项/DHCPv6 提供
```

- 无需服务器、无租约状态；地址还有**有效期（preferred/valid lifetime）**。
- 隐私扩展（RFC 4941）：临时地址随机接口 ID、定期轮换，避免被追踪。

### DHCPv6（RFC 3315/8415）

- UDP **客户端 546 / 服务器与中继 547**；客户端用链路本地地址 + 组播目的：
  - `ff02::1:2`（All DHCP Relay Agents and Servers）
  - `ff05::1:3`（All DHCP Servers，站点范围）
- 消息：SOLICIT / ADVERTISE / REQUEST / REPLY / RENEW / REBIND / RELEASE / **INFORMATION-REQUEST**（仅要参数）/ CONFIRM / DECLINE。
- 身份关联：**IA_NA / IA_TA / IAADDR** 把"一个接口的一组非临时地址"作为整体管理。
- 与 DHCPv4 的差异：不提供默认网关（由 RA 负责）、不提供掩码（前缀固定 /64）、天然支持多个地址。

## 4. 地址冲突与检测

- IPv4：客户端收到 DHCPACK 后**应**发送免费 ARP（或 ICMP 回显请求）探测地址是否被占；冲突则 DHCPDECLINE 并重新来。服务器也可用 ICMP Echo 探测分配前是否有人占用。
- IPv6：**DAD（Duplicate Address Detection）**——对将使用的地址发 NS（目标 = 该地址的 solicited-node 组播地址）；若收到 NA 应答则冲突。冲突地址进入 duplicate 状态不可用。
- RFC 5227 定义了 IPv4 的冲突检测与防御机制（ARP 探测/宣告）。

## 5. 无服务器环境与链路本地地址

- DHCP 失败且无 SLAAC 时，IPv4 可自动配置 `169.254.0.0/16`（APIPA，RFC 3927），仅限链路内通信。
- IPv6 接口**始终**拥有 `fe80::/64` 链路本地地址（不依赖任何服务器），保证同链路可达性与协议自举（如 RS/NS 都用它）。

## 6. 要点回顾

- DHCPv4 = DORA 四步 + 租约（T1=50% 续租、T2=87.5% 重绑定）；UDP 67/68；中继靠 giaddr。
- IPv6：RA 的 M/O/A 位决定 DHCPv6（有状态/无状态参数）还是 SLAAC；SLAAC = RA 前缀 + 接口标识符 + DAD。
- DHCPv6 端口 546/547，组播 `ff02::1:2`，不负责网关与掩码。
- 冲突检测：IPv4 用免费 ARP / ICMP，IPv6 用 DAD（NS/NA）。
