---
title: hexo
---

###   Front-matter

```yaml
---
title: 标题
date: 2013/7/13 20:46:25
updated: 2013/8/18 
description: 阅读全文描述内容
categories:
- Diary
tags:
- tag1
- tag2
---
```



| 参数 | 描述 | 默认值 |
| :----------- | :------------ | :---------: |
| `layout`     | 布局             |              |
| `title`      | 标题           | 文章的文件名 |
| `date`       | 建立日期        | 文件建立日期 |
| `updated`    | 更新日期     | 文件更新日期 |
| `comments`   | 开启文章的评论功能            |     true     |
| `tags`       | 标签（不适用于分页） |              |
| `categories` | 分类（不适用于分页）|              |
| `permalink`  | 覆盖文章网址 |              |
| `keywords`   | 仅用于 meta 标签和 Open Graph 的关键词（不推荐使用） |    |



### 分类、标签添加

- 生成“分类”页并添加

```shell
$ hexo new page categories
```

创建成功后，找到`blog/source/categories/index.md`，添加`type: "categories"`到内容中：

```yaml
---
title: 文章分类
date: 2017-05-27 13:47:40
type: "categories"
---
```

- 生成“标签”页并添加

```shell
$ hexo new page tags
```

  创建成功后，找到`blog/source/tags/index.md`，添加`type: "tags"`到内容中：

```yaml
---
title: 文章分类
date: 2017-05-27 13:47:40
type: "tags"
---
```

### 其他
- 支持绘制流程图

  ```shell
  $ npm install --save hexo-filter-flowchart
  ```


### 置顶功能

```shell
$ npm install hexo-generator-index-pin-top --save
```

然后在需要置顶的文章的`Front-matter`中加上`top: 数值` 即可(数值越大代表置顶级别越高）。

```yaml
---
title: 标题
date: 2017-09-08 12:00:25
categories: 分类
top: 4
---
```

打开：`/blog/themes/next/layout/_macro` 目录下的`post.swig`文件，定位到`<div class="post-meta">`标签下，插入如下代码：

```javascript
{% if post.top %}
  <i class="fa fa-thumb-tack"></i>
  <font color=7D26CD>置顶</font>
  <span class="post-meta-divider">|</span>
{% endif %}
```

### next 主题配置

```
avatar:
  url: 

mermaid:
  enable: true
  
 mathjax:
    enable: true
    
 #主题设置   
scheme: Pisces  

highlight_theme: night eighties
```

