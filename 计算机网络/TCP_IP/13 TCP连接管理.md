> 三次握手、连接关闭、TIME_WAIT、RST、同时打开/关闭、端口扫描。

## 1. 连接建立：三次握手（Three-Way Handshake）

```
客户端                                服务器 (LISTEN)
  │ ── SYN, seq=x ─────────────────▶│  (服务器 → SYN_RCVD)
  │ ◀── SYN+ACK, seq=y, ack=x+1 ────│
  │ ── ACK, ack=y+1 ──────────────▶ │  (双方 → ESTABLISHED)
```

1. **SYN**：客户端发连接请求，携带 ISN=c 与选项（MSS、WS、SACK-permitted、TS）。
2. **SYN+ACK**：服务器确认并同步自己的 ISN=s，回显确认的选项。
3. **ACK**：客户端最终确认。双方各自拿到对方的 ISN 与协商参数。

- **为什么三次**：双向各自确认"我发你能收"；两次无法让服务端确认其发送方向通（也无法防历史重复 SYN 建立幽灵连接）。
- **选项只在 SYN/SYN+ACK 中协商**，其后数据段不再带（MSS/WSCALE/TSopt 例外规则：TS 数据段也带）。
- 握手第三个 ACK 可以与首个数据段合并（piggyback）。

tcpdump 视角（`[S]`=SYN、`[S.]`=SYN+ACK、`[.]`=ACK）：

```bash
$ tcpdump -n 'host 93.184.216.34 and tcp port 443'
10.0.0.5.52314 > 93.184.216.34.443: Flags [S],  seq 2887924705, win 64240, options [mss 1460,wscale 8,...]
93.184.216.34.443 > 10.0.0.5.52314: Flags [S.], seq 1415883061, ack 2887924706, win 65535
10.0.0.5.52314 > 93.184.216.34.443: Flags [.],  ack 1415883062, win 2058
```

### SYN 交换中的序号消耗

- SYN 占 1 个序号：客户端首字节序号 = ISN_c + 1；同理 FIN。ACK 段本身不占序号。

## 2. 连接关闭

### 正常四次关闭

```
主动关闭方                              被动关闭方
  │ ── FIN, seq=u ──────────────▶│  (→ CLOSE_WAIT)
  │ ◀── ACK, ack=u+1 ────────────│
  │        (主动方 → FIN_WAIT_2, 半关闭: 仍可收)
  │ ◀── FIN, seq=w ──────────────│  (→ LAST_ACK)
  │ ── ACK, ack=w+1 ────────────▶│  (→ CLOSED)
  │ (主动方 → TIME_WAIT, 等 2MSL 后 CLOSED)
```

- **半关闭（half-close）**：一方发 FIN 只关闭**它的发送方向**，仍可接收对端数据（`shutdown(fd, SHUT_WR)`；`close()` 则双向关闭）。
- FIN 占 1 个序号；为简化，若无数据半关闭交换也常表现为三次（FIN/ACK 合并）。

### TIME_WAIT（2MSL）

主动关闭方在发出最后 ACK 后停留 **2 × MSL**（MSL 常取 30–120 s，故 TIME_WAIT 通常 60 s～4 min，Linux 默认 60 s）：

1. **可靠终止**：最后的 ACK 若丢失，对方重发 FIN，本端可重答；若直接 CLOSED，对端将收到 RST 而异常。
2. **让旧连接的重复报文在网络中消亡**，防止旧四元组的新连接收到上一代的数据。

- TIME_WAIT 数量过大是高并发服务器（短连接）的经典问题：
  - 缓解：用长连接/连接池、`tcp_tw_reuse`（客户端侧，配合时间戳安全复用）、扩大端口范围；
  - **不要**开 `tcp_tw_recycle`（NAT 下误杀，Linux 4.12 已移除）。

### 同时打开（Simultaneous Open）

双方同时向对方发 SYN（如端口对端口的服务发现）：两端都经历 SYN_SENT → SYN_RCVD → ESTABLISHED，握手交换 4 个段（SYN/SYN+ACK 各两次）——打开的是**一条**连接，不常见但合法。

### 同时关闭（Simultaneous Close）

双方同时发 FIN：各自 FIN_WAIT_1 → **CLOSING**（收到对方 FIN 而非 ACK）→ TIME_WAIT → CLOSED。

## 3. RST（Reset，重置）

收到 RST 表示"本连接不存在/必须终止"，**不确认、不排队、立即关闭**。

### 产生 RST 的典型场景

| 场景 | 说明 |
| ---- | ---- |
| **端口未监听** | 连接请求到达无服务端口 → SYN 收到 RST（connect 立即失败，与"超时"区分） |
| **中止连接** | 应用设置 SO_LINGER l_onoff=1, l_linger=0 后 close() → RST 丢弃未发数据 |
| **半开连接对端已崩溃重启** | 发数据收到 RST（对端无此连接状态） |
| **空闲连接被中间设备清表** | NAT/防火墙老化映射，后续包触发 RST |
| 向处于 TIME_WAIT 的旧四元组发 SYN（序号不符） | 对端回 RST |

- RST 段的 seq 通常等于被"指控"的 ACK 号；收到 RST 的应用看到 `ECONNRESET`。

## 4. SYN flood 与防御

- **攻击**：海量伪造源地址的 SYN 使服务器 SYN_RCVD 队列（backlog）塞满，真客户端无法完成握手（经典 DoS）。
- **防御**：
  - **SYN Cookies**：不为半连接保存状态，把连接信息编码进 SYN+ACK 的 ISN；客户端以合法 ACK"证明"，服务端解码恢复连接 → 无状态抗 flood。
  - 加大 backlog + 半连接队列（临时缓解）；入口过滤伪造源（BCP 38）。
- 相关参数：Linux `tcp_syncookies`（默认 1）、`tcp_max_syn_backlog`。

## 5. TCP 端口扫描（Port Scanning）

利用 TCP 对探测的不同响应判断端口状态：

| 扫描 | 方法 | 开放端口 | 关闭端口 |
| ---- | ---- | ---- | ---- |
| **Connect 扫描** | 完成`完整三次握手后关闭 | 建连成功 | 收 RST |
| **SYN（半开）扫描** | 发 SYN，收到 SYN+ACK 后回 RST 不完成握手 | SYN+ACK | RST |
| **FIN / NULL / Xmas 扫描** | 发 FIN / 无标志 / FIN+PSH+URG | **无响应**（静默丢弃） | RST |
| **ACK 扫描** | 发 ACK 探测 | RST（TTL/窗口特征可区分有无过滤） | RST |
| **Idle 扫描** | 借第三方僵尸主机的 IPID 变化判断 | IPID +2 | IPID +1 |

- SYN 扫描快且不留完整连接记录；FIN/NULL/Xmas 可绕过某些老式无状态防火墙（只拦 SYN）；ACK 扫描用于绘制**防火墙**（filtered vs unfiltered）而非端口开关。
- 工具：`nmap -sS target`、`nmap -sF/-sN/-sX`、`nmap -sA`。

## 6. 与连接相关的超时

- **connect 超时**：SYN 无应答时重发 SYN（间隔指数退避），Linux 默认 `tcp_syn_retries=6`（≈ 总 60~120 s）后放弃（ETIMEDOUT）。
- **FIN_WAIT_2 半关闭等待**：对端迟迟不 FIN，Linux 由 `tcp_fin_timeout`（默认 60 s）回收孤儿连接。
- **握手最后的 ACK 丢失**：服务器重发 SYN+ACK（`tcp_synack_retries`），仍无 ACK 则释放半连接。

## 7. 状态机与排错速查

```bash
ss -tan state syn-recv          # 半连接(SYN_RCVD) —— SYN flood 观测
ss -tan state time-wait | wc -l # TIME_WAIT 数量
ss -tan state established       # 活跃连接
```

| 现象 | 常见原因 |
| ---- | ---- |
| 大量 SYN_RCVD | SYN flood（或 backlog 太小） |
| 大量 CLOSE_WAIT | 应用未调用 close（代码泄漏），先查业务层 |
| 大量 TIME_WAIT | 短连接高频创建（主动关闭方残留），改长连接 |
| connect 立即 RST | 端口未监听/被防火墙 reset |
| connect 超时 | 中间丢包或被静默 drop（filtered） |

## 8. 要点回顾

- 三次握手同步双向 ISN 并协商选项；握手完成才 ESTABLISHED。
- 关闭是四次交换；主动方进 TIME_WAIT（2MSL），两大目的：终结可靠 + 消亡旧报文。
- 半关闭只关发送方向；同时打开/关闭产生 SYN_RCVD/CLOSING 等罕见状态。
- RST = 端口不通/异常中止/状态失配；SYN flood 用 SYN Cookies 防御。
- 扫描利用"开放静默、关闭回 RST"等差异行为（SYN/FIN/ACK 扫描各有用途）。
