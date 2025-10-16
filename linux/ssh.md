### 简介

SSH: Secure Shell protocol,传输加密技术，通过非对称加密来实现，使用公钥与私钥(Public and Private Key)来进行加密与解密，包含：

- 公钥(public key)：提供给远端主机进行加密
- 私钥(private key)：远端主机使用你提供的公钥进行加密后，在本地端就能够使用私钥来进行解密。

```c
$ ssh user@hostname //登录远程linux服务器,user为linux 服务器的管理员名称,hostname 为 linux 服务器的IP
$ ctrl+c // stop process
$ ctrl+d // end of file
```
命令格式
```bash
$ command  [-options]  parameter1  parameter2 ...
                 指令        选项        参数（1）     参数（2）
```

### 连接

1. 服务器**建立公钥档案**：每一次启动sshd服务时，该服务会主动去找`/etc/ssh/ssh_host*`的档案，若系统刚刚安装完成时，由于没有这些公钥档案，因此sshd会主动去计算出这些需要的公钥档案，同时也会计算出自己需要的私钥档

2. 客户端主动**连接**：使用SSH或图形界面来连接

3. 服务器**传送公钥**给客户端：接收到用户端的请求，服务器便将第一个步骤取得的公钥档案传送给用户端使用(明码传送)

4. 客户端**比对公私钥**：若用户端第一次连接到此服务器，则会将服务器的公钥资料记录到用户端的目录内的`~/.ssh/known_hosts` 。若是已经记录过服务器的公钥资料，则用户端会去比对此次接收到的与之前的记录是否有差异。若接受此公钥资料，则开始计算客户端自己的公私钥资料；

   > 用户端的秘钥是随机运算产生于本次连线当中的，所以这次的连线与下次的连线的秘钥可能就会不一样！此外在用户端的使用者家目录下的~/.ssh/known_hosts 会记录曾经连线过的主机的public key ，用以确认我们是连接上正确的服务器

5. 客户端**回传公钥**到服务器：客户端将自己的公钥传送给服务器。此时服务器『具有服务器的私钥与用户端的公钥』，而用户端则： 『具有服务器的公钥以及用户端自己的私钥』，你会看到，在此次连线的服务器与用户端的密钥系统(公钥+私钥)并不一样，所以才称为非对称式加密

6. 开始**双向加解密**：

    (1)服务器到用户端：服务器传送资料时，拿客户端的公钥加密后送出。客户端接收后，用自己的私钥解密； 

   (2)客户端到服务器：客户端传送资料时，拿服务器的公钥加密后送出。服务器接收后，用服务器的私钥解密

### 启动

Linux系统都会默认预设启动ssh，直接启动就是以 `SSH daemon` ，简称为 `sshd` 来启动的

```bash
$ /etc/init.d/sshd restart
$ netstat -tlnp | grep ssh
tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN      14700/sshd
tcp6       0      0 :::22                   :::*                    LISTEN      14700/sshd
```

使用systemctl时 

```bash
$ systemctl restart sshd
```

### 登录

#### 直接登录

```bash
$ ssh [-f] [-o 参数项目] [-p 端口] [账号@]IP [指令]
选项与参数：
-f ：需要配合后面的 [指令] ，不登入远程主机直接发送一个指令过去而已；
-o 参数项目：主要的参数项目有：
	ConnectTimeout=秒数 ：联机等待的秒数，减少等待的时间
	StrictHostKeyChecking=[yes|no|ask]：预设是 ask，若要让 public key
           主动加入 known_hosts ，则可以设定为 no 即可。
-p ：指定端口
[指令] ：不登入远程主机，直接发送指令过去。但与 -f 意义不太相同。
```

##### 公钥记录文件： `~/.ssh/known_hosts`

当登入远程服务器时，本机会主动的用接收到的服务器的 public key 去比对 ~/.ssh/known_hosts 有无相关的公钥：

- 若接收的公钥尚未记录，则询问用户是否记录。若要记录则写入 `~/.ssh/known_hosts` 且继续登入的后续工作；若不记录 (回答 no) 则不写入该档案，并且终止登录
- 若接收到的公钥已有记录，则比对记录是否相同，若相同则继续；若不相同，则出现警告信息， 且终止登录。这是客户端的自我保护功能，避免服务器是被别人伪装的。

如：删除原有服务器的系统公钥，重新启动 ssh 让公钥更新

```bash
$ rm  /etc/ssh/ssh_host*
$ /etc/init.d/sshd restart
```

在客户端进行登录：

```bash
$ ssh root@服务器IP或地址
```

#### 免密登录

具体步骤：

- 客户端创建公私钥
- 客户端私钥档案保存：将 Private Key 放在 Client 上面的home目录，即 `$HOME/.ssh/` ， 且要注意权限
- 公钥放置于服务器端的正确目录与文件名下：将Public Key 放在任何一个你想要用来登入的服务器端的某 User 的home目录内之 `.ssh`/ 里面的认证档案`authorized_keys`即可完成整个程序

##### 客户端秘钥生成

```bash
$ ssh-keygen [-t rsa|dsa]  <==可选rsa或dsa 
$ ssh-keygen   <==用预设的方法建立密钥
```

查看

```bash
$ ls -ld ~/.ssh; ls -l ~/.ssh 
drwx------. 2 vbirdtsai vbirdtsai 4096 2011-07-25 12:58 /home/vbirdtsai/.ssh

- rw-------. 1 vbirdtsai vbirdtsai 1675 2011-07-25 12:58 id_rsa       <==私钥
 -rw-r--r--. 1 vbirdtsai vbirdtsai 416 2011-07-25 12:58 id_rsa.pub   <==公钥
```

```bash
$ ls -ld ~/.ssh; ls -l ~/.ssh
drwx------. 2 root root 29 Apr 11  2020 /root/.ssh
total 4
-rw-r--r--. 1 root root 806 Mar 24  2020 authorized_keys
```

~/.ssh/目录必须要是700的权限才行，id_rsa的必须要是-rw-------且属于自己

##### 公钥上传到服务器

```bash
$ scp ~/.ssh/id_rsa.pub zj@zhengjing.life:~ 
```

##### 上传的公钥放到正确的目录下

> `/etc/ssh/sshd_config`的AuthorizedKeysFile属性用于指定公钥文件放置的位置

```bash 
#在~/.ssh/目录下创建authorized_keys文件
$touch  authorized_keys 
$chmod 644 authorized_keys
```

id_rsa.pub复制到远程主机对应账号下的.ssh/authorized_keys

### 配置

#### 配置新的连接秘钥

```bash
$ rm /etc/ssh/ssh_host*   <==删除
$ /etc/init.d/sshd restart   
正在停止sshd: [ 确定 ]
正在产生SSH1 RSA主机金钥: [确定] <==底下三个步骤重新产生密钥！
正在产生SSH2 RSA 主机金钥: [ 确定 ]
正在产生SSH2 DSA 主机金钥: [ 确定 ]
正在启动sshd: [ 确定 ]
$ date; ll /etc/ssh/ssh_host* 
Tue Feb  2 15:13:11 CST 2021
-rw------- 1 root root      668 Feb  1 18:55 /etc/ssh/ssh_host_dsa_key
-rw-r----- 1 root ssh_keys  227 Feb  2 15:06 /etc/ssh/ssh_host_ecdsa_key
-rw-r--r-- 1 root root      162 Feb  2 15:06 /etc/ssh/ssh_host_ecdsa_key.pub
-rw-r----- 1 root ssh_keys  387 Feb  2 15:06 /etc/ssh/ssh_host_ed25519_key
-rw-r--r-- 1 root root       82 Feb  2 15:06 /etc/ssh/ssh_host_ed25519_key.pub
-rw-r----- 1 root ssh_keys 1675 Feb  2 15:06 /etc/ssh/ssh_host_rsa_key
-rw-r--r-- 1 root root      382 Feb  2 15:06 /etc/ssh/ssh_host_rsa_key.pub
# netstat -tlnp|grep ssh
tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN      3188/sshd
```

```bash
$ ssh root@ip
#使用systemctl时 
$ systemctl restart sshd
$ exit
```

- 公钥记录档

```bash
# 删除掉known_hosts后，重新使用root连线到本机，且自动加上公钥记录
$ rm ~/.ssh/known_hosts 
$ ssh -o StrictHostKeyChecking= no root@localhost
Warning: Permanently added 'localhost' (RSA) to the list of known hosts.
root@localhost's password:
# 如上所示，不会问你yes 或no 啦！直接会写入~/.ssh/known_hosts 当中！
```

#### 配置参数

所有的 sshd 服务器详细设定位于`/etc/ssh/sshd_config` 

```bash
 vim /etc/ssh/sshd_config 
```

1. 整体设定

```bash
# Port 22 
# SSH预设使用22这个port，也可以使用多个port，即重复使用port这个设定项目！
# 例如想要开放sshd 在22 与443 ，则多加一行内容为：『 Port 443 』

Protocol 2 
#选择的SSH协定版本，可以是1也可以是2 ，CentOS 5.x预设是仅支援V2。
# 如果想要支援旧版V1 ，就得要使用『 Protocol 2,1 』才行。

# ListenAddress 0.0.0.0 
#监听,如：你有两个IP，分别是192.168.1.100及192.168.100.254，假设你只想要让192.168.1.100 可以监听sshd ，那就这样写：『 ListenAddress 192.168.1.100 』预设值是监听所有介面的SSH 要求

# PidFile /var/run/sshd.pid 
#可以放置SSHD这个PID的档案！上述为预设值

# LoginGraceTime 2m 
#当使用者连上SSH server之后，会出现输入密码的画面，在该画面中，
# 在多久时间内没有成功连上SSH server 就强迫断线！若无单位则预设时间为秒！

# Compression delayed 
#指定何时开始使用压缩资料模式进行传输。有yes, no与登入后才将资料压缩(delayed)

```

2. Private Key放置的档案

```bash
# HostKey /etc/ssh/ssh_host_key         # SSH version 1使用的私钥
# HostKey /etc/ssh/ssh_host_rsa_key     # SSH version 2使用的RSA私钥
# HostKey /etc/ssh/ssh_host_dsa_key     # SSH version 2使用的DSA私钥
```

3. 关于登录档的讯息资料放置与daemon的名称！

```bash
SyslogFacility AUTHPRIV 
#当有人使用SSH登入系统的时候，SSH会记录资讯，这个资讯要记录在什么daemon name底下？
#预设是以AUTH 来设定的，即是/var/log/secure 里面
#其他可用的daemon name为：DAEMON,USER,AUTH,LOCAL0,LOCAL1,LOCAL2,LOCAL3,LOCAL4,LOCAL5,

# LogLevel INFO 
#登录记录的等级考
```

4. 安全设定项目

```bash
# 4.1登入设定部分
# PermitRootLogin yes 
#是否允许root登入！预设是允许的，但是建议设定成no！

# StrictModes yes 
#是否让sshd去检查使用者家目录或相关档案的权限资料，
# 这是为了担心使用者将某些重要档案的权限设错，可能会导致一些问题所致。
# 例如使用者的~.ssh/ 权限设错时，某些特殊情况下会不许用户登入

# PubkeyAuthentication yes
# AuthorizedKeysFile .ssh/authorized_keys 
#是否允许用户自行使用成对的密钥系统进行登入行为，仅针对version 2。
# 至于自制的公钥资料就放置于使用者家目录下的.ssh/authorized_keys 内

PasswordAuthentication yes 
#密码验证

# PermitEmptyPasswords no 
#是否允许以空的密码登入

# 4.2认证部分
# RhostsAuthentication no 
#本机系统不使用.rhosts，因为仅使用.rhosts太不安全了，所以这里一定要设定为no

# IgnoreRhosts yes 
#是否取消使用~/.ssh/.rhosts来做为认证！当然是！

# RhostsRSAAuthentication no # 
#这个选项是专门给version 1用的，使用rhosts档案在/etc/hosts.equiv配合RSA 演算方式来进行认证！不要使用啊！

# HostbasedAuthentication no 
#这个项目与上面的项目类似，不过是给version 2使用的！

# IgnoreUserKnownHosts no 
#是否忽略家目录内的~/.ssh/known_hosts这个档案所记录的主机内容？不要忽略，所以这里就是no 啦！

ChallengeResponseAuthentication no 
#允许任何的密码认证！所以，任何login.conf规定的认证方式，均可适用！
# 但目前我们比较喜欢使用PAM 模组帮忙管理认证，因此这个选项可以设定为no

UsePAM yes 
#利用PAM管理使用者认证有很多好处，可以记录与管理。建议你使用UsePAM 且ChallengeResponseAuthentication 设定为no 
　
# 4.3与Kerberos有关的参数设定
# KerberosAuthentication no
# KerberosOrLocalPasswd yes
# KerberosTicketCleanup yes
# KerberosTgtPassing no
　
# 4.4 有关在X-Window底下使用的相关设定！
X11Forwarding yes
# X11DisplayOffset 10
# X11UseLocalhost yes 
#比较重要的是X11Forwarding项目，他可以让视窗的资料透过ssh通道来传送！

# 4.5登入后的项目：
# PrintMotd yes 
#登入后是否显示出一些资讯呢？例如上次登入的时间、地点等等，预设是yes
# 亦即是列印出/etc/motd 这个档案的内容。但是，如果为了安全，可以考虑改为no ！

# PrintLastLog yes 
#显示上次登入的资讯！预设是yes 

# TCPKeepAlive yes 
#当达成连线后，服务器会一直传送TCP封包给用户端借以判断对方式否一直存在连线。
# 不过，如果连线时中间的路由器暂时停止服务几秒钟，也会让连线中断！
# 在这个情况下，任何一端死掉后，SSH可以立刻知道！而不会有僵尸程序的发生！
# 但如果你的网路或路由器常常不稳定，那么可以设定为no！

UsePrivilegeSeparation yes 
#是否使用权限较低的程序来提供使用者操作。我们知道sshd启动在port 22 ，
# 因此启动的程序是属于root 的身份。那么当student 登入后，这个设定值
# 会让sshd 产生一个属于sutdent 的sshd 程序来使用，对系统较安全

MaxStartups 10 
#同时允许几个尚未登入的连线？当我们连上SSH ，但是尚未输入密码时，
# 这个时候就是我们所谓的连线！在这个连线中，为了保护主机， 所以需要设定最大值，预设最多十个连线，而已经建立连线的不计算在这十个当中

# 4.6关于使用者抵挡的设定项目：
DenyUsers * 
#设定受抵挡的使用者名称，如果是全部的使用者，那就是全部挡吧！
#若是部分使用者，可以将该帐号填入！例如下列！
DenyUsers test

DenyGroups test 
#与DenyUsers相同！仅抵挡几个群组而已！

```

5. 关于SFTP服务与其他的设定项目！

```bash
Subsystem sftp /usr/lib/ssh/sftp-server 
# UseDNS yes 
#一般来说，为了要判断用户端来源是正常合法的，因此会使用DNS去反查用户端的主机名
# 不过如果是在内网互连，这项目设定为no 会让连线达成速度比较快。
```


### sftp、scp

- 文件传输

```bash
$ sftp root@ip
$ sftp> lls /etc/hosts    <==先看看本机有没有这个档案
/etc/hosts
$ sftp> put /etc/hosts    <==上传该文件
Uploading /etc/hosts to /home/root/hosts
/etc/hosts 100% 243 0.2KB/s 00:00

$ sftt> lcd /tmp          <==切换本机目录到/tmp 
$ sftp> lpwd              <==查看本机所在目录
Local working directory: /tmp
$ sftp> get .bashrc       <==下载该文件到本地

```

- 异地复制

```bash
# 1.将本机的/etc/hosts*全部复制到127.0.0.1上面的student家目录内
$ scp /etc/hosts* student@127.0.0.1:~ 
# 2.将127.0.0.1这部远端主机的/etc/bashrc复制到本机的/tmp底下
$ scp student@127.0.0.1:/etc/bashrc /tmp
```