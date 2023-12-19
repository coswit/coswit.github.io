
[TOC]



<img src="./images/vi_en.png" alt="img" style="zoom:100%;" />

### 通用

vim:中和shell中均可以使用

| 操作              | 用途                         |
| ----------------- | ---------------------------- |
| `<C-h>`           | 删除前一个字符               |
| `<C-w>`           | 删除前一个单词               |
| `<C-u>`           | 删除至行首                   |
| `<C-d>`           | 显示补全列表                 |
| `<C-n>`  `<C-p>`  | 补全列表正、反向选择         |
| `<C-r>{register}` | 把任意寄存器的内容插入命令行 |
| `<C-v>`  `<C-k>`  | 插入键盘上找不到的字符       |

### 基本

| 目的                   | 操作                  | 重复 | 回退 |
| ---------------------- | --------------------- | ---- | ---- |
| 一次修改               | `{edit}`              | u    | .    |
| 行内查找下一个指定字符 | `f{char}`/`t{char}`   | ;    | ,    |
| 行内查找上一个指定字符 | F{char}`/`T{char}`    | ;    | ,    |
| 文档中查找下一处匹配项 | /pattern`<CR>`        | n    | N    |
| 文档中查找上一处匹配项 | ?pattern`<CR>`        | n    | N    |
| 行替换                 | :s/target/replacement | &    | u    |
| 执行一系列修改         | qx{changes}q          | @x   | u    |

### 普通模式
| ESC  或 <C-[> | 普通模式 |
| ------------- | -------- |


##### 高频使用

| 操作 | 目的                              |
| ---- | --------------------------------- |
| `.`  | 重复                              |
| u    | undo                              |
| 0    | 移动到这一行的最前面字符处        |
| `$`  | 行尾定位                          |
| G    | 文档尾行                          |
| gg   | 移动到这个档案的第一行，相当于 1G |
| ndd  | n 为数字。删除光标所在的向下 n 列 |

| 复合命令 | 等效的长命令 |
| -------- | ------------ |
| C        | c$           |
| s        | cl           |
| S        | ^c           |
| I        | ^i           |
| A        | $a           |
| o        | `A<CR>`      |
| O        | ko           |

| 操作命令        | 用途                      |
| --------------- | ------------------------- |
| `g~`            | 反转大小写                |
| gu              | 转为小写                  |
| gU              | 转为大写                  |
| gUap            | 整段文字转换为大写        |
| gUU             | 当前行转换为大写          |
| gUaw            | 单词转换为大写            |
| `>   <`         | 增加/减小 缩进            |
| `=`             | 自动缩进                  |
| yyp             | 行复制                    |
| `<C-a>   <C-x>` | 执行加/减操作 如`10<C-x>` |
| daw             | 删除一个单词              |
| dap             | 删除一个段落              |
| dl              | 删除一个字符              |

### 可视模式 

| 激活可视模式 | 可视模式                                                     |
| :----------- | ------------------------------------------------------------ |
| v            | 面向字符                                                     |
| V            | 面向行                                                       |
| `<C-v>`      | 面向列块                                                     |
| gv           | 重选上次的高亮区域                                           |
| o            | 切换高亮选区活动端                                           |
| vit          | 高亮选中标签内部的内容，**it** 命令是一种被称为文本对象（textobject） |

### 插入模式
|                   | 插入模式(Insert mode)：                                      |
| ----------------- | ------------------------------------------------------------ |
| `<C-o>`           | 切换到插入-普通模式                                          |
| i                 | 从目前光标所在处插入enter insertion mode before current character |
| I                 | 目前所在行的第一个非空格符处开始插入enter insertion mode before first non-whitespace character |
| a                 | 从目前光标所在的下一个字符处开始插入enter insertion mode after current character |
| A                 | 从光标所在行的最后一个字符处开始插入enter insertion mode after end of line |
| o                 | 在目前光标所在的下一行处插入新的一行open line below and enter insertion mode |
| O                 | 在目前光标所在处的上一行插入新的一行 open line above and enter insertion mode |
| r, R              | 进入取代模式(Replace mode)： r 只会取代光标所在的那一个字符一次；R会一直取代光标所在的文字，直到按下 ESC 为止 |
| `<C-r>{register}` | 插入寄存器中的内容，如`yt,`会复制开始位置至`,`到寄存器中，再输入`<C-r>0` |
| `<C-r>=`          | 使用寄存器进行计算，如`<C-r>=5*6`                            |
|                   |                                                              |

### 命令行模式
操作缓冲区文本命令

| 命令                                             | 用途                                              |
| ------------------------------------------------ | :------------------------------------------------ |
| `:[range]delete [x]`                             | 删除指定范围内的行[到寄存器x中]                   |
| `:[range]yank [x]`                               | 复制指定范围的行[到寄存器x中]                     |
| `:[line]put [x]`                                 | 在指定行后粘贴寄存器x中的内容                     |
| `:[range]copy {address}`                         | 把指定范围内的行拷贝到 {address} 指定的行之下     |
| `:[range]move {address}`                         | 把指定范围内的行移动到 {address} 指定的行之下     |
| `:[range]join`                                   | 连接指定范围内的行                                |
| `:[range]normal {commands}`                      | 对指定范围内的每一行执行普通模式命令 {commands}   |
| `:[range]substitute/{pattern}/ {string}/[flags]` | 把指定范围内出现{pattern}的地方替换为{string}     |
| `:[range]global/{pattern}/[cmd]`                 | 对指定范围内匹配{pattern}的所有行执行Ex 命令{cmd} |


一般命令

| 操作                     | 含义                                               |
| ------------------------ | -------------------------------------------------- |
| `:<C-r><C-w>`            | 命令模式下，插入光标下的单词                       |
| `:<C-r><C-a>`            | 命令模式下，插入光标下的字串                       |
| `:%`                     | 当前文档中的所有行，相当于`:1,$`                   |
| `:%s/查找字符/替换字符`  | 全局替换指定字符                                   |
| `: .`                    | 当前行                                             |
| `:1`                     | 文件第一行                                         |
| `:0`                     | 虚拟行，文件第一行上方                             |
| `:$`                     | 文件最后一行                                       |
| `:start,end`             | 开始到结束行                                       |
| `‘m`                     | 包含位置标记m的行                                  |
| `’<`                     | 高亮区起始行                                       |
| `‘>`                     | 高亮区尾行                                         |
| `:{address}+n`           | 位置偏移，如`: .,+3p`                              |
| `:normal`                | 普通模式命令，如`:;%normal A;`所有文档文档行尾加； |
| `@:`                     | 重复上次命令，一次后可以使用@@                     |
| `:bn[ext]  :bp[revious]` | 缓冲区的下一条，上一条                             |
| `:q`                     | 打开历史命令行窗口                                 |
| `q/`                     | 查找历史命令行窗口                                 |
| `<C-f>`                  | 命令行模式切换到命令行窗口模式                     |
| `:!shellCmd`             | 进入shell-cmd，退出exit，在此模式下%表示当前文件名 |
| `Ctrl+z`                 | 挂起，可通过fg唤起                                 |
| `$jobs`                  | 查看                                               |
| /                        | 正向查找                                           |
| ？                       | 反向查找                                           |
| =                        | 对vim表达式求值                                    |

重命名下述代码的tally为counter

```javascript
var tally;
 for (tally=1; tally <= 10; tally++) {
   // do something with tally
 };
```

```shell
#光标移到到要修改的首行单词位置
*
cw counter
:%s//<C-r><C-w>/g:
```

命令复制与移动行

| :[range]copy {address}：        | 令复制行                         |
| ------------------------------- | -------------------------------- |
| `:6t.` 或`:6 copy .`或`:6 co .` | 把第6行复制到当前行下            |
| `:t6`                           | 把当前行复制到第6行下            |
| `t.`                            | 为当前行创建一个副本(相当于yyp)  |
| `:t$`                           | 当前行复制到文本结尾             |
| `:'<,'>t0`                      | 把高亮区选中的文本复制到文件开头 |

| :[range]move {address} | 命令移动行                      |
| ---------------------- | ------------------------------- |
| :m                     | 通复制命令                      |
| `:'<,'>m$`             | 高亮区移动到文件尾，相当于`dGp` |

### 文件管理

| 操作                                    | 功能                          |
| --------------------------------------- | ----------------------------- |
| :ls                                     | 展示当前缓冲文件列表          |
| `:bnext`  `:bprev`  `:bfirst`  `:blast` | 切换缓冲区                    |
| `<C-^>`                                 | 当前文件和轮换文件进行切换    |
| :buffer N                               | 跳转到指定缓冲区              |
| :bdelete N1 N2  或者  :N,Mbd            | 删除缓冲区，`:5,10bd`删除5-10 |

缓存区列表

```shell
 %:表示哪个缓冲区在当前窗口可见；#代表轮换文件
  1 %a   "motions/template.js"          line 10  
  4      "motions/disable-arrowkeys.vim" line 3
  5 #    "motions/parentheses.rb"       line 8
```

### 移动跳转

> A **word** consists of a sequence of letters, digits, and underscores, or as a sequence of other nonblank characters separated with whitespace.
>
> The definition of a **WORD** is simpler: it consists of a sequence of nonblank characters separated with whitespace

| 操作       | 目的                                                         |
| ---------- | :----------------------------------------------------------- |
| w or W     | 正向移动到下一单词的开头， w-单词，W-字串                    |
| e or E     | Forward to end of current/next **word/Word**                 |
| ge or gE   | Backward to end of previous **word/Word**                    |
| b or B     | Backward to start of current/previous **word/Word**          |
| `*`        | 等同于输入`/\<<C-r><C-w>\><CR>`                              |
| ^          | 到第一个非空白字符                                           |
| %          | 匹配括号移动                                                 |
| `<C-f>`    | 屏幕『向下』移动一页，相当于 [Page Down]按键 (常用)          |
| `<C-b>`    | 屏幕『向上』移动一页，相当于 [Page Up] 按键 (常用)           |
| `<C-d>`    | 屏幕『向下』移动半页                                         |
| `<C-u>`    | 屏幕『向上』移动半页                                         |
| +          | 光标移动到非空格符的下一列                                   |
| -          | 光标移动到非空格符的上一列                                   |
| `n<space>` | 那个 n 表示『数字』，例如 20 。按下数字后再按空格键，光标会向右移动这一行的 n 个字符。例如 `20<space>` 则光标会向后面移动 20 个字符距离。 |
| H          | 光标移动到这个屏幕的最上方那一行的第一个字符                 |
| M          | 光标移动到这个屏幕的中央那一行的第一个字符                   |
| L          | 光标移动到这个屏幕的最下方那一行的第一个字符                 |
| nG         | n 为数字。移动到这个档案的第 n 行。20G 则会移动到第 20 行(可配合 :set nu) |
| g_         | 到本行最后一个不是blank的位置                                |
| `n<Enter>` | n 为数字。光标向下移动 n 行(常用)                            |


### 动作命令

分隔符文本对象

| 文本对象                                  | 选择区域                  | 文本对象 | 选择区域                |
| ----------------------------------------- | ------------------------- | -------- | ----------------------- |
| `a)`或ab                                  | `(parentheses)`一对圆括号 | `i)`或ib | (parentheses)圆括号内部 |
| `a}`或aB                                  | `{braces}`一对花括号      | `i}`或iB | {braces}花括号内部      |
| `a]`                                      | `[brackets]`              | `i]`     | `[brackets]`内部        |
| a'                                        | 'single quotes ' 单引号   | i'       |                         |
| a"                                        | "double quotes"           | i"       |                         |
| a`       | 反引号backticks           | i` |                           |          |                         |
| at                                        | xml标签`<xml>tags</xml>`  | it       |                         |

范围文本对象(inside & around)

| 文本对象 | 选择范围 | 文本对象 | 选择范围           |
| -------- | -------- | -------- | ------------------ |
| iw       | 当前单词 | aw       | 当前单词及一个空格 |
| iW       | 当前字串 | aW       |                    |
| is       | 当前句子 | as       |                    |
| ip       | 当前段落 | ap       |                    |









### 搜寻与取代

| 操作                  | 目的                                                         |
| --------------------- | ------------------------------------------------------------ |
| /word                 | 向光标之下寻找一个名称为 word 的字符串。例如要在档案内搜寻 vbird 这个字符串，就输入 /vbird 即可！ (常用) |
| ?word                 | 向光标之上寻找一个字符串名称为 word 的字符串。               |
| n                     | 这个 n 是英文按键。代表『重复前一个搜寻的动作』。举例来说， 如果刚刚我们执行 /vbird 去向下搜寻 vbird 这个字符串，则按下 n 后，会向下继续搜寻下一个名称为 vbird 的字符串。如果是执行 ?vbird 的话，那么按下 n 则会向上继续搜寻名称为 vbird 的字符串！ |
| N                     | 这个 N 是英文按键。与 n 刚好相反，为『反向』进行前一个搜寻动作。 例如 /vbird 后，按下 N 则表示『向上』搜寻 vbird 。 |
| *                     | 向后查找光标当前所在单词                                     |
| #                     | 向前查找光标当前所在单词                                     |
| :n1,n2s/word1/word2/g | n1 与 n2 为数字。在第 n1 与 n2 行之间寻找 word1 这个字符串，并将该字符串取代为 word2 ！举例来说，在 100 到 200 行之间搜寻 vbird 并取代为 VBIRD 则： 『:100,200s/vbird/VBIRD/g』。(常用) |
| :1,$s/word1/word2/g   | 从第一行到最后一行寻找 word1 字符串，并将该字符串取代为 word2 ！(常用) |
| :1,$s/word1/word2/gc  | 从第一行到最后一行寻找 word1 字符串，并将该字符串取代为 word2 ！且在取代前显示提示字符给用户确认 (confirm) 是否需要取代！(常用) |

###  删除、复制与粘贴

| 操作     | 目的                                                         |
| -------- | ------------------------------------------------------------ |
| **c**    | 重复删除多个数据，例如向下删除 10 行，[ 10cj ]；普通模式命令cw会删除从光标位置到当前词结尾处的文本 |
| <Ctrl+r> | 重做上一个动作。(常用)                                       |
| .        | 小数点！重复前一个动作。 如果你想要重复删除、重复贴上等等动作 |
| J        | 将光标所在列与下一列的数据结合成同一列                       |
| ~        | 大小写改变                                                   |
| rc       | 用 c 替换光标所指向的当前字符                                |
| nrc      | 用 c 替换光标所指向的前 n 个字符                             |
| x, X     | 在一行字当中，x 为向后删除一个字符 (相当于 [del] 按键)， X 为向前删除一个字符(相当于 [backspace] 亦即是退格键) (常用) |
| nx       | n 为数字，连续向后删除 n 个字符。举例来说，我要连续删除 10 个字符， 『10x』。 |
| dd       | 删除游标所在的那一整列(常用)                                 |
| d1G      | 删除光标所在到第一行的所有数据                               |
| dG       | 删除光标所在到最后一行的所有数据                             |
| d$       | 删除游标所在处，到该行的最后一个字符                         |
| d0       | 那个是数字的 0 ，删除游标所在处，到该行的最前面一个字符      |
| yy       | 复制游标所在的那一行(常用)                                   |
| nyy      | n 为数字。复制光标所在的向下 n 列，例如 20yy 则是复制 20 列(常用) |
| y1G      | 复制游标所在列到第一列的所有数据                             |
| yG       | 复制游标所在列到最后一列的所有数据                           |
| y0       | 复制光标所在的那个字符到该行行首的所有数据                   |
| y$       | 复制光标所在的那个字符到该行行尾的所有数据                   |
| p, P     | p 为将已复制的数据在光标下一行贴上，P 则为贴在游标上一行！ 举例来说，我目前光标在第 20 行，且已经复制了 10 行数据。则按下 p 后， 那 10 行数据会贴在原本的 20 行之后，亦即由 21 行开始贴。但如果是按下 P 呢？ 那么原本的第 20 行会被推到变成 30 行。 (常用) |
| 5rA      | 用 A 替换光标所指向的前 5 个字符                             |
| dw       | 删除光标右侧的字                                             |
| ndw      | 删除光标右侧的 n 个字                                        |

### 储存、离开

|                                                              |                                                              |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| :w                                                           | 将编辑的数据写入硬盘档案中(常用)                             |
| :w!                                                          | 若文件属性为『只读』时，强制写入该档案。不过，到底能不能写入， 还是跟你对该档案的档案权限有关啊！ |
| :q                                                           | 离开 vi (常用)                                               |
| :q!                                                          | 若曾修改过档案，又不想储存，使用 ! 为强制离开不储存档案。    |
| 注意一下啊，那个惊叹号 (!) 在 vi 当中，常常具有『强制』的意思～ |                                                              |
| :wq                                                          | 储存后离开，若为 :wq! 则为强制储存后离开 (常用)              |
| ZZ                                                           | 这是大写的 Z 喔！若档案没有更动，则不储存离开，若档案已经被更动过，则储存后离开！ |
| :w [filename]                                                | 将编辑的数据储存成另一个档案（类似另存新档）                 |
| :r [filename]                                                | 在编辑的数据中，读入另一个档案的数据。亦即将 『filename』 这个档案内容加到游标所在行后面 |
| :n1,n2 w [filename]                                          | 将 n1 到 n2 的内容储存成 filename 这个档案。                 |
| :! command                                                   | 暂时离开 vi 到指令列模式下执行 command 的显示结果！例如 『:! ls /home』即可在 vi 当中察看 /home 底下以 ls 输出的档案信息！ |

| vim 环境的变更 |                                                    |
| -------------- | -------------------------------------------------- |
| :set nu        | 显示行号，设定之后，会在每一行的前缀显示该行的行号 |
| :set nonu      | 与 set nu 相反，为取消行号！                       |

### 组合建

d(delete)3w(word)    删除三个词

d(delete)5j(lines)     删除6行（包括当前行）

c(hange)w(word)    替换一个词

d(delete)t(till){    删除直到{字符之前

d(delete)i(inside)p(paragraph)     删除一个段落

z(scroll)t(top)    当前光标行滚动到顶部

z(scroll)b(bottom)     当前光标行滚动到底部

33G(Goto)    跳转到33行

6j(down)      光标下移6行