> RTT 估计与 RTO 计算、超时重传、快速重传、SACK 与虚假重传的处理。

## 1. 问题：超时该设多长

- RTO（Retransmission Timeout）过短 → 没丢就重传，浪费带宽、加剧拥塞；过长 → 丢包后空等，性能差。
- RTT 本身随网络状态波动，故 RTO 必须**自适应跟踪 RTT**（其均值与方差）。

## 2. RTT 测量（RTTM）

- 用 Timestamps 选项（RTTM，RFC 1323）：发送方在 TSval 打时间戳，接收方在 ACK 中**原样回显**（TSecr），发送方用 `now − TSecr` 得到一次样本 R'。
- 无时间戳时用"某序号被 ACK"计时，但存在**重传二义性**。

### Karn 算法（Karn's Algorithm）

1. **重传过的段不作为 RTT 样本**（无法分辨 ACK 对应首发还是重传）。
2. 配合**指数退避**：每次超时重传后 RTO 加倍（直到上限），避免在恶劣路径上连环超时。

## 3. RTO 计算（Jacobson / RFC 6298）

维护平滑值 SRTT 与偏差 RTTVAR：

```
首次测量:
  SRTT  ← R'
  RTTVAR← R'/2
  RTO   ← SRTT + max(G, K × RTTVAR)        (K = 4)

后续测量:
  RTTVAR← (3/4)·RTTVAR + (1/4)·|SRTT − R'|   (β = 1/4)
  SRTT  ← (7/8)·SRTT  + (1/8)·R'             (α = 1/8)
  RTO   ← SRTT + max(G, 4 × RTTVAR)
  RTO 钳位: 下限(推荐 ≥1s, Linux 实现为 200ms), 上限(如 60~120s)
```

- G = 时钟粒度（timer granularity），粗粒度（如 500 ms 的老式时钟）会让 RTO 量化误差放大；现代内核用高精度计时。
- 超时发生 → 重传并 RTO ×2（backoff）；后续收到**新的（非重传）** ACK → 撤销 backoff 恢复计算值。
- 实现要点：每条连接通常只维护**一个**重传定时器，挂在最老的未确认数据上；收到推进的 ACK 便重启或重挂计时器。

## 4. 快速重传（Fast Retransmit）

不必等到超时——**重复 ACK（dup ACK）** 是丢包的早期信号：

- 接收方收到乱序段 → 立即重发"期望序号"的 ACK（相同 ack 值）→ 发送方收到**连续 3 个 dup ACK（dupthresh = 3）** → 立即重传丢失段（不等 RTO）。
- 随后的处理进入**快速恢复**（cwnd 调整），详见第 16 章。
- 与超时重传对比：超时 = "极强信号"（网络可能严重拥塞，cwnd 打回 1）；快速重传 = "温和信号"（个别丢包，减半即可）。

## 5. SACK（Selective Acknowledgment，RFC 2018/3517）

**问题**：累积 ACK 只能告知"最后一个连续字节"，窗口内**多个**洞时发送方不知道哪些到了，只能盲目重传（或每次 dup ACK 重传一个最老的段）。

**SACK 机制**：

1. SYN 中协商 SACK-Permitted；
2. 接收方在每个重复 ACK 中附 **SACK 选项**：列出已收到的乱序数据块（左/右边界对，每块 8 B，通常最多 3 块）；
3. 发送方维护 **scoreboard（记分板）**，按 SACK 精确知道空洞位置，**优先重传最老的未确认段**，避免冗余重传。

```
接收方: 已收 [1k-2k) [3k-4k) [5k-6k), 缺 2k-3k, 4k-5k
ACK=2000, SACK=3000-4000, 5000-6000   → 发送方只补两个洞
```

- SACK 信息是**随到随报的提示**（可能乱序/重复），发送方仍以累积 ACK 为准推进。

## 6. 虚假重传（Spurious Retransmissions）

RTO 偶尔过短（RTT 突变）或包只是**延迟未丢**时会无谓重传。检测与应对：

| 机制 | 原理 |
| ---- | ---- |
| **DSACK（Duplicate SACK）** | SACK 选项首个块报告"我重复收到了这些数据" → 发送方据此判定先前重传是多余的，并调整 dupthresh（RFC 3708） |
| **Eifel 检测算法**（RFC 3522） | 用时间戳判断收到的 ACK 属于首发还是重传，消除重传二义性，虚假超时后可撤销不必要的 cwnd 缩减 |
| **F-RTO**（RFC 5682） | 超时重传后观察其后首批 ACK：若出现推进的"新"数据 ACK，判定为虚假超时，恢复发送而非进入慢启动 |

## 7. 重传相关内核参数（Linux）

```bash
sysctl net.ipv4.tcp_retries1   # 警告阈值(默认2): 精确重传的耐心
sysctl net.ipv4.tcp_retries2   # 放弃阈值(默认15): RTO退避次数上限, ≈15~30min
sysctl net.ipv4.tcp_sack       # SACK 开关(默认开)
sysctl net.ipv4.tcp_dsack      # DSACK 开关
sysctl net.ipv4.tcp_frto       # F-RTO 开关
ss -ti                          # 观察每连接 rto/rtt/retrans 统计
```

- 应用层看到的断连超时主要由 `tcp_retries2` 控制（并非固定分钟数，而是退避序列的总时长）。

## 8. 重传层次总结

```
丢包发生
 ├─ 3×dupACK ──▶ 快速重传(+快速恢复)      [温和, 首选]
 ├─ RTO 到期 ──▶ 超时重传(指数退避, cwnd=1) [强烈, 兜底]
 └─ SACK 辅助 ─▶ 精确补洞, 减少冗余
虚假重传 ──▶ DSACK / Eifel / F-RTO 检测并撤销误判
```

## 9. 要点回顾

- RTO = SRTT + 4×RTTVAR（α=1/8、β=1/4），基于时间戳测 RTT；Karn：重传样本不用 + 指数退避。
- 3 个重复 ACK 触发快速重传，避免干等 RTO。
- SACK 报告乱序已收块，发送方精确补洞；DSACK/Eifel/F-RTO 处理"没丢却重传"。
- 超时重传与快速重传对 cwnd 的不同处理是第 16 章拥塞控制的主线。
