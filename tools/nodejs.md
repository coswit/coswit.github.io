

### 安装

```shell
sudo apt install nodejs npm
```

### 配置代理

```shell
npm config set https-proxy http://proxy.*.com:8080
npm config set proxy http://proxy.*.com:8080
npm config set registry https://registry.npm.taobao.org 
```

### 使用

```shell
#查询
npm search name
#已安装模块
npm list
#本地安装
npm install <package name>
#全局安装
npm install -g <package name>
npm install -g gitbook-cli
#强制重新安装
npm install <packageName> --force
```

