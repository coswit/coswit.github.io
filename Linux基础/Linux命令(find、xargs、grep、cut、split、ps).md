## find

`find` 在目录树中递归查找，支持按名称、类型、大小、权限、时间、属主等条件筛选，还能用 `-exec` 对查到的每个文件执行命令。它通常是工具链的起点：find 负责找出文件，xargs 把结果交给其他命令批量处理，grep 搜内容，cut 切字段。

```bash
# -name 区分大小写，-iname 忽略大小写
# 查找 / 目录下与 passwd 名称相关的文件
$ find / -name passwd

# 列出当前目录下的目录，-maxdepth 1 限制只向下搜一层，-type d 只匹配目录
$ find . -maxdepth 1 -type d -print

# 搜寻带有 SGID、SUID 或 SBIT 特殊权限的文件，7000 即 ---s--s--t
# /7000 表示三个权限位任一匹配；旧写法 +7000 已废弃；-7000 则要求全部匹配
$ find / -perm /7000

# 找出系统中大于 1MB 的文件
$ find / -size +1000k

# -exec 后接要执行的命令，{} 会被替换成 find 查到的每一个文件，命令以 \; 结束（; 要转义）
$ find . -type f -exec ls -l {} \;
```

与时间有关的选项共有 `-atime`、`-ctime` 与 `-mtime`，三者语义相同，分别对应访问时间、属性变更时间与内容修改时间，下面以 `-mtime` 为例：

| 选项 | 说明 |
| --- | --- |
| `-mtime n` | n 为数字，在 n 天之前的"一天之内"修改过内容的文件 |
| `-mtime +n` | 在 n 天之前（不含第 n 天本身）修改过内容的文件 |
| `-mtime -n` | 在 n 天之内（含第 n 天本身）修改过内容的文件 |
| `-newer file` | file 为一个已存在的文件，列出比 file 更新的文件 |

```bash
# 列出过去 24 小时内修改过内容（mtime）的文件，0 代表目前的时间，即从现在往前 24 小时
$ find / -mtime 0

# 查询 /etc 目录下比 /etc/passwd 新的文件
$ find /etc -newer /etc/passwd
```

与使用者或用户组有关的选项：

| 选项 | 说明 |
| --- | --- |
| `-uid n` | n 为数字 UID（User ID），记录在 /etc/passwd |
| `-gid n` | n 为数字 GID（Group ID），记录在 /etc/group |
| `-user name` | name 为使用者账号名 |
| `-group name` | name 为用户组名 |
| `-nouser` | 文件的属主不在 /etc/passwd 中，比如属主账号已被删除 |
| `-nogroup` | 文件所属的用户组不在 /etc/group 中 |

```bash
$ find /home -user 用户名

# 搜寻系统中不属于任何人的文件
$ find / -nouser
```

## xargs

xargs 从标准输入（stdin）读取以空白分隔的各项，把它们拼接起来传给指定命令执行；不指定命令时默认执行 echo。作用类似于 find 的 -exec，但 xargs 默认把多个输入攒成一批传给命令（-n 控制每批的个数），而不是每个文件都启动一次命令。

```bash
# 从 c 源码文件中搜索字符串 main
$ ls *.c | xargs grep main

$ ls | xargs rm
```

| 参数 | 说明 |
| --- | --- |
| `-I {}` | 指定替换字符串（如 `{}`），用于在命令中插入输入项 |
| `-n N` | 每次执行命令时传递 N 个参数 |
| `-t` | 打印要执行的命令（调试用） |
| `-p` | 交互式询问是否执行命令 |
| `-d '分隔符'` | 指定输入的分隔符（默认是空格、换行等空白符） |
| `-0` | 以 \0（NULL）作为输入分隔符，配合 find -print0 使用 |
| `-r` | 如果输入为空，则不执行命令 |
| `-s MAX` | 设置命令行的最大长度（字节） |
| `-P N` | 并行执行，最多 N 个进程 |

使用 `-n` 分割输入：

```bash
# example.txt 文件中的内容为
# 1 2 3 4 5
# 6 7 8

# 将输入分割成多行，每行最多 4 个
$ cat example.txt | xargs -n 4
# 1 2 3 4
# 5 6 7 8
```

默认使用空白符分割，可用 `-d` 指定其他分隔符：

```bash
$ echo "split1Xsplit2Xsplit3Xsplit4" | xargs -d X
# 输出 split1 split2 split3 split4
```

与 find 结合时，find 用 -print0 以 \0（NULL）分割查找到的路径，xargs 再用 -0 解析。文件名一旦含有空格，普通的空白分割就会把一个路径拆成多段，-print0 / -0 的组合可以避免这个问题：

```bash
# 搜索 .docx 文件，用 grep 找出不含 image 的文件
$ find /smbMount -iname '*.docx' -print0 | xargs -0 grep -L image

# 删除指定类型的文件
$ find . -type f -name "*.txt" -print | xargs rm -f

# 统计 java 代码行数
$ find . -type f -name "*.java" -print0 | xargs -0 wc -l
```

选项 `-I`（replace-str）指定替换字符串，每一项输入都会替换掉命令中的 `{}`，这样命令就能控制输入项出现的位置：

```bash
# cecho.sh
#!/bin/bash
echo $* '#'

$ echo -e "arg1 \n arg2 \n arg3" | xargs -I {} ./cecho.sh -p {} -l
# -p arg1 -l #
# -p arg2 -l #
# -p arg3 -l #
```

```bash
# 把查找到的文件复制到指定目录，下面两种写法等价
$ find ./ -name "main_log*" | xargs -I {} cp {} ./log
$ find ./ -name "main_log*" -exec cp {} ./log \;
```

要对每个输入项执行多条命令，可以用 `sh -c` 包一层：

```bash
$ cat foo.txt
one
two
three

$ cat foo.txt | xargs -I {} sh -c 'echo {}; mkdir {}'
one
two
three

$ ls
one two three
```

一个实际的例子：通过 adb 给所有连接的设备安装 apk。`tail -n +2` 跳过第一行表头，`cut -sf 1` 取每行第一列的设备序列号（cut 的用法见下一节），`xargs -IX` 对每个序列号执行一次安装：

```bash
$ adb devices
# List of devices attached
# AJFK013914000324        device

$ adb devices | tail -n +2 | cut -sf 1 | xargs -IX adb -s X install -r com.myAppPackage
```

## grep

grep 在文件或输入流中逐行搜索匹配模式的行并输出，模式为正则表达式。配合上一节的 xargs，可以在 find 找出的一批文件里搜内容。

| 参数 | 作用 |
| --- | --- |
| `-i` | 忽略大小写 |
| `-v` | 反选，输出不匹配的行 |
| `-H` / `-h` | 显示 / 隐藏文件名前缀 |
| `-R` / `-r` | 递归搜索目录 |
| `-o` | 只输出匹配到的文本 |
| `-e` | 指定匹配模式，可重复出现以匹配多个模式 |
| `-E` | 使用扩展正则表达式 |
| `-l` / `-L` | 只列出包含 / 不包含匹配内容的文件名 |
| `--color=always` | 高亮关键词 |
| `-A n` / `-B n` | 显示匹配行之后 / 之前 n 行 |
| `-C n` | 显示匹配行前后各 n 行 |
| `-n` | 显示所在行号 |
| `-c` | 统计每个文件匹配到的行数 |

```bash
# 匹配特定模式。默认使用基础正则表达式，加 -E 使用扩展正则
# egrep/fgrep 已被标记废弃，推荐统一使用 grep -E / grep -F
$ grep -E "pattern" filename
$ grep -E "[a-z]+" filename

# -e 匹配多个模式
$ grep -e "pattern1" -e "pattern2"

# 在多个文件中搜索，也可匹配正则
$ grep "match_text" file1 file2
$ grep -E -i "fatal|AndroidRuntime" -h ./logs/android_logs/applog/applog*

# 使用 -o 只输出匹配到的文本
$ echo this is a line. | grep -E -o "[a-z]+\."
line.

# -v 输出不匹配的行
$ grep -v match_pattern file
$ adb shell logcat | grep -E -v "removeDirectiveWithoutDialogFinished" | grep -E "SmartSummaryService"

# 递归搜索目录下的所有文件
$ grep "text" . -R -n

# 下述两个搜索是等价的
$ grep "test_function()" . -R -n
$ find . -type f | xargs grep "test_function()"

# 使用通配符 include/exclude 指定要搜索的文件
$ grep "main()" . -r --include=*.{c,cpp} --exclude="README" --exclude-dir=build

# 打印匹配行之前或之后的 n 行，-A3 即之后 3 行
$ grep -A3 "Exception" log.txt

# -l 列出包含匹配内容的文件
$ grep -l linux e1.txt e2.txt
```

## cut

cut 按位置切分每一行并取出指定的部分，可以按字节、按字符，也可以按分隔符分隔的字段取列。上面 adb 管线里的 `cut -sf 1` 取的就是每行的第一列。

| 选项 | 说明 |
| --- | --- |
| `-b` | 以字节为单位分割，忽略多字节字符边界，除非同时指定 -n |
| `-c` | 以字符为单位分割 |
| `-d` | 自定义分隔符，默认为制表符 TAB |
| `-f` | 与 -d 一起使用，指定显示第几个字段 |
| `-n` | 取消分割多字节字符，与 -b 配合使用 |
| `-s` | 不输出不含分隔符的行，可用来去掉注释和标题行 |

```bash
# 以 : 为分隔符取 /etc/passwd 的第一列，得到系统上所有用户名
$ cut -d: -f1 /etc/passwd

# 也可以一次取多列，如第一列和第三列
$ cut -d: -f1,3 /etc/passwd
```

## split

split 与 cut 名字相近但职责不同：cut 切分的是每一行的字段，split 切分的是整个文件，把一个大文件拆成若干小文件。用法：`split [选项] [输入文件] [输出文件前缀]`。

```bash
# 按行数分割，每 1000 行一个文件
$ split -l 1000 bigfile.txt smallfile_

# 按字节大小分割，单位可以是 K、M、G
$ split -b 10M bigfile.bin smallfile_

# 按文件数量分割成 5 份
$ split -n 5 bigfile.txt part_

# 使用数字后缀（-d），并指定后缀长度（-a 3，生成 part_000、part_001……）
$ split -d -a 3 bigfile.txt part_

# 按字节分割，但保持行完整（不截断行）
$ split -C 1M logfile.log

# 指定行分隔符（默认为换行符）
$ split -t '|' file.csv
```

## ps

前面都是围绕文件与文本的工具，最后这个 ps（process status）换个对象，查看系统当前进程的快照，Android 设备上也常用它配合 adb 排查进程。

常见输出字段的含义：

| 字段名 | 含义说明 |
| --- | --- |
| `USER` | 用户名或 UID（如 `root`、`system`、`u0_a123`，`u0_aXX` 为普通应用 UID） |
| `PID` | 进程 ID |
| `PPID` | 父进程 ID |
| `VSZ` | 进程使用的虚拟内存大小（单位 KB） |
| `RSS` | 进程实际占用的物理内存大小（单位 KB） |
| `WCHAN` | 进程等待的内核函数（`-` 表示进程正在运行） |
| `PC` | 进程当前执行的程序计数器（内存地址） |
| `NAME` | 进程名称 |
| `STAT` | 进程状态（与 Linux 一致，如 `R` 运行、`S` 睡眠、`Z` 僵尸，`-f` 选项时显示） |
| `TID` | 线程 ID |

常用参数：

| 参数 | 说明 |
| --- | --- |
| `-p` | 查看指定 PID 的进程 |
| `-u` | 指定用户的所有进程 |
| `-e` / `-A` | 显示所有进程 |
| `-f` | 全格式（full）显示 |
| `-t` | 显示与终端（tty）关联的进程 |
| `-T` | `--threads`，显示进程包含的线程，如 `ps -T -p 4351` |
| `-o` | `--format`，自定义输出字段，逗号分隔，如 `ps -o PID,USER,NAME` |
| `--sort` | 按指定字段排序，+升序、-降序，如 `ps -ef --sort=-PID` |
| `-x` | BSD 风格选项，显示没有控制终端的进程 |

选项分两种风格，各自常用的组合：

```bash
# BSD 风格，选项不带连字符
$ ps aux

# System V / 标准风格
$ ps -ef
```
