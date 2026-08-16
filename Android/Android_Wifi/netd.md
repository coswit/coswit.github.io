# netd：Android 的网络守护进程

> 本文以现行 AOSP 源码为主线（示例基于 Android 10 前后，节选简化并标注路径），老版本（4.x）的差异单独标注；分析思路参考邓凡平《深入理解Android：Wi-Fi、NFC和GPS卷》的 netd 章节。完整源码可在文末链接中按 tag 查看。

### netd 概述

netd（network daemon）是 Android 平台的网络守护进程，运行在 native 层，是 Framework 网络管理与 Linux 内核之间的桥梁，职责包括：

- **网络接口管理**：配置接口的 IP 地址、状态（up/down）、MTU，增删路由表项；
- **多网络路由**：为每个网络（netId）维护独立路由表，实现 Wi-Fi / 蜂数据等多网络并存与选路；
- **DNS 解析管理**：为每个网络设置 DNS，并作为 bionic DNS 查询的代理（新版含独立缓存与 DoT）；
- **防火墙与联网控制**：iptables 规则 + eBPF，按 uid/网络放行或禁止联网；
- **带宽控制**：流量配额、限速、空闲计时；
- **NAT 与网络共享**：tethering（USB / Wi-Fi 热点）所需的 NAT、IP 转发配置。

netd 对外提供四个入口（理解架构的关键）：

| 入口 | 使用方 | 说明 |
| --- | --- | --- |
| `/dev/socket/netd`（文本命令） | NetworkManagementService | 4.x 的唯一入口，现作为兼容通道保留 |
| **INetd binder**（NetdNativeService） | ConnectivityService / NMS | Android 8.0 起的主通道 |
| `/dev/socket/dnsproxyd` | bionic（getaddrinfo） | App 的 DNS 查询代理 |
| `/dev/socket/fwmarkd`（FwmarkServer） | bionic（connect 钩子） | 给 App 的 socket 打 netId 标记，决定走哪个网络（5.0 引入） |

整体架构（数据流）：

```
Framework 层   ConnectivityService / NetworkManagementService
                    ↕ binder（INetd，主通道） + socket netd（兼容命令）
native 层      netd
                 ├─ NetdNativeService（INetd binder 实现）
                 ├─ CommandListener（文本命令分发，兼容）
                 ├─ FwmarkServer（fwmarkd，socket 选路打标）
                 ├─ DnsProxyListener（dnsproxyd，DNS 查询代理）
                 ├─ Controllers（功能控制器集合）
                 │    ├─ InterfaceController / RouteController（接口与多网络路由）
                 │    ├─ FirewallController（iptables） / TrafficController（eBPF）
                 │    ├─ BandwidthController / IdletimerController
                 │    ├─ NatController / TetherController / TunnelController
                 │    └─ ResolverController（→ resolv 解析器）
                 └─ NetlinkManager（NETLINK_ROUTE，接收内核事件后广播）
                    ↕ 系统调用 / netlink / BPF
内核           路由表 + ip rule / iptables / eBPF / 网卡驱动
```

关键点：**netd 只做"执行者"，不做决策**。要不要联网、默认网络是谁、DNS 是多少、限不限速，都是 Framework 层决策后下发给 netd 执行的。

### 启动流程源码：main.cpp

```cpp
// system/netd/server/main.cpp（Android 10 前后，节选）
int main() {
    // ① 内核事件监听（与 4.x 相同）
    NetlinkManager *nm = NetlinkManager::Instance();
    nm->start();

    // ② 所有功能控制器。4.x 时它们在 CommandListener 内部创建，现已聚合为独立的 Controllers
    gCtls = new Controllers();

    // ③ 各监听入口
    CommandListener cl;                          // /dev/socket/netd（文本命令，兼容）
    DnsProxyListener dpl(&gCtls->resolverCtrl);  // /dev/socket/dnsproxyd（DNS 代理）
    FwmarkServer fs(DEFAULT_NET_ID);             // /dev/socket/fwmarkd（socket 打标选路）
    NetdNativeService *nativeService = new NetdNativeService(); // INetd binder 服务
    nativeService->start();

    // ④ 各自创建独立监听线程
    fs.startListener();
    cl.startListener();
    dpl.startListener();
}
```

Controllers 中主要的控制器（标 ★ 的是 4.x 之后新增或重写的）：

| 控制器 | 职责 |
| --- | --- |
| InterfaceController | 接口 up/down、MTU |
| ★ RouteController | **每个网络（netId）一张路由表 + ip rule**，5.0 多网络机制的核心 |
| FirewallController | iptables 防火墙链（bw_INPUT / bw_OUTPUT 等） |
| ★ TrafficController | **eBPF** 流量统计与按 uid 的联网控制（9.0 起，替代 iptables 逐条规则） |
| BandwidthController | 流量配额、限速 |
| NatController / TetherController | NAT 与网络共享 |
| ★ TunnelController | 隧道接口管理 |
| IdletimerController | 接口空闲计时 |
| ★ ProcessController / StrictCtrl | 按进程/uid 的网络权限、严格模式（配合 BPF） |
| ResolverController | DNS 配置入口，下发给解析器（resolv） |

### binder 主通道：NetdNativeService 与多网络路由

NetdNativeService 实现 INetd.aidl（`system/netd/binder/android/net/INetd.aidl`），常用方法：

- 网络管理：`createPhysicalNetwork(netId)` / `destroyNetwork` / `addInterfaceToNetwork` / `addRoute` / `setDefaultNetwork(netId)`；
- DNS：`setResolverConfiguration(...)`（服务器、域名搜索列表、超时重试、DoT 配置）；
- 防火墙与限流：`setFirewallType` / `setUidRule` / `setInterfaceQuota`；
- 共享：`tetherStart / tetherStop`、`ipfwdEnabled`；以及 `socketDestroy`（断开某 uid 的所有连接）。

多网络路由的核心在 RouteController：

```cpp
// system/netd/server/RouteController.cpp（节选简化，签名有精简）
int RouteController::addInterfaceToNetwork(unsigned netId, const std::string& interface) {
    // 在 netId 专属的路由表中加入接口的直连路由。等价于：
    //   ip route add <直连网段> dev wlan0 table <netId 对应表号>
    // 并加一条入向规则：iif wlan0 lookup <table>
    return modifyPhysicalNetwork(netId, interface, ACTION_ADD, ...);
}

int RouteController::setDefaultNetwork(unsigned netId) {
    // 修改默认选路规则（priority 10000 的 from all lookup <table>），
    // 把"未显式指定网络"的流量切到新网络。等价于：
    //   ip rule add from all lookup <table> priority 10000
    return writePidFile? /* 简化 */ 0;
}
```

**与 4.x 对比**：4.x 只有一个全局路由表，切换网络就是改默认路由（`interface newroute`）；5.0 起 Wi-Fi 和蜂窝可同时在线，各自一张表，通过 ip rule + socket 标记（fwmark）决定每个包查哪张表。

### fwmarkd：socket 如何决定走哪个网络

多网络并存后，"某个 App 的连接走哪个网络"由 socket 上的 **fwmark**（firewall mark）决定，mark 中编码了 netId 和权限位。打标的动作就发生在 netd 的 FwmarkServer：

```cpp
// system/netd/server/FwmarkServer.cpp（节选简化）
int FwmarkServer::onDataAvailable(SocketClient* client) {
    int socketFd;
    // ① 通过 SCM_RIGHTS 收到 bionic 转来的、App 正在 connect() 的 socket fd
    if (!recvFd(client, &socketFd)) return -1;

    Fwmark fwmark;
    getsockopt(socketFd, SOL_SOCKET, SO_MARK, &fwmark.intValue, &fwmarkLen);

    // ② 未显式绑定网络的 socket（没调 bindToDevice / bindToNetwork）→ 标记为当前默认网络
    if (!fwmark.netId) {
        fwmark.netId = mDefaultNetId;
        setsockopt(socketFd, SOL_SOCKET, SO_MARK, &fwmark.intValue, sizeof(fwmark.intValue));
    }
    return 0;
}
```

配合链路：bionic 的 connect() 钩子（libnetd_client）把 fd 发到 fwmarkd → netd 回写 SO_MARK → 内核按 `ip rule fwmark <netId> lookup <table>` 把包导入对应网络的路由表。这样同一家 App 里，绑定了蜂窝的 socket 走蜂窝、其余走默认 Wi-Fi，互不干扰。

### DNS 链路：配置与查询

**配置段**（Framework → binder → 解析器）：

```cpp
// system/netd/server/NetdNativeService.cpp（节选）
binder::Status NetdNativeService::setResolverConfiguration(const ResolverParamsParcel& params) {
    // params 含 netId、DNS 服务器列表、搜索域名、超时/重试、DoT（Private DNS）配置
    int res = gCtls->resolverCtrl.setResolverConfig(params);
    return binderStatusFromErrno(res, "setResolverConfiguration");
}
// ResolverController 再把这些参数下发给解析器（较新版本拆分为独立的
// netd_resolv 进程，system/netd/resolv），缓存与参数都按 netId 隔离
```

**查询段**（App → bionic → netd）：

```c
// bionic 侧（App 进程内的 libc）：getaddrinfo 不直接发 UDP，
// 而是把请求文本发给 /dev/socket/dnsproxyd，例如：
//   "getaddrinfo www.baidu.com <service> <hints...>"
int fd = socket(AF_UNIX, SOCK_STREAM, 0);
connect(fd, "/dev/socket/dnsproxyd");
write(fd, buf, strlen(buf) + 1);
// 读回序列化的 addrinfo 链表，还原后返回给 App
```

```cpp
// system/netd/server/DnsProxyListener.cpp（现行，节选）
void DnsProxyListener::GetAddrInfoHandler::run() {
    struct addrinfo* result = nullptr;
    // 关键：带 netId 和 mark 做解析——按该网络的 DNS 服务器查询，
    // 查询报文本身也带 mark，保证从正确的网络发出；命中按网络独立的缓存则直接返回
    int rv = android_getaddrinfofornet(mName, mService, &mHints, mNetId, mMark, &result);

    // 结果逐条序列化写回 socket，最后发 104 结束标记，bionic 据此结束读取
    ...
    freeaddrinfo(result);
}
```

**与 4.x 对比**：早期 DNS 服务器是全局的 `net.dns1 / net.dns2` 系统属性，所有网络共用；现在每个 netId 一套参数与缓存，还支持按网络的 DoT（DNS over TLS，Private DNS）。

### 兼容通道：CommandListener（文本命令）

老命令通道的框架从 4.x 至今基本未变（system/core/libsysutils 的 SocketListener/FrameworkListener）：

```cpp
// system/core/libsysutils/src/FrameworkListener.cpp（版本通用，节选）
bool FrameworkListener::onDataAvailable(SocketClient *cli) {
    char buffer[255];
    int len = recv(cli->getSocket(), buffer, sizeof(buffer) - 1, 0);
    ...
    dispatchCommand(cli, buffer);          // 分发这一行命令
}

void FrameworkListener::dispatchCommand(SocketClient *cli, char *data) {
    // 按空格切成 argv：["interface", "setcfg", "wlan0", ...]
    for (size_t i = 0; i < mCommands->size(); i++) {
        FrameworkCommand *c = mCommands->at(i);
        if (!c->getCommand().compare(argv[0])) {   // 匹配第一个单词
            c->runCommand(cli, argc, argv);          // 执行对应命令
            return;
        }
    }
    cli->sendMsg(500, "Command not recognized", false);
}
```

Framework 侧对应 NativeDaemonConnector：发送一行文本命令，按响应码处理——**2xx 成功、4xx/5xx 失败**（唤醒阻塞的调用方）、**6xx 为 netd 主动上报的事件**（走异步回调）。

常用命令速查（4.x 起定义，部分沿用至今）：

| 模块 | 命令示例 | 作用 |
| --- | --- | --- |
| interface | `interface getcfg wlan0`、`interface setcfg wlan0 <ip> <prefix> up` | 查询/配置接口 IP 与状态 |
| interface | `interface newroute / delroute` | 增删路由（4.x，全局表） |
| network | `network create <netId>`、`network interface add <netId> wlan0`、`network default set <netId>` | 多网络操作（5.0+） |
| resolver | `resolver setnetdns <netId> <domains> <dns...>` | 按网络设置 DNS（早期为 setdefaultif/setifdns） |
| firewall | `firewall enable`、`firewall set_uid_rule` | 防火墙开关与按 uid 规则 |
| bandwidth | `bandwidth setiquota <iface> <bytes>` | 接口流量配额 |
| tether / nat | `tether start`、`nat enable <in> <out>` | 网络共享与 NAT |
| ipf | `ipf enable` | 内核 IP 转发开关 |

### 防火墙与流量控制：iptables → eBPF

- **FirewallController**：维护 `bw_INPUT / bw_OUTPUT / bw_COSTLY_SHARED / bw_penalty_box` 等 iptables 链，实现按 uid 的联网黑白名单、待机省电等特性，`adb shell iptables -L -n` 可直接查看；
- **BandwidthController**：流量配额（超限触发 6xx 事件上报，Framework 提示并断网）；
- **TrafficController（9.0 新增）**：用 eBPF 取代"逐 uid 插 iptables 规则"的方式：

```cpp
// system/netd/server/TrafficController.cpp（节选简化）
netdutils::Status TrafficController::start() {
    // ① 从 /sys/fs/bpf 加载内核生成的 BPF map（uid 权限、cookieTag、流量统计等）
    // ② 把 cgroup BPF 程序 attach 到 cgroup 挂载点：收发包路径上按 uid 查 map，
    //    决定放行/丢弃，并累加流量统计
    RETURN_IF_NOT_OK(mBpfMapLoader.start(loadLocally));
    return netdutils::status::ok;
}

// 按 uid 设置联网规则：
//   4.x：iptables -I bw_OUTPUT -m owner --uid-owner <uid> -j REJECT（规则随 uid 线性增长）
//   现在：向 BPF map 写一个 key=uid 的表项，数据面 O(1) 查表
netdutils::Status TrafficController::updateUidOwnerMap(uid_t uid, OwnerMatchType match, IptOp op) {
    // 读写 uidOwnerMap（简化）
}
```

### 内核事件上报：NetlinkManager → 6xx 广播

这部分从 4.x 至今保持稳定：

```cpp
// system/netd/server/NetlinkManager.cpp（节选）
int NetlinkManager::start() {
    struct sockaddr_nl nladdr;
    memset(&nladdr, 0, sizeof(nladdr));
    nladdr.nl_family = AF_NETLINK;
    nladdr.nl_pid = getpid();
    // 订阅这几类内核事件：链路、IPv4/IPv6 地址、路由
    nladdr.nl_groups = RTMGRP_LINK | RTMGRP_IPV4_IFADDR | RTMGRP_IPV6_IFADDR
                     | RTMGRP_IPV4_ROUTE | RTMGRP_IPV6_ROUTE;

    mSock = socket(PF_NETLINK, SOCK_DGRAM, NETLINK_ROUTE);
    bind(mSock, (sockaddr *)&nladdr, sizeof(nladdr));

    NetlinkHandler *handler = new NetlinkHandler(this, mSock);
    handler->start();  // 独立线程循环 recv 内核事件
}

// system/netd/server/NetlinkHandler.cpp（节选）
void NetlinkHandler::onEvent(NetlinkEvent *evt) {
    const char *subsys = evt->getSubsystem();
    if (!strcmp(subsys, "net")) {
        // 解析后组包广播给所有客户端，如 "<6xx> Iface linkstate wlan0 up"，
        // 具体事件码以对应版本 netd 的 ResponseCode.h 为准
        mNm->getBroadcaster()->sendBroadcast(code, msg, false);
    }
}
```

Framework 侧收到 6xx 后由 NetworkManagementService 分发：接口增删通知 ConnectivityService 调整网络，链路状态用于跟踪 wlan0 等物理接口的 up/down。

### 一次 Wi-Fi 连接中 netd 的参与（现代流程）

1. Wi-Fi 关联成功，IpClient 完成 DHCP（基于 netlink），拿到 IP 与 DNS；
2. ConnectivityService 为该网络分配 netId，创建 NetworkAgent，随后通过 INetd 下发：
   `createPhysicalNetwork(netId)` → `addInterfaceToNetwork(netId, "wlan0")`（建路由表和规则）→ `addRoute`（默认路由）→ `setDefaultNetwork(netId)`（切换默认网络）→ `setResolverConfiguration`（该网络的 DNS 参数）；
3. netd 执行的同时更新防火墙/限流规则；内核产生 netlink 事件（地址、路由变化），NetlinkManager 广播 6xx 给 NMS，进而更新 LinkProperties，`ConnectivityManager` 发出网络回调；
4. 此后 App 的每次 `connect()` 都会经 fwmarkd 打上默认网络（或显式绑定网络）的 mark，`getaddrinfo` 经 dnsproxyd 由 netd 按 netId 解析——控制面全在 netd，数据面由内核按 mark 和路由表直接转发。

### 版本演进速查

| 版本 | netd 相关变化 |
| --- | --- |
| 4.x（书的时代） | `netd` socket 文本命令为唯一入口；DNS 用全局 `net.dns1/2` 属性；防火墙/限流全 iptables |
| 5.0 | 多网络机制：netId、每网络独立路由表、fwmarkd 打标选路；`resolver setnetdns` 按网络配 DNS |
| 8.0 | 新增 INetd binder 接口（NetdNativeService），Framework 逐步改走 binder |
| 9.0 | eBPF 流量统计与按 uid 控制（TrafficController）；Private DNS（DoT） |
| 10~11 | DNS 解析器拆分为 netd_resolv（system/netd/resolv），缓存与参数按网络隔离 |
| 12+ | NetworkManagementService 并入 ConnectivityService；Tethering 等持续模块化（APEX） |

### 调试命令

```bash
adb shell ps -A | grep netd            # 确认 netd / netd_resolv 进程存活
adb shell ndc interface getcfg wlan0   # ndc 直接向 netd 发文本命令
adb shell ndc resolver getdefaultif   # 查看当前默认网络（老版本有效）
adb shell ip rule list                # 查看多网络选路规则（fwmark → 路由表）
adb shell ip route show table all      # 查看各网络的路由表
adb shell iptables -L -n               # 查看防火墙规则
adb shell dumpsys connectivity         # 网络状态（含各 netId）
adb logcat | grep -iE "netd|NetworkManagement"
```

### 参考文档

- 《深入理解Android：Wi-Fi、NFC和GPS卷》邓凡平著，机械工业出版社（4.x 时代的 netd 与网络管理分析思路）；
- 现行源码：[aosp-mirror/platform_system_netd](https://github.com/aosp-mirror/platform_system_netd)，官方上游 [android.googlesource.com/platform/system/netd](https://android.googlesource.com/platform/system/netd/)；
- 在线按 tag 浏览：[cs.android.com](https://cs.android.com)（建议对照 android-4.3_r1 与 android-10.0.0_r1 两个版本，正好覆盖本文的"4.x → 现代"两条线）；
- 多网络选路与 fwmark 的设计说明：AOSP 源码中 `system/netd/docs` 及 `frameworks/base` 中 ConnectivityService 相关注释。
