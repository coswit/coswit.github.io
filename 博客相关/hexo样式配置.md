# Hexo 样式与主题配置

> 基于 Hexo 7.x + NexT 主题整理（基于模型知识更新，细节以官方文档为准）。

## Front-matter

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

## 分类、标签页

- 生成「分类」页并添加：

```bash
hexo new page categories
```

创建成功后，找到 `blog/source/categories/index.md`，Front-matter 中加 `type: "categories"`：

```yaml
---
title: 文章分类
date: 2017-05-27 13:47:40
type: "categories"
---
```

- 生成「标签」页并添加：

```bash
hexo new page tags
```

创建成功后，找到 `blog/source/tags/index.md`，Front-matter 中加 `type: "tags"`：

```yaml
---
title: 文章标签
date: 2017-05-27 13:47:40
type: "tags"
---
```

## 置顶功能

```bash
npm install hexo-generator-index-pin-top --save
```

在需要置顶的文章的 Front-matter 中加上 `top: 数值` 即可（数值越大置顶级别越高）：

```yaml
---
title: 标题
date: 2017-09-08 12:00:25
categories: 分类
top: 4
---
```

## NexT 主题配置

NexT 主题推荐用 npm 方式安装（Git 克隆方式升级麻烦）：

```bash
npm install hexo-theme-next --save
```

启用主题：把站点 `_config.yml` 中的 `theme:` 改为 `next`。

主题配置建议使用「独立配置文件」：在博客根目录新建 `_config.next.yml`，把所有主题相关的修改放在这里，升级主题时不会丢失：

```yaml
# 主题外观
scheme: Pisces
highlight_theme: night eighties

# 头像
avatar:
  url: /images/avatar.png

# mermaid 图表支持
mermaid:
  enable: true

# 数学公式支持
mathjax:
  enable: true
```

> 旧版做法是直接改 `themes/next/_config.yml`，并在 `themes/next/layout/_macro/post.swig` 里改模板加置顶图标；NexT 8.x 之后已不推荐，置顶建议直接用上面的 `hexo-generator-index-pin-top` 插件。

## 其他插件

- mermaid 流程图渲染：

```bash
npm install hexo-filter-mermaid-diagrams --save
```
