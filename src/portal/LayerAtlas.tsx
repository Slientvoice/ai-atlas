"use client";
import { useState } from "react";

const layers = [
  ["算力", "GPU、云与机房", "#347dc5"],
  ["数据", "采集与清洗", "#21866b"],
  ["模型", "训练与表示", "#ab760c"],
  ["对齐", "偏好与安全", "#487744"],
  ["部署", "权重与 API", "#7158a5"],
  ["应用", "检索与工具", "#bc653e"],
  ["产品", "界面与标识", "#a9577e"],
] as const;

export default function LayerAtlas({ base }: { base: string }) {
  const [hovered, setHovered] = useState<number | null>(null);
  return <div className="layer-atlas">
    <svg className="layer-section" viewBox="0 0 222 226" aria-hidden="true">
      <path className="section-datum" d="M18 42v141m99-170v146m88-116v142M109 72v141" />
      {layers.map((_, depth) => {
        const i = layers.length - 1 - depth;
        const layer = layers[i];
        const y = 9 + i * 21;
        return <g key={layer[0]} transform={`translate(0 ${y})`} className={hovered === i ? "slice highlighted" : "slice"}>
          <path className="slice-edge" d="M14 42 108 71 207 41v5l-99 30-94-29Z" />
          <path className="slice-top" d="M14 42 113 12 207 41 108 71Z"/>
          <path className="slice-grid" d="m38 35 94 29m-69-37 94 29m-69-37 94 29m-143 1 98-30m-74 37 98-29m-74 37 98-30" />
          <circle cx="108" cy="71" r="3.8" fill={layer[2]} />
        </g>;
      })}
    </svg>
    <ol className="layer-legend" aria-label="全景地图的七个技术层">
      {layers.map(([name, topic, color], i) => <li key={name}>
        <a href={base + "/index-map.html#layer-" + i} onFocus={() => setHovered(i)} onBlur={() => setHovered(null)}
          onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
          <i style={{ background: color }} aria-hidden="true" /><span className="layer-code">L{i}</span>
          <strong>{name}</strong><span className="layer-topic">{topic}</span>
        </a>
      </li>)}
    </ol>
  </div>;
}
