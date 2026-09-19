"use client";

import { useState } from "react";
import type { CSSProperties } from "react";

const steps = [
  { name: "分词", en: "TOKENIZE", title: "文本 → Token", text: "分词器把文本切成 token，并映射为编号。一个 token 不一定对应一个汉字或一个词。" },
  { name: "向量", en: "EMBEDDING", title: "Token → 向量表示", text: "把 token 编号映射为向量，配合位置信息进入模型。图中的色块代表向量维度。" },
  { name: "注意力", en: "ATTENTION", title: "在上下文中建立联系", text: "因果注意力在当前位置及之前的位置间聚合信息。矩阵中的空白表示未来位置被遮罩。" },
  { name: "前馈", en: "FEED-FORWARD", title: "逐位置变换，再层层处理", text: "前馈网络对每个位置的表示做非线性变换；注意力与前馈网络在多个 Transformer 块中重复。" },
  { name: "预测", en: "NEXT TOKEN", title: "表示 → 下一个 Token", text: "将最后位置的表示投影到词表，经 softmax 得到概率，再按解码策略选取下一个 token。" },
];

// Original, schematic SVG: this is an explanatory diagram, not a live model run.
export default function ModelCutaway({ base }: { base: string }) {
  const [active, setActive] = useState(2);
  const step = steps[active];
  const on = (index: number) => active === index ? "model-part is-active" : "model-part";

  return <div className="home-model-cutaway">
    <div className="home-model-caption"><span>点选下方步骤，查看局部</span><span>解码器式 Transformer · 简图</span></div>
    <div className="home-model-graphic" style={{ "--diagram-focus": `${[54,163,291,423,604][active]}px` } as CSSProperties}>
      <svg viewBox="0 0 700 206" role="img" aria-label="文本经过分词、向量表示、因果注意力、前馈网络，得到下一个 token 的概率分布。注意力和前馈网络在多个 Transformer 块中重复。">
        <defs>
          <marker id="model-arrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0 0 5 2.5 0 5" fill="#93a4c4" /></marker>
        </defs>
        <g className="model-connectors" fill="none" stroke="#93a4c4" strokeWidth="1.2" markerEnd="url(#model-arrow)">
          <path d="M94 99H128" /><path d="M200 99H248" /><path d="M335 99H375" /><path d="M468 99H524" />
        </g>
        <rect className="model-block-boundary" x="234" y="17" width="253" height="153" rx="14" />
        <text className="model-block-label" x="360" y="36" textAnchor="middle">TRANSFORMER BLOCK × N</text>
        <g className={on(0)}>
          <text className="model-stage-label" x="54" y="32" textAnchor="middle">文本片段</text>
          {["人工", "智能", "可以"].map((token, i) => <g key={token} transform={`translate(15 ${49 + i * 34})`}>
            <rect className="model-token" width="79" height="27" rx="6" />
            <text x="39.5" y="18" textAnchor="middle">{token}</text>
          </g>)}
          <text className="model-stage-code" x="54" y="163" textAnchor="middle">TOKEN IDS</text>
        </g>
        <g className={on(1)}>
          <text className="model-stage-label" x="163" y="32" textAnchor="middle">向量表示</text>
          {Array.from({ length: 24 }, (_, i) => <rect key={i} x={134 + i % 4 * 15} y={53 + Math.floor(i / 4) * 14} width="11" height="10" rx="2" className="model-cell" opacity={.22 + ((i * 7 + 3) % 11) * .06} />)}
          <text className="model-stage-code" x="163" y="163" textAnchor="middle">EMBEDDING</text>
        </g>
        <g className={on(2)}>
          {Array.from({ length: 25 }, (_, i) => <rect key={i} x={255 + i % 5 * 15} y={55 + Math.floor(i / 5) * 15} width="11" height="11" rx="2" className={i % 5 <= Math.floor(i / 5) ? "model-cell" : "model-masked-cell"} opacity={i % 5 <= Math.floor(i / 5) ? .28 + ((i * 3) % 7) * .1 : 1} />)}
          <text className="model-stage-label" x="291" y="151" textAnchor="middle">因果注意力</text>
        </g>
        <g className={on(3)}>
          <g className="model-neuron-lines" stroke="currentColor" strokeWidth=".6" opacity=".3">
            {[69, 96, 123].flatMap((y, i) => [54, 75, 96, 117, 138].map((other, j) => <path key={`${i}-${j}`} d={`M388 ${y}L423 ${other}L458 ${y}`} fill="none" />))}
          </g>
          {[69, 96, 123].map(y => <g key={y}><circle className="model-neuron" cx="388" cy={y} r="4.5" /><circle className="model-neuron" cx="458" cy={y} r="4.5" /></g>)}
          {[54, 75, 96, 117, 138].map(y => <circle className="model-neuron" key={y} cx="423" cy={y} r="4.5" />)}
          <text className="model-stage-label" x="423" y="157" textAnchor="middle">前馈网络</text>
        </g>
        <g className={on(4)}>
          <text className="model-stage-label" x="604" y="32" textAnchor="middle">下一 token 概率</text>
          {[{label:"帮助",p:46},{label:"生成",p:29},{label:"理解",p:16},{label:"其他",p:9}].map((token,i) => <g key={token.label} transform={`translate(529 ${53+i*25})`}>
            <text x="0" y="10">{token.label}</text>
            <rect className="model-prob-track" x="32" width="95" height="12" rx="3" />
            <rect className="model-cell" x="32" width={token.p*1.9} height="12" rx="3" opacity={.8-i*.13} />
            <text className="model-prob-value" x="134" y="10">{token.p}%</text>
          </g>)}
          <text className="model-stage-code" x="603" y="163" textAnchor="middle">PROJECTION + SOFTMAX</text>
        </g>
        <path className="model-return" d="M605 174V190H55V174" fill="none" stroke="#a4b1cb" strokeWidth="1" strokeDasharray="3 4" markerEnd="url(#model-arrow)" />
        <rect x="234" y="180" width="252" height="20" rx="10" fill="#edf1fb" />
        <text className="model-return-label" x="360" y="194" textAnchor="middle">选出一个 token，加入上下文，继续生成</text>
      </svg>
    </div>
    <div className="home-model-steps" role="group" aria-label="选择模型内部步骤">
      {steps.map((item, index) => <button key={item.en} type="button" aria-pressed={active === index} aria-controls="model-step-detail" onClick={() => setActive(index)}><span>{String(index+1).padStart(2,"0")}</span>{item.name}</button>)}
    </div>
    <div className="home-model-detail" id="model-step-detail">
      <div aria-live="polite" aria-atomic="true"><h3>{step.title}</h3><p>{step.text}</p></div>
      <a className="home-detail-link" href={`${base}/blueprint.html#pl2`}>深入模型本体 <span aria-hidden="true">↗</span></a>
    </div>
    <p className="home-map-footnote">分词与数值仅为示意；省略位置编码、归一化和残差连接等细节。</p>
  </div>;
}
