import { readFile, access } from 'node:fs/promises';
import { pages } from '../assets/site-navigation.mjs';

const root = new URL('../', import.meta.url);
const site = 'https://slientvoice.github.io/ai-atlas/';
const files = [...pages.map(([file]) => file), 'font-fitting.html'];
const html = new Map(await Promise.all(files.map(async file => [file, await readFile(new URL(file, root), 'utf8')])));
const ids = new Map([...html].map(([file, body]) => [file, new Set([...body.matchAll(/\bid=["']([^"']+)["']/g)].map(match => match[1]))]));
const errors = [];
let checked = 0;
for (const [file, body] of html) {
  for (const match of body.matchAll(/<(a|link|script|img)\b([^>]*?)\b(?:href|src)=["']([^"']+)["']([^>]*)>/g)) {
    const [ , tag, before, href, after] = match;
    if (href.includes('${') || href.startsWith('data:')) continue;
    const url = new URL(href.replaceAll('&amp;', '&'), site + file);
    if (!url.href.startsWith(site)) continue;
    const target = url.pathname.slice(new URL(site).pathname.length) || 'index.html';
    checked++;
    try { await access(new URL(target, root)); }
    catch { errors.push(`${file}: missing file ${href}`); continue; }
    if (tag === 'a' && /target=["']_blank["']/.test(before + after)) errors.push(`${file}: internal link opens a new tab: ${href}`);
    if (url.hash && ids.has(target) && target !== 'index.html' && !ids.get(target).has(decodeURIComponent(url.hash.slice(1)))) {
      errors.push(`${file}: missing anchor ${href}`);
    }
  }
  if (file !== 'index.html') {
    if ((body.match(/aria-label="全站导航"/g) || []).length !== 1) errors.push(`${file}: expected exactly one shared navigation`);
    if (!body.includes('class="atlas-nav-home" href="./index.html"')) errors.push(`${file}: missing homepage action`);
  }
}
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log(`${files.length} pages checked; ${checked} local links/assets resolve. Homepage-generated links require browser verification.`);
