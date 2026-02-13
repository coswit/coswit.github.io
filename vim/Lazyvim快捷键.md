## 基本操作

`<leader>`键一般为空格键

| 快捷键               | 描述                                |
| :------------------- | ----------------------------------- |
| `<leader>ft`         | 打开`terminal`                      |
| `ctrl /`             | 打开` / `隐藏` `terminal            |
| `ctrl ww`            | 焦点在各窗口之间切换                |
| `ctrl w` + `h/j/k/l` | 焦点移动到 ⬅️/⬇️/⬆️/➡️ 侧窗口           |
| `shift h`            | 移动到 ⬅️ 侧 buffer 标签             |
| `shift l`            | 移动到 ➡️ 侧 buffer 标签             |
| `shift k`            | 浮窗显示函数文档                    |
| `<leader>qq`         | 退出 nvim (quit all)                |
| `<leader>cd`         | 在 lsp 警告提示上执行可以看完整信息 |
| `<leader>xx`         | 可以在窗口中查看所有 lint 提示信息  |
| `<leader>cs`         | 显示函数/类大纲                     |
| `<leader>n`          | 查看 notify （通知消息） 历史       |
| `<leader>l`          | 打开 `lazy.vim` 窗口                |
| `<leader>fp`         | 快速切找项目                        |

## 搜索

| 快捷键             | 描述                                 |
| :----------------- | ------------------------------------ |
| `<leader><leader>` | 搜索                                 |
| `<leader>ff`       | 快速查找文件                         |
| `<leader>fF`       | Cwd(Current Working directory)下查找 |
| `<leader>sg`       | 在项目中搜索内容                     |
| `<leader>sb`       | 在当前buffer中搜索                   |
| `<leader>fr`       | 打开最近文件                         |
| `s` + 任意字符串   | 快速搜索定位，当前可见界面           |

`<leader><leader>`：`Alt-s`，进行选择跳转；Tab进行多文件选择打开，`Ctr-d`和`Ctr-u`进行文件上下选择，`Ctr-f`和`Ctr-b`进行选中的文件进行上下预览。

## 文件管理器

snacks explorer插件：

| 快捷键                 | 描述                            |
| ---------------------- | ------------------------------- |
| `:lcd`                 | 变更`Cwd`                       |
| `<leader>e``<leader>E` | 打开或关闭文件管理器            |
| `Esc`                  | 隐藏文件管理器                  |
| `i`                    | 进入文件搜索                    |
| `a`                    | `add`新建文件或文件夹 （/结尾） |
| `c`                    | `copy` 文件                     |
| `m`                    | `move` 文件 / 重命名            |
| `r`                    | `rename`重命名文件              |
| `d`                    | `delete` 删除文件 / 目录        |
| V 选中后 `y`           | 多选文件 / 目录                 |
| H                      | 显示隐藏文件                    |
| I                      | 显示隐藏.gitignore忽略文件      |
| ？                     | 帮助                            |

## 窗口

| 键位        | 描述         | 模式 |
| ----------- | ------------ | ---- |
| `<C-h>`     | 跳至左侧窗口 | n, t |
| `<C-j>`     | 跳至下方窗口 | n, t |
| `<C-k>`     | 跳至上方窗口 | n, t |
| `<C-l>`     | 跳至右侧窗口 | n, t |
| `<C-Up>`    | 增加窗口高度 | n    |
| `<C-Down>`  | 减少窗口高度 | n    |
| `<C-Left>`  | 减少窗口宽度 | n    |
| `<C-Right>` | 增加窗口宽度 | n    |

## jetbrains 对照

| 快捷键              | 描述                         | jetbrains 快捷键  |
| ------------------- | ---------------------------- | ----------------- |
| `gd`                | 跳转到定义处                 | `cmd b`           |
| `gr`                | 显示引用                     | `cmd b`           |
| `ctrl o / ctrl + i` | 跳转回原处                   | `cmd opt <- / ->` |
| `<leader>/`         | 全局关键字搜索               | `cmd shift f`     |
| `<leader>sg`        | 全局关键字搜索               | cmd shift f       |
| `<leader>cr`        | 变量名重构                   | `shift f6`        |
| `zM`                | 折叠所有函数体               | `cmd shift -`     |
| `zR`                | 展开所有函数体               | `cmd shift +`     |
| `za`                | 折叠/打开当前函数体          | `cmd -`           |
| `zo`                | 展开当前函数体               | `cmd +`           |
| `zc`                | 折叠当前函数体               | -                 |
| `gc`                | `多行` 注释/取消注释         | `cmd /`           |
| `gcc`               | `单行` 注释/取消注释         | `cmd /`           |
| `:%s/old/new/g`     | 当前文件替换                 | `cmd r`           |
| `<leader>sr`        | 批量查找替换                 | `shift cmd r`     |
| `<leader>sr \c`     | 退出替换窗口                 | -                 |
| `<leader>sr \r`     | 执行 `replace`               | -                 |
| `<leader>sr \s`     | 执行 `sync`，效果同`replace` | -                 |

## 其他

```bash
# 在命令行模式下，输入 :e file可以进行文件编辑
Control - y  # 直接选中文件

# 帮助查询
:help command 
```

