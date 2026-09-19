export const pages = [
  ['index.html', '首页'], ['blueprint.html', '工程蓝图'],
  ['toolchain.html', '工业现场'], ['genealogy.html', '模型门派谱系'],
  ['thread.html', '一句话的旅程'], ['index-map.html', '索引地图'],
  ['progress.html', '项目进度'],
];
const knownPages = new Set([...pages.map(([file]) => file), 'font-fitting.html']);

export function isAtlasURL(value, homeURL) {
  try {
    if (!value) return false;
    const url = new URL(value, homeURL);
    const root = new URL('.', homeURL);
    const file = url.pathname.slice(root.pathname.length) || 'index.html';
    return url.origin === root.origin && url.pathname.startsWith(root.pathname) && knownPages.has(file);
  } catch { return false; }
}

// Only traverse adjacent entries within this Atlas, never an unrelated site.
// Older browsers retain ordinary home/directory links and a same-site return link.
export function historyTargets(env, homeURL) {
  const nav = env.navigation;
  if (nav?.currentEntry && typeof nav.entries === 'function') {
    const entries = nav.entries();
    const position = entries.findIndex(entry => entry.key === nav.currentEntry.key);
    const back = position > 0 ? entries[position - 1]?.url : null;
    const forward = position >= 0 ? entries[position + 1]?.url : null;
    return { back: isAtlasURL(back, homeURL) ? back : null,
      forward: isAtlasURL(forward, homeURL) ? forward : null, native: true };
  }
  const previous = env.document?.referrer;
  return { back: isAtlasURL(previous, homeURL) && previous !== env.location.href ? previous : null,
    forward: null, native: false };
}

const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
export function navigationContents(current, base = '.') {
  const name = pages.find(([file]) => file === current)?.[1] || '字体试衣间';
  const home = `${base}/index.html`;
  return `<div class="atlas-nav-identity"><a class="atlas-nav-brand" href="${escape(home)}" aria-label="AI Atlas 首页">AI—ATLAS <span aria-hidden="true">o &gt; _</span></a><span class="atlas-nav-current">${name}</span></div>
    <div class="atlas-nav-actions" aria-label="浏览历史与首页">
      <button type="button" data-atlas-back disabled title="没有可返回的站内记录"><span aria-hidden="true">←</span> 后退</button>
      <button type="button" data-atlas-forward disabled title="没有可前进的站内记录">前进 <span aria-hidden="true">→</span></button>
      <a class="atlas-nav-home" href="${escape(home)}"${current === 'index.html' ? ' aria-current="page"' : ''}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 11 9-8 9 8M5 10v10h5v-6h4v6h5V10" /></svg>返回首页</a>
    </div>
    <details class="atlas-nav-directory"><summary>全部页面 <span aria-hidden="true">⌄</span></summary><div class="atlas-nav-menu">${pages.map(([file,label]) => `<a href="${escape(`${base}/${file}`)}"${file===current?' aria-current="page"':''}>${label}<span aria-hidden="true">${file===current?'·':'→'}</span></a>`).join('')}<a class="atlas-nav-top" href="#atlas-top">回到页首 <span aria-hidden="true">↑</span></a></div></details>`;
}

const bound = new WeakSet();
export function initializeNavigation(element) {
  if (!element || bound.has(element)) return () => {};
  bound.add(element);
  const homeURL = new URL(element.querySelector('.atlas-nav-home').href, location.href).href;
  const back = element.querySelector('[data-atlas-back]');
  const forward = element.querySelector('[data-atlas-forward]');
  const directory = element.querySelector('details');
  const sync = () => {
    const state = historyTargets(window, homeURL);
    back.disabled = !state.back;
    back.title = state.back ? '返回上一条站内浏览记录' : '没有可返回的站内记录';
    forward.disabled = !state.forward;
    forward.hidden = !state.native;
    forward.title = state.forward ? '前往下一条站内浏览记录' : '没有可前进的站内记录';
  };
  const goBack = () => {
    const state = historyTargets(window, homeURL);
    if (state.back) state.native ? history.back() : location.assign(state.back);
  };
  const goForward = () => {
    if (historyTargets(window, homeURL).forward) history.forward();
  };
  const closeOutside = event => { if (!directory.contains(event.target)) directory.open = false; };
  const closeWithEscape = event => {
    if (event.key === 'Escape' && directory.open) {
      directory.open = false;
      if (directory.contains(document.activeElement)) directory.querySelector('summary').focus();
    }
  };
  const closeOnLink = event => { if (event.target.closest('a')) directory.open = false; };
  const size = () => document.documentElement.style.setProperty('--atlas-nav-clearance', `${element.offsetHeight + 28}px`);
  // Some legacy labs scroll while initializing. Restore an explicit deep link
  // after load, once those scripts and the initial browser anchor have settled.
  let frame;
  const revealFragment = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      let id;
      try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
      const target = id && document.getElementById(id);
      if (!target) return;
      for (let parent = target; parent; parent = parent.parentElement) {
        if (parent instanceof HTMLDetailsElement) parent.open = true;
      }
      target.scrollIntoView({ block: 'start', behavior: 'instant' });
    });
  };
  const observer = new ResizeObserver(size);
  observer.observe(element);
  back.addEventListener('click', goBack);
  forward.addEventListener('click', goForward);
  directory.addEventListener('click', closeOnLink);
  document.addEventListener('click', closeOutside);
  document.addEventListener('keydown', closeWithEscape);
  window.addEventListener('pageshow', sync);
  window.addEventListener('popstate', sync);
  window.addEventListener('hashchange', sync);
  window.addEventListener('hashchange', revealFragment);
  window.addEventListener('load', revealFragment, { once: true });
  window.navigation?.addEventListener('currententrychange', sync);
  sync(); size();
  if (document.readyState === 'complete') revealFragment();
  return () => {
    observer.disconnect(); bound.delete(element);
    back.removeEventListener('click', goBack); forward.removeEventListener('click', goForward);
    directory.removeEventListener('click', closeOnLink);
    document.removeEventListener('click', closeOutside); document.removeEventListener('keydown', closeWithEscape);
    window.removeEventListener('pageshow', sync); window.removeEventListener('popstate', sync);
    window.removeEventListener('hashchange', sync); window.navigation?.removeEventListener('currententrychange', sync);
    window.removeEventListener('hashchange', revealFragment); window.removeEventListener('load', revealFragment);
    cancelAnimationFrame(frame);
  };
}

if (typeof document !== 'undefined') {
  const boot = () => document.querySelectorAll('[data-atlas-static]').forEach(initializeNavigation);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
}
