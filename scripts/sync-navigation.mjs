import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { pages, navigationContents } from '../assets/site-navigation.mjs';

const root = new URL('../', import.meta.url);
for (const file of [...pages.map(([file]) => file).filter(file => file !== 'index.html'), 'font-fitting.html']) {
  const path = new URL(file, root);
  let html = await readFile(path, 'utf8');
  const block = `<!-- atlas-navigation:start -->\n<div id="atlas-top"></div>\n<nav class="atlas-site-nav" aria-label="全站导航" data-atlas-static>\n${navigationContents(file)}\n</nav>\n<!-- atlas-navigation:end -->`;
  if (html.includes('<!-- atlas-navigation:start -->')) html = html.replace(/<!-- atlas-navigation:start -->[\s\S]*?<!-- atlas-navigation:end -->/, block);
  else {
    // A body tag is optional in the legacy static HTML. Insert before its first content node.
    const match = html.match(/<body[^>]*>/i);
    if (match) html = html.replace(match[0], `${match[0]}\n${block}`);
    else html = html.replace(/(<\/style>\s*)/, `$1\n${block}\n`);
  }
  if (!html.includes('href="./assets/site-navigation.css"')) html = html.replace('</style>', '</style>\n<link rel="stylesheet" href="./assets/site-navigation.css">\n<script type="module" src="./assets/site-navigation.mjs"></script>');
  // Internal navigation stays in this tab, while citation links retain their targets.
  html = html.replace(/<a\b([^>]*href="(?:\.\/)?(?:index|blueprint|toolchain|genealogy|thread|index-map|progress|font-fitting)\.html(?:#[^"]*)?"[^>]*)>([\s\S]*?)<\/a>/g,
    (_all, attrs, body) => `<a${attrs.replace(/\s+target="_blank"/g,'').replace(/\s+rel="noopener(?: noreferrer)?"/g,'')}>${body.replace(/↗/g,'→').replace(/← 返回门户|← 门户|门户首页/g,'返回首页')}</a>`);
  // Keep the canonical navigation markup unchanged after normalizing legacy links.
  html = html.replace(/<!-- atlas-navigation:start -->[\s\S]*?<!-- atlas-navigation:end -->/, block);
  await writeFile(path, html);
  console.log(`Navigation synchronized: ${fileURLToPath(path).split('/').pop()}`);
}
