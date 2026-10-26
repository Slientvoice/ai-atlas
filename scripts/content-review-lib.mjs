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

export function validateRegistry(data, pages) {
  const errors = [], seen = new Set();
  for (const [page, kind] of [['blueprint.html', 'blueprint'], ['thread.html', 'journey']]) {
    const units = unitsIn(pages[page], kind);
    const records = data.units.filter(r => r.page === page);
    if (records.length !== units.length) errors.push(`${page}: registry does not cover every unit`);
    for (const unit of units) {
      const key = `${page}#${unit.id}`;
      const record = records.find(r => r.id === unit.id);
      if (!record) { errors.push(`Missing ${key}`); continue; }
      seen.add(key);
      if (record.title !== unit.title) errors.push(`${key}: title changed`);
      if (record.checkedAt) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(record.checkedAt) || !record.evidence?.length || !record.boundary) errors.push(`${key}: incomplete review evidence`);
        if (statusOf(record, unit.content) === 'stale') errors.push(`${key}: content changed since review; recheck sources or mark pending`);
        for (const evidence of record.evidence || []) {
          if (!evidence.claim || !evidence.sources?.length) errors.push(`${key}: claim needs sources`);
          for (const id of evidence.sources || []) if (!data.sources[id]?.url || !data.sources[id]?.checkedAt) errors.push(`${key}: missing source ${id}`);
        }
      }
      if (record.humanReview && (!record.humanReview.name || !record.humanReview.date || !record.humanReview.note)) errors.push(`${key}: human review needs name, date and note`);
    }
  }
  const keys = data.units.map(r => `${r.page}#${r.id}`);
  if (new Set(keys).size !== keys.length || keys.some(k => !seen.has(k))) errors.push('Duplicate or unknown review records');
  const legalIds = [...pages['index-map.html'].matchAll(/\{ id:'([^']+)', layer:/g)].map(m => m[1]);
  if (new Set(data.legalHooks.map(r => r.id)).size !== legalIds.length || data.legalHooks.length !== legalIds.length || legalIds.some(id => !data.legalHooks.some(r => r.id === id))) errors.push('Legal hook inventory differs from index map');
  for (const hook of data.legalHooks) if (hook.review && (!hook.review.name || !hook.review.date || !hook.review.note)) errors.push(`${hook.id}: legal review needs name, date and note`);
  if (errors.length) throw new Error(errors.join('\n'));
}
