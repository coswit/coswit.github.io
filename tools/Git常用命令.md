## status 与 diff

```bash
# 简洁状态信息
git status -s
git status --short
# --untracked-files，显示未跟踪文件
git status -u
```

```bash
# 查看已 add 的变化
git diff --staged
# 或
git diff --cached
```

| 命令                                      | 功能                                       |
| :---------------------------------------- | :----------------------------------------- |
| git diff HEAD                             | 显示工作区与当前分支最新 commit 之间的差异 |
| git diff [first-branch]...[second-branch] | 显示两次提交之间的差异                     |
| git diff --shortstat "@{0 day ago}"       | 显示今天你写了多少行代码                   |
| git show [commit]                         | 显示某次提交的元数据和内容变化             |
| git show --name-only [commit]             | 显示某次提交发生变化的文件                 |
| git show [commit]:[filename]              | 显示某次提交时，某个文件的内容             |

## log

```bash
# -p 或 --patch，显示每次提交所引入的差异
git log -p -2
# 查看每次提交的简略统计信息
git log --stat
```

### 选项 `--pretty`

```bash
# oneline 会将每个提交放在一行显示，short、full 和 fuller 选项会减少或增加输出
git log --pretty=oneline
# format 指定输出样式
git log --pretty=format:"%h - %an, %ar : %s"
# graph 添加 ASCII 字符形象地展示分支、合并历史
git log --pretty=format:"%h %s" --graph
```

| --pretty=format 选项 | 说明                                          |
| :------------------ | :-------------------------------------------- |
| `%H`                | 提交的完整哈希值                              |
| `%h`                | 提交的简写哈希值                              |
| `%T`                | 树的完整哈希值                                |
| `%t`                | 树的简写哈希值                                |
| `%P`                | 父提交的完整哈希值                            |
| `%p`                | 父提交的简写哈希值                            |
| `%an`               | 作者名字                                      |
| `%ae`               | 作者的电子邮件地址                            |
| `%ad`               | 作者修订日期（可以用 --date=选项 来定制格式） |
| `%ar`               | 作者修订日期，按多久以前的方式显示            |
| `%cn`               | 提交者的名字                                  |
| `%ce`               | 提交者的电子邮件地址                          |
| `%cd`               | 提交日期                                      |
| `%cr`               | 提交日期（距今多长时间）                      |
| `%s`                | 提交说明                                      |

### log 常用选项

| git log 常用选项       | 说明                                                           |
| :-------------------- | :------------------------------------------------------------- |
| `--shortstat`         | 只显示 --stat 中最后的行数修改添加移除统计。                   |
| `--name-only`         | 仅在提交信息后显示已修改的文件清单。                           |
| `--name-status`       | 显示新增、修改、删除的文件清单。                               |
| `--abbrev-commit`     | 仅显示 SHA-1 校验和所有 40 个字符中的前几个字符。              |
| `--relative-date`     | 使用较短的相对时间而不是完整格式显示日期（比如"2 weeks ago"）。 |
| `--graph`             | 在日志旁以 ASCII 图形显示分支与合并历史。                      |
| `--pretty`            | 使用其他格式显示历史提交信息。可用的选项包括 oneline、short、full、fuller 和 format（用来定义自己的格式）。 |
| `--oneline`           | `--pretty=oneline --abbrev-commit` 合用的简写。                |
| `--since`, `--after`  | 仅显示指定时间之后的提交。                                     |
| `--until`, `--before` | 仅显示指定时间之前的提交。                                     |
| `--author`            | 仅显示作者匹配指定字符串的提交。                               |
| `--committer`         | 仅显示提交者匹配指定字符串的提交。                             |
| `--grep`              | 仅显示提交说明中包含指定字符串的提交。                         |
| `-S`                  | 仅显示添加或删除内容匹配指定字符串的提交。                     |

### 限制输出

```bash
# --since、--until、--after、--before 按时间限制
git log --since=2.weeks

# --author、--committer 按人过滤
# --grep 仅显示提交说明中包含指定字符串的提交
git log --pretty="%h - %s" --author='Junio C Hamano' --since="2008-10-01" \
   --before="2008-11-01" --no-merges -- t/

# -S 仅显示添加或删除内容匹配指定字符串的提交
git log -S function_name
```

## blame

```bash
# 显示文件每一行是谁在哪个 commit 修改的
git blame [file]
# 只看第 10~20 行
git blame -L 10,20 [file]
# 显示完整 commit hash，并忽略代码移动的探测
git blame -M -C [file]
```

## 撤销与移除

### 移除文件

```bash
# 移除文件，下一次提交时，该文件就不再纳入版本管理
git rm file
# 删除之前修改过或已经放到暂存区的文件
git rm -f file
# 停止追踪指定文件，但该文件会保留在工作区
git rm --cached file
# 确定无误后删除文件
git rm -r --cached 文件/文件夹名称
# 预览将要删除的远程文件
git rm -r -n --cached file/dir

# 删除 log/ 目录下扩展名为 .log 的所有文件
# * 之前的反斜杠 \，是因为 Git 有它自己的文件模式扩展匹配方式，不用 shell 来帮忙展开
git rm log/\*.log
# 删除所有名字以 ~ 结尾的文件
git rm \*~
```

### reset

```bash
# 把文件移出暂存区，恢复到已修改但未暂存
git reset HEAD <file>...
# git reset 加上 --hard 是个危险的命令，但下述命令是安全的
git reset HEAD CONTRIBUTING.md
# 强制恢复到上一个节点，丢弃修改（危险）
git reset --hard HEAD~
# 返回到某个节点，保留修改
git reset --soft
```

### 撤销修改

```bash
# 会将本地未 add 的修改文件恢复到修改前
git checkout -- CONTRIBUTING.md
git checkout -- ./
# 清除未跟踪的新加文件
git clean -df
# 排除多个文件夹
git clean -df -e node_modules -e dist -e .vscode
# 在执行删除前，先用 -n（dry-run）看看到底会删什么
git clean -dfn -e <文件夹名>

# 恢复某个 commit 的指定文件到暂存区和工作区
git checkout [commit] [file]

# 回退指定路径
git checkout HEAD -- path
```

## stash

临时保存工作现场（未提交的修改），切换分支处理别的事情后再恢复：

```bash
# 保存当前工作区和暂存区的修改
git stash
# 等价写法，附带说明信息
git stash push -m "wip: xxx"

# 查看 stash 列表
git stash list

# 恢复最近一次 stash，并从列表中删除
git stash pop
# 恢复最近一次 stash，但保留在列表中
git stash apply
# 恢复指定的 stash
git stash apply stash@{2}

# 删除最近一次 stash
git stash drop
# 清空所有 stash
git stash clear

# 查看 stash 内容的差异
git stash show -p
```

注意：`stash pop/apply` 默认不含未跟踪文件，保存未跟踪文件需要 `git stash -u`。

## cherry-pick

把别的分支上的某个 commit 摘到当前分支：

```bash
# 摘取一个 commit
git cherry-pick [commit]
# 摘取多个 commit
git cherry-pick [commit1] [commit2]
# 摘取一段区间（不含 start，左开右闭）
git cherry-pick [start]..[end]
# 只把修改应用到工作区，不自动提交
git cherry-pick -n [commit]
# 出现冲突时，解决后继续
git cherry-pick --continue
# 放弃本次 cherry-pick
git cherry-pick --abort
```

## 远程仓库

```bash
# 简单列出远程仓库，加 -v 会显示对应的 URL
git remote -v
# 添加远程仓库
git remote add origin https://github.com/paulboone/ticgit
# 拉取更新
git fetch origin
# 检查远程仓库
git remote show origin
# 重命名远程仓库
git remote rename origin paul
```

## 分支

### 新建分支

```bash
# 新建一个分支，指向指定 commit
git branch [branch] [commit]

# 新建一个分支，与指定的远程分支建立追踪关系
git branch --track [branch] [remote-branch]
# 新建一个和远程分支同名的分支，并建立跟踪关系
git checkout -t origin/branch

# 新建一个分支，并切换到该分支
git checkout -b [branch]
# 新建分支，并与远程分支建立跟踪
git checkout -b branch origin/branch
```

### 删除本地分支

```bash
git branch -d [branch]
# 强制删除
git branch -D [branch]
```

### 分支查看

```bash
# 列出所有本地分支
git branch
# 列出所有远程分支
git branch -r
# 列出所有本地分支和远程分支
git branch -a
```

### 分支切换

```bash
# 切换到指定分支，并更新工作区
git checkout [branch-name]
# 切换到上一个分支
git checkout -
```

Git 2.23 之后推荐使用职责更单一的 `switch` / `restore` 替代 `checkout`：

```bash
# 切换分支
git switch [branch-name]
# 新建并切换
git switch -c [branch-name]
# 切换到上一个分支
git switch -

# 撤销工作区修改（替代 git checkout -- <file>）
git restore [file]
# 取消暂存（替代 git reset HEAD <file>）
git restore --staged [file]
# 从指定 commit 恢复文件
git restore --source [commit] [file]
```

### 修改本地分支名

```bash
git branch -m old_branch new_branch
```

### 远程分支

```bash
# 增加一个新的远程仓库，并命名
git remote add origin 仓库地址
# 删除一个远程仓库
git remote rm [name]
# 取回远程仓库的变化，并与本地分支合并
git pull [remote] [branch]
# 拉取后用 rebase 代替 merge，历史更干净
git pull --rebase [remote] [branch]
```

## submodule

```bash
# 添加子模块
git submodule add <repository-url> [path]
# 克隆含子模块的仓库后，初始化并拉取子模块
git submodule init
git submodule update
# 或者克隆时一步到位
git clone --recurse-submodules <repository-url>
# 子模块较多时，并行拉取
git submodule update --init --recursive --jobs 8
# 更新所有子模块到远端最新
git submodule update --remote
```

删除远程分支

```bash
git push origin -d branch
git push origin --delete [branch-name]
git push origin :branch
```

同步远程已删除的本地分支

```bash
git pull -p
# 等同于下面的命令
git fetch --prune origin
git fetch -p
```

将远程分支和本地分支对应

```bash
git branch --set-upstream-to origin/name otherName
# 或者简写为
git branch -u origin/name orOtherName
# 推送新分支并建立跟踪
git push --set-upstream origin new_branch
# 缩写
git push -u origin master
```

### push

```bash
# 上传本地指定分支到远程仓库
git push [remote] [branch]
# 推送所有分支到远程仓库
git push [remote] --all
# 强行推送当前分支到远程仓库，即使有冲突
git push [remote] --force
```

### 分支合并

```bash
# 合并指定分支到当前分支
git merge [branch]
```

## commit 与 add

### commit

```bash
# 提交指定文件暂存区到仓库区（可不指定文件）
git commit [file1] [file2] -m 'msg'

# 跳过使用暂存区域，把所有已经跟踪过的文件暂存起来一并提交，从而跳过 git add 步骤
git commit -a

# 已跟踪文件提交到暂存区，同时添加提交信息
git commit -a -m 'msg'

# 提交时显示所有 diff 信息
git commit -v

# 在上一次提交基础上修改
git commit --amend -m
```

### 合并 commit

```bash
# i（要合并的 commit 的前一个 head）
git rebase -i HEAD~4
# 进入 vim 模式，修改要合并的信息，wq 退出保存
git push origin --force 远程分支名
# 放弃修改
git rebase --abort
# 查看修改记录
git reflog
```

### add

```bash
# 添加每个变化前，都会要求确认，对于同一个文件的多处变化，可以实现分次提交
git add -p

# 取消 add 操作
git restore --staged .
git reset HEAD .
```

## 配置

### 首次配置

Git 配置文件分为三级，系统级（--system）、用户级（--global）和目录级（--local），三者的使用优先级以离目录（repository）最近为原则，如果三者的配置不一样，则生效优先级 **目录级 > 用户级 > 系统级**，可以通过 `git config --help` 查看更多内容。

- 系统级配置存储在 `/etc/gitconfig` 文件中，可以使用 `git config --system user.name "jim"`、`git config --system user.email "jim.jim@gmail.com"` 来进行配置，该配置对系统上所有用户及他们所拥有的仓库都生效。
- 用户级存储在每个用户的 `~/.gitconfig` 中，可以使用 `git config --global user.name "jim"`、`git config --global user.email "jim.jim@gmail.com"` 来进行配置，该配置对当前用户上所有的仓库有效。
- 目录级存储在每个仓库下的 `.git/config` 中，可以使用 `git config --local user.name "jim"`、`git config --local user.email "jim.jim@gmail.com"` 来进行配置，只对当前仓库生效。

| 命令                                                 | 功能                     |
| :--------------------------------------------------- | :----------------------- |
| `git config --list` 或者 -l                          | 显示当前的 Git 配置      |
| `git config -e [--global]`                           | 编辑 Git 配置文件        |
| `git config [--global] user.name "[name]"`           | 设置提交代码时的用户信息 |
| `git config [--global] user.email "[email address]"` |                          |

### 编辑器配置

```bash
git config --global core.editor emacs
# windows 上配置 notepad
git config --global core.editor "'C:/Program Files/Notepad++/notepad++.exe' -multiInst -notabbar -nosession -noPlugin"
```

### 别名配置

```bash
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.st status
```

### 代理配置

```bash
# 配置
git config --global http.proxy http://username:passwd@proxy.*.com:port
git config --global https.proxy http://username:passwd@proxy.*.com:port
# 取消配置
git config --global --unset http.proxy
git config --global --unset https.proxy

# 或者直接编辑 ~/.gitconfig 文件
```

### 多 git ssh 配置

添加另外的 ssh（-f 后面的参数是自定义的 SSH Key 的存放路径，将来生成的公私钥的名字分别是 gitlab.pub 和 gitlab）：

```bash
ssh-keygen -t rsa -C "YOUR_EMAIL@YOUREMAIL.COM" -f ~/.ssh/gitlab
```

在 SSH 用户配置文件 `~/.ssh/config` 中指定对应服务所使用的公私钥名称，如果没有 config 文件的话就新建一个，添加内容：

```bash
Host gitlab.yunduoketang.com.cn
    HostName gitlab.yunduoketang.com.cn
    # 指定端口号
    Port 17202
    # 指定私钥名称
    IdentityFile ~/.ssh/gitlab_yunduoketang

# github
Host github.com
    HostName github.com
    PreferredAuthentications publickey
    IdentityFile ~/.ssh/id_rsa
```

测试：

```bash
ssh -T git@gitlab.*.com
ssh -T git@github.com
```

## 文件忽略 `.gitignore`

```bash
# 忽略所有的 .a 文件
*.a
# 但跟踪所有的 lib.a，即便你在前面忽略了 .a 文件
!lib.a
# 只忽略当前目录下的 TODO 文件，而不忽略 subdir/TODO
/TODO
# 忽略任何目录下名为 build 的文件夹
build/
# 忽略 doc/notes.txt，但不忽略 doc/server/arch.txt
doc/*.txt
# 忽略 doc/ 目录及其所有子目录下的 .pdf 文件
doc/**/*.pdf
```

## tag 与 reflog

标签分为两种：**附注标签（annotated tag）**是完整对象，含打标签者、日期、说明信息，推荐使用；**轻量标签（lightweight tag）**只是指向某个 commit 的指针。

```bash
# 创建附注标签
git tag -a v1.0 -m "release version 1.0"
# 创建轻量标签
git tag v1.0-light
# 查看标签信息
git show v1.0
# 按模式列出标签
git tag -l "v1.*"
# 推送单个标签到远程
git push origin v1.0
```

| 命令                                 | 功能                        |
| :----------------------------------- | :-------------------------- |
| git tag                              | 列出所有 tag                |
| git tag [tag]                        | 新建一个 tag 在当前 commit  |
| git tag [tag] [commit]               | 新建一个 tag 在指定 commit  |
| git tag -d [tag]                     | 删除本地 tag                |
| git push origin :refs/tags/[tagName] | 删除远程 tag                |
| git show [tag]                       | 查看 tag 信息               |
| git push [remote] [tag]              | 提交指定 tag                |
| git push [remote] --tags             | 提交所有 tag                |
| git checkout -b [branch] [tag]       | 新建一个分支，指向某个 tag  |
| git reflog                           | 显示 HEAD 的移动历史，常用于找回丢失的 commit |
