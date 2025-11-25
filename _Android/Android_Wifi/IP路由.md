

 #### IP路由表

```powershell
ip rule list
ip route list table local_network

255#表： locale table 
254#表： main table
253#表： defulte table

ip link list //显示链路
ip address show //显示地址
ip route show //显示路由
ip neigh show //显示ARP映射表
ip neigh delete [IP] dev [dev]  //删除ARP缓存
ip rule list //显示路由表规则优先级
ip route list table [table] //显示制定路由表
ip rule add from [IP] table [table name]  //增加新的路由表
ip route add [IP/defaulte] via [src IP] dev [dev] table [table name]   //为路由表增加表项
ip route flush cache   //刷新路由缓存
ip rule add from all lookup main prio 22000 
ip route add 172.30.2.0/24 dev chba0 src 172.30.1.2 table local_network 
ip address add 172.30.1.2/24 dev chba0
ip route add 172.30.1.0/24 dev chba0 proto static table local_network
ip rule delete table main
```

```shell
172.30.1.2

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

### ne多IP配置

替换前

```powershell
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

HWNOH:/ # ip route show table local_network
172.30.1.0/24 dev chba0 proto static scope link
172.30.2.0/24 dev chba0 proto static scope link
```

替换后

```powershell
172.30.1.2

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
