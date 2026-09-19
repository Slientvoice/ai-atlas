import { CodexAtmosphere, SectionGlyphField } from "./AmbientEffects";
import OverviewMap from "./OverviewMap";
import SiteNavigation from "./SiteNavigation";
import "./home.css";

// Static builds share a directory with the Atlas pages. The Next preview uses
// the published pages so every destination also works outside that directory.
declare const __ATLAS_STATIC_BASE__: string;
const liveBase = typeof __ATLAS_STATIC_BASE__ !== "undefined"
  ? __ATLAS_STATIC_BASE__
  : "https://slientvoice.github.io/ai-atlas";

export const metadata = {
  title: "AI Atlas · 看见 AI 如何工作",
  description: "以技术为主线的交互式 AI 地图：探索工程原理、工业工具与模型谱系，并在关键环节补充法律与合规观察。",
};

const entries = [
  { id: "blueprint", number: "01", lens: "理解原理", title: "工程蓝图", description: "从算力到 Agent，拆开 AI 的工作机制。", stat: "7 个平面 · 45 个实验", action: "进入蓝图", href: "blueprint.html" },
  { id: "toolchain", number: "02", lens: "走进实践", title: "工业现场", description: "沿六个工位，认识今天的工程工具链。", stat: "6 个工位 · 30 个条目", action: "走进现场", href: "toolchain.html" },
  { id: "genealogy", number: "03", lens: "比较选择", title: "模型门派谱系", description: "对照模型家族的架构、能力与开放边界。", stat: "11 个家族 · 6 个维度", action: "查看谱系", href: "genealogy.html" },
];
const journey = ["算力", "分词", "向量", "注意力", "检索", "决策", "生成", "护栏", "界面"];

function EntryIcon({ kind }: { kind: string }) {
  return (
    <svg className="home-entry-icon" viewBox="0 0 64 40" fill="none" aria-hidden="true">
      {kind === "blueprint" ? <>
        <path d="M6 8h52M6 20h52M6 32h52M17 3v34M32 3v34M47 3v34" opacity=".2" />
        <path d="M10 28V12h16v16H10Zm28 0V12h16v16H38ZM26 20h12" />
        <circle cx="18" cy="20" r="2" fill="currentColor" />
      </> : kind === "toolchain" ? <>
        <path d="M3 20h58" opacity=".4" />
        <rect x="6" y="13" width="12" height="14" rx="2" />
        <rect x="26" y="8" width="12" height="24" rx="2" />
        <rect x="46" y="13" width="12" height="14" rx="2" />
        <path d="m29 20 3 3 5-7" />
      </> : <>
        <path d="M32 11v9H12v9m20-9h20v9m-20-9v9" />
        <circle cx="32" cy="7" r="4" /><circle cx="12" cy="32" r="3" />
        <circle cx="32" cy="32" r="3" /><circle cx="52" cy="32" r="3" />
      </>}
    </svg>
  );
}

export default function Portal() {
  return (
    <main className="portal-page home-v2" id="top">
      <CodexAtmosphere />
      <a className="home-skip" href="#overview">跳到系统全景</a>
      <div className="home-shell">
        <SiteNavigation base={liveBase} />

        <header className="home-hero home-glass">
          <SectionGlyphField />
          <div className="home-hero-copy">
            <span className="home-eyebrow">AN INTERACTIVE FIELD GUIDE TO AI</span>
            <h1>看见 AI <em>如何工作。</em></h1>
            <p><span>以技术为主线，理解 AI 如何运行。</span><span>沿途补充法律与合规观察。</span></p>
          </div>
          <a className="home-start" href={`${liveBase}/thread.html`}>
            <span>第一次来？从一个日常请求开始</span>
            <b>跟随一句话的旅程 <span aria-hidden="true">↗</span></b>
          </a>
        </header>

        <div className="home-dashboard">
          <OverviewMap base={liveBase} />
          <section className="home-entries home-glass" id="explore" aria-labelledby="entries-title">
            <div className="home-entries-heading">
              <h2 id="entries-title">三个入口，三种观看角度</h2>
              <span className="home-eyebrow" aria-hidden="true">EXPLORE ↗</span>
            </div>
            {entries.map((entry) => (
              <a className={`home-entry home-entry-${entry.id}`} href={`${liveBase}/${entry.href}`} key={entry.id}>
                <div className="home-entry-heading">
                  <div><span className="home-entry-lens"><span>{entry.number}</span> / {entry.lens}</span><h3>{entry.title}</h3></div>
                  <EntryIcon kind={entry.id} />
                </div>
                <p>{entry.description}</p>
                <div className="home-entry-bottom"><span>{entry.stat}</span><b>{entry.action} <span aria-hidden="true">↗</span></b></div>
              </a>
            ))}
          </section>
        </div>

        <section className="home-reading home-glass" id="routes" aria-labelledby="routes-title">
          <SectionGlyphField />
          <div className="home-section-heading">
            <div><span className="home-eyebrow">FIND YOUR WAY IN</span><h2 id="routes-title">从一个问题开始。</h2></div>
            <p>顺着一个故事理解整体，或带着一个词直接查找。</p>
          </div>
          <div className="home-reading-grid">
            <article className="home-journey">
              <span className="home-route-label">入门路线 / 09 站</span>
              <h3>“帮我看看合同里的解约条款。”</h3>
              <p>跟随这一句请求，看看算力、模型与应用如何接力。</p>
              <ol className="home-journey-stops" aria-label="一句话的九站旅程">
                {journey.map((stop, i) => <li key={stop}><span>{String(i + 1).padStart(2, "0")}</span><b>{stop}</b></li>)}
              </ol>
              <a className="home-button home-button-blue" href={`${liveBase}/thread.html`}>开始这段旅程 <span aria-hidden="true">↗</span></a>
            </article>
            <article className="home-lookup">
              <span className="home-route-label">按词查找 / 28 个基础节点</span>
              <h3>已经有想了解的概念？</h3>
              <p>从一个技术名词，定位它在整个系统中的位置。</p>
              <div className="home-index-terms" aria-hidden="true"><span>GPU</span><span>Transformer</span><span>RAG</span><span>Agent</span><span>RLHF</span><span>量化</span></div>
              <a className="home-button" href={`${liveBase}/index-map.html`}>打开索引地图 <span aria-hidden="true">↗</span></a>
            </article>
          </div>
        </section>

        <aside className="home-compliance home-glass" id="compliance" aria-labelledby="compliance-title">
          <div className="home-compliance-lead">
            <span className="home-eyebrow">A COMPLEMENTARY LENS / 合规观察</span>
            <h2 id="compliance-title">沿着技术链，定位合规问题。</h2>
            <p>先理解技术如何运行，再讨论使用边界。法律与合规专题将围绕具体环节逐步补充。</p>
            <span className="home-planned">后续专题 · 逐步建设</span>
          </div>
          <div className="home-compliance-topics" aria-label="计划补充的合规观察方向">
            <div><span>01 / 数据与训练</span><p>数据从哪里来，使用依据是什么？</p></div>
            <div><span>02 / 模型与许可</span><p>模型、权重和输出各有哪些使用条件？</p></div>
            <div><span>03 / 应用与部署</span><p>信息如何流转，操作权限与责任如何划分？</p></div>
          </div>
        </aside>

        <section className="home-updates home-glass" aria-labelledby="updates-title">
          <div><span className="home-eyebrow">FIELD NOTES</span><h2 id="updates-title">地图持续生长</h2></div>
          <a href={`${liveBase}/toolchain.html`}><span className="home-update-date">2026.09.18 · 现场 v2</span><b>工业现场：30 个条目，44 个官方来源 <span aria-hidden="true">↗</span></b></a>
          <a href={`${liveBase}/genealogy.html`}><span className="home-update-date">2026.09.17 · 谱系 v3</span><b>模型谱系：11 个家族，6 个比较维度 <span aria-hidden="true">↗</span></b></a>
        </section>

        <section className="home-method" id="method" aria-labelledby="method-title">
          <div className="home-method-lead">
            <span className="home-eyebrow">MECHANISM / EVIDENCE / CONSEQUENCE</span>
            <h2 id="method-title">理解机制，也追问依据。</h2>
            <p>技术解释注明机制与来源，动态信息注明盘点日期。后续法律与合规观察将另行标明适用地区、场景和规则版本。</p>
            <a className="home-button" href={`${liveBase}/progress.html`}>查看方法、来源与版本 <span aria-hidden="true">↗</span></a>
          </div>
          <div className="home-method-notes">
            <article><span>01</span><div><h3>结构可拆</h3><p>把能力放回数据、模型、推理与系统之间。</p></div></article>
            <article><span>02</span><div><h3>证据可查</h3><p>标明资料来源，保留尚未确定的问题。</p></div></article>
            <article><span>03</span><div><h3>时效可见</h3><p>动态内容注明盘点日期，按具体版本阅读。</p></div></article>
          </div>
        </section>

        <footer className="home-footer">
          <a className="home-brand" href="#top">AI—ATLAS <span aria-hidden="true">o &gt; _</span></a>
          <p>技术为主线，合规为补充。</p>
          <a href={`${liveBase}/progress.html`}>版本记录 ↗</a>
          <a href="#top">回到顶部 ↑</a>
        </footer>
      </div>
    </main>
  );
}
