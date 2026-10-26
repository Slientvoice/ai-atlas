import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { digest, statusOf, unitsIn, validateRegistry } from '../scripts/content-review-lib.mjs';

test('nested disclosures stay inside their module and generated badges do not change its fingerprint', () => {
  const unit = '<details class="mod" id="example"><summary><span class="m-name">Example</span></summary><details><summary>Math</summary>Formula</details>Boundary</details>';
  const decorated = unit.replace('Boundary', '\n<!-- atlas-review:example:start -->Badge<!-- atlas-review:example:end -->Boundary');
  assert.equal(unitsIn(decorated + '<details class="mod" id="next"><span class="m-name">Next</span></details>', 'blueprint')[0].content, unit);
  assert.equal(digest(unit), digest(decorated));
});

test('editing a reviewed claim invalidates its status; a date alone cannot validate a claim', () => {
  const original = '<p>SiLU(-1) is negative.</p>';
  const record = { checkedAt: '2026-10-26', contentHash: digest(original) };
  assert.equal(statusOf(record, original), 'checked');
  assert.equal(statusOf(record, '<p>SiLU(-1) is zero.</p>'), 'stale');
  assert.equal(statusOf({ checkedAt: '2026-10-26' }, original), 'stale');
  assert.equal(statusOf({}, original), 'pending');
});

test('public source manifest rejects orphaned references and internal workflow fields', async () => {
  const root = new URL('../', import.meta.url);
  const registry = JSON.parse(await readFile(new URL('assets/content-review.json', root)));
  const pages = Object.fromEntries(await Promise.all(['blueprint.html', 'thread.html', 'index-map.html'].map(async p => [p, await readFile(new URL(p, root), 'utf8')])));
  assert.doesNotThrow(() => validateRegistry(registry, pages));
  const missingSource = structuredClone(registry);
  delete missingSource.sources.token;
  assert.throws(() => validateRegistry(missingSource, pages), /missing source token/);
  const unknownUnit = structuredClone(registry);
  unknownUnit.units[0].id = 'unknown-unit';
  assert.throws(() => validateRegistry(unknownUnit, pages), /unknown source record/);
  for (const mutate of [
    data => { data.legalHooks = []; },
    data => { data.units[0].humanReview = null; },
    data => { data.sources.token.internalNote = 'private'; },
    data => { data.units[0].evidence[0].reviewer = 'private'; },
  ]) {
    const internal = structuredClone(registry);
    mutate(internal);
    assert.throws(() => validateRegistry(internal, pages), /non-public field/);
  }
  const unsupported = structuredClone(registry);
  unsupported.units[0].checkedAt = null;
  assert.throws(() => validateRegistry(unsupported, pages), /incomplete source evidence/);
});

test('public pages and reading guides contain no internal review status displays', async () => {
  const root = new URL('../', import.meta.url);
  const files = ['blueprint.html', 'thread.html', 'index-map.html', 'progress.html', 'genealogy.html', 'README.md', 'PROJECT.md', 'docs/content-review.md', 'docs/release-v0.36.md', 'assets/content-review.json'];
  const internalStatus = /待(?:人工技术|人工与法律|法律)?审校|人工(?:技术)?审校[：\s]*\d|尚未经人工核验|atlas-review-metric/;
  for (const file of files) assert.doesNotMatch(await readFile(new URL(file, root), 'utf8'), internalStatus, file);
});
