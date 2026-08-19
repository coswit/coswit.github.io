> 各层的安全威胁与对策：链路接入认证（EAP）、网络层（IPsec）、运输层（TLS）、DNS 安全（DNSSEC）、邮件签名（DKIM）。

## 1. 威胁模型（回顾第 1、7 章的攻击）

针对网络与协议的常见攻击决定了安全机制的位置：

| 威胁 | 含义 | 对策层次 |
| ---- | ---- | ---- |
| 窃听（sniffing） | 读取明文流量 | 加密（IPsec/TLS） |
| 篡改（modification） | 改写报文 | 完整性校验（MAC/签名） |
| 伪装（spoofing） | 冒充他人 | 身份认证（证书/密钥） |
| 重放（replay） | 录制重发旧报文 | 序号/时间戳/nonce |
| 注入（injection） | 伪造报文混入流 | 连接级校验（TCP 序号、AUTH） |
| 拦截（MITM） | 中间人冒充双方 | 端点认证（PKI） |
| DoS | 拒绝服务 | 无法根除，只能缓解 |

**加密通信的基本属性**：机密性（加密）、完整性（MAC）、认证（谁发的）。二者常合称机密性+完整性与认证。

## 2. EAP（Extensible Authentication Protocol，RFC 3748）

- **认证框架**（不规定具体算法），运行在链路层接入点：802.11 Wi-Fi（WPA/WPA2-Enterprise）、802.3 有线准入、VPN 拨入。
- **802.1X（EAPOL）** 架构三角色：

```
[申请者 Supplicant]──EAPOL(链路层)──[认证者 Authenticator]
   (客户端)                          (AP/交换机)
                                          │ RADIUS/Diameter(IP)
                                   [认证服务器 AS]
                                    (验证凭证, 决定放行)
```

- 典型流程：认证者要求身份 → 申请者发 Identity → AS 依所选方法多轮问答（如 TLS 证书交换）→ Success/Failure → 衍生会话密钥用于后续无线加密。
- **常见 EAP 方法**：

| 方法 | 特点 |
| ---- | ---- |
| EAP-MD5 | 仅口令挑战，无密钥衍生、无服务器认证——不安全，勿用 |
| **EAP-TLS** | 双向证书认证，最安全；要求客户端也有证书 |
| **EAP-TTLS / PEAP** | 先建服务器侧 TLS 隧道，再在内层用口令（PAP/CHAP/MSCHAPv2）认证客户端——部署最广 |
| EAP-FAST / SIM / AKA | Cisco 私有 / 手机 SIM 卡 / 3GPP AKA |

## 3. IPsec（IP 层安全，RFC 4301 体系）

为 IP 报文提供认证与加密，对上层完全透明。两大协议：

| 协议 | 提供服务 | IP 协议号 | NAT 兼容 |
| ---- | ---- | ---- | ---- |
| **AH（Authentication Header）** | 完整性 + 认证 + 抗重放（覆盖 IP 头不变字段） | 51 | ✘（NAT 改头破坏校验） |
| **ESP（Encapsulating Security Payload）** | 加密 + 完整性 + 认证 + 抗重放 | 50 | ✔（配 NAT-T） |

### 两种模式

```
传输模式 (Transport, 主机到主机):
[原IP头][ESP头][TCP ...]           → 原IP头不动, 保护载荷

隧道模式 (Tunnel, 网关到网关/VPN):
[新IP头][ESP头][原IP头][TCP ...]   → 整个原包被保护, 常用于 site-to-site VPN
```

### SA（Security Association）

- 一条单向（单方向！）的"安全通道"，由三元组唯一标识：**{SPI, 目的 IP, 协议(AH/ESP)}**。
- 两台主机双向通信至少 2 个 SA（每方向一个）；双向多服务（AH+ESP）则更多。
- **SAD（SA 数据库）**：每 SA 的密钥、算法、序列号、生存期；**SPD（安全策略数据库）**：定义"哪些流量套哪条策略"（进/出各一）。

### 密钥协商：IKE（Internet Key Exchange）

- 手工静态密钥只适合小规模；动态协商用 **IKE（IKEv2，RFC 7296）**：
  1. `IKE_SA_INIT`：协商 IKE 自身的安全参数（DH 交换，建立加密控制信道）；
  2. `IKE_AUTH`：互相认证（证书/预共享密钥/EAP），建立第一对 **Child SA（IPsec SA）**；
  3. CREATE_CHILD_SA 按需建立更多 SA、重协商。
- **MOBIKE**（RFC 4555）支持 IP 地址变化不断流（移动 VPN 场景）。
- **NAT-T（NAT 穿越国，RFC 3947/3948）**：探测路径有无 NAT，把 ESP 整体封装进 UDP 4500 端口。

## 4. TLS（Transport Layer Security，运输层安全）

前身为 SSL，为 TCP 之上的应用（HTTPS、SMTPS…）提供加密与认证（RFC 5246 TLS 1.2 等）。**SSL/TLS 各版本漏洞（SSLv2/v3、POODLE、BEAST、CRIME）使旧版本已被禁用。**

### 分层结构

```
┌─────────────────────────────┐
│  握手协议 / 告警 / 密码变更   │  ← 协商参数、验证证书
├─────────────────────────────┤
│  记录协议 (Record)           │  ← 分块、加密、MAC
├─────────────────────────────┤
│  TCP                        │
└─────────────────────────────┘
```

### 典型握手（TLS 1.2，RSA 密钥交换为例）

```
客户端                                     服务器
  │── ClientHello (随机数, 支持的套件) ──▶│
  │◀─ ServerHello (选定套件, 随机数)      │
  │◀─ Certificate (服务器证书链)          │
  │◀─ ServerHelloDone                    │
  │── ClientKeyExchange (预主密钥) ─────▶│   双方由 3 个随机数导出会话密钥
  │── ChangeCipherSpec, Finished ──────▶ │
  │◀─ ChangeCipherSpec, Finished ────────│   之后全部记录加密传输
```

- **证书验证链**：服务器证书 → 中间 CA → **根 CA（信任锚，预装于 OS/浏览器）**；校验域名匹配、有效期、吊销状态（CRL/OCSP）。
- **密码套件（cipher suite）**形如 `TLS_RSA_WITH_AES_128_CBC_SHA`：密钥交换 + 加密 + MAC 算法三元组合。
- **会话恢复**：Session ID / **Session Ticket**（服务器加密的状态票据）→ 短握手重用主密钥。
- **DTLS**：TLS over UDP（RFC 6347），用于实时类应用。
- **TLS 1.3**（RFC 8442，2018，成书后）：握手 1-RTT（恢复 0-RTT）、强制前向保密（ECDHE）、砍掉 RSA 密钥交换与大量旧算法。
- 已知攻击与对策：重协商漏洞（RFC 5746 安全重协商）、压缩侧信道（CRIME→禁压缩）、降级攻击（TLS_FALLBACK_SCSV / 1.3 的 Downgrade Protection）。

```bash
openssl s_client -connect example.com:443 </dev/null   # 观察证书链与协商出的套件
```

## 5. DNSSEC（DNS Security Extensions）

- 目标：让解析器**验证** DNS 应答确实来自权威且未被篡改——防缓存投毒与 MITM（见第 11 章）。**不提供机密性、不做加密**（那靠 DoT/DoH）。
- 机制：对区域**签名**，RRset 附 **RRSIG**（签名）；新记录类型：

| 记录 | 作用 |
| ---- | ---- |
| **DNSKEY** | 区域公钥（**ZSK** 区签名钥签名普通记录；**KSK** 密钥签名钥签名 ZSK/DNSKEY 集） |
| **RRSIG** | 对某 RRset 的数字签名（含签名有效期） |
| **DS** | 放在**父区域**的"委托签名者"记录——KSK 的摘要，构成**信任链**：根→TLD→example.com |
| **NSEC / NSEC3** | 对"不存在"的签名证明（可被用于枚举区域，NSEC3 加哈希缓解） |

- 根的信任锚（根 KSK 公钥）预置于验证解析器；验证失败（Bogus）则向客户端回 SERVFAIL。
- 部署链：根（2010 签名）→ TLD → 各域逐步铺开；一旦父区有 DS，子区不签名即"不可解析"。

## 6. DKIM（DomainKeys Identified Mail）

- 邮件**发送域签名**：邮件服务器用私钥对邮件（头 + 体）签名，收件方通过 DNS 查询公钥验签——确认"邮件确实来自该域且途中未篡改"。

```
1. 发方 MTA 计算 RSA/EdDSA 签名, 写入邮件头:
   DKIM-Signature: d=example.com; s=sel1; v=1; h=From,Subject,...; b=...
2. 收方按 <s>._domainkey.<d> 查 DNS TXT 得公钥:
   sel1._domainkey.example.com TXT "v=DKIM1; k=rsa; p=<公钥>"
3. 验签通过 → 可信来自 example.com (配合 SPF/DMARC 判定处置)
```

- 防的是**发件人假冒**与**中途篡改**（配合 SPF、DMARC 构成现代邮件反伪造三件套；DMARC 依赖二者并给出策略与报表）。
- 私钥保管在发件 MTA（可选择性签名），签名含 `h=` 列出的头字段与正文哈希。

## 7. 各层安全方案对比

| 层 | 方案 | 保护对象 | 优点 | 缺点 |
| ---- | ---- | ---- | ---- | ---- |
| 链路 | EAP/802.1X | 接入准入 | 防未授权接入 | 不跨网 |
| 网络 | IPsec | 一切 IP 流量 | 透明、可站点间 VPN | 配置复杂、NAT 需穿越、每端需部署 |
| 运输 | TLS | 单条 TCP 流 | PKI 成熟、防火墙友好、应用可控粒度 | 每应用各自实现 |
| 应用 | DNSSEC / DKIM | DNS 数据 / 邮件来源 | 定向解决投毒与假冒 | 不加密、部署率 |

## 8. 要点回顾

- EAP 是认证框架，802.1X 三角色（Supplicant/Authenticator/AS），EAP-TLS 最强、PEAP/TTLS 最常见。
- IPsec：AH（仅认证）/ESP（加密+认证），传输/隧道两模式，SA 单向、由 {SPI, dst, 协议} 标识，IKEv2 协商，NAT-T 用 UDP 4500。
- TLS：握手协商密钥并验证书，记录层加密+MAC；会话恢复省 RTT；TLS 1.3 强制前向保密。
- DNSSEC 用 RRSIG/DNSKEY/DS/NSEC 构建根向下的信任链，验证"真且未被改"，不保密。
- DKIM：域私钥签邮件、DNS TXT 发公钥、收方验签，与 SPF/DMARC 配套反假冒。
