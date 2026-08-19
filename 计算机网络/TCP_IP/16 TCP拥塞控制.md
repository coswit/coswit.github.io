> 慢启动、拥塞避免、快速重传/恢复；NewReno 与 SACK；CUBIC 等替代算法；ECN。

## 1. 为什么需要拥塞控制

- 流量控制（第 15 章）只保护**接收方**；网络（路由器缓冲）无人保护时会**拥塞崩溃（congestion collapse）**：缓冲溢出、大量重传、有效吞吐骤降（1986 年 LBL→UC Berkeley 吞吐从 32 Mb/s 崩到 40 b/s 的著名事件）。
- 1988 年 Van Jacobson 提出 TCP 拥塞控制，核心思想：**发送方自我限速**，通过丢包/标记信号推断网络负载。

## 2. 核心变量

| 变量 | 含义 |
| ---- | ---- |
| **cwnd（congestion window）** | 拥塞窗口：发送方"猜"网络能承受的在途量 |
| **ssthresh（slow start threshold）** | 慢启动/拥塞避免的分界 |
| **FlightSize** | 已发未确认的字节数 |
| 实际发送上限 | `min(cwnd, rwnd)`（rwnd = 接收通告窗口） |
| **AWND / LW** | 接收方限制 / 丢失窗口（历史概念） |

- **ACK 时钟（self-clocking）**：每收到一个 ACK 放行新数据，发送节奏自然跟随网络往返节奏。
- ssthresh 初始值无穷大（或极大），首次丢包才"定形"；IW（Initial Window）旧标准 1–2 MSS，RFC 6928 提升为 **10 MSS**，短连接与高时延链路受益明显。

## 3. 经典算法（RFC 5681）

### 慢启动（Slow Start）

```
初始: cwnd = IW (初始窗口, 现常用 10 MSS; 旧标准 1~2 MSS)
每收到一个(新)ACK: cwnd += 1 MSS        →  每个 RTT cwnd 翻倍 (1,2,4,8...)
出口: cwnd ≥ ssthresh → 进入拥塞避免; 或中途丢包
```

- 名字"慢"是相对旧 TCP 一上来就发整窗的暴冲；实际是指数增长。

### 拥塞避免（Congestion Avoidance）

```
每个 RTT: cwnd += 1 MSS                 (线性增长, 加性增 AI)
   等价的逐 ACK 形式: cwnd += MSS×MSS/cwnd
```

### 丢包响应（乘性减 MD）

| 信号 | 动作 |
| ---- | ---- |
| **RTO 超时**（强拥塞信号） | `ssthresh = max(FlightSize/2, 2×MSS)`；**cwnd = 1 MSS** 重回慢启动 |
| **3×dupACK / ECN**（温和信号） | 快速重传 + 快速恢复：`ssthresh = max(FlightSize/2, 2×MSS)`；cwnd 设为 ssthresh（减半），继续拥塞避免 |

### 快速重传与快速恢复（Fast Retransmit / Fast Recovery）

- 3 个 dup ACK → 重传最老丢失段；**不**把 cwnd 打回 1（网络还在转发后续段，说明未瘫）。
- 恢复期临时膨胀 cwnd（每 dupACK +MSS）以维持 ACK 时钟；收到新 ACK 后回落到 ssthresh。

## 4. 标准演进：Reno → NewRoo → SACK

| 版本 | 恢复策略 | 局限 |
| ---- | ---- | ---- |
| **Tahoe** (1988) | 只有慢启动/拥塞避免，丢包一律 cwnd=1 | 无快速恢复 |
| **Reno** | 快速重传 + 快速恢复 | 一个窗口丢多包时恢复慢（每 RTT 只救一个） |
| **NewReno**（RFC 6582） | 快速恢复期记住"最高已发序号"，partial ACK 到来时继续重传下一个洞，一轮 RTT 救多个洞 | 仍受窗口内丢包数量拖累 |
| **SACK**（RFC 3517） | 基于 SACK 信息精确重传全部空洞 | 需两端支持（第 14 章） |

- **FACK（Forward ACK）**：更激进地用 SACK 前沿控制重传，混见于 BSD 实现。

## 5. 替代与改进算法

共同痛点：AIMD 对高 BDP（长肥）网络填充太慢；丢包即减半对无线误码过于悲观。

| 算法 | 思路 | 备注 |
| ---- | ---- | ---- |
| **Vegas** | 基于**时延**（RTT 增大即退让）而非丢包 | 与 Reno 竞争时吃亏（守规矩者吃亏） |
| **Westwood/Westwood+** | 估端到端带宽率定 cwnd | 对无线/非拥塞丢包友好 |
| **FAST** | Vegas 的改进，高 BDP 友好 | |
| **HighSpeed TCP / Scalable TCP / H-TCP** | 大 cwnd 区间采用更陡的增长函数 | 长肥网络加速填充 |
| **BIC** | 二分搜索逼近最优窗口 | 曾是 Linux 默认（2.6.9–2.6.18） |
| **CUBIC** | 窗口是距上次丢包时间 t 的**三次函数**：`W(t) = C·(t−K)³ + W_max`（K 由减半幅度 β=0.7 决定），先快速逼近再缓探顶 | **Linux 默认**（2006 至今），与 RTT 无关的公平性是其卖点 |
| **Compound TCP** | 维持 Reno 与时延驱动两条窗口取和 | Windows 默认 |
| **BBR**（2016，书中未收录） | 估计瓶颈带宽与最小 RTT，不依赖丢包 | Google 提出，YouTube 等大规模部署 |

- **RTT 不公平性**：线性增长按 RTT 计，短 RTT 流抢走带宽（同一 RTT 内 ACK 多）；SACK/FACK 无法解决，属于 AIMD 内生问题。
- **bufferbloat**（缓冲膨胀）：超大缓冲让丢包信号迟到、RTT 飙升 → AQM（如 CoDel/FQ-CoDel）+ ECN 是根治方向。

## 6. ECN（Explicit Congestion Notification，RFC 3168）

用"路由器打标记"取代"靠丢包报信"：

```
1. 建连: SYN 带CWR+ECE / SYN+ACK 带ECE —— 双方支持 ECN
2. 发送端: IP 头 DSCP 字段低 2 bit 置 ECT(0)/ECT(1) = "可标记"
3. 拥塞路由器: 转发但改标记为 CE (Congestion Experienced)
4. 接收端: 回 ACK 时置 TCP ECE 标志 (持续提示)
5. 发送端: 拥塞避免式减半, 置 CWR 告知"已处理", 停止 CE 提示
```

- 好处：无需真丢包即可感知拥塞（时延敏感、无损数据中心 DC-TCP 大量使用）。
- ECN 与快速恢复联动：cwnd 减半但**不需要重传**。

## 7. 观察与调参（Linux）

```bash
sysctl net.ipv4.tcp_congestion_control     # 当前算法(cubic)
sysctl net.ipv4.tcp_available_congestion_control
sysctl net.ipv4.tcp_ecn                    # ECN 支持(2=默认按需)
ss -ti                                     # 看 cwnd/ ssthresh / retrans
tc qdisc ... fq / cubic                    # pacing 与队列管理
```

## 8. 拥塞控制全景图

```
                    丢包/CE 标记
   ┌───────────────────────────────┐
   │  cwnd=1MSS, ssthresh=FS/2     │ (RTO: 强信号)
   ▼                               │
 慢启动 (指数 ×2/RTT) ──cwnd≥ssthresh──▶ 拥塞避免 (线性 +1MSS/RTT)
   │                                       │
   └── 3×dupACK: ssthresh=FS/2, cwnd≈ssthresh (快速重传/恢复) ──┘
```

## 9. 要点回顾

- cwnd 是发送方对网络的尊重，实际窗口 = min(cwnd, rwnd)；ACK 时钟自节拍。
- 慢启动指数增长到 ssthresh，拥塞避免线性增长；RTO → cwnd=1，dupACK/ECN → 减半。
- NewReno/SACK 解决"一窗多丢"；CUBIC（三次函数）是 Linux 默认，BBR 代表丢包之外的路线。
- ECN 用标记代替丢包：IP ECT/CE + TCP ECE/CWR。
