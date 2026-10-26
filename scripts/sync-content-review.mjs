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
function reviewBox(r) {
  if (!r.checkedAt) return `<p class="atlas-review"><b>待来源核对</b> · 本轮未逐项复核。${feedback(r.page, r.id, r.title)}</p>`;
  const claims = r.evidence.map(e => `<li>${esc(e.claim)}<br>${e.sources.map(id => {
    const source = data.sources[id];
    return `<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)}</a>`;
  }).join(' · ')}</li>`).join('\n');
  const human = r.humanReview ? `人工技术审校：${esc(r.humanReview.name)} · ${esc(r.humanReview.date)}` : '待人工技术审校';
  return `<details class="atlas-review" data-review-status="source-checked"><summary>核心表述已对照来源（AI） · ${r.checkedAt}</summary>
<p>${esc(r.method)}。${human}；法律审校另行记录。</p>
<ul>${claims}</ul><p><b>教学边界：</b>${esc(r.boundary)}</p>
<p>${feedback(r.page, r.id, r.title)} · <a href="progress.html#review-status">查看全站核验范围</a></p></details>`;
}
const blueprint = data.units.filter(r => r.page === 'blueprint.html');
const journey = data.units.filter(r => r.page === 'thread.html');
const checkedCount = records => records.filter(r => r.checkedAt).length;
const overview = page => `<aside class="atlas-review-overview" aria-label="本页核验范围"><b>读图前，先看核验范围</b>
<p>${page === 'blueprint.html' ? `本轮对照了 ${checkedCount(blueprint)} / ${blueprint.length} 个模块的核心技术表述，其余模块待复核。` : page === 'thread.html' ? `九站核心技术表述已对照来源；动画、合同与数值为教学示意，不能当作真实服务运行结果。` : '索引地图仅同步部分入门概念纠错，28 个条目尚未逐项完成核验。'}</p>
<p>来源核对由 AI 完成，人工技术审校与法律审校另行记录；标记不代表整页通过审核。<a href="progress.html#review-status">查看核验台账</a> · ${feedback(page, '', page === 'thread.html' ? '入门旅程' : page === 'blueprint.html' ? '工程蓝图' : '索引地图')}</p></aside>`;
function dashboard() {
  const metric = (title, value, note) => `<div class="atlas-review-metric"><span>${title}</span><strong>${value}</strong><small>${note}</small></div>`;
  return `<section class="atlas-review-dashboard" id="review-status" aria-labelledby="review-heading">
<h2 id="review-heading">建设之外，内容核验走到哪里</h2><p>按可追溯记录计数 · ${data.updated}。下面的分母分别是蓝图模块、入门站点与索引合规挂点，不合并为一个总分。</p>
<div class="atlas-review-metrics">
${metric('蓝图核心表述 · 来源核对（AI）', `${checkedCount(blueprint)} / ${blueprint.length}`, '仅覆盖展开后列明的表述与边界；其余待复核。')}
${metric('入门九站 · 来源核对（AI）', `${checkedCount(journey)} / ${journey.length}`, '覆盖技术叙事；示意动画不代表模型实测。')}
${metric('人工技术审校', `${data.units.filter(r => r.humanReview).length} / ${data.units.length}`, '分母为本台账的 45 个蓝图模块与 9 个入门站点。')}
${metric('索引合规挂点 · 法律审校', `${data.legalHooks.filter(r => r.review).length} / ${data.legalHooks.length}`, '“已填”仅指草稿存在；入门与蓝图的法律观察也仍待审校。')}
</div>
<details open><summary>本轮已对照来源的蓝图模块</summary><div class="atlas-review-links">${blueprint.filter(r => r.checkedAt).map(recordLink).join('')}</div></details>
<details><summary>待来源复核的蓝图模块（${blueprint.length - checkedCount(blueprint)}）</summary><div class="atlas-review-links">${blueprint.filter(r => !r.checkedAt).map(recordLink).join('')}</div></details>
<p><b>如何理解标记：</b>“已对照来源”记录 AI 查阅资料后的核对范围；“教学简化”说明实验的适用边界；“待人工审校”说明还缺少人的专业复核。正文改动后，构建检查要求重新确认来源记录，不能自动沿用旧标记。</p>
<p>模型谱系与工业现场沿用各自的盘点日期和来源记录，未计入本轮技术核验分母。<a href="docs/content-review.md">核验方法与维护约定</a> · <a href="assets/content-review.json">完整核验台账（JSON）</a> · ${feedback('progress.html', 'review-status', '核验台账')}</p></section>`;
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
      const content = unit.content.replace(opening, opening + marker(unit.id, reviewBox(r)));
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
console.log(check ? 'Review evidence, content fingerprints, inventories and displays match.' : `Review displays synchronized (${changed} pages).`);
