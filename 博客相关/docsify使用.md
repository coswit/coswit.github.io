# docsify 使用

## 初始化

```bash
# 安装
npm i docsify-cli -g
# 初始化
docsify init ./docs
```

主要会生成下面的文件：

- `index.html` 入口文件
- `.nojekyll` 用于阻止 GitHub Pages 忽略掉下划线开头的文件

## 配置修改

主要在 `index.html` 文件中。

### 主题

默认自带主题，可选择 `vue` `buble` `dark` `pure` `dolphin`：

```html
<link rel="stylesheet" href="//cdn.jsdelivr.net/npm/docsify/lib/themes/vue.css">
```

可自定义主题，具体参考 [docsify-themeable](https://jhildenbiddle.github.io/docsify-themeable/#/)：

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/docsify-themeable@0/dist/css/theme-simple.css">
<script src="https://cdn.jsdelivr.net/npm/docsify-themeable@0/dist/js/docsify-themeable.min.js"></script>
```

## 启动

可不指定端口：

```bash
docsify serve ./docs --port 3001
```

## 常见问题

### 安装报 Unsupported engine（EBADENGINE）

docsify-cli 5.0 要求 Node ≥ 20（其依赖 docsify、marked、commander 同样要求）。Ubuntu 24.04 用 apt 装的 Node 是 v18.19.1，版本太旧。通过 NodeSource 源升级到 Node 22：

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
sudo apt-get install -y nodejs
```

升级后 Node 为 v22.x，npm 随之升到 10.x。

### 安装报 sh: 1: husky: not found

docsify-cli 的 postinstall 脚本会在全局安装目录里执行 `npx husky install`，而 husky 是它项目开发才用的工具，全局安装场景下找不到该命令，导致安装失败（错误码 127）。这是 docsify-cli 自身的 bug，与 Node 版本无关，跳过安装脚本即可，功能不受影响：

```bash
npm install -g docsify-cli --ignore-scripts
```

