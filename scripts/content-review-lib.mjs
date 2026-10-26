import { createHash } from 'node:crypto';

export const stripReviews = html => html.replace(/\n?<!-- atlas-review:[\w-]+:start -->[\s\S]*?<!-- atlas-review:[\w-]+:end -->/g, '');
export const digest = html => createHash('sha256').update(stripReviews(html).trim()).digest('hex');
export const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// These hand-maintained pages use nested details; stop at the matching close,
// not the first nested disclosure. Generated review blocks are excluded.
export function unitsIn(html, kind) {
  html = stripReviews(html);
  const tag = kind === 'blueprint' ? 'details' : 'section';
  const className = kind === 'blueprint' ? 'mod' : 'station';
  const starts = new RegExp(`<${tag}\\b[^>]*class="${className}"[^>]*>`, 'g');
  return [...html.matchAll(starts)].map(match => {
    const id = match[0].match(/\bid="([^"]+)"/)?.[1];
    if (!id) throw new Error('Review unit needs a stable id');
    const tags = new RegExp(`<\\/?${tag}\\b[^>]*>`, 'g');
    tags.lastIndex = match.index + match[0].length;
    let depth = 1, token;
    while ((token = tags.exec(html))) {
      depth += token[0].startsWith('</') ? -1 : 1;
      if (!depth) break;
    }
    if (depth) throw new Error(`Unclosed review unit: ${id}`);
    const content = html.slice(match.index, tags.lastIndex);
    const title = content.match(kind === 'blueprint' ? /class="m-name">([^<]+)/ : /<h2>([^<]+)/)?.[1];
    return { id, title, content, start: match.index, end: tags.lastIndex };
  });
}

export function statusOf(record, content) {
  if (!record.checkedAt) return 'pending';
  return record.contentHash === digest(content) ? 'checked' : 'stale';
}

// The public manifest is an allowlist, never a serialized internal work queue.
export function validateRegistry(data, pages) {
  const errors = [], seen = new Set();
  const fields = (object, allowed, label) => {
    for (const key of Object.keys(object)) if (!allowed.includes(key)) errors.push(`${label}: non-public field ${key}`);
  };
  fields(data, ['version', 'updated', 'sources', 'units'], 'manifest');
  for (const [id, source] of Object.entries(data.sources)) {
    fields(source, ['title', 'url', 'scope', 'checkedAt'], `source ${id}`);
  }
  const available = new Map();
  for (const [page, kind] of [['blueprint.html', 'blueprint'], ['thread.html', 'journey']]) {
    for (const unit of unitsIn(pages[page], kind)) available.set(`${page}#${unit.id}`, unit);
  }
  for (const record of data.units) {
    const key = `${record.page}#${record.id}`;
    fields(record, ['page', 'id', 'title', 'checkedAt', 'evidence', 'boundary', 'contentHash'], key);
    const unit = available.get(key);
    if (!unit || seen.has(key)) { errors.push(`Duplicate or unknown source record: ${key}`); continue; }
    seen.add(key);
    if (record.title !== unit.title) errors.push(`${key}: title changed`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(record.checkedAt) || !record.evidence?.length || !record.boundary) errors.push(`${key}: incomplete source evidence`);
    if (statusOf(record, unit.content) !== 'checked') errors.push(`${key}: content changed since source comparison; recheck the affected statements`);
    for (const evidence of record.evidence || []) {
      fields(evidence, ['claim', 'sources'], `${key} evidence`);
      if (!evidence.claim || !evidence.sources?.length) errors.push(`${key}: claim needs sources`);
      for (const id of evidence.sources || []) if (!data.sources[id]?.url || !data.sources[id]?.checkedAt) errors.push(`${key}: missing source ${id}`);
    }
  }
  if (errors.length) throw new Error(errors.join('\n'));
}
