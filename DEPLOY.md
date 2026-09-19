# 构建与发布

## 发布位置

- 公开仓库：`Slientvoice/ai-atlas`
- 网站：https://slientvoice.github.io/ai-atlas/
- 2026-09-19 核对的 GitHub Pages 来源：**`agent/add-atlas-flow-skill` 分支根目录 `/`**，legacy 分支发布模式。
- 此分支名沿用既有设置；推送 `main` 不会更新当前站点。发布前用 `gh api repos/Slientvoice/ai-atlas/pages` 再核对配置。

## 构建与检查

使用 Node.js 22.13+ 及 npm，依赖锁在 `package-lock.json`。

```sh
npm ci
npm run typecheck
npm test
npm run build
npm run check:links
git diff --check
python3 -m http.server 8767 --bind 127.0.0.1
```

浏览器打开 `http://127.0.0.1:8767/`。检查桌面与窄屏：首页图示切换、三个主入口、各页目录、直接访问子页、深链接、后退与前进、刷新后的状态。浏览器可能缓存静态预览页，改动后需刷新对应页面。

`npm run build` 先生成 `.portal-build/`，再复制首页到根目录 `index.html`，复制散列资源到 `assets/` 并删除上一版首页引用的旧散列资源，最后同步七个静态页面的导航。字体和其他共享资源不会清理。`.portal-build/`、`node_modules/` 不提交。

发布前更新 `README.md`、`CHANGELOG.md` 及 `progress.html` 中的版本数据。提交首页源码、构建配置、导航源、静态内容和生成产物的完整差异。

## 上线与确认

确认当前分支和差异正确后，提交并推送上述 Pages 来源分支。用 `gh api repos/Slientvoice/ai-atlas/pages/builds/latest` 检查最新构建，要求其 `commit` 等于本次发布提交且 `status` 为 `built`。

推送成功后继续访问线上首页与子页面，确认首页资源、导航、深链接和进度记录均已更新。CDN 或浏览器仍显示旧版时，可在验证 URL 后加版本查询参数，或强制刷新。

## 回滚

用 `git revert <发布提交>` 生成恢复提交，再推送当前 Pages 来源分支；源码与静态产物会一起恢复。不要用强制推送覆盖公开历史。v0.33 之前的已发布基线为 `2d5e41d232502641e8c906b2eb786e236bce70da`。
