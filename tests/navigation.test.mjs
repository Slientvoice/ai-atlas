import test from 'node:test';
import assert from 'node:assert/strict';
import { historyTargets, isAtlasURL } from '../assets/site-navigation.mjs';

const home = 'https://slientvoice.github.io/ai-atlas/index.html';
const base = 'https://slientvoice.github.io/ai-atlas/';
const history = (urls, selected) => {
  const entries = urls.map((url, index) => ({ key: String(index), url }));
  return { navigation: { currentEntry: entries[selected], entries: () => entries } };
};

test('directory homepage and page fragments belong to this Atlas', () => {
  for (const url of [base, home, `${base}blueprint.html#pl4`, `${base}toolchain.html?view=all#agents`]) {
    assert.equal(isAtlasURL(url, home), true, url);
  }
  const localHome = 'http://127.0.0.1:8767/home-v2-preview/index.html';
  assert.equal(isAtlasURL('./thread.html', localHome), true);
});

test('external sites, other projects and unknown paths are not return targets', () => {
  for (const url of [null, '', 'https://example.org/', 'https://slientvoice.github.io/other/index.html', `${base}unknown.html`, `${base}assets/file.js`, `${base}sub/index.html`]) {
    assert.equal(isAtlasURL(url, home), false, String(url));
  }
});

test('direct entry has no history actions', () => {
  assert.deepEqual(historyTargets(history([`${base}index-map.html`], 0), home), { back: null, forward: null, native: true });
});

test('back then forward follows native adjacent entries, including anchors', () => {
  const urls = [home, `${base}toolchain.html`, `${base}blueprint.html#mod-rag`, `${base}blueprint.html#pl5`];
  assert.deepEqual(historyTargets(history(urls, 2), home), { back: urls[1], forward: urls[3], native: true });
  assert.deepEqual(historyTargets(history(urls, 3), home), { back: urls[2], forward: null, native: true });
  assert.deepEqual(historyTargets(history(urls, 0), home), { back: null, forward: urls[1], native: true });
});

test('navigation does not skip an unrelated adjacent entry', () => {
  const urls = [home, 'https://example.org/', `${base}blueprint.html`, `${base}unknown.html`, `${base}toolchain.html`];
  assert.deepEqual(historyTargets(history(urls, 2), home), { back: null, forward: null, native: true });
});

test('missing current entry fails closed', () => {
  const env = history([home], 0);
  env.navigation.currentEntry = { key: 'missing' };
  assert.deepEqual(historyTargets(env, home), { back: null, forward: null, native: true });
});

test('older browsers use a same-site referrer only, never a speculative forward action', () => {
  const env = { document: { referrer: home }, location: { href: `${base}thread.html` } };
  assert.deepEqual(historyTargets(env, home), { back: home, forward: null, native: false });
  for (const previous of ['', env.location.href, 'https://example.org/', `${base}unknown.html`]) {
    env.document.referrer = previous;
    assert.deepEqual(historyTargets(env, home), { back: null, forward: null, native: false });
  }
});
