## 1. HCI 是什么

**HCI(Host Controller Interface, 主机控制器接口)** 是 Host 与 Controller 之间的标准界面:一套**命令(Command)、事件(Event)与数据(Data)分组**协议,配合若干物理传输层。它存在的意义:

- **可移植**:同一个 Host 协议栈(如 Android 的原生栈)配任何厂商的 Controller 芯片都能工作;
- **可拆分**:双芯片形态(手机、USB 蓝牙 dongle、串口透传模块)靠它通信;
- **可测试**:认证测试、产线校准直接在 HCI 上注入命令。

> HCI 上传输的命令/事件语义由核心规范 Vol 2 Part E(HCI)定义;LE 相关命令集中在 LE Controller Commands 一节(OGF 0x08)。

## 2. 物理传输层

| 传输 | 说明 |
| ---- | ---- |
| UART(4 线 H4) | RX/TX/RTS/CTS + 波特率,嵌入式最常用;分组仅靠每包首字节区分类型,要求传输层零差错 |
| 3-Wire UART(H5) | 在 UART 上再加 SLIP 编码与重传,容忍丢包,仅有 3 根线时可用 |
| USB | 标准 USB Bluetooth 类设备(0xE0),dongle 即插即用 |
| SDIO | 手机/平板 SoC 内部常用,配私有固件下载流程 |

Controller 上电后往往还需先经侧信道(UART 下载、USB DFU、OTP)加载固件,再开始 HCI 交互——Android 平台上这一步由厂商 HAL/固件服务完成。

## 3. 三种分组与流控

HCI 上一切信息都是分组,首字节是类型:

| 类型 | 值 | 方向 |
| ---- | -- | ---- |
| Command(命令) | 0x01 | Host → Controller |
| ACL Data(异步数据) | 0x02 | 双向 |
| SCO/eSCO Data(同步数据) | 0x03 | 双向(经典蓝牙语音) |
| Event(事件) | 0x04 | Controller → Host |
| ISO Data(等时数据) | 0x05 | 双向(5.2 LE Audio) |

### 3.1 命令分组

```text
| 类型 1B | OpCode 2B(OGF 6bit + OCF 10bit) | 参数总长 1B | 参数 ... |
```

例:`HCI_LE_Set_Scan_Parameters` 的 OpCode 是 0x200B(OGF=0x08 LE,OCF=0x000B)。Host 一次可以连发多条命令。

### 3.2 事件分组与命令完成

Controller 用两类事件回执命令:

- **Command Status**(先回"收到了,正在办"),真正结果后续再由事件送出;
- **Command Complete**(带返回参数),大多数 LE 命令走这类。

LE 专属事件统一打包进 **LE Meta Event**(0x3E),如 `LE Advertising Report`、`LE Connection Complete`、`LE Connection Update Complete`。所有 HCI 交互的监听与分析(抓包、btsnoop)都围绕这些事件展开。

### 3.3 流控

双向都要防止一端缓冲溢出:

- **Controller → Host**:Host 用 `HCI_Host_Buffer_Size` + `HCI_Host_Completed_Packets` 报告"我消化了 N 包"信用;
- **Host → Controller**:`HCI_Read_Buffer_Size` 得到 Controller ACL 缓冲个数与深度,每发一包减一,收到 `Number of Completed Packets` 事件再补充信用。

## 4. Controller 初始化与典型流程

Host 启动 Controller 的标准顺序(原书 8.4 节):

1. `HCI_Reset` 归位;
2. `HCI_Read_BD_ADDR` 读公有地址;
3. `HCI_Set_Event_Mask` 打开关心的事件(LE Meta Event 必开);
4. `HCI_Read_Buffer_Size` / `HCI_LE_Read_Buffer_Size` 拿缓冲参数;
5. `HCI_Read_Local_Supported_Features` / `HCI_LE_Read_Local_Supported_Features`、`Supported_States`;
6. `HCI_LE_Set_Random_Address` 设置私有地址;
7. 白名单、广播/扫描参数配置,进入业务。

### 4.1 广播与观察

- `HCI_LE_Set_Advertising_Parameters` / `Set_Advertising_Data` / `Set_Scan_Response_Data` / `Advertising_Enable`;
- `HCI_LE_Set_Scan_Parameters` / `Set_Scan_Enable`(主动/被动,过滤策略),报告经 `LE Advertising Report` 事件批量上报。

### 4.2 连接与连接管理

| 阶段 | 代表命令 |
| ---- | -------- |
| 发起连接 | `HCI_LE_Create_Connection`(含扫描参数、连接参数、白名单策略) / `Create_Connection_Cancel` |
| 参数维护 | `HCI_LE_Connection_Update`、`HCI_Read/Write_Remote_Features`、`HCI_Read_Remote_Version` |
| 加密 | `HCI_LE_Start_Encryption`(Central,带 LTK/Rand/EDIV)、`HCI_LE_Long_Term_Key_Request_Reply`(Peripheral 被索要 LTK 时回复) |
| 断开 | `HCI_Disconnect`(原因码进 Disconnection Complete 事件) |

## 5. 用日志看 HCI(联调视角)

Android 开启"蓝牙 HCI 信息收集日志"后,bugreport 里的 `btsnoop_hci.log` 就是 HCI 全量分组的时间线,可拖进 Wireshark 直接解析(过滤 `bthci_cmd` / `bthci_evt` / `btle` / `btatt`)。一次"扫描→连接→发现服务"在日志里的样子:

```text
bthci_cmd  LE Set Scan Parameters / LE Set Scan Enable
bthci_evt  LE Meta - Advertising Report  (厂商广播包)
bthci_cmd  LE Create Connection
bthci_evt  LE Meta - Enhanced Connection Complete  (handle=0x0001, interval=24, latency=0)
bthci_evt  LE Data Length Change / PHY Update
btatt      Exchange MTU Request / Response
```

排障时先看 HCI,再往上看 ATT:如果 `LE Connection Complete` 都没有,问题在广播/扫描侧(广播类型、过滤策略、地址类型不匹配);如果连接成功而 ATT 不通,再看 GATT 层。

## 6. 小结

HCI 之于 BLE,相当于"司机与发动机之间的踏板和仪表盘"——协议语义上它只是搬运工(真正协议在 LL 与 Host 各层),但它把"协议栈软件"与"射频芯片"解耦成了两个独立产业。写嵌入式双芯片方案(应用 MCU + 蓝牙模块走 HCI)时,直接面对的就是本篇这张命令表。
