

### 命令行参数

```shell
#当前执行脚本文件，.目录
my_dir="$(dirname "$0")"
cd "${my_dir}/../../"
```

$相关

|       符号        | 说明                                                         |
| :---------------: | ------------------------------------------------------------ |
|       `$$`        | Shell本身的PID（ProcessID）                                  |
|       `$!`        | Shell最后运行的后台Process的PID                              |
|       `$?`        | 最后运行的命令的结束代码（返回值）                           |
|       `$-`        | 使用Set命令设定的Flag一览                                    |
|       `$*`        | 所有参数列表，遍历时会将所有参数当成单个参数                 |
|       `$@`        | 所有参数列表。遍历时会将单独处理每个参数                     |
|       `$#`        | 输入的参数个数                                               |
|      `${!#}`      | 最后一个参数                                                 |
|     `$1～$9`      | 添加到Shell的各参数值。$1是第1参数、$2是第2参数，超出10需要使用${10} |
|       `$0`        | 调用Shell脚本时，输入的本身文件名，完整输入的路径名          |
| `$(basename $0)`  | 只包含脚本名称，去除输入的路径                               |
| `$(dirname "$0")` | 当前执行脚本所在目录，.目录                                  |

#### echo

```shell
#-n选项不会在字符串末尾输出换行符
echo -n "input text"

# -e启用转义字符 -E（默认）禁用转义字符
echo -e "Hello,\nWorld!"
```

### test命令

格式

```shell
if test condition;then
	commands
fi

#也可以使用另一种方式替代[]
if [ condition ]
then
	commands
fi
```

具体使用参考：

|            格式            | 命令              |
| :------------------------: | ----------------- |
| s1 = s2 (或者 <    !=   >) | 字符串比较大小    |
|          -n  str           | 检查字符串是否非0 |
|           -z str           | 检查字符串是否为0 |
|         n1 -eq n2          | 数值比较等于      |
|         n1 -ne n2          | 数值比较不等于    |
|         n1 -gt n2          | 数值比较大于      |
|         n1 -ge n2          | 数值比较大于等于  |
|         n1 -lt n2          | 数值比较小于      |
|         n1 -le n2          | 数值比较小于等于  |

### 数学运算

expr运算

| 操作符          | 描述                          |
| --------------- | ----------------------------- |
| ARG1 = ARG2     | 相等返回1，否则返回0          |
| ARG1 /* ARG2    | 相乘                          |
| $[ARG1 *  ARG2] | 相乘，可不加expr，直接使用$[] |
| str  :  regexp  | 正则匹配，                    |

bc: 浮点运算

```shell
#可查看版本
$ bc
#设置保留的小数位，默认0
>>> scale=3
#退出
>>> quit

#在脚本中使用bc
$ var1=$(echo "scale=4; 10/3" | bc)
```

### 结构化命令

#### 特殊符号

- 双括号：((expression))

  可以是任意的数学表达式或比较表达式，如val++， !， ~(求反)，|，||，**(幂运算)

  ```shell
  (( v2 = $v1 ** 2 ))
  ```

- 双方括号[[expression]]

  exp使用了test命令中的字符串比较，同时支持模式匹配。

  ```shell
  [[ $USER == r* ]]
  ```

#### if than

```shell
if cmd;then
	cmd
fi
#或者
if cmd
then
	cmd
fi
```

#### for循环

```shell
for var in list
do 
	cmd
done
```

#### case命令

```shell
case var in
pattern1 | pattern2) cmd;;
pattern3) cmd;
*) default cmd;;
esac
```

#### while循环

格式

```shell
while test command
do 
	other command
done
```

举例

```shell
var=1
while [ $var -gt 0 ]
do 
	echo $var
	var=$[ $var - 1 ]
#循环结果可输出
done  >> out.txt
```

#### util命令

```shell
until test command
do
	other command
done
```

### 其他命令

#### shift移动变量

默认情况下会将每个参数变量左移一个位置，如果某个参数被移出，它的值就被丢弃了。

```shell
while [ -n "$1" ]
do 
	echo "parameter: $1"
	#或者移动多位 shift 2
	shift
done
```

#### 分离参数选项--

--表明选项列表结束，可以将剩余的命令行参数当作参数。

#### getopt命令

格式：冒号(:)表示后面需要选项参数值，使用--来分割额外参数。-参数

```shell
$ getopt optstring parameters
```

示例

```shell
$  getopt ab:cd -ab test1 cd test2 test3
#-a -b test1 -- cd test2 test3
$ getopt ab:cd -ab test1 -cd test2 test3
#  -a -b test1 -c -d -- test2 test3
```

在脚本中可以使用set命令的--选项，将输入的命令行参数替换为转换的参数

```shell
set -- $(getopt -q ab:cd "$0")
```

#### getopts

不同于getopt，一次处理命令行上的一个参数，处理完会返回一个大于0的状态码。

格式：

```shell
$ getopts optstring variable
```

示例：

#### 用户输入read

```shell
#如果不指定最后的变量，数据会放入REPLY中
read -p "input content" content

#设置超时5s
read -t 5 -p "input content" content

#设置预期字符个数
read -n1 -p 
#隐藏输入字符
read -s -p
#从文本中读取
cat txt | while read line
```

### 输出

0 ：STDIN ，1:STDOUT， 2:STDERR

```shell
#重定向错误
2>
#重定向不输出
2> dev/null
```

#### 临时重定向

在文件描述符数字前加&

```shell
#临时重定向为错误输出
 >&2
```

#### 永久重定向

通过exec命令，指定脚本执行期间的某个文件描述符。

```shell
$ exec 2>file

#重定向输入
$ exec 0< inputFile
```

创建新的fd

```shell
exec 3>file
echo "this is show text" >&3
```

