> IPv4 地址 → MAC 地址 的解析；IPv6 中对应功能由 NDP（Neighbor Discovery，基于 ICMPv6）承担。

## 1. 为什么需要 ARP

- IP 地址是网络层标识，MAC 地址是链路层标识。同一链路上实际传输的是**帧**，帧的寻址靠 MAC。
- 发送 IP 分组前，主机必须先知道下一跳 IP（同链路）对应的 MAC 地址——这个映射关系由 **ARP（RFC 826）** 动态获得。

```
主机A 向 同链路的 192.0.2.3 发包:
  1. A 的路由判断目的在链路上 → 需要知道 192.0.2.3 的 MAC
  2. ARP 解析 → 得到 MAC (如 00:30:48:5a:9f:3d)
  3. 组帧: [目的MAC | 源MAC | 0x0800 | IP分组...]
```

## 2. ARP 的工作过程

### ARP 请求与应答

1. **ARP Request（请求）**：若缓存无映射，发送方广播一个 ARP 请求帧（目的 MAC = `ff:ff:ff:ff:ff:ff`），询问"谁是 192.0.2.3？请告诉 192.0.2.2"。
2. 链路上**所有**主机收到该请求；目标主机单播回复 **ARP Reply（应答）**："192.0.2.3 是 00:30:48:5a:9f:3d"。
3. 请求方把映射写入 **ARP 缓存（ARP cache）**，随后即可发包。

- ARP 报文直接封装在 Ethernet 帧中（**EtherType = 0x0806**），**没有 IP 头**——它不是 IP 协议。
- ARP 报文**不会被路由器转发**，作用域仅限本地链路；跨网段的可达性由 IP 路由解决（代理 ARP 是特例）。

### ARP 报文格式（28 字节，Ethernet 上）

```
┌──────────────┬───────────────┬─────────┬──────────────┬────────┬────────┐
│ Hardware     │ Protocol      │ HLen=6  │ PLen=4       │ Op     │ ...    │
│ Type =1(Eth) │ Type =0x0800  │         │              │ 1/2    │        │
└──────────────┴───────────────┴─────────┴──────────────┴────────┴────────┘
Op: 1=ARP Request  2=ARP Reply 3=RARP Request 4=RARP Reply
其后依次: Sender MAC(6) | Sender IP(4) | Target MAC(6) | Target IP(4)
```

| 字段 | 说明 |
| ---- | ---- |
| Hardware Type | 链路类型，Ethernet = 1 |
| Protocol Type | 要解析的上层协议，IPv4 = 0x0800 |
| HLEN / PLEN | 硬件/协议地址长度（6 / 4） |
| Operation | 1 = 请求，2 = 应答 |
| Sender/Target | 发送方与目标的 MAC + IP |

- 请求帧中 Target MAC 填 `00:00:00:00:00:00`（未知）；应答是单播。

## 3. ARP 缓存

- 每个映射带超时：完整表项（已验证可达）通常数十秒；不完整表项（正在解析）数秒即丢弃。
- Linux 查看与操作：

```bash
ip neigh show            # 查看邻居表（含 ARP 项，状态 PERMANENT/REACHABLE/STALE/DELAY/PROBE 等）
ip neigh del 192.0.2.3 dev eth0
arp -n                   # 旧式命令
```

- **可达性判定（NUD 状态机）**：Linux 邻居项有 REACHABLE / STALE / DELAY / PROBE / INCOMPLETE 等状态；引用陈旧表项时会先发单播 ARP 请求确认（**可达性确认**），而非直接使用。

## 4. 免费 ARP（Gratuitous ARP）

主机发送 **ARP 请求，Sender IP 与 Target IP 都是自己的地址**（仍广播）：

- **作用 1——地址冲突检测**：若收到应答，说明链路上有其他主机占用了相同 IP（地址冲突，见第 6 章 DAD）。
- **作用 2——通告更新**：MAC 变化（如主备切换、虚拟化迁移、HA 心跳）时，主动让邻居刷新缓存。
- 应答方（收到与自己冲突的免费 ARP）也可以主动反击/告警。

## 5. 代理 ARP（Proxy ARP）

- 路由器**代替**不在本链路的主机回答 ARP 请求（把自己的 MAC 作为应答）。
- 效果：发送方以为目的主机在同链路，实际帧发给了路由器，由其转发。
- 用途：子网划分早期无掩码支持时的平滑过渡、某些拨号/移动场景。
- **缺陷**：网络不透明（掩码设置错误也能"通"，掩盖配置问题），现代网络更推荐显式路由 + 默认网关。

## 6. ARP 与 IPv6：Neighbor Discovery

IPv6 不用 ARP，改用 **ND（Neighbor Discovery，RFC 4861）**，报文承载于 ICMPv6（第 8 章）：

| 功能 | IPv4 | IPv6 |
| ---- | ---- | ---- |
| 地址解析 | ARP 请求/应答（广播） | **NS/NA**（Neighbor Solicitation/Advertisement，组播到 solicited-node 地址 `ff02::1:ffXX:XXXX`） |
| 冲突检测（DAD） | 免费 ARP | 发送方对目标地址发 NS，收到 NA 则冲突 |
| 路由器发现 | IRDP（少见）/ 手工配置 | **RS/RA**（Router Solicitation/Advertisement，第 6 章 SLAAC 的基础） |
| 重定向 | ICMP Redirect | ICMPv6 Redirect |

- 组播化的地址解析（只打扰少数主机）取代了 IPv4 的全网广播，是 IPv6 的重要改进。

## 7. 针对 ARP 的攻击

- **ARP 欺骗/中毒（ARP spoofing/poisoning）**：攻击者伪造 ARP 应答（通常宣称"网关 IP → 攻击者 MAC"），把流量引向自己，实现**中间人（MITM）嗅探/篡改**。ARP 无认证机制，天然可伪造。
- **免费 ARP 泛洪**：大量伪造免费 ARP 刷新交换机与主机缓存，导致 DoS 或流量劫持。
- 缓解：静态 ARP 表、动态 ARP 检测（DAI，交换机特性）、加密（TLS/IPsec 使嗅探失效）、802.1X 网络准入。

## 8. 要点回顾

- ARP 只解决**同链路**上 IPv4 → MAC 的映射；报文封装于 EtherType 0x0806，无 IP 头。
- 请求广播、应答单播；缓存表项带超时；免费 ARP 用于冲突检测与 MAC 更新通告。
- 代理 ARP 由路由器代答，现代网络少用；IPv6 用 ICMPv6 的 NS/NA/RS/RA 取代 ARP。
