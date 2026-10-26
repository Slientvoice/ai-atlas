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

test('release registry rejects orphaned sources, missing modules and invented human approvals', async () => {
  const root = new URL('../', import.meta.url);
  const registry = JSON.parse(await readFile(new URL('assets/content-review.json', root)));
  const pages = Object.fromEntries(await Promise.all(['blueprint.html', 'thread.html', 'index-map.html'].map(async p => [p, await readFile(new URL(p, root), 'utf8')])));
  assert.doesNotThrow(() => validateRegistry(registry, pages));
  const missingSource = structuredClone(registry);
  delete missingSource.sources.token;
  assert.throws(() => validateRegistry(missingSource, pages), /missing source token/);
  const missingUnit = structuredClone(registry);
  missingUnit.units.pop();
  assert.throws(() => validateRegistry(missingUnit, pages), /cover every unit/);
  const unsigned = structuredClone(registry);
  unsigned.units[0].humanReview = { date: '2026-10-26' };
  assert.throws(() => validateRegistry(unsigned, pages), /human review needs/);
});
