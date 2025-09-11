

### find

```shell
-iname 区分大小写

#查找/目录下与passwd名称相关的文件
$ find / -name passwd
#列出目录
$ find . -maxdepth 1 -type d  -print
#搜寻文件当中含有 SGID 或 SUID 或 SBIT 的属性，7000 就是 ---s--s--t
$ find / -perm +7000
#找出系统中大于1MB 的文件
$ find / -size +1000k

#-exec后面要执行的命令，{}表示find查找到的内容，执行命令以;结束，需要\转义
$ find . type f  -exec ls -l {} \;
```

- 与时间有关的选项：共有 -atime, -ctime 与 -mtime ，以 -mtime 说明

  ```shell
  -mtime  n ：n 为数字，意义为在 n 天之前的『一天之内』被更动过内容的文件；
  -mtime +n ：列出在 n 天之前(不含 n 天本身)被更动过内容的文件档名；
  -mtime -n ：列出在 n 天之内(含 n 天本身)被更动过内容的文件档名。
  -newer file ：file 为一个存在的文件，列出比 file 还要新的文件档名
  
  #将过去系统上面 24 小时内有更动过内容 (mtime) 的文件列出， 0代表目前的时间，所以，从现在开始到 24 小时前
  $ find / -mtime 0
  #查询 /etc目录下的文件，如果文件日期比 /etc/passwd 新就列出
  $ find /etc -newer /etc/passwd
  ```

- 与使用者或群组名称有关的参数：

  ```shell
  -uid n ：n 为数字 UID ，记录在 /etc/passwd 
  -gid n ：n 为数字，这个数字是群组名称的 ID，在/etc/group
  -user name ：name 为使用者帐号名
  -group name：name 为群组名
  -nouser 
  -nogroup   
  
  $ find /home -user 用户名
  #搜寻系统中不属於任何人的文件
  $ find / -nouser
  ```

### xargs

从标准stdin读取参数，然后执行指定命令。xargs默认会执行echo命令，类似于find的-exec。

```shell
#从c源码文件中搜索字符串main
$ ls  *.c | xargs grep main

$ ls | xargs rm
```

使用xargs进行分割：

```shell
#如example.txt文件中的内容为 
#1 2 3 4 5
#6 7 8

#会将输入数字分割成多行，每行n个
$ cat example.txt | -n 4
# 1 2 3 4
# 5 6 7 8
```

默认使用空白符分割，可指定

```shell
$ echo "split1Xsplit2Xsplit3Xsplit4" | xargs -d X
#输出 Split1 split2 split3 split4
```

与find结合，find中的-print0使用0(null)来分割查找到的元素，xargs 再以-0进行解析，代替空格符。

```shell
#搜索.docx文件，使用grep查找不包含image的文件
$ find /smbMount -iname '*.docx' -print0 | xargs -0 grep -L image

#删除指定类型文件
$ find . -type f -name "*.txt" -print | xargs rm -f 

#统计java代码行数
$ find . -type f -name "*.java" -print0 | xargs -0 wc -l
```

格式化参数，选项`-I`(replace-str)可用于指定字符串替换。指定每一项命令行参数的替代字符串

```shell 
#cecho.sh文件
#!/bin/bash
echo $* '#'

$ echo -e "arg1 \n arg2 \n arg3" | xargs -I {} ./cecho.sh -p {} -l
#输出
-p arg1 -l #
-p arg2 -l #
-p arg3 -l #

```

```shell
# 通过adb给所有连接设备安装对应apk
$ adb devices
# List of devices attached
# AJFK013914000324        device
$ adb devices | tail -n +2 | cut -sf 1 | xargs -IX adb -s X install -r com.myAppPackage
```

```shell
$ cat foo.txt
one
two
three

$ cat foo.txt | xargs -I file sh -c 'echo file; mkdir file'
one 
two
three

$ ls 
one two three
```

### grep

|      参数      | 作用               |
| :------------: | ------------------ |
|       -i       | 忽略大小写         |
|       -v       | 反选               |
|     -H/-h      | 显示/隐藏文件名    |
|     -R/-r      | 递归搜索           |
|       -o       | 只输出到匹配的文本 |
|       -e       | 匹配多个模式       |
| --color=always | 高亮关键词         |
|    -A/-B n     | 显示匹配 后/前 n行 |
|      -C n      | 显示匹配前后n行    |
|       -n       | 显示所在行数       |
|       -c       | 文本匹配到的次数   |

```shell
#匹配特定模式,默认使用基础正则表达式，可加-E进行扩展,或者使用egre
$ grep  -E "patten" filename
$ egrep "[a-z]+" filename

#-e 匹配多个模式
$ grep -e "pattern1" -e "pattern2"

#在多个文件中搜索，也可匹配正则
$ grep "match_text" file1 file2
$ egrep -i "fatal|AndroidRuntime"  -h ./logs/android_logs/applog/applog*

#使用-o只输出到匹配的文本
$ echo this is a line. | egrep -o "[a-z]+\."
line.

#-v输出不匹配的行
$ grep -v match_pattern file
$ adb shell logcat | egrep  -v "removeDirectiveWithoutDialogFinished" | egrep "SmartSummaryService"

#递归搜索多个文件
$ grep "text" . -R -n
#下述两个搜索是等价的
$ grep "test_function()" . -R -n
$ find . -type f | xargs grep "test_function()" 

#使用通配符include或exclude指定文件
$ grep "main()" . -r --inclue *.{c,cpp} --exclude "README" -exclude-dir build

#打印匹配后的之前或之后的行
$ grep -A3 "Exception" log.txt

#-l列出所在的文件
$ grep -l linux e1.txt e2.txt
```

### cut

```
-b：以字节为单位进行分割。这些字节位置将忽略多字节字符边界，除非也指定了 -n 标志。 
-c：以字符为单位进行分割。 
-d：自定义分隔符，默认为制表符“TAB”； 
-f：与-d一起使用，指定显示哪个区域。
-n：取消分割多字节字符
-s表示不包括那些不含分隔符的行（这样有利于去掉注释和标题）
```

```shell
$ adb devices | tail -n +2 | cut -sf 1 | xargs -IX adb -s X install -r com.myAppPackage
```
