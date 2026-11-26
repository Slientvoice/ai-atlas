import LayerAtlas from "./LayerAtlas";
import { AtlasFlowAtmosphere } from "./AmbientEffects";
import SiteNavigation from "./SiteNavigation";
import { siteName } from "../../assets/site-navigation.mjs";
import OverviewMap from "./OverviewMap";
import "./home.css";
import "./field-guide.css";

declare const __ATLAS_STATIC_BASE__: string;
const base = typeof __ATLAS_STATIC_BASE__ === "undefined" ? "https://slientvoice.github.io/ai-atlas" : __ATLAS_STATIC_BASE__;
const url = (file: string) => base + "/" + file;

export const metadata = {
  title: siteName + " · AI Atlas",
  description: "沿七个技术层理解 AI 系统，用合同问答和模型选型核对数据使用权限、模型许可与输出依据。",
};

const checks = [
  ["谁能检索这份合同？", "用权限不同的账号发起同一查询，核对各自能读到的合同片段。", "查看合同检索", "thread.html#st5"],
  ["选定的型号允许怎样使用？", "记下具体版本、交付方式和许可原文，逐项核对商用与再分发条件。", "查看选型核对项", "genealogy.html#selection-notes"],
  ["用户最后看到了什么？", "留一份最终回答，对照合同原文核实引文，并检查生成标识的呈现。", "查看回答界面", "thread.html#st9"],
];

export default function Portal() {
  return <div className="home-v2 field-guide" id="top">
    <AtlasFlowAtmosphere />
    <a className="home-skip" href="#routes">跳到正文</a>
    <SiteNavigation base={base}/>
    <main className="guide-main" id="routes" tabIndex={-1}>
      <section className="glass panorama" id="overview" aria-labelledby="panorama-title">
        <div className="pano-copy">
          <p className="kicker">七个技术层 · 28 个节点</p>
          <h1 id="panorama-title"><a href={url("index-map.html")}>{siteName}</a></h1>
          <p className="lead">从算力到产品，沿七个技术层理解 AI 系统。<br/>每一层都附有合规批注，涵盖数据授权、模型许可和输出责任。</p>
          <a className="pano-link" href={url("index-map.html#map")}>打开全景地图</a>
        </div>
        <LayerAtlas base={base}/>
      </section>

      <div className="feature-pair" id="explore">
        <article className="glass contract-feature">
          <div className="feature-copy">
            <p className="kicker">合同问答 · 九站</p>
            <h2><a href={url("thread.html")}>从一个合同开始</a></h2>
            <p>“帮我看看这份合同里的解约条款。”跟着这次请求，看系统如何检索原文，以及谁有权读取这些条款。</p>
            <a className="text-action" href={url("thread.html")}>跟读这次合同问答</a>
          </div>
          <figure className="contract-excerpt">
            <figcaption>合同节选 <span>教学示例</span></figcaption>
            <p><b>12.2</b> 任一方均可<mark>提前 30 日以书面形式通知</mark>对方解除本合同。</p>
          </figure>
        </article>
        <article className="glass family-feature">
          <p className="kicker">模型选型 · 13 个家族</p>
          <h2><a href={url("genealogy.html")}>门派谱系</a></h2>
          <p>哪些型号提供权重，哪些通过 API 调用？按具体版本查架构、部署方式和许可原文。</p>
          <a className="text-action" href={url("genealogy.html#matrix-title")}>对照模型家族</a>
        </article>
      </div>

      <section className="glass engineering" aria-labelledby="engineering-title">
        <div className="section-head">
          <div><h2 id="engineering-title"><a href={url("blueprint.html")}>工程蓝图</a></h2>
          <p>用 49 个实验拆开训练、推理和系统组装。</p></div>
          <a className="text-action" href={url("blueprint.html")}>进入实验</a>
        </div>
        <details className="engineering-detail">
          <summary>浏览工程关系图与模型剖面</summary>
          <OverviewMap base={base}/>
        </details>
      </section>

      <section className="glass evidence" id="compliance" aria-labelledby="checks-title" tabIndex={-1}>
        <div className="section-head"><div><h2 id="checks-title">项目合规核对</h2>
          <p>上线前，可以把这三项写进验收记录。</p></div></div>
        <div className="check-list">{checks.map(([title, body, label, target]) =>
          <article key={target}><h3>{title}</h3><p>{body}</p><a className="text-action" href={url(target)}>{label}</a></article>
        )}</div>
      </section>
      <footer id="method" className="guide-footer">
        <div><strong>{siteName}</strong><span>工具、资料与版本</span></div>
        <nav aria-label="其他资料"><a href={url("toolchain.html")}>工业现场</a><a href={url("progress.html#review-status")}>来源与核对日期</a><a href={url("progress.html#vlist")}>版本记录</a><a href="https://ai-reg-tracker.jiamaooooo.workers.dev/">AI 监管观察</a></nav>
      </footer>
    </main>
  </div>;
}
