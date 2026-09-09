### ip rule 与 ip route 命令速查

Linux 多网络路由的核心三件套：`ip rule`（策略路由规则，按优先级决定查哪张表）、`ip route`（路由表项）、`ip address`（接口地址）。系统保留表编号：**255 = local 表**（本地与回环路由，内核维护）、**254 = main 表**（默认表）、**253 = default 表**（空表，兜底）。

```bash
ip link list                       # 显示链路
ip address show                    # 显示地址
ip route show                      # 显示路由
ip neigh show                      # 显示 ARP 映射表
ip neigh delete [IP] dev [dev]     # 删除 ARP 缓存
ip rule list                       # 显示路由表规则优先级
ip route list table [table]        # 显示指定路由表

# 增删规则与表项
ip rule add from [IP] table [table name]                                  # 增加新的路由规则
ip route add [IP/default] via [src IP] dev [dev] table [table name]       # 为路由表增加表项
ip route flush cache                # 刷新路由缓存

# 实例
ip rule add from all lookup main prio 22000
ip route add 172.30.2.0/24 dev chba0 src 172.30.1.2 table local_network
ip address add 172.30.1.2/24 dev chba0
ip route add 172.30.1.0/24 dev chba0 proto static table local_network
ip rule delete table main
```

### 实机示例：多网络下接口换名前后的 rule 与路由表

同一台设备上把自定义网络 `chba0` 的表名从 `chba0` 替换为 `local_network`，对比 `ip rule` 与路由表的变化（Android 实机输出，fwmark 掩码中的 0x10063 等即各网络 netId）。

替换前：

```bash
HWNOH:/ # ip rule
0:      from all lookup local
10000:  from all fwmark 0xc0000/0xd0000 lookup legacy_system
11000:  from all iif lo oif dummy0 uidrange 0-0 lookup dummy0
11000:  from all iif lo oif rmnet_ims00 uidrange 0-0 lookup rmnet_ims00
11000:  from all iif lo oif chba0 uidrange 0-0 lookup chba0
16000:  from all fwmark 0x10063/0x1ffff iif lo lookup chba0
16000:  from all fwmark 0x10032/0x1ffff iif lo lookup rmnet_ims00
17000:  from all iif lo oif dummy0 lookup dummy0
17000:  from all iif lo oif rmnet_ims00 lookup rmnet_ims00
17000:  from all iif lo oif chba0 lookup chba0
18000:  from all fwmark 0x0/0x10000 lookup legacy_system
19000:  from all fwmark 0x0/0x10000 lookup legacy_network
20000:  from all fwmark 0x0/0x10000 lookup chba0
23000:  from all fwmark 0x32/0x1ffff iif lo lookup rmnet_ims00
29000:  from all lookup default
32000:  from all unreachable

HWNOH:/ # ip route show table chba0
172.30.1.0/24 dev chba0 proto static scope link
172.30.2.0/24 dev chba0 proto static scope link
```

替换后（规则结构不变，仅表名从 `chba0` 换为 `local_network`，接口 `chba0` 与地址 `172.30.1.2` 保持不变）：

```bash
HWNOH:/ # ip rule
0:      from all lookup local
10000:  from all fwmark 0xc0000/0xd0000 lookup legacy_system
11000:  from all iif lo oif dummy0 uidrange 0-0 lookup dummy0
11000:  from all iif lo oif rmnet_ims00 uidrange 0-0 lookup rmnet_ims00
11000:  from all iif lo oif chba0 uidrange 0-0 lookup local_network
16000:  from all fwmark 0x10063/0x1ffff iif lo lookup local_network
16000:  from all fwmark 0x10032/0x1ffff iif lo lookup rmnet_ims00
17000:  from all iif lo oif dummy0 lookup dummy0
17000:  from all iif lo oif rmnet_ims00 lookup rmnet_ims00
17000:  from all iif lo oif chba0 lookup local_network
18000:  from all fwmark 0x0/0x10000 lookup legacy_system
19000:  from all fwmark 0x0/0x10000 lookup legacy_network
20000:  from all fwmark 0x0/0x10000 lookup local_network
23000:  from all fwmark 0x32/0x1ffff iif lo lookup rmnet_ims00
29000:  from all lookup default
32000:  from all unreachable

HWNOH:/ # ip route show table local_network
172.30.1.0/24 dev chba0 proto static scope link
172.30.2.0/24 dev chba0 proto static scope link
```

对照要点：同一条 `16000` 优先级规则用 `fwmark 0x10063/0x1ffff` 匹配打上了 netId 0x63 标记的 socket 并导入 `local_network` 表；`20000` 优先级规则则是该网络的「未显式绑定」默认选路入口——正是 netd 篇中 RouteController 维护的多网络选路结构。
