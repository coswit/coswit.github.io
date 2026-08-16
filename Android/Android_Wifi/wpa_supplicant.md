# wpa_supplicant：Wi-Fi 客户端（STA 侧）的实现

> 本文以 AOSP 中自带的 wpa_supplicant（external/wpa_supplicant_8）为主线，代码为 2.x 版本、Android 4.x 时代（书中分析所用）的形态，新版本差异（wificond、HIDL/AIDL HAL、WPA3 等）单独标注；分析思路参考邓凡平《深入理解Android：Wi-Fi、NFC和GPS卷》的 WPAS 相关章节。完整源码可在文末链接按 tag 查看。

### 概述

wpa_supplicant（下称 WPAS）是开源的 WPA/802.1X Supplicant（Wi-Fi 客户端侧认证组件），上游是 w1.fi 的 hostap 项目，Android 直接使用其 AOSP 分支 `external/wpa_supplicant_8`。它负责 STA 侧几乎所有"协议"工作：

- **扫描与选择**：触发扫描、缓存结果、按配置挑选目标 AP（4.x 时代也负责扫描下发）；
- **关联**：发起认证（Authentication）与关联（Association）；
- **密钥协商**：WPA/WPA2 的四次握手（PTK/GTK）、组密钥更新、WPA3-SAE；
- **企业认证**：802.1X / EAP（TLS、PEAP、TTLS 等，eapol_sm）；
- **P2P**（Wi-Fi Direct）与**网络配置管理**。

与其他组件的关系：

```
Framework    WifiService / WifiStateMachine（4.x）/ WifiNative
                 ↕ ctrl socket（"IFNAME=wlan0 STATUS"）；
                 现代改经 SupplicantStaIfaceHal（HIDL/AIDL binder）
WPAS         wpa_supplicant 进程
                 ├─ ctrl_iface：接收 Framework 命令 / 广播 CTRL-EVENT-* 事件
                 ├─ wpa_sm：密钥协商状态机（四次握手）
                 ├─ eapol_sm：802.1X 认证
                 ├─ 配置：network 列表（4.x 持久化在 wpa_supplicant.conf）
                 └─ driver 层（nl80211 / 老版本 wext）
                 ↕ nl80211（cfg80211）
内核/固件     Wi-Fi 驱动
```

4.x 的启动方式（init.rc）：

```
service wpa /system/bin/wpa_supplicant \
    -iwlan0 -Dwext -c /data/misc/wifi/wpa_supplicant.conf
```

每个接口（wlan0、p2p0）在 WPAS 内对应一个 `struct wpa_supplicant` 实例，各有一套状态与 ctrl socket。

### 启动与初始化：main.c

```c
// external/wpa_supplicant_8/wpa_supplicant/main.c（节选）
int main(int argc, char *argv[])
{
    // 解析启动参数：-i 接口名 -c 配置文件 -dd 调试等级等
    for (;;) { ... }

    global = wpa_supplicant_init(&params);                 // ① 全局初始化（eloop 等）
    for (i = 0; i < iface_count; i++) {
        if (wpa_supplicant_add_iface(global, ifaces[i]) == NULL)  // ② 添加 wlan0/p2p0
            return -1;
    }
    wpa_supplicant_run(global);                            // ③ 进入事件循环（不返回）
}
```

`wpa_supplicant_add_iface` 最终调用 `wpa_supplicant_init_iface` 完成单个接口的初始化：

```c
// wpa_supplicant.c（节选）
static int wpa_supplicant_init_iface(struct wpa_supplicant *wpa_s, struct wpa_interface *iface)
{
    wpa_supplicant_set_driver(wpa_s, iface->driver);      // 选择驱动封装（nl80211）
    wpa_s->conf = wpa_config_read(wpa_s->confname);       // 读取配置文件（含 network 列表）
    wpa_s->drv_priv = wpa_drv_init(wpa_s, wpa_s->ifname); // 驱动初始化：与内核 cfg80211 交互的入口
    ...
    wpa_supplicant_ctrl_iface_init(wpa_s);                // 创建该接口的 ctrl socket
    return 0;
}
```

### 事件循环：eloop

WPAS 是单线程事件驱动模型，所有工作都发生在 eloop 循环里，事件源三类：**定时器、socket（可读/可写）、信号**：

```c
// eloop.c（select 版，节选；新版本换 epoll，结构不变）
void eloop_run(void)
{
    while (!eloop.terminate) {
        res = select(max_sock + 1, &rfds, &wfds, NULL, _tv);  // ① 阻塞等待任一事件源就绪
        eloop_process_timeouts();                             // ② 到期定时器回调（如扫描调度）
        // ③ 遍历读表，回调就绪 socket 的处理函数
        //    （ctrl 命令、驱动事件 nl80211、EAPOL 帧等都从这里进来）
        for (i = 0; i < table_count && res > 0; i++) {
            if (FD_ISSET(table[i].sock, &rfds)) {
                table[i].handler(table[i].sock, ...);
                res--;
            }
        }
    }
}
```

注册接口形如 `eloop_register_read_sock(fd, handler, ...)`、`eloop_register_timeout(sec, usec, handler, ...)`。理解"所有流程都是某个事件的回调"是读 WPAS 代码的关键。

### 控制接口：命令与事件

Framework（WifiNative）与 WPAS 之间通过 Unix domain socket 文本协议交互，命令风格类似 wpa_cli：

| 命令 | 作用 |
| --- | --- |
| `STATUS` | 查询状态：wpa_state、bssid、ssid、key_mgmt 等 |
| `SCAN` / `SCAN_RESULTS` | 触发扫描 / 获取扫描结果 |
| `LIST_NETWORKS`、`ADD_NETWORK`、`SET_NETWORK` | 网络配置（id、ssid、psk、key_mgmt 等字段） |
| `ENABLE_NETWORK` / `DISABLE_NETWORK` / `REMOVE_NETWORK` | 启用/禁用/删除一个配置网络 |
| `SAVE_CONFIG` | 把 network 列表写回 wpa_supplicant.conf（4.x） |
| `REASSOCIATE` / `RECONNECT` | 重关联 |

```c
// ctrl_iface_unix.c（节选）
static void wpa_supplicant_ctrl_iface_receive(int sock, void *eloop_ctx, void *sock_ctx)
{
    char buf[4096], reply[4096];
    ...  // recvfrom 拿到一行命令文本，如 "IFNAME=wlan0 STATUS"
    reply_len = wpa_supplicant_ctrl_iface_process(wpa_s, buf, reply, &reply_len);
    sendto(sock, reply, reply_len, 0, ...);   // 原路返回："OK"/"FAIL" 或结果文本
}

// ctrl_iface.c（节选）
char * wpa_supplicant_ctrl_iface_process(struct wpa_supplicant *wpa_s, char *buf, ...)
{
    if (os_strcmp(buf, "STATUS") == 0)
        wpa_supplicant_ctrl_iface_status(wpa_s, buf, reply, &reply_len);
    else if (os_strcmp(buf, "SCAN") == 0)
        wpa_supplicant_ctrl_iface_scan(wpa_s, ...);
    else if (os_strncmp(buf, "SET_NETWORK ", 12) == 0)
        wpa_supplicant_ctrl_iface_set_network(...);
    ...
    else
        reply_len = os_snprintf(reply, ..., "UNKNOWN COMMAND\n");
    return reply;
}
```

**反向的事件通道**：WPAS 用 `wpa_msg()` 把内部状态变化广播到 monitor socket（Framework 常驻监听），常见事件：

- `CTRL-EVENT-SCAN-RESULTS`：扫描完成；
- `CTRL-EVENT-CONNECTED - Connection to xx:xx... completed`：关联且密钥协商完成；
- `CTRL-EVENT-DISCONNECTED`：断开；
- `Trying to associate with ...`、`Associated with ...`：过程日志（书中 WifiStateMachine 状态机切换的触发源就是这些字符串）。

### 扫描流程（4.x）

```c
// ctrl_iface 的 SCAN 命令最终到（节选）
void wpa_supplicant_scan(void *eloop_ctx, void *timeout_ctx)
{
    struct wpa_driver_scan_params params;
    ...  // 按配置填信道列表、SSID 过滤等
    wpa_supplicant_trigger_scan(wpa_s, &params);   // → wpa_drv_scan() → nl80211 下发
}

// 驱动层扫描完成后，结果以事件回调上来：
void wpa_supplicant_event(void *ctx, enum wpa_event_type event, union wpa_event_data *data)
{
    switch (event) {
    case EVENT_SCAN_RESULTS:
        wpa_supplicant_event_scan_results(wpa_s, data);  // 取回并缓存 BSS 列表
        // 广播 CTRL-EVENT-SCAN-RESULTS，Framework 收到后拉取 SCAN_RESULTS
        break;
    case EVENT_ASSOC:  ...
    }
}
```

Framework 拿到结果后做网络选择（WifiConfigManager 评分），选定后下发关联命令——即 WPAS 自己不决定连谁（modern 也是如此，选择逻辑全在 Framework）。

### 关联与四次握手（WPA2-PSK 为例）

```c
// ENABLE_NETWORK → 挑选 BSS → wpa_supplicant_associate（节选）
static void wpa_supplicant_associate(struct wpa_supplicant *wpa_s, struct wpa_ssid *ssid)
{
    struct wpa_driver_associate_params params;
    ...  // 填 BSSID/SSID、认证与加密套件（PSK/802.1X）、频段等
    wpa_drv_associate(wpa_s, &params);  // 下发关联（Auth/Assoc 帧由驱动/固件完成）
}
```

关联成功后（`EVENT_ASSOC`），AP 发起密钥协商，WPAS 的 `wpa_sm` 完成四次握手：

```
STA（wpa_sm）                                        AP
   ←  M1: EAPOL-Key(ANonce)
       生成 SNonce；PTK = PRF(PMK, ANonce, SNonce, 两端 MAC)
   →  M2: EAPOL-Key(SNonce, MIC)
   ←  M3: EAPOL-Key(MIC, 加密的 GTK)
       校验 MIC → 安装 PTK（单播加密密钥）
   →  M4: EAPOL-Key(MIC)
       安装 GTK（组播密钥）→ wpa_sm 进入 COMPLETED
```

- PSK 模式下 PMK = `PBKDF2(HMAC-SHA1, passphrase, ssid, 4096次, 32字节)`，四次握手的 MIC 用来互相证明持有 PMK，同时派生出真正的会话密钥 PTK；
- PTK 安装通过驱动的 set_key 接口写入内核/固件，之后数据帧加解密完全在硬件层完成；
- 握手完成后 `wpa_msg()` 广播 `CTRL-EVENT-CONNECTED`，Framework 收到才开始 DHCP（4.x 在 WifiStateMachine 内做，现代由 IpClient 完成）并最终显示"已连接"。

### 新版本演进（超出书的范围）

- **HAL 化**：Android 8.0 起 supplicant 提供 **HIDL** 接口（hardware/interfaces/supplicant/1.0~1.2），Framework 经 SupplicantStaIfaceHal 调用；Android 11 起改 **AIDL**（`ISupplicant` / `ISupplicantStaIface` / `ISupplicantNetwork`），文本 ctrl 接口仅在内部保留；
- **wificond 分工（9.0 起）**：扫描、信号统计等由新守护进程 wificond（system/connectivity/wificond，直接走 nl80211）接管，WPAS 更专注于关联、密钥协商与企业认证；
- **配置存储**：4.x 由 WPAS 持久化（wpa_supplicant.conf + SAVE_CONFIG）；6.0 起网络配置统一由 Framework 的 WifiConfigStore（XML）管理，WPAS 内不落盘；
- **安全特性**：WPA3-SAE、OWE（增强开放）、DPP（Easy Connect）、PMF 等（对应 AOSP 中 wpa_supplicant_8 的新版本）；
- 代码位置不变：`external/wpa_supplicant_8`（含持续跟随上游 hostap 更新的 android 分支）。

### 调试命令

```bash
adb shell ps -A | grep wpa                     # 确认进程（wlan0/p2p0 两个接口在进程中）
adb shell dumpsys wifi | grep -iA5 supplicant  # HAL 状态与版本
# 老版本（或 userdebug 且带 wpa_cli 的镜像）可直接用 ctrl 接口：
adb shell wpa_cli -i wlan0 status
adb shell wpa_cli -i wlan0 scan_results
adb logcat | grep -iE "wpa_supplicant|SupplicantStaIfaceHal|WifiConfigManager"
```

### 参考文档

- 《深入理解Android：Wi-Fi、NFC和GPS卷》邓凡平著，机械工业出版社（WPAS 初始化、事件循环、工作流程与四次握手的详细走读）；
- AOSP 源码（官方，无 GitHub 活跃镜像）：<https://android.googlesource.com/platform/external/wpa_supplicant_8/>，在线浏览：[cs.android.com](https://cs.android.com)（可切 android-4.3_r1 对照书中代码）；
- 上游项目：w1.fi hostap（wpa_supplicant 官方）：<https://w1.fi/cgit/hostap/>；
- supplicant HAL 定义：hardware/interfaces/supplicant（HIDL 1.x 与 aidl 目录，可在 cs.android.com 查看）。
