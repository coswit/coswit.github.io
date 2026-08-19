# 第16~18章 工程工具：ctags、:make/Quickfix 与 grep

> 三件套把 Vim 变成轻量 IDE：**ctags** 跳转定义，**:make** + **Quickfix** 定位编译错误，**:grep** 工程内搜索——三者的结果都汇入跳转/Quickfix 工作流。

## 一、用 ctags 建立索引并浏览源代码

## 生成 tags 文件

```bash
$ ctags -R           # 递归为当前工程生成 ./tags
```

- Vim 默认在 `'tags'` 选项指定的路径中查找 tags 文件（可 `:set tags+=./**/tags` 扩大范围）；
- 建议在工程根目录生成，代码变动后重新执行（可接入 git hook / 构建脚本自动化）。

## 跳转命令

| 按键/命令 | 用途 |
| --------- | ---- |
| `<C-]>` | 跳转到光标下关键字的**定义**（definition） |
| `g<C-]>` / `:tjump {关键字}` | 同上，但有多个定义时弹出选择列表 |
| `<C-t>` | 沿标签栈（tag stack）**返回**跳转前的位置 |
| `:tag {关键字}` | 命令行版跳转 |
| `:tags` | 查看标签栈 |

多个候选间遍历：

| 命令 | 用途 |
| ---- | ---- |
| `:tn[ext]` / `:tprev` | 下一个 / 上一个标签匹配 |
| `:tf[irst]` / `:tl[ast]` | 第一个 / 最后一个匹配 |
| `:ts[elect]` | 列出所有匹配供选择 |

## ctags 工作流

1. 光标放在函数/类名上，`<C-]>` 直达定义；
2. 阅读完后 `<C-t>` 逐层返回（或 `<C-o>` 走跳转列表，第9章）；
3. 一个符号多处定义时用 `g<C-]>`，在候选间 `:tn`/`:tp` 遍历。

## 二、编译代码并用 Quickfix 列表浏览错误

## 不离开 Vim 编译（:make 与 makeprg）

```bash
:make             " 调用 'makeprg'（默认 make），结果进 Quickfix
```

- 编译器选择与参数由 `'makeprg'` 控制：

```bash
:set makeprg=gcc\ -o\ %<\ %      " 当前 C 文件（%< 为无后缀文件名）
:set makeprg=rake                " Ruby 项目的 rake
```

- 错误信息由 `'errorformat'` 解析（`%f` 文件、`%l` 行号、`%c` 列号、`%m` 消息等），大多数编译器有现成配置（`:h errorformat`）。

## 浏览 Quickfix 列表

| 命令 | 用途 |
| ---- | ---- |
| `:copen` / `:cwindow` | 打开 Quickfix 窗口（列表中 `<CR>` 打开该条） |
| `:cclose` | 关闭 Quickfix 窗口 |
| `:cn[ext]` / `:cp[rev]` | 下一个 / 上一个错误 |
| `:cf[irst]` / `:cl[ast]` | 第一个 / 最后一个错误 |
| `:cc {N}` | 跳到第 N 条 |
| `:cnf[ile]` / `:cpf[ile]` | 下一个 / 上一个文件的首个错误 |

- 高效节奏：不开窗口，直接 `:cn`/`:cp` 步进（回车即可重复 `@:`）；
- 从错误跳回原位置：`<C-o>`（跳转列表，第9章）。

## Quickfix vs Location List

| Quickfix（全局唯一） | Location List（每个窗口一份） |
| -------------------- | ----------------------------- |
| `:make` / `:grep` 填充 | `:lmake` / `:lgrep` 填充 |
| `:copen` `:cn` `:cp` | `:lopen` `:ln` `:lp` |

- 同一任务想在不同窗口保留多份结果时用 location list；日常 `:make`/`:grep` 用 Quickfix 即可。

## 定制：让 :make 跑测试/Lint

`:make` 不限于编译——把 `'makeprg'` 指向测试运行器或语法检查工具，错误照样进 Quickfix 逐条定位：

```bash
:set makeprg=npm\ run\ test      " 例：前端项目跑测试
:set makeprg=eslint\ --format\ compact
:make!                           " ! = 不自动跳到第一个错误
:copen
```

## 三、用 grep 在工程内搜索

## 不离开 Vim 调用 grep

```bash
:grep {pattern} {文件}     " 外部 grep，结果进 Quickfix
:grep -r TODO .            " 递归搜当前目录
```

- 默认 `'grepprg'` 为 `grep -n $* /dev/null`；
- 之后用 Quickfix 命令浏览：`:copen`、`:cn`、`:cp`（见上文）。

## 定制外部 grep 程序（grepprg）

把 `'grepprg'` 指向更快/更好用的工具（书中以 ack 为例）：

```bash
:set grepprg=ack\ --nocolor\ --nogroup\ --column\ $*
```

- 如今常用 ripgrep（输出格式兼容 Quickfix）：

```bash
:set grepprg=rg\ --vimgrep
```

- 原则：工具会换，`'grepprg'` + `:grep` + Quickfix 的工作流不变。

## 使用 Vim 内置 grep（:vimgrep）

```bash
:vim[grep] /{pattern}/[g][j] {文件模式}
:vimgrep /practical/gj **/*.txt
```

| 标志 | 含义 |
| ---- | ---- |
| `g` | global：每行每个匹配都单列一条（缺省每行只列第一条） |
| `j` | jump：只更新 Quickfix，不跳到第一个匹配 |

- 特点：
  - 用 **Vim 自己的正则引擎**（支持 `\v` 等，第12章），跨平台一致；
  - 文件匹配 `**/*.txt` 递归（依赖 `'wildignore'` 排除）；
  - 大工程比外部 grep 慢——大仓库优先外部工具。

## 搜索工具选择

| 需求 | 工具选择 |
| ---- | -------- |
| 快速全工程搜索 | 外部 grep/rg（`:grep`） |
| 需要 Vim 正则/纯 Vim 环境 | `:vimgrep` |
| 只在当前文件 | `/pattern<CR>` + `n`（第13章） |
