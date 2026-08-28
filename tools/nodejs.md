## 安装

### Linux（Ubuntu/Debian）

```bash
# 方式一：系统源直接装（版本较旧；先 update 刷新索引，否则可能报 Unable to locate package）
sudo apt update
sudo apt install nodejs npm
```

```bash
# 方式二：NodeSource 官方源，版本新
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
# nodejs 包自带 npm，无需单独安装

# 验证
node -v
npm -v
```

```bash
# 方式三：通过 nvm 安装（推荐，见下节，免 sudo、多版本共存）
nvm install --lts
```

### Windows

```powershell
# 方式一：官网下载安装包，一路下一步
# https://nodejs.org/en/download

# 方式二：winget
winget install OpenJS.NodeJS.LTS

# 方式三：scoop
scoop install nodejs-lts

# 验证（新开终端）
node -v
npm -v
```

注意：apt 装的 node/npm 版本可能落后很多，且系统全局装包需要 sudo；实际开发建议用 nvm（Linux/macOS）或 nvm-windows 管理版本。

## 版本管理

## 版本管理

### nvm

nvm（Node Version Manager）用于在同一台机器上安装和切换多个 node 版本：

```bash
# 安装（Linux/macOS）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash

# 查看已安装版本
nvm ls
# 安装指定版本
nvm install 20
# 安装最新 LTS 版本
nvm install --lts
# 切换版本
nvm use 20
# 设置默认版本
nvm alias default 20
```

Windows 下使用 [nvm-windows](https://github.com/coreybutler/nvm-windows)，命令基本相同。

### nrm

nrm（npm registry manager）用于快速切换 npm 镜像源：

```bash
npm install -g nrm

# 列出可用源，当前使用的带 *
nrm ls
# 切换到淘宝源
nrm use taobao
# 测试各源速度
nrm test
```

## 配置代理

```bash
npm config set https-proxy http://proxy.*.com:8080
npm config set proxy http://proxy.*.com:8080
# 镜像源（原 registry.npm.taobao.org 已失效，现为 npmmirror）
npm config set registry https://registry.npmmirror.com
```

## 使用

```bash
# 查询
npm search name
# 已安装模块
npm list
# 本地安装
npm install <package name>
# 全局安装
npm install -g <package name>
npm install -g gitbook-cli
# 强制重新安装
npm install <packageName> --force

# 卸载
npm uninstall <package name>
# 更新（按 package.json 的版本范围）
npm update <package name>
# 清理缓存（安装异常时排查用）
npm cache clean --force
```

### npx

npx 用于执行包的命令行工具，不需要全局安装：`npx` 会临时下载并运行指定包：

```bash
# 直接运行 create-react-app，无需先 npm install -g
npx create-react-app my-app
# 运行本地项目里安装的工具
npx eslint .
```

### package.json 与 scripts

`package.json` 中的 `scripts` 字段定义命令别名，通过 `npm run` 执行：

```json
{
  "name": "my-project",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "jest"
  },
  "dependencies": {
    "react": "^18.2.0"
  },
  "devDependencies": {
    "vite": "^5.0.0"
  }
}
```

```bash
# 执行 scripts 中的命令（start 和 test 可以省略 run）
npm run dev
npm run build
npm start
npm test
```

`dependencies` 是运行时依赖，`devDependencies` 是开发期依赖（构建工具、测试框架等）。
