### 初始化

```bash
docsify init ./docs
```

主要会生成下面的文件：

- `index.html` 入口文件
- `.nojekyll` 用于阻止 GitHub Pages 忽略掉下划线开头的文件

### 配置修改

主要在`index.html`文件中。

#### 主题

默认自带主题，可选择`vue buble dark pure dolphin`：

```css
<link rel="stylesheet" href="//cdn.jsdelivr.net/npm/docsify/lib/themes/vue.css">
```

可自定义主题，具体参考https://jhildenbiddle.github.io/docsify-themeable/#/：

```css
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/docsify-themeable@0/dist/css/theme-simple.css">

<script src="https://cdn.jsdelivr.net/npm/docsify-themeable@0/dist/js/docsify-themeable.min.js"></script>
```

### 启动

可不指定端口：

```bash
docsify serve ./docs --port 3001
```

