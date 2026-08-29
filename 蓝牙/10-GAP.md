## 1. GAP:设备如何被发现与连接

**GAP(Generic Access Profile, 通用访问规范)** 处在协议栈最顶层的"通用流程"位置,规定 BLE 设备**广播什么、怎么被发现、怎么建立连接、用什么安全模式**——一句话,GAP 管的是"从陌生到熟络"的全过程,连接建立之后就交棒给 GATT。

### 1.1 四种角色

| 角色 | 对端 | 典型设备 | 使用的 LL 状态 |
| ---- | ---- | -------- | -------------- |
| Broadcaster(广播者) | Observer | 温度信标、iBeacon | Advertising |
| Observer(观察者) | Broadcaster | 手机扫码 App | Scanning |
| Peripheral(外围) | Central | 手环、传感器 | Advertising → Connected |
| Central(中心) | Peripheral | 手机、网关 | Scanning + Initiating → Connected |

角色可叠加:手机可以同时是 Central(连着手环)与 Broadcaster(做快速配对广播)。

## 2. 广播数据格式(AD Structure)

广播/扫描响应载荷是**一串 TLV 结构**:

```text
| Len 1B | Type 1B | Data (Len-1)B | Len 1B | Type 1B | ... |
```

常用 AD Type(SIG 分配):

| Type | 名称 | 说明 |
| ---- | ---- | ---- |
| 0x01 | Flags | LE 通用发现/BR/EDR 不支持等标志 |
| 0x02 / 0x03 | Incomplete/Complete 16-bit UUID 列表 | 暴露携带的服务 |
| 0x06 / 0x07 | 32-bit UUID 列表 | 少用 |
| 0x08 / 0x09 | Shortened/Complete Local Name | 设备名 |
| 0x0A | Tx Power Level | 发射功率 |
| 0x16 | Service Data | 服务附带数据(iBeacon/快连依赖) |
| 0x19 | Appearance | 外观图标码(手表/心率带…) |
| 0x1B | LE Bluetooth Device Address | 带地址类型 |
| 0x21 | Advertising Interval | 5.0 起扩展/周期广播用 |
| 0xFF | Manufacturer Specific Data | 厂商自定义,私有协议主战场 |

传统广播 31 字节限制下,Service Data + Manufacturer Data 就是全部自定义空间;5.0 扩展广播把上限大幅抬高(链式组包)。

**iBeacon 的例子**:Manufacturer Data(0xFF)里放 Apple 厂商 ID(0x004E)+ UUID/Major/Minor/TxPower——Eddystone(Google)同理用 0x16 Service Data。广播协议的"应用层"基本都寄生在这两个 AD Type 上。

**AD 结构与平台过滤的对应**:各平台扫描 API 的过滤条件,本质就是拿 AD Type 与内容做匹配——写过滤器等于在脑子里拼广播包:

| 平台 API | 匹配内容 | 对应 AD Type |
| -------- | -------- | ------------ |
| Android `ScanFilter.setServiceUuid()` | 服务 UUID | 0x02 / 0x03 / 0x06 / 0x07 |
| Android `ScanFilter.setManufacturerData()` | 厂商 ID + 载荷前缀 | 0xFF |
| Android `ScanFilter.setServiceData()` | 服务 UUID + 数据前缀 | 0x16 |
| Android `ScanFilter.setDeviceName()` | 设备名 | 0x08 / 0x09 |
| iOS `scanForPeripherals(withServices:)` | 服务 UUID | 0x02 / 0x03 |

由此得出两个工程事实:过滤条件与对方广播/扫描响应里实际携带的 AD 结构对不上,就永远扫不到;iOS **后台扫描强制要求**带服务 UUID 的过滤——所以"想在 iOS 后台被发现"的设备,必须把主服务 UUID 放进广播本体(而不是只放 SCAN_RSP)。

## 3. 可发现性与可连接性(Modes & Procedures)

GAP 用"模式(Mode,被动属性)+ 流程(Procedure,主动动作)"成对描述行为:

| 能力 | 模式 | 说明 |
| ---- | ---- | ---- |
| 可发现性 | Non-Discoverable / Limited / General Discoverable | 广播里 Flags 位决定;Limited 仅限时窗口内可发现 |
| 可连接性 | Non-Connectable / Connectable | 广播类型 ADV_IND vs ADV_NONCONN_IND |
| 广播 | Broadcast 模式 + Observation 流程 | 单向数据 |
| 绑定 | Bondable 模式 + Bonding 流程 | 配对后存密钥 |

**定向广播(Directed Advertising)**:ADV_DIRECT_IND 直接携带对端地址,只有那个地址的设备能连——重连场景专属。高占空定向(3.75 ms 间隔,最多 1.28 s)用于"一摸就连"的体验;低占空定向可长期低功耗地等待主人回来。

## 4. 连接流程与 GAP 服务

GAP 规定的连接建立流程:Observer 扫描 → 选中目标 → Initiating → CONNECT_IND → 连接建立。连接后:

- **GAP 服务(UUID 0x1800)** 暴露设备身份:

| 特征 | UUID | 内容 |
| ---- | ---- | ---- |
| Device Name | 0x2A00 | 设备名 |
| Appearance | 0x2A01 | 图标类别码 |
| Peripheral Preferred Connection Parameters, PPCP | 0x2A04 | 外设期望的连接参数(interval/latency/timeout) |
| Central Address Resolution Support | 0x2AA6 | 支持用 RPA 定向广播的声明 |

- **重连加速**:Bonding 记录对端身份地址与 IRK;Peripheral 用定向广播喊话,或 Central 白名单直连(`LE Create Connection` + White List)。

## 5. 隐私与地址策略(GAP 视角)

GAP 把地址类型(公有/随机静态/不可解析私有/可解析私有 RPA)与发现流程串起来:

- **隐私关闭**:静态地址,可被长期追踪;
- **隐私开启**:RPA 定时轮换(典型 15 min),配合定向广播"点名"老朋友;新朋友通过正常配对交换 IRK;
- 定向广播里的目标地址若是 RPA,要求 Central 支持 Address Resolution(0x2AA6 声明)。

## 6. 安全模式与等级

GAP 定义两级安全模式(SM1/SM2,各含 Level 1-3),简化记法:

| 等级 | 要求 |
| ---- | ---- |
| Mode 1 Level 1 | 无加密无认证(明文) |
| Mode 1 Level 2 | 未认证的加密(Just Works 配对) |
| Mode 1 Level 3 | 经认证的加密(带 MITM 防护的配对) |
| Mode 1 Level 4 | LE Secure Connections 的认证加密(128-bit ECDH) |
| Mode 2 Level 1/2 | 数据签名(未经认证/经认证) |

服务可以按特征声明各自所需等级——访问时先满足等级,不满足触发配对/加密。

## 7. 广播工程实践清单

- **想被 iOS 后台发现**:广播里带 0x02/0x03 服务 UUID 或 Service Data;iOS 对 Flags 与 ADV_NONCONN 有严格预期;
- **想快连**:定向广播 + 白名单 + Service Data(GATT Service Changed 0x2A05 的 CCCD 记得持久化);
- **想省电**:拉长广播间隔(1-2 s),用 Service Data 携带完整语义让 Observer 不必发 SCAN_REQ;
- **想隐蔽**:关 Flags 中的 BR/EDR 位、用 RPA、缩短广播窗口;
- **名字放不下**:Local Name 放 SCAN_RSP(主动扫描才拿得到),广播里放最关键的 Service Data。

## 8. 小结

GAP 是 BLE 的"社交礼仪":**角色、广播内容编码、可发现/可连接模式、连接与重连流程、地址隐私、安全等级声明**。它与 GATT 分工清晰——GAP 负责"搭上线",GATT 负责"聊内容";而广播与 GATT 这两样基础设施,也正是蓝牙 Mesh 组网大厦的砖石。
