import OverviewMap from "./OverviewMap";
import ReadingPlate, { chapters } from "./ReadingPlate";
import SiteNavigation from "./SiteNavigation";
import "./home.css";

declare const __ATLAS_STATIC_BASE__: string;
const base = typeof __ATLAS_STATIC_BASE__ !== "undefined" ? __ATLAS_STATIC_BASE__ : "https://slientvoice.github.io/ai-atlas";

export const metadata = {
  title: "AI Atlas · 人工智能技术地图集",
  description: "从一个日常请求出发，探索 AI 的工程原理、工业工具与模型家族。",
};

const journey = ["算力", "分词", "向量", "注意力", "检索", "决策", "生成", "护栏", "界面"];

export default function Portal() {
  return <div className="folio" id="top">
    <a className="skip" href="#explore">跳到分册目录</a>
    <div className="folio-shell">
      <SiteNavigation base={base}/>
      <main>
        <header className="cover">
          <div className="cover-copy">
            <p className="kicker cover-kicker" lang="en">A FIELD GUIDE TO AI</p>
            <h1>人工智能<br/>技术地图集<span className="title-stop" aria-hidden="true">.</span></h1>
            <p className="cover-intro">一句请求怎样变成回答？<br/>从模型内部的计算，走到部署模型的工业现场。</p>
            <div className="cover-actions">
              <a className="primary" href={`${base}/thread.html`}>从一句话开始 <span aria-hidden="true">→</span></a>
              <a className="text-link" href={`${base}/index-map.html`}>按概念查找 <span aria-hidden="true">↗</span></a>
            </div>
          </div>
          <ReadingPlate base={base}/>
        </header>

        <section id="explore" className="chapter-index" aria-labelledby="entries-title">
          <div className="section-intro">
            <span className="kicker" lang="en">CONTENTS</span><h2 id="entries-title">分册目录</h2>
            <p>读原理、查工具，或把两个模型家族放在一起比较。</p>
            <a className="text-link" href="#overview">进入交互实验 <span aria-hidden="true">↓</span></a>
          </div>
          <div className="chapter-list">
            {chapters.map(ch => <a className="chapter" key={ch.code} href={`${base}/${ch.file}`}>
              <span className="chapter-code">{ch.code}</span>
              <div><div className="chapter-title"><h3>{ch.title}</h3><i lang="en">{ch.english}</i></div><p>{ch.note}</p></div>
              <span className="chapter-stat">{ch.stat}</span><span className="chapter-arrow" aria-hidden="true">↗</span>
            </a>)}
          </div>
        </section>

        <OverviewMap base={base}/>

        <section id="routes" className="reading-routes" aria-labelledby="routes-title">
          <div className="section-intro"><span className="kicker" lang="en">READING ROUTES</span><h2 id="routes-title">两条阅读路线</h2></div>
          <div className="route-body">
            <div><h3><a href={`${base}/thread.html`}>跟随一句话的旅程 <span aria-hidden="true">↗</span></a></h3>
              <p>“帮我看看合同里的解约条款。”这句请求会经过哪些环节？</p>
              <ol className="stops" aria-label="九站旅程">{journey.map(s => <li key={s}>{s}</li>)}</ol>
            </div>
            <div><h3><a href={`${base}/index-map.html`}>按技术名词查找 <span aria-hidden="true">↗</span></a></h3>
              <p>在索引地图的 28 个基础节点中，找到 GPU、Transformer 或 RAG 的位置。</p></div>
          </div>
        </section>

        <section className="endnotes" aria-label="编辑手记与修订">
          <div id="method"><span className="kicker" lang="en">EDITORIAL NOTES</span><h2 id="method-title">阅读与依据</h2>
            <p>工程图注明教学简化，工具与模型资料标出盘点日期。阅读某项能力时，可以回到对应版本的原始来源。</p>
            <a className="text-link" href={`${base}/progress.html#review-status`}>查看来源与阅读说明 <span aria-hidden="true">↗</span></a>
            <details id="compliance"><summary id="compliance-title">合规观察 · 专题筹备中</summary><p>后续专题将沿三个环节展开。训练阶段看数据来源，发布阶段看模型与权重的使用许可，部署阶段看信息流向与责任。</p></details>
          </div>
          <div><span className="kicker" lang="en">FIELD NOTES</span><h2 id="updates-title">修订记录</h2>
            <ul className="revisions">
              <li><time dateTime="2026-11-20">11.20</time><a href={`${base}/progress.html`}>首页改版 · 三册阅读地形图</a></li>
              <li><time dateTime="2026-11-19">11.19</time><a href={`${base}/toolchain.html`}>工业现场 v3 · 推理压测与部署</a></li>
              <li><time dateTime="2026-11-19">11.19</time><a href={`${base}/genealogy.html`}>模型谱系 v6 · 权重与许可</a></li>
            </ul><a className="text-link" href={`${base}/progress.html`}>全部版本记录 <span aria-hidden="true">↗</span></a>
          </div>
        </section>
      </main>
      <footer className="folio-footer"><a href="#top">AI Atlas</a><span>人工智能技术地图集</span><a href="#top">回到顶部 ↑</a></footer>
    </div>
  </div>;
}
