export const chapters = [
  { code: "A", title: "工程蓝图", english: "System blueprint", file: "blueprint.html", note: "从一块 GPU 到一个 Agent，拆开系统的七个技术平面。", stat: "45 个实验" },
  { code: "B", title: "工业现场", english: "Engineering practice", file: "toolchain.html", note: "沿六个工位，看工程师如何训练、部署和评测模型。", stat: "30 个条目" },
  { code: "C", title: "模型门派谱系", english: "Model families", file: "genealogy.html", note: "对照架构、能力与开放条件，辨认模型家族之间的差异。", stat: "11 个家族" },
] as const;

// An oblique relief engraving. Each profile occludes the profiles behind it.
// The heights make a schematic landscape and do not encode measurements.
function project(u: number, v: number) {
  const ridge = (x: number, y: number, spread: number) =>
    Math.exp(-((u - x) ** 2 + (v - y) ** 2) / spread);
  const envelope = Math.max(0, (1 - u ** 4) * (1 - v ** 4));
  const fold = .075 * Math.sin(u * 15 + v * 12) + .035 * Math.sin(v * 27 - u * 9);
  const elevation = (124 * ridge(-.32, .22, .16) + 87 * ridge(.47, .14, .19)
    + 55 * ridge(-.28, -.54, .13)) * envelope * (1 + fold);
  return [310 + 184 * u + 101 * v, 210 + 49 * u - 67 * v - elevation];
}
const point = (p: number[]) => p.map(n => n.toFixed(1)).join(",");
const profiles = Array.from({ length: 61 }, (_, row) => {
  const v = 1 - row / 30;
  const line = Array.from({ length: 107 }, (_, col) => point(project(col / 53 - 1, v)));
  return "M" + line.join(" L");
});

const labels = [
  { u: -.32, v: .22, x: 63, y: 29, short: "工程蓝图" },
  { u: .47, v: .14, x: 438, y: 78, short: "工业现场" },
  { u: -.28, v: -.54, x: 50, y: 238, short: "模型谱系" },
];

export default function ReadingPlate({ base }: { base: string }) {
  return <figure className="reading-plate" aria-label="三册阅读地图">
    <div className="plate-surface">
      <svg className="relief" viewBox="0 0 620 350" aria-hidden="true" focusable="false">
        <defs>
          <pattern id="plate-grid" width="46" height="46" patternUnits="userSpaceOnUse">
            <path d="M0 46V0H46" fill="none" stroke="#c4ccba" strokeWidth=".7"/>
            <path d="M20 23h6m-3-3v6" fill="none" stroke="#a8b39f" strokeWidth=".7"/>
          </pattern>
          <pattern id="strata" width="5" height="5" patternUnits="userSpaceOnUse">
            <path d="M-1 5 5-1m-1 7 3-3" stroke="#728971" strokeWidth=".8"/>
          </pattern>
        </defs>
        <rect width="620" height="350" fill="url(#plate-grid)"/>
        <g stroke="#435f4a" strokeLinejoin="round">
          <path d="M25 228 393 326 595 192v9L393 335 25 237Z" fill="#d0d9c8" />
          <path d="M25 228 393 326 595 192v9L393 335 25 237Z" fill="url(#strata)" />
          <path d="M25 228 227 94 595 192 393 326Z" fill="#e1e7d7"/>
        </g>
        {profiles.map((d, i) => {
          // Opaque ground under each silhouette hides lines on the far slope.
          const v = 1 - i / 30;
          return <g key={i}><path d={d + " L" + point(project(1, v)) + " L" + point(project(-1, v)) + "Z"} fill="#e1e7d7"/>
            <path d={d} fill="none" stroke={i % 5 === 0 ? "#36553f" : "#657f62"} strokeWidth={i % 5 === 0 ? 1.35 : .78}/></g>;
        })}
        <g fill="none" stroke="#b4482e" strokeWidth="1.35">
          {labels.map((label, i) => {
            const [x,y] = project(label.u,label.v);
            const right = i === 1;
            return <g key={label.short}><path d={`M${x} ${y} L${right ? x + 26 : x - 26} ${label.y + 13} H${label.x + 43}`}/>
              <circle cx={x} cy={y} r="4" fill="#ad432c" stroke="#faf8ed" strokeWidth="1.6"/></g>;
          })}
        </g>
      </svg>
      {chapters.map((chapter, i) => <a key={chapter.code} className="map-marker" href={`${base}/${chapter.file}`}
        style={{ left: `${labels[i].x / 6.2}%`, top: `${labels[i].y / 3.5}%` }} aria-label={`进入${chapter.title}`}>
        <span>{chapter.code}</span>{labels[i].short}</a>)}
    </div>
    <figcaption><b>图 01 <i>/</i> 阅读地形图</b><span>点选图签进入分册 <span aria-hidden="true">↗</span></span></figcaption>
  </figure>;
}
