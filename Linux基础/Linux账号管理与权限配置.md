## 账号与群组

账号与身份使用者记录在`/etc/passwd`文件内，密码则是记录在`/etc/shadow`，组名都纪录在`/etc/group`。

每个用户在登入系统时都是通过ID来标识的，一般至少包含两个ID：UID（User ID）、ID（Group ID)，系统会依据 `/etc/passwd` 与 `/etc/group`找到对应的ID。

UID：0是系统管理员，1-499保留给系统使用，500-65535给一般使用者用

```shell
#/etc/passwd
root:x:0:0:root:/root:/bin/bash
zhengjing:x:1000:1000:,,,:/home/zhengjing:/usr/bin/zsh
#/etc/group
root:x:0:
zhengjing:x:1000:
#/etc/shadow
root:$6$dXY:19702:0:99999:7:::
zhengjing:$6$:19667:0:99999:7:::
```

`/etc/passwd` ：账号名称（对应UID）：口令：UID ：GID ：用户信息说明栏 ：家目录 ：shell。

/etc/group ：组名：群组口令：GID：改组支持的账号名称

`/etc/shadow` ：账号名称 ：口令：最近口令变动日期 ：口令不可变动天数（基于前述日期） ：口令需要重新变更天数 ：口令需要变更期限前的警告天数 ： 口令过期后的账号宽限时间(口令失效日) ：账号失效日期 ：保留

登录过程：

1. 在`/etc/passwd` 里查找账号，如果有，则将该账号对应的 UID 与 GID (在 `/etc/group` 中) 读出来，该账号的**home**目录与 shell 配置也一并读出
2. 核对口令表，入 `/etc/shadow` 里面找出对应的账号与 UID，然后核对一下你刚刚输入的口令与里面的口令是否相符
3. 一切相符则进入shell管控

## 文件权限

`chgrp`:改变文件所属群组，-R : 递归(recursive)变更

```shell
$ chgrp users file
$ ls -l
```

`chown` ：改变文件拥有者

```shell
$ chown owner file
$ ls -l
-rw-r--r--  1 bin  users 68495 Jun 25 08:53 install.log
范例：将install.log的拥有者与群组改回为root：
#owner和群组都改为root
$ chown root:root file
#将owner改为root，组为shared
$ chown root.shared file
```

`chmod` ：改变文件的权限, SUID, SGID, SBIT等等的特性，-R : 递归(recursive)变更，

```shell
$ chmod 777 .bashrc
#通过u, g, o，a来代表三种身份的权限， u代表用户，g代表组，o代表其他用户，a表示上述所有
$ chmod  u=rwx,go=rx  .bashrc

#通过 +(加入) -(除去) 设定
$ chmod  a+w  file
$ chmod  o+r file
```

## 默认权限

umask ：显示创建文件时的默认权限。第一位表示粘着位(sticky bit)，后面3位表示文件或目录对应的八进制位。umask的值是指**”默认值需要减掉的权限“**。

与一般权限相关的是后三个数字，第一组是特殊权限使用的。0022创建的八进制文件权限是644。

> 对文件来说，全权限的值是666(所有用户都有读写权限)，对目录来说是777(所有用户都有读写执行权限)。

| 权 限 | 二进制值 | 八进制值 | 描 述            |
| :---: | -------- | -------- | ---------------- |
| - - - | 000      | 0        | 没有任何权限     |
| - - x | 001      | 1        | 只有执行权限     |
| - w - | 010      | 2        | 只有写入权限     |
| - w x | 011      | 3        | 有写入和执行权限 |
| r - - | 100      | 4        | 只有读取权限     |
| r - x | 101      | 5        | 有读取和执行权限 |
| r w - | 110      | 6        | 有读取和写入权限 |
| r w x | 111      | 7        | 有全部权限       |

umask值配置一般在/etc/profile中，有些在/etc/login.defs文件中(Ubuntu)。查看umask命令：

```shell
$ umask 
0022 
# -S (Symbolic) 
$ umask -S
u=rwx,g=rx,o=rx
```

配置umask

```shell
$ umask 002
```

## 隐藏权限

chattr:设置文件的隐藏数学

> +:增加一个特殊参数，-：删除
> i:让文件不能被删除，以让一个文件无法被更动
> a:只能添加数据，而不能删除也不能修改数据，只有root 才能配置

```shell
$ chattr +i attrtest
#增加属性后，不能被删除
$ rm attrtest
rm: remove regular empty file ‘attrtest’? yes
rm: cannot remove ‘attrtest’: Operation not permitted
$ chattr -i attrtest
```

lsattr:显示隐藏属性

```shell
$ lsattr -a
-------------e-- ./test2
----i--------e-- ./attrtest
```

## 文件特殊权限

```shell
$ ls -l /usr/bin/passwd
-rwsr-xr-x. 1 root root 27832 Jun 10  2014 /usr/bin/passwd
```

- SUID
  s 出现在文件拥有者的 x 权限上时，被称为 Set UID，称为SUID特殊权限。s、t的权限意义和系统的账号及系统的进程相关。
  > 1. SUID 权限二进制程序(binary program)有效；
  > 2. 运行者对该程序需要具有 x 可运行权限；
  > 3. 本权限仅在运行该程序的过程中有效 (run-time)；
  > 4. 运行者将具有该程序拥有者 (owner) 的权限。

- SGID 

  s 在群组的 x ,为 Set GID, SGID 。与SUID不同的是，SGID可以针对文件或目录来配置。对文件来说， SGID 有如下的功能：

  > 1. SGID 对二进位程序有用；
  > 2. 程序运行者对该程序需具备 x 的权限；
  > 3. 运行者在运行的过程中将会获得该程序群组的支持

  目录配置了 SGID 的权限后，他将具有如下的功能：

  > 1. 使用者若对此目录具有 r 与 x 的权限时，该使用者能够进入此目录；
  > 2. 使用者在此目录下的有效群组(effective group)将会变成该目录的群组；
  > 3. 用途：若使用者在此目录下具有 w 的权限(可以新建文件)，则使用者所创建的新文件，该新文件的群组与此目录的群组相同。

- Sticky Bit:SBIT，粘着位

  只对目录有效：当使用者在该目录下创建文件或目录时，仅有自己与 root 才有权力删除该文件

- SUID/SGID/SBIT 权限配置

  4 为 SUID，2为SGID，1为SBIT

  ```shell
  #加入具有 SUID 的权限
  $ chmod 4755 test; ls -l test 
  -rwsr-xr-x 1 root root 0 Sep 29 03:06 test
  ```

## 账号管理

### 账号添加

```shell
-s 指定shell，默认/bin/bash
-u 指定UID
-d 指定home目录
-g 指定组名

$ useradd username
```
具体进行了：
- 在 /etc/passwd 里面创建一行与账号相关的数据，包括创建 UID/GID/家目录等；
- 在 /etc/shadow 里面将此账号的口令相关参数填入，但是尚未有口令；
- 在 /etc/group 里面加入一个与账号名称一模一样的组名；
- 在 /home 底下创建一个与账号同名的目录作为用户家目录，且权限为 700

### 删除

```shell
 #-r 连同home目录一并删除
 $ userdel -r username
```

### 修改

- passwd

```shell
$ passwd username

#-S 列出相关参数
$ passwd -S username
username PS 2021-02-05 0 99999 7 -1 (Password set, SHA512 crypt.)
# 上面说明口令创建时间 (2021-02-05)、0 最小天数、99999 变更天数、7 警告日数 与口令不会失效 (-1)

# 每 60 天需要变更口令， 口令过期后 10 天未使用就宣告口令失效
$  passwd -x 60 -i 10 username
$ passwd -S username
username PS 2021-02-05 0 60 7 10 (Password set, MD5 crypt.)
```

- finger


```shell
#-s  ：仅列出用户的账号、全名、终端机代号与登陆时间等等
$ finger root 
```

- id 

```shell
$ id usrname
uid=1001(usrname) gid=1001(usrname) groups=1001(usrname)
```

### 身份切换

- su：switch user

```shell
#进行切换到root
$ su 
$ id
uid=0(root) gid=0(root) groups=0(root)
#离开root
$ exit

$ su - username
```

- sudo

 sudo 可以让你以其他用户的身份运行命令 (通常是使用 root 的身份来运行命令)，并非所有人都能够运行 sudo ， 而是仅有规范到 `/etc/sudoers` 内的用户才能够运行 sudo 

```shell
-u  ：后面可以接欲切换的使用者，若无此项则代表切换身份为 root
# 以 sshd 的身份在 /tmp 底下创建一个名为 mysshd 的文件
$ sudo -u sshd touch /tmp/mysshd
```

1. 当用户运行 sudo 时，系统于 /etc/sudoers 文件中搜寻该使用者是否有运行 sudo 的权限；
2. 若使用者具有可运行 sudo 的权限后，便让使用者『输入用户自己的口令』来确认；
3. 若口令输入成功，便开始进行 sudo 后续接的命令(但 root 运行 sudo 时，不需要输入口令)；
4. 若欲切换的身份与运行者身份相同，那也不需要输入口令。

- visudo 与 /etc/sudoers

```shell
$ visudo
#会进入文档编辑
...
root    ALL=(ALL)       ALL 
....
```
