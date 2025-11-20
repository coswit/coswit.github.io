<img src="./博客相关/images/hexo.png" alt="img" style="zoom:100%;" />

### 本地hexo的安装

1.  安装Node.js

2. 安装Hexo :

   ```shell
   $ npm install -g hexo-cli
   #升级
   $ npm update hexo -g
   ```

3.  初始化：hexo init blog

4. 创建及启动：

   ```shell
   #hexo generate 生成
   $ hexo g 
   # hexo server 启动服务预览
   $ hexo s
   ```

5. 初始化博客

   ```shell
   $ hexo init
   # 清除缓存，若是网页正常情况下可以忽略这条命令
   $ hexo clean
   ```

6. 本地hexo启动后，可以打开浏览器访问 `http://localhost:4000` 来查看

### 服务器git安装

详细可参考[廖雪峰的git教程](https://www.liaoxuefeng.com/wiki/0013739516305929606dd18361248578c67b8067c8c017b000/00137583770360579bc4b458f044ce7afed3df579123eca000)

> 基于centos系统

1. 安装git
```shell
$ yum install git
```

2. 创建一个`git`用户，用来运行`git`服务：
```shell
$ sudo adduser git
```

3. 创建证书登录：
收集所有需要登录的用户的公钥，就是他们自己的`id_rsa.pub`文件，把所有公钥导入到`/home/git/.ssh/authorized_keys`文件里，一行一个。

4. 初始化Git仓库：
先选定一个目录作为Git仓库，假定是`/home/blog.git`，在`/home`目录下输入命令：
```shell
$ sudo git init --bare blog.git
```
> 注意blog.git的用户为git，否则需要修改
>
> ```shell
> $ sudo chown -R git:git blog.git
> ```



### 配置Nginx

- 查看配置文件位置
```shell
$ nginx -t
```



- 得到配置文件位置在`/etc/nginx/nginx.conf`，在http一项中添加虚拟主机如下:
```
https {
    ...
    server {
        listen 80;
        root   /home/git;
        server_name  localhost;

        location / {
            index  index.html index.htm;
        }
    }
    ...
}
```



- 查询

  端口使用查看 ：netstat -tulpn

  用户查看：ps -aux | grep nginx

  修改权限（保证nginx具有权限）：chmod -R 777 /home/git

- 重启Nginx服务
```shell
$ service nginx restart
```

- 强制停止
```shell
$ cd /usr/local/nginx/sbin/
$ ./nginx -s quit
```



### 自动发布

这里通过hooks完成网站更新工作，详细git的[hook使用参考](https://aotu.io/notes/2017/04/10/githooks/index.html)

- 将目录切换至 `/home/git/blog.git/hooks`，用 `cp post-update.sample post-update` 复制并重命名文件后 `vim post-update` 修改，在`exec git update-server-info`前添加:

```shell
git --work-tree=/home/git --git-dir=/home/git/blog.git checkout -f
```

- 修改post-update文件权限为可执行

```
$ chmod +x post-update
```

- 找到之前创建的Hexo项目（也就是blog文件夹），编辑_config.yml，修改#deploy如下

```
deploy:
  type: git
  repo: git@<your ip address>:/home/git/blog.git
  branch: master
```

- 在Hexo项目中（blog文件夹下）安装hexo-deployer-git

```
$ npm install hexo-deployer-git --save
```

重新部署

```
$ hexo g -d
```

