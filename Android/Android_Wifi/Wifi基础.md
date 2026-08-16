### 802.11组件

#### 物理组件

- **WM**（Wireless Medium，无线媒介）：传输无线 MAC 帧数据的物理层。规范最早定义了射频和红外两种物理层，但目前使用最多的是射频物理层。
- **STA**（Station）："A logical entity that is a singly addressable instanceof a MAC and PHY interface to the WM"。STA是指携带无线网络接口卡（即无线网卡）的设备，例如笔记本、智能手机等。另外，无线网卡和有线网卡的MAC地址均分配自同一个地址池以确保其唯一性。
- **AP**（Access Point，接入点）："An entity that contains one STA and provides access to the distribution services，via the WM for associated STAs"。AP本身也是一个STA，只不过它还能为那些已经关联的（associated）STA提供分布式服务（DistributionService，DS）。
- **DS**（Distribution System，分布式系统）："A system used to interconnect a set of **basic service sets（BSSs）**and integrated local area networks（LANs）to create an **extended service set（ESS）**"。DS的定义涉及BSS、ESS等无线网络架构。

#### 无线网络的构建

基本服务集（Basic Service Set，**BSS**）是整个无线网络的基本构建组件（Basic Building Block）。

- **独立型BSS**（Independent BSS  **IBSS**）：这种类型的BSS不需要AP参与。各STA之间可直接交互。这种网络也叫ad-hoc BSS（一般译为自组网络或对等网络）

- **基础结构型BSS**（Infrastructure BSS）：所有STA之间的交互必须经过AP。AP是基础结构型BSS的中控台。这也是家庭或工作中最常见的网络架构。在这种网络中，一个STA必须完成诸如关联、授权等步骤后才能加入某个BSS。注意，一个STA一次只能属于一个BSS。

**ESS** ："A set of one or more interconnected BSSs that appears as a single BSS to the LLC layer at any STA associated with one of those BSSs"。一个ESS包含一或多个BSS。ESS中的BSS拥有相同的**SSID（Service Set Identification）**，并且彼此之间协同工作。一般情况下，ESS的SSID就是其网络名（networkname）。

- **BSSID（BSS Identification）**：每一个BSS都有自己的唯一编号。在基础结构型网络中，BSSID就是AP的MAC地址，该MAC地址是真实的地址。IBSS中，其BSSID也是一个MAC地址，不过这个MAC地址是随机生成的。

- **SSID（Service Set Identification）**：一般而言，BSSID会和一个SSID关联。BSSID是MAC地址，而**SSID就是网络名**。网络名往往是一个可读字符串，因为网络名比MAC地址更方便人们记忆。

### 802.11 Service

- **SS**（Station Service）：它是STA应该具有的功能。
- **DSS**（Distribution System Service）：它指明DS应具有的功能。

#### 数据传输服务

- **Distribution Service**（**DS**，分布式服务）与**Integration Service**（**IS**，整合服务）：STA进行数据传输和整合

- **association**（关联）、**reassociation**（重新关联）、**disassociation**（取消关联）服务 ： **Transition Type**对STA在无线网络中移动的类型分为：
  
  - **No-Transition**：即没有移动。它包括固定不动的情况以及在某个AP无线覆盖范围内移动。
  
  - **BSS-Transition**：即从ESS中的一个BSS切换到另一个BSS。我们希望这种移动不影响网络的使用。
  
  - **ESS-Transition**：从一个ESS中的BSS切换到位于另外一个ESS的BSS。这种情况极有可能导致网络切换，影响用户使用。

   当DS传输数据时，DSS需要知道和哪个AP建立联系。所以，规范要求STA在传输数据前，必须要和一个AP建立关联关系，这就需要使用association服务。关联服务的目的在于为AP和STA建立一种映射关系。
  
   当STA进行transition的时候（如BSS Transition），它就需要使用reassociation服务了。因为之前它和BSS1建立了关联关系，此后它需要和BSS2建立关联关系。这时就可以使用reassociation服务来完成该功能。reassociation服务只能由STA发起。
  
   当STA不需要使用DSS，或者AP不再为某个STA服务时，就需要调用disassociation服务。
  
- 访问控制和数据机密性（Access Control and Data Confidentiality）服务：包括三个服务，主要解决无线网络中安全防护相关的工作。
  
  - **Authentication**和**Deauthentication**：这两个服务用于Access Control，身份验证以及解除身份验证。
  - **Confidentiality**：私密性（privacy）服务，后来对这部分内容实施了加强。目前规范中提到的数据加密方法有WEP、TKIP、CCMP。
  
- 频谱管理服务：包括TPC（Transmit Power Control，传输功率控制）服务和DFS（Dynamic Frequency Selection，动态频率选择）服务。

- QoS和时间同步服务

- 无线电测量（Radio Measurement）服务

### 802.11 MAC帧

MAC 帧由 **MAC Header**（帧头）、**Frame Body**（帧体）和 **FCS**（校验）三部分组成：

<img src="./android/images/802.11_mac.png"  style="zoom:100%;" />

| 字段 | 长度 | 说明 |
| --- | --- | --- |
| Frame Control | 2 字节 | 帧控制：协议版本、类型/子类型、ToDS/FromDS 等标志位 |
| Duration/ID | 2 字节 | 多数帧中为持续时间（微秒），供其他站点做虚拟载波侦听（NAV） |
| Address1~4 | 各 6 字节 | 四个地址字段，含义随帧类型与 ToDS/FromDS 变化（见下表） |
| Sequence Control | 2 字节 | 序列号（12bit）+ 分片号（4bit），用于去重与分片重组 |
| QoS Control | 2 字节 | 仅 QoS 数据帧有，携带优先级等 |
| Frame Body | 0~2312 字节 | 帧体：管理帧的信息元素（SSID、速率、RSN 等）或数据帧的 LLC 报文 |
| FCS | 4 字节 | CRC-32 校验 |

Frame Control 中的关键标志位：

- **Type / Subtype**：帧类型与子类型；
- **ToDS / FromDS**：标志帧的去向（去往/来自分布式系统），决定地址字段的含义；
- **More Fragments**：还有后续分片；
- **Retry**：该帧是重传帧；
- **More Data**：AP 缓存中还有发给省电 STA 的数据；
- **Protected Frame**：帧体已加密（WEP / TKIP / CCMP / GCMP）。

#### 三类帧

| 类型 | 说明 | 常见子类型 |
| --- | --- | --- |
| 管理帧（Management） | 负责链路的建立与维护 | Beacon、Probe Request / Response、Authentication / Deauthentication、Association Request / Response、Disassociation、Action |
| 控制帧（Control） | 配合数据帧收发 | RTS、CTS、ACK、PS-Poll、Block ACK |
| 数据帧（Data） | 承载上层报文 | Data、QoS Data、Null Function（无数据的空帧，用于省电轮询） |

几个常用帧的典型场景：

- **Beacon**：AP 周期性广播（默认 100ms 一次），携带 SSID、支持的速率、信道、安全能力（RSN IE）、TIM（通知处于省电模式的 STA 来取缓存数据）——被动扫描监听的就是它；
- **Probe Request / Response**：STA 主动扫描时发出，内容与 Beacon 类似；
- **Authentication / Association**：接入的两步曲——先认证、再关联。

#### 四个地址字段的含义

Addr1 总是接收方（RA），Addr2 总是发送方（TA）：

| ToDS | FromDS | Addr1（RA） | Addr2（TA） | Addr3 | Addr4 | 场景 |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | 0 | DA（常为 BSSID） | SA | BSSID | 不用 | IBSS（Ad-hoc）内直接通信 |
| 0 | 1 | DA（接收 STA） | BSSID（AP） | SA | 不用 | AP → STA（下行） |
| 1 | 0 | BSSID（AP） | SA（发送 STA） | DA | 不用 | STA → AP（上行） |
| 1 | 1 | RA | TA | DA | SA | WDS 无线桥接 |

上行帧中 BSSID 位于 Addr1、下行帧中位于 Addr2，第三个地址则放真正的源/目的——这就是 802.11 用多个地址字段实现"经 AP 转发"的方式。

### CSMA/CA：无线介质访问控制

无线网络没有沿用有线的 CSMA/CD，原因有二：

- 无线网卡要同时收发（全双工）成本高，冲突难以在发送时检测；
- **隐藏节点**（Hidden Node）：STA A、C 都能与 AP 通信，但彼此互相听不到；两者同时发送时冲突发生在 AP 处，发送方却检测不到。

因此 802.11 采用 **CSMA/CA**（冲突避免）：

1. 发送前先**载波侦听**：物理载波侦听（检测信道能量）+ 虚拟载波侦听（NAV——其他帧的 Duration 字段通告的信道占用时长）；
2. 信道需空闲满 DIFS 才能发送；若信道忙，进入**随机退避**（Backoff）：从竞争窗口 CW 中取随机数，每过一个时隙递减，减到 0 才发送；冲突后 CW 翻倍（指数退避），降低再次冲突概率；
3. 单播帧发送后等待 **ACK**，超时未收到则置 Retry 位重传。

帧间间隔（IFS）决定发送优先级，间隔越短优先级越高：

| 间隔 | 用途 |
| --- | --- |
| SIFS | 最短，用于已获得介质控制权的帧：ACK、CTS、分片续帧 |
| PIFS | AP 发送 Beacon 等管理帧 |
| DIFS | 普通异步数据帧发送前要求的最小空闲时间 |

针对隐藏节点可开启 **RTS/CTS**：发送方先发 RTS，AP 回 CTS，两者都携带 Duration，周围站点听到任意一个都会设置 NAV 让出信道——这样即使"听不到对方"（隐藏节点）也能互相避让。

### 扫描与接入流程

STA 加入一个基础结构型 BSS 的完整过程：

1. **扫描**：发现周围的 BSS——
   - 被动扫描：逐信道监听 Beacon；
   - 主动扫描：逐信道广播 Probe Request，等待 AP 的 Probe Response；
2. **认证**（Authentication）：与选定的 AP 完成身份认证（早期的 Open System / Shared Key 已被淘汰，现在由 WPA2/WPA3 的机制承担）；
3. **关联**（Association）：交换双方能力（速率、QoS 等），获得 AID，此后才能经 AP 收发数据；
4. **密钥协商**：WPA2-PSK 为四次握手（EAPOL-Key 帧）派生 PTK / GTK（代码级走读见 [wpa_supplicant](./Android/Android_Wifi/wpa_supplicant.md)）；
5. **DHCP 与数据通信**：拿到 IP 后由系统完成网络配置与路由（见 [netd](./Android/Android_Wifi/netd.md)）。

### 相关笔记

- [WIFI信道](./Android/Android_Wifi/WIFI信道.md)：2.4G / 5G 频段与信道划分
- [wpa_supplicant](./Android/Android_Wifi/wpa_supplicant.md)：扫描、关联与四次握手的实现
- [netd](./Android/Android_Wifi/netd.md)：连接成功后的网络配置、路由与 DNS