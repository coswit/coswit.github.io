

### status/diff

status

```shell
  #简洁状态信息
  $ git status -s 
  $ git status --short 
```

diff

```shell
#查看已add的变化
$ git diff --staged
#或
$ git diff --cached
```

| 命令                                      | 功能                                     |
| :---------------------------------------- | :--------------------------------------- |
| git diff HEAD                             | 显示工作区与当前分支最新commit之间的差异 |
| git diff [first-branch]...[second-branch] | 显示两次提交之间的差异                   |
| git diff --shortstat "@{0 day ago}"       | 显示今天你写了多少行代码                 |
| git show [commit]                         | 显示某次提交的元数据和内容变化           |
| git show --name-only [commit]             | 显示某次提交发生变化的文件               |
| git show [commit]:[filename]              | 显示某次提交时，某个文件的内容           |
| git reflog                                | 显示当前分支的最近几次提交               |
### log

```shell
#-p 或 --patch ，它会显示每次提交所引入的差异
$ git log -p -2
#查看每次提交的简略统计信息
$ git log --stat
```

#### 选项 `--pretty`

```shell
#oneline 会将每个提交放在一行显示,short，full 和 fuller 选项会减少或增加输出
$ git log --pretty=oneline
#format指定输入样式
$ git log --pretty=format:"%h - %an, %ar : %s"
#graph添加了一些 ASCII 字符串来形象地展示分支、合并历史
$ git log --pretty=format:"%h %s" --graph
```

| --pretty=format选项 | 说明                                          |
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

#### log常用选项 

| git log常用选项       | 说明                                                         |
| :-------------------- | :----------------------------------------------------------- |
| `--shortstat`         | 只显示 --stat 中最后的行数修改添加移除统计。                 |
| `--name-only`         | 仅在提交信息后显示已修改的文件清单。                         |
| `--name-status`       | 显示新增、修改、删除的文件清单。                             |
| `--abbrev-commit`     | 仅显示 SHA-1 校验和所有 40 个字符中的前几个字符。            |
| `--relative-date`     | 使用较短的相对时间而不是完整格式显示日期（比如“2 weeks ago”）。 |
| `--graph`             | 在日志旁以 ASCII 图形显示分支与合并历史。                    |
| `--pretty`            | 使用其他格式显示历史提交信息。可用的选项包括 oneline、short、full、fuller 和 format（用来定义自己的格式）。 |
| `--oneline`           | `--pretty=oneline --abbrev-commit` 合用的简写。              |
| `--since`, `--after`  | 仅显示指定时间之后的提交。                                   |
| `--until`, `--before` | 仅显示指定时间之前的提交。                                   |
| `--author`            | 仅显示作者匹配指定字符串的提交。                             |
| `--committer`         | 仅显示提交者匹配指定字符串的提交。                           |
| `--grep`              | 仅显示提交说明中包含指定字符串的提交。                       |
| `-S`                  | 仅显示添加或删除内容匹配指定字符串的提交。                   |

#### 限制输出

```shell
#--since ，-until，--until, --before 按照时间作限制
$ git log --since=2.weeks

# --author，--committer
# --grep 仅显示提交说明中包含指定字符串的提交
$ git log --pretty="%h - %s" --author='Junio C Hamano' --since="2008-10-01" \
   --before="2008-11-01" --no-merges -- t/
   
# -S 仅显示添加或删除内容匹配指定字符串的提交。
$ git log -S function_name
```

### 撤销、移除
#### 移除文件

```shell
#移除文件,下一次提交时，该文件就不再纳入版本管理
$ git rm file
#删除之前修改过或已经放到暂存区的文件
$ git rm -f file
#停止追踪指定文件，但该文件会保留在工作区
$ git rm --cached file
#确定无误后删除文件
$ git rm -r --cached 文件/文件夹名称
#预览将要删除的远程文件
$ git rm -r -n --cached file/dir

#删除 log/ 目录下扩展名为 .log 的所有文件
# * 之前的反斜杠 \， 是因为 Git 有它自己的文件模式扩展匹配方式，所以我们不用 shell 来帮忙展开
$ git rm log/\*.log
#删除所有名字以 ~ 结尾的文件
$ git rm \*~
```

#### reset

返回到某个节点。保留修改    

```shell
#把文件移出暂存区，恢复到已修改但未暂存
$ git reset HEAD <file>... 
#git reset 加上--hard 是个危险的命令，但下述命令是安全的
$ git reset HEAD CONTRIBUTING.md
#强制回复到上一个节点
$ git reset --hard HEAD~

#返回到某个节点。保留修改  
$ git reset --soft 
```
#### 撤销修改

```shell
#git checkout -- <file>... to discard changes in working directory
#会将本地未add的修改文件恢复到修改前
$ git checkout -- CONTRIBUTING.md
$ git checkout -- ./
#清除未新加文件
$ git clean -df

#恢复某个commit的指定文件到暂存区和工作区
$ git checkout [commit] [file]

#回退指定路径
 git checkout HEAD -- path
```

### 远程仓库

```shell
#会简单列出远程仓库,加 -v 会显示对应的URL
$ git remote -v
#添加远程仓库
$ git remote add origin https://github.com/paulboone/ticgit
#拉取更新
$ git fetch origin
#检查远程仓库git remote show <remote>
$ git remote show origin
#重命名远程仓库 git remote rename 
$ git remote rename origin paul
```

### 分支

#### 新建分支

```shell
#新建一个分支，指向指定commit
git branch [branch] [commit]

#新建一个分支，与指定的远程分支建立追踪关系
git branch --track [branch] [remote-branch]
#新建一个和远程分支同名的分支，并建立跟踪关系
git checkout -t origin/branch

#新建一个分支，并切换到该分支
git checkout -b [branch]
#新建分支，并与远程分支建立跟踪
git checkout -b branch orgin/branch
```

#### 删除本地分支

```shell
git branch -d [branch]
#强制删除
git branch -D [branch]
```

#### 分支查看

```shell
#列出所有本地分支
git branch
#列出所有远程分支
git branch -r
#列出所有本地分支和远程分支
git branch -a
```

#### 分支切换

```shell
#切换到指定分支，并更新工作区
git checkout [branch-name]
#切换到上一个分支
git checkout -
```

#### 修改本地分支名

```shell
# Rename branch locally   
$ git branch -m old_branch new_branch   
```

#### 远程分支

```shell
#增加一个新的远程仓库，并命名
git remote add origin 仓库地址
#删除一个远程仓库
git remote rm [name]
#取回远程仓库的变化，并与本地分支合并
git pull [remote] [branch]
```

删除远程分支

```shell
$ git push origin -d branch
$ git push origin --delete [branch-name]
$ git push origin :branch

#或者
$git branch -dr [remote/branch]
```

同步远程删除的本地分支

```shell
$ git pull -p
# 等同于下面的命令
$ git fetch --prune origin 
$ git fetch -p
```

将远程分支和本地分支对应

```shell
$ git branch --set-upstream-to origin/name otherName
#或者简写为
$ git branch -u origin/name orOtherName
# Push the new branch, set local branch to track the new remote
$ git push --set-upstream origin new_branch   
#缩写
$ git push -u origin master
```

#### push

```shell
#上传本地指定分支到远程仓库
git push [remote] [branch]
#推送所有分支到远程仓库
git push [remote] --all
#强行推送当前分支到远程仓库，即使有冲突
git push [remote] --force
```

#### 分支合并

```shell
#合并指定分支到当前分支
git merge [branch]
```

### commit与add

#### commit

  ```shell
  #提交指定文件暂存区到仓库区（可不指定文件）
  git commit [file1] [file2] -m  'msg'
  
  #跳过使用暂存区域，把所有已经跟踪过的文件暂存起来一并提交，从而跳过 git add 步骤
  git commit -a
  
  #已跟踪文件提交到暂缓区，同时添加提交信息
  git commit -a -m  'msg'
  
  #提交时显示所有diff信息
  git commit -v
  
  #在上一次提交基础上修改
  git commit --amend -m
  ```
#### 合并commit 

```shell
# i(要合并的commit的前一个head)
$ git rebase -i HEAD~4 
# 进入vim模式，修改要合并的信息，wq退出保存
$ git push origin --force 远程分支名
#放弃修改
$ git rebase --abort 
# 修改记录
$ git reflog 
```

#### add

```shell
#添加每个变化前，都会要求确认，对于同一个文件的多处变化，可以实现分次提交
git add -p
```

### 配置

#### 首次配置

Git 配置文件分为三级，系统级(--system)、用户级(--global)和目录级(--local)，三者的使用优先级以离目录 (repository)最近为原则，如果三者的配置不一样，则生效优先级 **目录级>用户级>系统级**，可以通过 `git config --help` 查看更多内容。
+ 系统级配置存储在 `/etc/gitconfig` 文件中，可以使用 `git config --system user.name "jim"` ,`git config --sytem user.email "jim.jim@gmail.com"` 来进行配置，该配置对系统上所有用户及他们所拥有的仓库都生效的配置值。
+ 用户级存储在每个用户的 `~/.gitconfig` 中，可以使用 `git config --global user.name "jim"` ,`git config --global user.email "jim.jim@gmail.com"` 来进行配置，该配置对当前用户上所有的仓库有效。
+ 目录级存储在每个仓库下的 `.git/config` 中，可以使用 `git config --local user.name "jim"` , `git config --local user.email "jim.jim@gmail.com"` 来进行配置，只对当前仓库生效。

| 命令                                                 | 功能                     |
| :--------------------------------------------------- | :----------------------- |
| `git config --list` 或者 -l                          | 显示当前的Git配置        |
| `git config -e [--global]`                           | 编辑Git配置文件          |
| `git config [--global] user.name "[name]"`           | 设置提交代码时的用户信息 |
| `git config [--global] user.email "[email address]"` |                          |

#### 编辑器配置

```shell
$ git config --global core.editor emacs
#windows上配置notepad
$ git config --global core.editor "'C:/Program Files/Notepad++/notepad++.exe' -multiInst -notabbar -nosession -noPlugin"
```

#### 别名配置

```shell
$ git config --global alias.co checkout
$ git config --global alias.br branch
$ git config --global alias.ci commit
$ git config --global alias.st status
```

#### 代理配置

```shell
#配置
git config --global http.proxy http://username:passwd@proxy.*.com:port
git config --global https.proxy http://username:passwd@proxy.*.com:port
#取消配置
git config --global --unset http.proxy
git config --global --unset https.proxy

#或者编辑~/.gitconfig文件
```

#### 多git ssh配置

- 添加另外的ssh,（-f后面的参数是自定义的SSH Key的存放路径，将来生成的公秘钥的名字分别是gitlab.pub和gitlab)

  ```shell
  $ ssh-keygen -t rsa -C "YOUR_EMAIL@YOUREMAIL.COM" -f ~/.ssh/gitlab
  ```

- 在SSH用户配置文件~/.ssh/config中指定对应服务所使用的公秘钥名称，如果没有config文件的话就新建一个
- 打开conifg文件添加内容

```shell

Host gitlab.yunduoketang.com.cn
     HostName gitlab.yunduoketang.com.cn
     #指定端口号
     port 17202
		# 添加私钥名称
    IdentityFile ~/.ssh/gitlab_yunduoketang
    
# github
Host github.com
    HostName github.com
    PreferredAuthentications publickey
    IdentityFile ~/.ssh/id_rsa
```
- 测试

```shell
$ ssh -T git@gitlab.*.com
$ ssh -T git@github.com
```

### 文件忽略`.gitignore`

  ```powershell
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


### tag

| 命令                                 | 功能                      |
| :----------------------------------- | :------------------------ |
| git tag                              | 列出所有tag               |
| git tag [tag]                        | 新建一个tag在当前commit   |
| git tag [tag] [commit]               | 新建一个tag在指定commit   |
| git tag -d [tag]                     | 删除本地tag               |
| git push origin :refs/tags/[tagName] | 删除远程tag               |
| git show [tag]                       | 查看tag信息               |
| git push [remote] [tag]              | 提交指定tag               |
| git push [remote] --tags             | 提交所有tag               |
| git checkout -b [branch] [tag]       | 新建一个分支，指向某个tag |



