

### sed

stream editor，不同于交互式文本编辑（如vim），流编辑器会在处理数据前会基于预先提供的规则来编辑数据流。

|   选项    | 描述                                     |
| :-------: | :--------------------------------------- |
| -e script | 在已有命令上加上script命令，执行多个命令 |
|  -f file  | 指定文件                                 |
|    -n     | 使用print完成输出                        |

#### 行命令

单行next命令(n)会使sed移动下一行文本到工作空间，多行next命令(N)会将下一文本行添加到**模式空间(pattern space)**已有文本后。

#### 空间命令

**保持空间(hold space)**，用来临时保存一些行。

| 命令 | 描述                                                       |
| :--: | ---------------------------------------------------------- |
|  h   | 将模式空间copy到保持空间                                   |
|  H   | 将模式空间append到保持空间                                 |
|  g   | 将保持空间copy到模式空间                                   |
|  G   | 将保持空间append到模式空间                                 |
| n/N  | Read/append the next line of input into the pattern space. |

```shell
cat data1.txt
This is header line.
This is first line.
This is second line.
This is end line.

$ sed -n '/first/ {h; p; n; p; g; p}' data1.txt
This is first line.  # h将过滤到的行放到保持空间，p打印模式空间内容
This is second line. # n提取下一行到模式空间，p打印模式空间
This is first line.  # g将保持空间内容放回到模式空间，p打印

# 按行数反转
$ sed -n '{1!G; h; $p}' data1.txt
```

#### 替换s

格式：s/pattern/replacement/flags

- flag: 
  - g ：全局替换
  - p：print the result if match
  - n：number，只替换第n个匹配
  - w file：替换结果写入文件
  - e：excute PatSpace to PatSpace，执行替换后的命令

```shell 
# 替换
# sed 's/原值/目标值/'
# sed 's/原值/目标值/g' 全局替换

# 指定行数
$ sed '2s/pattern/replacement/' # 只替换第二行
$ sed '2,3s/pattern/replacement/' # 2-3行
$ sed '2,$s/pattern/replacement'

# 执行多个命令
$ sed -e 's/a/b/; s/d/c/' test.txt

# 文本过滤替换
$ sed '/zhengjing/s/zsh/tsh/' /etc/passwd
```

行命令：

```shell
# 将包含first字串的所上行和下一行合并为一行
sed '/first/{N; s/\n/ /}' data1.txt

$ cat data2.txt
On Tuesday, the Linux System
Administrator's group meeting will be held.
All System Administrators should attend.

# 替换， .匹配了通配符模式，这个命令在执行前将下一行文本读入到模式空间，当到达最后一行时，没有下一行可读了，sed编辑器停止了
$ sed 'N ; s/System.Administrator/Desktop User/' data2.txt
On Tuesday, the Linux Desktop User's group meeting will be held.
All System Administrators should attend.

# 解决上面问题，将单行命令放在N命令前面，将多行命令放在N命令后面
$ 's/System Administrator/Desktop User/
> N
> s/System\nAdministrator/Desktop\nUser/' data2.txt

On Tuesday, the Linux Desktop
User's group meeting will be held.
All Desktop Users should attend.
```

#### 删除d

```shell
# 删除1-2行
$ sed '1,2d' data.txt
# 删除2-最后行
$ sed '2,$d' data.txt
# 删除包含字串number 2的行
$ sed '/number 2/d' data.txt 

# 删掉空白行
$ sed '/^$/d' data.txt
# 删除包含target字符的下一行
sed '/target/{n ; d}' data.txt
```

行命令：

```shell
# 删除包含target字符的下一行
$ sed '/target/{n ; d}' data.txt

# 多行删除时，d会将所在的行都删掉
$ sed 'N; /System\nAdministrator/d' data2.txt
# D则会删除到换行符就停止，不会删除到下一行
$ sed 'N; /System\nAdministrator/d' data2.txt
```

#### 插入i、增加a、修改c

不会修改原文件，格式：

```shell
sed '[address]command\  new line'
```

示例：

```shell
# 在每一行后插入
$ sed 'i\this is new line' data.txt 
# 在第2行插入，在第一行后
$ sed '2i\this is new line' data.txt 
# 在最后一行前面
$ sed '$i\this is new line' data.txt 

# 在每一行后增加
$ sed 'a\this is new line' data.txt 
# 将第三行的内容修改为新的内容
$ sed '3c\this is new line' data.txt 
```

#### 转换y

transform格式：

```shell
sed '[address]y/inchars/outchars'
```

```shell
# 将旧值改为新的值
$ sed 'y/12/89/' data.txt
```

#### 处理文件w/r

格式：

```shell
# 写入文件
sed '[address]w' filename

# 从文件读取数据
sed '[address]r' filename
```

```shell
#将data.txt中的第1行写入data2.txt中
$ sed '1w data2.txt' data.txt 

$ sed '2r data2.txt' data.txt
```

#### 打印p

```shell
# 多行打印p和P，与删除相同
$  sed -n 'N; /System\nAdministrator/p' data2.txt
$  sed -n 'N; /System\nAdministrator/P' data2.txt
```

#### 排除命令!

```Shell
sed -n '/header/!p' data1.txt
```

#### 分支b

格式：`[address]b [label]`

分支标签和跳转命令之间使用分号或换行

```shell
# 对2-3行之外的进行替换：line换num, .换?，.支持正则，需要进行转义
$ sed '{2,3b; s/line/num/; s/\./?/}' data1.txt
```

```shell
# 定义了分支start，如果能查找到则执行跳转该标签
$ echo "This, is, a, test, to, remove, commas." | sed -n '{:start s/,//1p; /,/b start}'
```

#### 测试t

格式：`[address]t [label]`

```shell
$ echo "This, is, a, test, to, remove, commas." | sed -n '{
:start s/,//1p
t start
}'
```

```shell
$ cat data1.txt
This is the header line.
This is the first line.
This is the second line.
This is the end line.
# 第一个未匹配才会执行第二个
$  sed '{s/first/matched/; t; s/This is/No match on/}' data1.txt
No match on the header line.
This is the matched line.
No match on the second line.
No match on the end line.
```

#### 模式替换

`&`用来代表替换命令中的匹配的模式

```shell
$  echo "The cat sleeps in his hat." | sed 's/.at/"&"/g'
The "cat" sleeps in his "hat".
```

`&`会提取匹配替换命令中指定模式的整个字串，如果想提取字串的部分，可使用了模式，sed会给第一个子模式分配`\1`，第n个分配`\n`

```shell
$  echo "The System Administrator manual" | sed 's/\(System\) Administrator/\1 User/'
The System User manual

$ echo "The furry cat is preety. The furry hat is preety" | sed 's/furry \(.at\)/\1/g'
The cat is preety. The hat is preety

$ echo "test1234567" | sed '{:start s/\(.*[0-9]\)\([0-9]\{3\}\)/\1,\2/; t start}'
test1,234,567
```

### awk

**gawk**是awk的GNU版本，基本格式：

```shell
$ gawk options program file
```

选项

|     选项     | 描述                                                      |
| :----------: | --------------------------------------------------------- |
|    -F fs     | 指定字段分隔符，默认分格符为空格或制表符，field-separator |
|   -f file    | 从指定文件中读取                                          |
| -v var=value | 定义变量及默认值                                          |
|    -mf N     | 指定要处理数据文件中的最大字段数                          |
|    -mr N     | 指定数据中的最大数据行数                                  |
|  -W keyword  | 指定兼容模式或警告等级                                    |

#### 变量

|    变量     | 描述           |
| :---------: | -------------- |
| FIELDWIDTHS | 按字段宽度分隔 |
|     FS      | 输入字段分隔符 |
|     OFS     | 输出字段分隔符 |

数据字段变量

```shell
$0  表示整个文本行
$1  表示文本中的第一个数据字段
$n  表示文本中的第n个数据字段
```

```shell
$ gawk -F: '{print $1}' /etc/passwd
```

```shell
$ echo "1234567890" | gawk 'BEGIN{FS="3|8"; OFS="-"} {print $1,$2,$3,$4}'
12-4567-90-

$ echo "1234567890" | gawk 'BEGIN{FIELDWIDTHS="2 3 2"} {print $1,$2,$3,$4}'
12 345 67
```

