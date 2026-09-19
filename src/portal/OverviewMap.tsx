"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import ModelCutaway from "./ModelCutaway";

const planes = [
  { code: "P0", name: "物理底座", short: "算力 · 显存 · 互联", count: 5, color: "#536579", description: "GPU、显存墙、数值格式与集群互联：理解整个系统的资源边界。" },
  { code: "P1", name: "训练流水线", short: "语料 · 学习 · 对齐", count: 9, color: "#9b7025", description: "从语料处理、预训练到 SFT、偏好优化与评测，理解模型如何获得能力。" },
  { code: "P2", name: "模型本体", short: "表示 · 注意力 · 结构", count: 10, color: "#365fd3", description: "走进 Token、Embedding、Attention 与 MoE，拆开模型内部的信息流。" },
  { code: "P3", name: "推理服务", short: "计算 · 缓存 · 生成", count: 6, color: "#7158ba", description: "从 Prefill、KV Cache 到采样与量化，理解模型如何高效生成答案。" },
  { code: "P4", name: "系统组装", short: "检索 · 工具 · 编排", count: 7, color: "#148065", description: "用 Context、RAG、Agent 与 MCP 连接模型、知识和工具，形成可用的系统。" },
  { code: "P5", name: "多模态", short: "图像 · 视频 · 语音", count: 6, color: "#b5583b", description: "从视觉语言到扩散、视频与语音，理解模型如何跨越文本之外的媒介。" },
  { code: "P6", name: "具身与世界", short: "世界模型 · VLA", count: 2, color: "#9b4f79", description: "从世界模型到视觉—语言—动作，理解预测、行动与环境之间的关系。" },
] as const;

export default function OverviewMap({ base }: { base: string }) {
  const [selected, setSelected] = useState(4);
  const [view, setView] = useState<"system" | "model">("system");
  const plane = planes[selected];

  function planeButton(index: number, variant = "") {
    const item = planes[index];
    return (
      <button type="button" className={`home-plane ${variant}`} key={item.code}
        style={{ "--plane-color": item.color } as CSSProperties}
        aria-pressed={selected === index} aria-controls="plane-detail"
        aria-label={`${item.code} ${item.name}，${item.count} 个交互实验`}
        onClick={() => setSelected(index)}>
        <span className="home-plane-code">{item.code}<span className="home-plane-count">{String(item.count).padStart(2, "0")}</span></span>
        <strong>{item.name}</strong><small>{item.short}</small>
      </button>
    );
  }

  return (
    <section className="home-overview home-glass" id="overview" aria-labelledby="overview-title">
      <div className="home-map-heading">
        <div><span className="home-eyebrow">THE BIG PICTURE</span><h2 id="overview-title">AI 系统全景</h2></div>
        <div className="home-map-views" role="group" aria-label="全景图视图">
          <button type="button" aria-pressed={view === "system"} aria-controls="overview-content" onClick={() => setView("system")}>系统关系</button>
          <button type="button" aria-pressed={view === "model"} aria-controls="overview-content" onClick={() => setView("model")}>模型剖面 <span aria-hidden="true">↗</span></button>
        </div>
      </div>
      <div className="home-overview-content" id="overview-content">
      {view === "model" ? <ModelCutaway base={base} /> : <>
      <div className="home-map-diagram" role="group" aria-label="七个技术平面，点击查看简介和章节入口">
        <div className="home-map-caption"><span>7 个技术平面 · 45 个交互实验</span><span>点选一个平面，继续深入 <span aria-hidden="true">↓</span></span></div>
        <div className="home-main-chain">
          {[1, 2, 3, 4].map((index) => <div className="home-chain-step" key={index}>
            {planeButton(index)}{index < 4 && <span className="home-chain-arrow" aria-hidden="true">→</span>}
          </div>)}
        </div>
        <div className="home-foundation">
          <span className="home-support-line" aria-hidden="true"><i /><i /><i /><i /></span>
          {planeButton(0, "home-plane-wide")}
          <span className="home-foundation-note">支撑整条工程链 <span aria-hidden="true">↑</span></span>
        </div>
        <div className="home-extensions">
          <div className="home-extension-label"><b>能力延伸</b><span>跨越模型与系统</span></div>
          {planeButton(5, "home-plane-extension")}{planeButton(6, "home-plane-extension")}
        </div>
      </div>
      <div className="home-plane-detail" id="plane-detail" style={{ "--plane-color": plane.color } as CSSProperties}>
        <div aria-live="polite" aria-atomic="true">
          <div className="home-detail-title"><span>{plane.code}</span><h3>{plane.name}</h3><small>{plane.count} 个实验</small></div>
          <p>{plane.description}</p>
        </div>
        <a className="home-detail-link" href={`${base}/blueprint.html#pl${selected}`}>深入{plane.name}<span aria-hidden="true">↗</span></a>
      </div>
      <p className="home-map-footnote">这是一张工程关系图；一次请求通常调用已训练的模型。</p>
      </>}
      </div>
    </section>
  );
}
