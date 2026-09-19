import { readFile, writeFile, cp, rm } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const previous = await readFile(new URL('index.html', root), 'utf8');
const next = await readFile(new URL('.portal-build/portal.html', root), 'utf8');
// Only remove hashed homepage assets referenced by the previous generated index.
const obsolete = [...previous.matchAll(/\.\/assets\/((?:static-portal|portal)-[\w-]+\.(?:js|css))/g)]
  .map(match => match[1]).filter(file => !next.includes(`./assets/${file}`));
await cp(new URL('.portal-build/assets/', root), new URL('assets/', root), { recursive: true });
await writeFile(new URL('index.html', root), next);
for (const file of obsolete) await rm(new URL(`assets/${file}`, root), { force: true });
console.log('Homepage build copied to index.html and assets/.');
