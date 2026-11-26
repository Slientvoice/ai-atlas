# 本地构建与预览

此项目提供静态 HTML、CSS 和 JavaScript。使用 Node.js 22.13 或更高版本，在项目目录运行以下命令。

```sh
npm ci
npm run build
npm test
npm run check:links
npm run check:reviews
```

根目录的 `index.html` 是构建后的首页。用本地 HTTP 服务器打开项目时，可从首页进入六个内容页。
