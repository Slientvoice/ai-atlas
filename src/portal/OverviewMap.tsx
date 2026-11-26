"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import ModelCutaway from "./ModelCutaway";
import GlassSurface from "./GlassSurface";

const planes = [
  { code: "P0", name: "物理底座", short: "算力 · 显存 · 互联", count: 5, color: "#536579", description: "GPU、显存墙、数值格式与集群互联：理解整个系统的资源边界。" },
  { code: "P1", name: "训练流水线", short: "语料 · 学习 · 供应链", count: 10, color: "#9b7025", description: "从语料处理、预训练、SFT 与偏好优化到评测、供应链安全与内容溯源，理解模型如何获得能力与出处凭证。" },
  { code: "P2", name: "模型本体", short: "表示 · 注意力 · 稀疏记忆", count: 11, color: "#365fd3", description: "走进 Token、Embedding、Attention、MoE 与条件记忆稀疏路由，拆开模型内部的信息流。" },
  { code: "P3", name: "推理服务", short: "缓存 · 量化 · 循环深度", count: 7, color: "#7158ba", description: "从 Prefill、KV Cache、采样量化到测试时算力与循环深度推理，理解模型如何高效生成答案。" },
  { code: "P4", name: "系统组装", short: "检索 · 协议 · 隔离沙箱", count: 8, color: "#148065", description: "用 Context、RAG、Agent、MCP 与隔离沙箱连接模型、知识与工具，形成可控可用的系统。" },
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
    <GlassSurface className="home-overview" id="engineering-map" aria-labelledby="overview-title">
      <div className="home-map-heading">
        <div><h3 id="overview-title">工程关系图</h3></div>
        <div className="home-map-views" role="group" aria-label="全景图视图">
          <button type="button" aria-pressed={view === "system"} aria-controls="overview-content" onClick={() => setView("system")}>系统关系</button>
          <button type="button" aria-pressed={view === "model"} aria-controls="overview-content" onClick={() => setView("model")}>模型剖面 <span aria-hidden="true">↗</span></button>
        </div>
      </div>
      <div className="home-overview-content" id="overview-content">
      {view === "model" ? <ModelCutaway base={base} /> : <>
      <div className="home-map-diagram" role="group" aria-label="七个技术平面，点击查看简介和章节入口">
        <div className="home-map-caption"><span>7 个技术平面 · 49 个交互实验</span><span>点选一个平面，继续深入 <span aria-hidden="true">↓</span></span></div>
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
    </GlassSurface>
  );
}
