import { readFile, writeFile } from 'node:fs/promises';
import { unitsIn, stripReviews, validateRegistry, escapeHtml as esc } from './content-review-lib.mjs';

const root = new URL('../', import.meta.url);
const check = process.argv.includes('--check');
const data = JSON.parse(await readFile(new URL('assets/content-review.json', root), 'utf8'));
const files = ['blueprint.html', 'thread.html', 'index-map.html', 'progress.html'];
const pages = Object.fromEntries(await Promise.all(files.map(async p => [p, await readFile(new URL(p, root), 'utf8')])));
validateRegistry(data, pages);
const recordLink = r => `<a href="${r.page}#${r.id}">${esc(r.title)}</a>`;
const feedback = (page, id, title) => {
  const url = new URL('https://github.com/Slientvoice/ai-atlas/issues/new');
  url.searchParams.set('title', `内容纠错：${title}`);
  url.searchParams.set('body', `页面：https://slientvoice.github.io/ai-atlas/${page}${id ? '#' + id : ''}\n原文与问题：\n建议与依据：\n`);
  return `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">反馈内容问题 ↗</a>`;
};
const marker = (id, content) => `\n<!-- atlas-review:${id}:start -->\n${content}\n<!-- atlas-review:${id}:end -->`;
function reviewBox(r, page, unit) {
  if (!r) return `<p class="atlas-review">${feedback(page, unit.id, unit.title)}</p>`;
  const claims = r.evidence.map(e => `<li>${esc(e.claim)}<br>${e.sources.map(id => {
    const source = data.sources[id];
    return `<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)}</a>`;
  }).join(' · ')}</li>`).join('\n');
  return `<details class="atlas-review"><summary>来源与教学边界 · ${r.checkedAt}</summary>
<p>以下资料对应所列核心表述，图示与实验的适用条件见下方说明。</p>
<ul>${claims}</ul><p><b>教学边界：</b>${esc(r.boundary)}</p>
<p>${feedback(r.page, r.id, r.title)} · <a href="progress.html#review-status">来源与阅读说明</a></p></details>`;
}
const blueprint = data.units.filter(r => r.page === 'blueprint.html');
const journey = data.units.filter(r => r.page === 'thread.html');
const overview = page => `<aside class="atlas-review-overview" aria-label="阅读说明"><b>来源与阅读说明</b>
<p>${page === 'blueprint.html' ? '原理说明配有来源链接，交互实验就近标注算法、示意数据与简化条件。' : page === 'thread.html' ? '跟随一句请求理解系统链路；动画、合同与数值为教学示意，不能当作真实服务运行结果。' : '按技术环节探索概念、交互范例与合规观察，深入原理可进入对应蓝图模块。'}</p>
<p>合规观察用于学习，具体适用需结合主体、地区与业务场景判断。<a href="progress.html#review-status">查看资料来源</a> · ${feedback(page, '', page === 'thread.html' ? '入门旅程' : page === 'blueprint.html' ? '工程蓝图' : '索引地图')}</p></aside>`;
function dashboard() {
  return `<section class="atlas-review-dashboard" id="review-status" aria-labelledby="review-heading">
<h2 id="review-heading">资料来源与阅读说明</h2><p>从具体表述回到原始资料，结合教学边界理解每个实验。下列资料查阅日期为 ${data.updated}；模型谱系与工业现场另有各自的盘点日期。</p>
<details open><summary>工程蓝图 · 原理与实验来源</summary><div class="atlas-review-links">${blueprint.map(recordLink).join('')}</div></details>
<details><summary>入门旅程 · 沿请求链路阅读</summary><div class="atlas-review-links">${journey.map(recordLink).join('')}</div></details>
<p>来源链接对应所列核心表述；实验中的简化参数、预设动画与真实模型运行结果需分别理解。合规观察用于学习，具体适用需结合业务场景判断。</p>
<p><a href="docs/content-review.md">来源说明与维护约定</a> · <a href="assets/content-review.json">公开来源记录（JSON）</a> · ${feedback('progress.html', 'review-status', '来源与阅读说明')}</p></section>`;
}
let changed = 0;
for (const page of files) {
  let html = pages[page];
  if (page === 'blueprint.html' || page === 'thread.html') {
    html = stripReviews(html);
    const units = unitsIn(html, page === 'blueprint.html' ? 'blueprint' : 'journey');
    for (const unit of units.reverse()) {
      const r = data.units.find(r => r.page === page && r.id === unit.id);
      const opening = page === 'blueprint.html' ? '<div class="m-body">' : '<div class="st-body">';
      const content = unit.content.replace(opening, opening + marker(unit.id, reviewBox(r, page, unit)));
      html = html.slice(0, unit.start) + content + html.slice(unit.end);
    }
  }
  const block = page === 'progress.html' ? dashboard() : overview(page);
  const slot = '<!-- atlas-review-overview -->';
  // Overview blocks are regenerated independently of unit content fingerprints.
  if (page === 'index-map.html' || page === 'progress.html') html = stripReviews(html);
  if (!html.includes(slot)) throw new Error(`${page}: review overview slot missing`);
  html = html.replace(slot, slot + marker('overview', block));
  if (html !== pages[page]) {
    changed++;
    if (check) throw new Error(`${page}: review display differs from registry; run npm run sync:reviews`);
    await writeFile(new URL(page, root), html);
  }
}
console.log(check ? 'Public source evidence, content fingerprints and displays match.' : `Review displays synchronized (${changed} pages).`);
