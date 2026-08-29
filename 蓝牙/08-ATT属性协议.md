## 1. 属性(Attribute):BLE 数据模型的最小单元

**ATT(Attribute Protocol, 属性协议)** 定义了 BLE 唯一的数据模型。一个**属性**由四元组构成:

| 组成 | 说明 |
| ---- | ---- |
| Attribute Handle(句柄) | 16 位,属性表的"行号",0x0001-0xFFFF,全表单调递增(允许留空隙,服务器重启或固件升级后可能改变) |
| Attribute Type(类型) | UUID,16 位(SIG 分配)或 128 位(自定义) |
| Attribute Value(值) | 0-512 字节,语义由类型决定 |
| Attribute Permissions(权限) | 服务器自定:Read/Write 组合 + 是否需要认证 Authentication、授权 Authorization、加密 |

要点:

- **权限不上空口**:权限只存在于服务器本地,客户端违规访问只会收到 Error Response——安全由服务器把守,不靠协议声明;
- **服务器与客户端(Server / Client)**:持有属性表的一方是服务器(通常是外围传感器),访问方是客户端(通常是手机)。**这与 Central/Peripheral 无关**——手机也能当 GATT 服务器,手环也可能当客户端(如反向控制)。

## 2. PDU 分类与操作全集

ATT PDU 走 L2CAP 固定信道 CID 0x0004,格式:`Opcode 1B + ...`。Opcode 最高两位区分语义:

| 类别 | 特点 | 例子 |
| ---- | ---- | ---- |
| Request(请求) | 需 Response,**同时只能有一个未完成事务** | Read Request |
| Response(响应) | 回复 Request,含错误则回 Error | Read Response |
| Command(命令) | 无响应 | Write Command、Notification |
| Notification(通知) | 服务器主动推,不需确认,快但可能丢 | Handle Value Notification |
| Indication(指示)+ Confirmation | 服务器主动推,客户端必须回 Confirmation,可靠但慢 | Handle Value Indication |

操作全集(Opcode 括注):

| 操作 | 请求 | 响应 | 用途 |
| ---- | ---- | ---- | ---- |
| Exchange MTU | 0x02 | 0x03 | 协商更大的 ATT MTU,默认 23 |
| Find Information | 0x04 | 0x05 | 枚举句柄→类型,用于发现描述符 |
| Find By Type Value | 0x06 | 0x07 | 按类型+值查句柄(发现指定服务) |
| Read By Type | 0x08 | 0x09 | 按类型批量读(发现特征的关键操作) |
| Read | 0x0A | 0x0B | 读单个句柄 |
| Read Blob | 0x0C | 0x0D | 分段读长值(带 offset) |
| Read Multiple | 0x0E | 0x0F | 一次读多个句柄 |
| Read By Group Type | 0x10 | 0x11 | 按组类型读(发现服务的关键操作) |
| Write Request | 0x12 | 0x13 | 写 + 需响应 |
| Write Command | 0x52 | - | 写 + 无响应,快,可能丢 |
| Signed Write Command | 0xD2 | - | 带 CSRK 签名的写 |
| Prepare Write / Execute Write | 0x16/0x17 / 0x18/0x19 | | 长写(Prepare 阶段缓存,Execute 一次生效) |
| Handle Value Notification | 0x1B | - | 服务器推送 |
| Handle Value Indication | 0x1D | 0x1E Confirmation | 服务器可靠推送 |
| Error Response | - | 0x01 | 错误码表见下 |

常见错误码:

| 错误码 | 含义 |
| ------ | ---- |
| 0x01 | Invalid Handle(句柄不存在) |
| 0x02 / 0x03 | Read / Write Not Permitted(权限不允许) |
| 0x05 | Insufficient Authentication(未配对/认证等级不够) |
| 0x07 | Invalid Offset(读长值偏移越界) |
| 0x0A / 0x0B | Attribute Not Found / Attribute Not Long |
| 0x0F | Insufficient Encryption(连接未加密) |
| 0x12 | Insufficient Resources(资源不足,如队列满) |

**排障时错误码基本能直接指到原因**。

## 3. MTU 与事务

- **ATT MTU 默认 23 字节**(1 字节 Opcode + 20 字节载荷),iOS 常用 185,Android 由客户端 `requestMtu` 发起协商,常见 247;
- 通知与写命令的**单包载荷上限 = MTU - 3**;
- **事务(Transaction)**:Request 发出后必须等 Response 才能发下一个 Request(串行);Notification/Command 不受此限,可以穿插;
- **队列(Queued Writes)**:Prepare/Execute 的意义是"攒一批改动要么全生效要么全不生效"——服务器实现为暂存队列,Execute 时统一提交,同时也是值长度超过单包时的"可靠长写"手段(与 Read Blob/分段相对)。

## 4. 事务串行的实现后果

"同时只能有一个未完成的 Request"不只是协议洁癖,它直接塑造了上层框架与应用层的写法:

- **框架必须排队**:Android `BluetoothGatt` 与 iOS Core Bluetooth 都把读、写、订阅放进内部串行队列,上一个操作的回调回来才发下一个——循环里连发十次写,实际是一条条排队执行的,不是实现偷懒,是协议不允许;
- **吞吐要绕开它**:带响应事务一来一回,速率远低于空口能力;大流量场景(OTA 固件块、传感器数据流)的标准做法是 Write Command + Notification 的无响应组合;
- **死等的表现**:Response 丢失时,客户端必须等到超时才能发下一个事务,应用侧就是"卡住数秒后恢复或报错";在抓包 btatt 过滤器下找"有 Request 无 Response"的位置,就是案发现场;
- EATT(第 7 节)的动机正在于此:LE Audio 的控制命令不能排在数据传输后面,于是引入可并发的增强承载。

## 5. 属性分组:服务的雏形

ATT 本身允许把一段句柄区间声明为**组(Group)**:Read By Group Type 返回"起点句柄 + 终点句柄 + 值",客户端据此知道 0x0021-0x002C 是一组。GATT 层正是用这个机制把属性表切分为一个个 Service——ATT 出"表与行",GATT 出"章节"。

## 6. 属性表长什么样(以心率服务为例)

| Handle | Type(UUID) | Value | Permissions |
| ------ | ----------- | ----- | ----------- |
| 0x0001 | 0x2800 Primary Service | 0x180D Heart Rate Service | R |
| 0x0002 | 0x2803 Characteristic Declaration | 属性 0x10 Notify;值句柄 0x0003;类型 0x2A37 | R |
| 0x0003 | 0x2A37 Heart Rate Measurement | 心率测量结构 | N(通知) |
| 0x0004 | 0x2902 CCCD | 通知开关位 | R/W |
| 0x0005 | 0x2803 Characteristic Declaration | 属性 0x02 Read;值句柄 0x0006;类型 0x2A38 | R |
| 0x0006 | 0x2A38 Body Sensor Location | 枚举(腕/胸/手指…) | R |

读法:第 2 行"声明"告诉客户端"0x0003 处有一个可通知的心率测量特征";第 4 行 CCCD(Client Characteristic Configuration Descriptor)是客户端写 0x0001 打开通知的开关。**发现(Discovery)的本质就是按类型扫这张表**。

## 7. EATT(5.2,顺带一提)

**EATT(Enhanced ATT)** 允许并发的 ATT 事务:建立在 L2CAP 面向连接的加密信道上(固定 CID 0x0007),多个"承载"并行处理,消除 LE Audio 场景下控制命令被大数据读写阻塞的问题。传统 ATT 承载(CID 0x0004)与 EATT 可共存。

## 8. 小结

ATT 一句话:**一张带句柄的 KV 表 + 十来个读写/发现/订阅操作 + 严格的事务串行**。GATT 只是给这张表加上了"服务/特征/描述符"的叙事结构。抓住"句柄是地址、类型是语义、权限在服务器、事务要串行"四点,ATT 就通透了。
