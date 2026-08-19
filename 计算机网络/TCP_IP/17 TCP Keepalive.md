> 探测"对端是否还活着"的空闲连接保活机制。

## 1. 问题：死去的对端

对端主机**崩溃/断电/网络中断**（而非优雅关闭）时：

- 没有任何 FIN/RST 到来，TCP 不会自动报告——**连接保持 ESTABLISHED，直到本端发送数据**。
- 若本端也不发数据：连接将**永远挂在那里**（半开连接，half-open connection），白白占用表项与内存；客户端切网、NAT/防火墙老化映射也会造成类似"僵尸连接"。

两个方向的问题：

- **服务器视角**：大量死客户端占着连接资源 → 需要回收。
- **客户端视角**：想知道服务器/链路是否还通 → 需要探测。

## 2. TCP Keepalive 机制

**默认关闭**，应用显式开启：

```c
int on = 1;
setsockopt(fd, SOL_SOCKET, SO_KEEPALIVE, &on, sizeof(on));
```

开启后，当连接**空闲（无任何数据交换）**达到一定时间，发送**保活探测（keepalive probe）**：

```
空闲 keepidle (默认 2 小时)
   └─▶ 发探测段: 序号 = snd.nxt − 1 (一个"已旧"字节) → 对方被迫回 ACK
         ├─ 收到 ACK ──▶ 对端活着, 重置空闲计时器, 继续等 keepidle
         ├─ 无应答 ──▶ 每 keepintvl (75s) 重发, 共 keepcnt (9) 次
         │      └─ 全部失败 ──▶ 连接判定死亡, 应用收到 ETIMEDOUT
         └─ 收到 RST ──▶ 对端已重启/无此连接, 连接立即重置
```

- Linux 默认参数（`sysctl net.ipv4.tcp_keepalive_*`）：

| 参数 | 默认值 | 含义 |
| ---- | ---- | ---- |
| `tcp_keepalive_time` | 7200 s | 空闲多久才开始探测 |
| `tcp_keepalive_intvl` | 75 s | 探测间隔 |
| `tcp_keepalive_probes` | 9 | 放弃前探测次数 |

- 从空闲到判死最坏耗时：`7200 + 9 × 75 ≈ 2小时11分`。各实现默认不同（如 Windows idle 2 h、间隔 1 s、次数 10；参数多为系统级而非每连接）。
- 每连接覆盖参数（无需改全局）：Linux 2.6.37+ `TCP_KEEPIDLE/TCP_KEEPINTVL/TCP_KEEPCNT`，Windows `SIO_KEEPALIVE_VALS`（WSAIoctl）。

## 3. 争议与替代方案

### 对 Keepalive 的经典批评（书中有详细讨论）

1. **占用带宽**：周期性小包（对按流量计费/电池敏感的场景不利）。
2. **占用服务器连接资源**：本可空闲无成本挂着的连接被频繁唤醒。
3. **探测只证明"TCP 栈活着"**，不证明**应用**活着（进程死锁、数据库卡死照样 ACK）。

### 应用层心跳（heartbeat）往往更好

```c
// 应用自带"你还好吗"的协议消息 (如 HTTP Keep-Alive 心跳、MQTT PINGREQ、数据库 SELECT 1)
// 优点: 同时检测进程/业务可用性; 可携带会话级语义; 参数完全可控
```

- **何时用 TCP Keepalive 合适**：无法改动应用协议（如现成程序间的长连接）、只关心对端主机存活（如下载工具的空闲 FTP 数据连接）、想探测中间 NAT/防火墙是否已拆表（探测失败即知连接已废）。
- 现代实践：**应用层心跳为主，keepalive 兜底**；心跳周期应短于路径上 NAT 的映射老化时间（否则"早晨上班连接全断"）。

## 4. Keepalive 与其他"死亡检测"的对比

| 机制 | 谁发现死亡 | 备注 |
| ---- | ---- | ---- |
| **TCP Keepalive** | 内核（空闲时） | 主机级存活；默认 2 h 太钝，需调参 |
| **应用心跳** | 应用 | 能检测业务死锁，最推荐 |
| **RST 探测** | 发数据时立即 | 对端重启后首次发数据会收到 RST |
| **不检测** | 永远 | 半开连接一直挂着 |
| **TCP_USER_TIMEOUT**（现代扩展） | 发送侧 | 限制"数据未被确认"的最长时间，配合重传上限更快报错 |

## 5. 观察

```bash
sysctl net.ipv4.tcp_keepalive_time tcp_keepalive_intvl tcp_keepalive_probes
ss -tanoe     # 第三列 timer: keepalive,xxxF/x.xxF 表示开启了保活计时
```

## 6. 要点回顾

- Keepalive 默认关闭；`SO_KEEPALIVE` 开启，空闲 2 h → 每 75 s 探测 1 次、9 次失败判死（Linux 默认）。
- 探测包序号 = snd.nxt−1，是一个"诱饵字节"，期望 ACK。
- 批评：只证明栈活着、耗带宽；应用层心跳通常更优，keepalive 作兜底。
- 每连接可调参（TCP_KEEPIDLE 等），不必改全局。
