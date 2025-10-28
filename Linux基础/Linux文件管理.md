## 文件属性

<img src="./Linux基础/images/linux文件权限.png" alt="img" style="zoom:60%;" />

- 第一个字符代表这个文件是“目录、文件或链接文件等等”:

  > [ d ]则是目录  
  >
  > [ - ]则是文件
  >
  > [ l ]则表示为链接文件（link file）
  >
  > [ b ]则表示为设备文件里面的可供储存的周边设备（可随机存取设备）
  >
  > [ c ]则表示为设备文件里面的序列设备，例如键盘、鼠标（一次性读取设备）

- [ r ]代表可读（read）4、[ w ]代表可写（write）2、[ x ]代表可执行（execute）1、[-]无权限0


```
 [-]     [rwx]       [r-x]          [r--]  
[类型]  [拥有者权限] [组账号权限]  [其他账号权限] 
```

```shell
r(read):4  w(write):2  x(execute):1
rwx = 4+2+1 = 7
--- = 0+0+0 = 0
```

##  目录配置

<img src="./Linux基础/images/linux-catalog.png" alt="image" style="zoom:40%;" />

Filesystem Hierarchy Standard (FHS):FSH依据文件系统使用的频繁与否与是否允许使用者随意更动， 而将目录定义成为四种交互作用的形态

|                    | 可分享的(shareable)        | 不可分享的(unshareable) |
| ------------------ | -------------------------- | ----------------------- |
| 不变的(static)     | /usr (软件放置处)          | /etc (配置文件)         |
|                    | /opt (第三方协力软件)      | /boot (开机与核心档)    |
| 可变动的(variable) | /var/mail (使用者邮件信箱) | /var/run (程序相关)     |
|                    | /var/spool/news (新闻组)   | /var/lock (程序相关)    |

## 编辑

### mkdir

创建一个新的目录


```shell
#递归创建父文件夹
$ mkdir -p test1/test2/test3/test4
#-m ：配置文件的权限，创建权限为rwx--x--x的目录
$ mkdir -m 711 test2 
```

### touch 

 修改文件时间或新建

```shell
-a  ：仅修改 access time；
-c  ：仅修改文件的时间，若该文件不存在则不创建新文件；
-d  ：修改为解析后的时间
-m  ：仅修改 mtime ；
-t  ：修改时间，格式[YYMMDDhhmm]

#将 ~/.bashrc 复制成为 bashrc，假设复制完全的属性，检查其日期
$ cp -a ~/.bashrc bashrc
$ ll bashrc; ll --time=atime bashrc; ll --time=ctime bashrc
-rw-r--r-- 1 root root 176 Jan  6  2007 bashrc  <==这是 mtime
-rw-r--r-- 1 root root 176 Sep 25 21:11 bashrc  <==这是 atime
-rw-r--r-- 1 root root 176 Sep 25 21:12 bashrc  <==这是 ctime
#将日期调整为两天前
$ touch -d "2 days ago" bashrc
##日期改为 2007/09/15 2:02
$ touch -t 0709150202 bashrc
```

### rmdir

删除一个空的目录

```shell
#递归将父目录也删除
rmdir -p test1/test2/test3/test4
```

### ls 

|     命令      | 解释                                                         |
| :-----------: | :----------------------------------------------------------- |
|      -l       | 列出长数据串，包含文件的属性与权限数据等  -l (long)          |
|      -h       | -h (human) option将文件容量以较易读的方式（GB，kB等）列出来  |
|      -F       | 按文件和文件夹分类列出                                       |
|      -a       | 列出全部的文件，连同隐藏文件（开头为.的文件）一起列出来（常用） |
|      -d       | 仅列出目录本身，而不是列出目录的文件数据                     |
|      -t       | 按时间排序                                                   |
|      -R       | 递归列出                                                     |
|      -r       | 反向排序输出                                                 |
|      -S       | 文件容量大小排序                                             |
|  --full-time  | 以完整时间模式 (包含年、月、日、时、分) 输出                 |
|      -i       | 列出 inode 号码                                              |
| --color=never | 不显示颜色，=always ：显示颜色，=auto   ：让系统自行依据配置来判断是否给予颜色 |

```shell
$ ls -al ~ # 将家目录下的所有文件列出来(含属性与隐藏档)
# 不显示颜色，但在档名末显示出该档名代表的类型(type)
$ ls -alF --color=never  ~
# 完整的呈现文件的修改时间 *(modification time)
$ ls -al --full-time  ~
```

### cp 复制  

cp 源(source)  目标(destination)

```shell
-f  ：force，若目标文件已经存在且无法开启，则移除后再尝试一次；
-p  ：连同文件的属性一起复制过去，而非使用默认属性(备份常用)；
-r  ：递归复制

#复制前询问
$cp -i ~/.bashrc /tmp/bashrc

# -a将文件的所有特性一同复制，相当于 -pdr
$ cp -a /var/log/wtmp wtmp_2

#-s 以(symbolic link）复制，复制的 bashrc 创建一个连结档 (symbolic link)
$ cp -s bashrc bashrc_slink
#-l 以hard link创建
$ cp -l bashrc bashrc_hlink

#若 ~/.bashrc 与 /tmp/bashrc 有差异时才复制，可用于备份
$ cp -u ~/.bashrc /tmp/bashrc

#若复制文件是link类型，link一并复制
$ cp -d bashrc_slink bashrc_slink_2

#多文件复制，将多个数据一次复制到同一个目录去！后面一定是目录
$ cp ~/.bashrc ~/.bash_history /tmp
```

### rm 移除

```shell 
#互动模式
$ rm -i bashrc
#支持正则
$ rm -i bashrc*

#-f  ： force ，忽略不存在的文件，不会出现警告信息
$ rm -f bashrc*
#递归删除
$ rm -r /tmp/etc
# 在命令前加上反斜线，可以忽略掉 alias 的指定选项
$ \rm -r /tmp/etc
```

### mv

源(source)  目标(destination)

> -f  ：force 强制,不会询问
> -i  ：交互模式
> -u  ：update，文件有更新才移动

## 查询

### cat  

由第一行开始显示文件内容

```shell
-b  ：列出行号，仅针对非空白行做行号显示，空白行不标行号！
-E  ：将结尾的断行字节 $ 显示出来；
-T  ：将 [tab] 按键以 ^I 显示出来；
-v  ：列出一些看不出来的特殊字符

#-n列出行号
$ cat -n /etc/issue
#-A,相当于-vET，
$ cat -A /etc/xinetd.conf
```

### tac 

 从最后一行开始显示， tac 是 cat 的倒写

### more 

一页一页的显示文件内容

```
空格：下翻一页；
Enter ：代表向下翻『一行』；
/字串：查询对应字串
:f ：立刻显示出档名以及目前显示的行数；
q ：退出
b 或 [ctrl]-b ：回翻页
```

### less 

与 more 类似，但是比 more 更好的是，他可以往前翻页！

### head 

只看头几行

```shell
# 默认显示前面十行！-n 可以指定行数
$ head -n 20 /etc/man.config
```

### tail 

```shell
# 默认最后10行 -n 指定最后几行； -n +k 从k行开始输出
adb devices | tail -n +2
```

### od   

以二进位的方式读取文件内容，非存文本文件

### file

查看文件类型

### 搜索

### whereis (寻找特定文件)

```shell
-b    :只找 binary 格式的文件
-m    : manual，寻找指定路径下的文件
-s    :只找 source 来源文件
-u    :搜寻不在上述三个项目当中的其他特殊文件
```

### locate

```shell
-i  ：忽略大小写的差异；
-r  ：后面可接正规表示法的显示方式

#找出系统中所有与 passwd 相关的文件
$  locate passwd
```

## 排序

### sort

```shell
#按照数字顺序排序
$ sort -n file.txt
#按照逆序排序
$ sort -r file.txt
#合并两个已排序过的文件
$ sort -m sorted1 sorted2
#找出排序文档中的不重复行
$ sort file1.txt file2.txt | uniq
```

## 字符串替换tr

```shell
$ echo "HELLO WHO IS THIS" | tr 'A-Z' 'a-z' 
hello who is this
```

## 磁盘管理

### mount/umount

磁盘挂载，命令格式：

```shell
mount -t type device directory
umount directory device
```

如：

```shell
#手动将U盘/dev/sdb1挂载到 /media/disk
mount -t vfat /dev/sdb1 /media/disk

umount /mnt/d
```

### df

列出文件系统的整体磁盘使用量(report file system disk space usage)

```shell
-h :human-readable
-k:kBytes,m:M
-T:print-type,print file system type
-i:list inode information instead of block usage

$ df -h /etc/
Filesystem      Size  Used Avail Use% Mounted on
/dev/user        40G  2.9G   35G   8% /
```

### du

显示特定磁盘的使用情况(estimate file space usage)

```shell
-c  显示所有已列出的文件总大小
-s 输出每个参数汇总信息

#统计当前目录的大小
$ du -sh
#统计当前目录下的所有文件大小，包含隐藏文件，并按大小排序
$ du -sh * .* | sort -rh
#统计当前目录下一级子目录，并排序
$ du -h --max-depth=1 | sort
```

## 文件压缩与解压

### gz文件

```shell
#解压后会将原gz文件删除, decompress
$ gzip -d file.gz
#保留原文件keep
$ gzip -dk file.gz
#gunzip 等同于 gzip -d
$ gunzip file.gz

#解压到指定目录
$ for f in *.gz; do gunzip -c "$f" > ./test/"${f%.*}" ; done

#压缩,保留原文件
$ gzip -dk file.gz
$ gunzip -k file.gz
```

### tar文件

tar命令只归档，不压缩。起选项支持压缩

```shell
-c, -t, -x 不可同时出现在一串命令行中。
-c  ：创建打包文件
-x  ：解压缩的功能，可以搭配 -C 在特定目录解开
-t  ：查看打包文件的内容含有哪些文件名
    
-v  ：在压缩/解压缩的过程中，将正在处理的文件名显示出来

-z, -j, -J 不可以同时出现在一串命令行中
-z  ：通过 gzip的支持进行压缩/解压缩：此时文件名最好为 *.tar.gz
-j  ：通过 bzip2 的支持进行压缩/解压缩：此时文件名最好为 *.tar.bz2
-J  ：通过 xz的支持进行压缩/解压缩：此时文件名最好为 *.tar.xz    

-f filename：-f 后面要立刻接要被处理的文件名, -f 可以单独写一个选项
-C 目录，解压缩时指定特定目录

#归档
$ tar cvf file.tar
#解包
$ tar xvf file.tar

#压缩
$ tar zxvf file.tar.gz fileName
#解压
$ tar zxvf file.tar.gz
```

