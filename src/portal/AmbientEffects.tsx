"use client";

import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

/**
 * 点在按钮、链接、输入框上时不该触发背景的点击涟漪——那是「我要操作这个控件」，
 * 不是「我在跟背景玩」。两件事叠在一起会让点击反馈显得含混。
 */
// Ported from ai-reg-tracker/site/src/atlas/AtlasFlowEffects.tsx (c606c0e).
const INTERACTIVE = 'a, button, input, select, textarea, label, summary, [role="tab"], [role="button"]';

function onInteractive(event: PointerEvent): boolean {
  const t = event.target;
  return t instanceof Element && t.closest(INTERACTIVE) !== null;
}

const glyphSet = ["o", ">", "_"] as const;

/**
 * 字符在背景中绘制，每帧按卡片的实际轮廓擦除遮挡区域。
 * 新增不属于 .glass 的卡片、面板、浮层时，给它加 data-glyph-block 属性即可。
 */
const GLYPH_BLOCK =
  '.field-guide .glass, .atlas-site-nav, .atlas-nav-directory[open] .atlas-nav-menu, .guide-footer, dialog[open], [data-glyph-block]';

function onGlyphBlock(event: PointerEvent): boolean {
  const t = event.target;
  return t instanceof Element && t.closest(GLYPH_BLOCK) !== null;
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(preference.matches);
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);
  return reduced;
}

type ClickPulse = {
  x: number;
  y: number;
  born: number;
  duration: number;
  afterlife: number;
  radius: number;
  power: number;
  /**
   * 轮廓起伏的三组相位，每次点击随机。
   *
   * 没有它时扩散边界是个标准圆——只靠逐格噪声做细碎抖动，形状本身仍然是圆，
   * 而且每次点击一模一样，看上去就像在重播同一段动画。有了随机相位，
   * 半径随方向起伏，每次点击摊开的形状都不同。
   */
  lobeA: number;
  lobeB: number;
  lobeC: number;
  /** 二倍角项的系数，决定这一团被拉成哪个方向的椭圆（免 atan2） */
  la: number;
  lb: number;
  /** 整团随时间偏移的方向，让它像被水流带着走而不是钉在原地 */
  driftA: number;
  driftB: number;
};

/**
 * 轮廓半径系数的最大偏差，取包围盒要留出这个余量。
 * 角度项 0.12 + 两个噪声项 0.17/0.14 ≈ 0.43。
 */
const LOBE_SPAN = 1.48;

/**
 * 单次点击最多同时存活几团。
 *
 * 半径 124px 时单团约 1000 格；上限 8 意味着最坏情况约 8000 格/帧，
 * 配合查表版的逐格开销（约 0.06µs）仍在预算内。
 */
const MAX_PULSES = 8;

/** 亮起的字符超过这个数就关掉阴影，保住帧预算 */
const SHADOW_BUDGET = 900;

/** 字符颜色。恒定——参考里字符亮度不随能量变化，见绘制处的注释 */
const GLYPH_FILL = "rgba(250,252,255,0.85)";

type PointerSample = { x: number; y: number; time: number };

const vertexShaderSource = `
  attribute vec2 a_position;
  varying vec2 v_uv;

  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  precision highp float;

  varying vec2 v_uv;
  uniform vec2 u_resolution;
  uniform vec2 u_pointer;
  uniform float u_time;
  uniform float u_energy;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.52;
    mat2 turn = mat2(0.82, -0.57, 0.57, 0.82);
    for (int i = 0; i < 5; i++) {
      value += amplitude * noise(p);
      p = turn * p * 2.03 + 17.13;
      amplitude *= 0.48;
    }
    return value;
  }

  void main() {
    vec2 uv = v_uv;
    float aspect = u_resolution.x / max(u_resolution.y, 1.0);
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
    float t = u_time * 0.043;

    vec2 firstWarp = vec2(
      fbm(p * 0.86 + vec2(t * 0.47, -t * 0.18)),
      fbm(p * 0.79 + vec2(-t * 0.21, t * 0.39) + 8.7)
    );
    vec2 secondWarp = vec2(
      fbm(p * 1.34 + firstWarp * 1.72 + vec2(-t * 0.16, t * 0.25)),
      fbm(p * 1.16 - firstWarp * 1.38 + vec2(t * 0.23, -t * 0.11) + 3.2)
    );

    float broad = fbm(p * 0.72 + firstWarp * 1.42 + secondWarp * 0.28);
    float folds = fbm(p * 1.54 + secondWarp * 1.05 - firstWarp * 0.33);
    float vapor = fbm(p * 2.55 + firstWarp * 0.58 + vec2(t * 0.08, -t * 0.12));

    vec3 paper = vec3(0.935, 0.948, 1.0);
    vec3 mist = vec3(0.79, 0.84, 1.0);
    vec3 cobalt = vec3(0.20, 0.34, 0.92);
    vec3 violet = vec3(0.49, 0.31, 0.86);
    vec3 deep = vec3(0.12, 0.21, 0.58);

    vec2 leftDelta = (p - vec2(-0.64, 0.17)) * vec2(0.78, 1.22);
    vec2 rightDelta = (p - vec2(0.67, 0.13)) * vec2(0.72, 1.16);
    vec2 lowerDelta = (p - vec2(0.12, -0.58)) * vec2(0.72, 1.02);
    float leftEnvelope = exp(-dot(leftDelta, leftDelta) * 1.28);
    float rightEnvelope = exp(-dot(rightDelta, rightDelta) * 1.34);
    float lowerEnvelope = exp(-dot(lowerDelta, lowerDelta) * 1.16);
    float leftMass = clamp((broad - 0.34) * 1.08 + leftEnvelope * 0.76 + folds * 0.18, 0.0, 1.0);
    float rightMass = clamp((folds - 0.40) * 0.92 + rightEnvelope * 0.70 + broad * 0.14, 0.0, 1.0);
    float lowerMass = clamp((broad - 0.44) * 0.76 + lowerEnvelope * 0.58 + folds * 0.12, 0.0, 1.0);
    float whiteRift = 1.0 - smoothstep(0.34, 0.66, abs(folds - broad) + abs(p.x * 0.13));

    vec3 color = mix(paper, mist, smoothstep(0.12, 0.82, broad) * 0.68);
    float leftDetail = smoothstep(0.43, 0.73, broad * 0.62 + folds * 0.49 + vapor * 0.14);
    float rightDetail = smoothstep(0.42, 0.71, folds * 0.61 + broad * 0.39 + vapor * 0.16);
    float brightVein = 1.0 - smoothstep(0.055, 0.23, abs(broad + vapor * 0.09 - folds));
    color = mix(color, cobalt, leftMass * (0.27 + vapor * 0.18));
    color = mix(color, violet, rightMass * (0.23 + folds * 0.16));
    color = mix(color, deep, lowerMass * (0.14 + smoothstep(0.42, 0.88, folds) * 0.22));
    color = mix(color, vec3(0.965, 0.972, 1.0), whiteRift * 0.18);
    color = mix(color, cobalt, leftEnvelope * (0.18 + leftDetail * 0.64));
    color = mix(color, violet, rightEnvelope * (0.16 + rightDetail * 0.56));
    color = mix(color, vec3(0.96, 0.97, 1.0), brightVein * 0.26);

    vec2 pointerDelta = (uv - u_pointer) * vec2(aspect, 1.0);
    float pointerHalo = exp(-dot(pointerDelta, pointerDelta) * 9.2) * u_energy;
    float pointerFold = sin(length(pointerDelta) * 33.0 - u_time * 1.35) * 0.5 + 0.5;
    color = mix(color, vec3(0.68, 0.73, 1.0), pointerHalo * (0.055 + pointerFold * 0.035));

    float edge = smoothstep(0.88, 0.19, length((uv - 0.5) * vec2(0.78, 1.0)));
    color += (vapor - 0.5) * 0.025;
    color = mix(color * 0.985, color, 0.88 + edge * 0.12);
    gl_FragColor = vec4(color, 1.0);
  }
`;

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

/**
 * still = 阅读页（事件与规则详情）：背景停在当前一帧、不跟随鼠标。
 * 长时间阅读时持续流动是干扰，也耗电；系统「减少动效」本来就只画一帧，这里复用同一机制。
 * still 用 ref 传入而不是放进 effect 依赖：切换页面时不销毁重建 WebGL 上下文，
 * 离开阅读页后从停住的那一帧接着流动，而不是跳到另一幅画面。
 */
function useFluidField(canvasRef: RefObject<HTMLCanvasElement | null>, still: boolean) {
  const reduced = useReducedMotion();
  const stillRef = useRef(still);
  const wakeRef = useRef<() => void>(() => {});
  useEffect(() => {
    stillRef.current = still;
    if (!still) wakeRef.current();
  }, [still]);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // A transparent canvas reveals the CSS background if drawing stops.
    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      depth: false,
      powerPreference: "low-power",
    });
    if (!gl) return;

    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const position = gl.getAttribLocation(program, "a_position");
    const resolution = gl.getUniformLocation(program, "u_resolution");
    const pointer = gl.getUniformLocation(program, "u_pointer");
    const time = gl.getUniformLocation(program, "u_time");
    const energyLocation = gl.getUniformLocation(program, "u_energy");
    const mobile = window.matchMedia("(max-width: 780px)").matches;
    let width = 1;
    let height = 1;
    let frame = 0;
    let energy = 0;
    let pointerX = 0.5;
    let pointerY = 0.52;
    let lost = false;
    // 画面时间 = 真实时间 - offset。静止期间画面时间不走；恢复时重算 offset，
    // 让画面从停住的那一刻接着流动。初始 offset = 0，非阅读页的起始画面与改动前一致；
    // 直接打开阅读页时停在 18.0——与「减少动效」用的是同一帧
    let sceneTime = 18.0;
    let offset = 0;
    let resync = false;

    const resize = () => {
      width = Math.max(1, window.innerWidth);
      height = Math.max(1, window.innerHeight);
      const quality = mobile ? 0.58 : Math.min(1, (window.devicePixelRatio || 1) * 0.72);
      canvas.width = Math.max(1, Math.round(width * quality));
      canvas.height = Math.max(1, Math.round(height * quality));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (reduced || stillRef.current) draw(0);
    };

    const draw = (now: number) => {
      if (lost) return;
      const still = reduced || stillRef.current;
      if (!still) {
        if (resync) {
          offset = now * 0.001 - sceneTime;
          resync = false;
        }
        sceneTime = now * 0.001 - offset;
      } else {
        resync = true;
        energy = 0; // 静止帧不留鼠标光晕，否则会定格成一团亮斑
      }
      gl.useProgram(program);
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(resolution, canvas.width, canvas.height);
      gl.uniform2f(pointer, pointerX, pointerY);
      gl.uniform1f(time, sceneTime);
      gl.uniform1f(energyLocation, energy);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      energy *= 0.965;
      // 不再预约下一帧时必须把 frame 清零：onVisibility 靠 frame === 0 判断「循环已停」。
      if (!still && document.visibilityState === "visible") frame = requestAnimationFrame(draw);
      else frame = 0;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (stillRef.current) return;
      pointerX += (event.clientX / width - pointerX) * 0.72;
      pointerY += (1 - event.clientY / height - pointerY) * 0.72;
      energy = Math.max(energy, 0.22);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (stillRef.current || onInteractive(event)) return;
      pointerX = event.clientX / width;
      pointerY = 1 - event.clientY / height;
      energy = 1;
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        cancelAnimationFrame(frame);
        frame = 0;
      } else if (!reduced && !stillRef.current && frame === 0) {
        frame = requestAnimationFrame(draw);
      }
    };
    // 离开阅读页时由上面的 still effect 调用：循环已停才重启，避免同时跑两个循环
    wakeRef.current = () => {
      if (!reduced && !lost && frame === 0 && document.visibilityState === "visible") {
        frame = requestAnimationFrame(draw);
      }
    };

    // 图形上下文可能被浏览器回收（显卡重置、同时打开太多含 WebGL 的页面）。
    // 丢失后画布会黑屏或停帧：这里停止动画并隐藏画布，退回 CSS 渐变（SITE_V1「无 WebGL 时
    // 保留 CSS 渐变背景」的延伸）。不做恢复重建——代价是本次浏览保持静态渐变，刷新即恢复。
    const onContextLost = () => {
      lost = true;
      cancelAnimationFrame(frame);
      frame = 0;
      canvas.dataset.fluid = "lost";
    };

    resize();
    frame = requestAnimationFrame(draw);
    canvas.addEventListener("webglcontextlost", onContextLost);
    window.addEventListener("resize", resize);
    if (!reduced) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("pointerdown", onPointerDown, { passive: true });
      document.addEventListener("visibilitychange", onVisibility);
    }

    return () => {
      wakeRef.current = () => {};
      cancelAnimationFrame(frame);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("visibilitychange", onVisibility);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, [canvasRef, reduced]);
}

function useGlyphField(canvasRef: RefObject<HTMLCanvasElement | null>) {
  const reduced = useReducedMotion();
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resolvedContext = canvas.getContext("2d");
    if (!resolvedContext) return;
    const context: CanvasRenderingContext2D = resolvedContext;

    const mobile = window.matchMedia("(max-width: 780px)").matches;
    let width = 1;
    let height = 1;
    let spacing = mobile ? 14 : 12;
    let columns = 1;
    let rows = 1;
    let offsetX = spacing * 0.5;
    let offsetY = spacing * 0.5;
    let frame = 0;
    let previousTime = 0;
    let lastPointer: PointerSample | null = null;
    let lastClick = { x: -1000, y: -1000, time: -1000, stack: 0 };
    let pulses: ClickPulse[] = [];
    let energy = new Float32Array(1);
    let nextEnergy = new Float32Array(1);
    let seed = new Float32Array(1);
    let pulseEnergy = new Float32Array(1);
    let litLastFrame = 0;
    let edgeNoiseField = new Float32Array(1);
    let noiseA = new Float32Array(1);
    let noiseB = new Float32Array(1);

    const hash = (column: number, row: number) => {
      const value = Math.sin(column * 127.1 + row * 311.7) * 43758.5453123;
      return value - Math.floor(value);
    };

    const rebuildGrid = () => {
      spacing = mobile ? 14 : width > 1800 ? 13 : 12;
      columns = Math.ceil(width / spacing) + 1;
      rows = Math.ceil(height / spacing) + 1;
      offsetX = (width - (columns - 1) * spacing) * 0.5;
      offsetY = (height - (rows - 1) * spacing) * 0.5;
      const length = columns * rows;
      energy = new Float32Array(length);
      nextEnergy = new Float32Array(length);
      seed = new Float32Array(length);
      pulseEnergy = new Float32Array(length);
      // 这三张表只跟格子位置有关，与时间和脉冲无关——一次算好，
      // 逐格循环里就只剩数组读取。原先它们是每格每帧现算三角函数，
      // 半径放大之后成了压垮主线程的那部分。
      edgeNoiseField = new Float32Array(length);
      noiseA = new Float32Array(length);
      noiseB = new Float32Array(length);
      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          const i = row * columns + column;
          edgeNoiseField[i] =
            0.91 +
            hash(column, row) * 0.13 +
            Math.sin(column * 0.47 + row * 0.19) * 0.035 +
            Math.cos(row * 0.38 - column * 0.16) * 0.025;
          // 两张平滑噪声场：撕裂状边界与内部云絮都从这里取，
          // 不再依赖脉冲中心的相对坐标——效果上更像「介质本身有纹理」
          noiseA[i] =
            Math.sin(column * 0.19 + row * 0.11) * 0.5 + Math.sin(column * 0.07 - row * 0.23) * 0.5;
          noiseB[i] =
            Math.sin(column * 0.13 - row * 0.29) * 0.5 + Math.cos((column + row) * 0.09) * 0.5;
          seed[i] = hash(column, row);
        }
      }
    };

    /**
     * 卡片遮挡：只在字符活动的帧里执行（静止时不计算）。卡片位置随滚动、展开、页面切换而变，
     * 每帧重新量矩形（几十个，开销很小）；元素清单与圆角只在 DOM 变化或窗口缩放后重新收集。
     */
    const root = canvas.closest(".field-guide") ?? document.body;
    let blocks: { element: Element; radius: number }[] = [];
    let blocksDirty = true;
    const collectBlocks = () => {
      blocks = [...root.querySelectorAll(GLYPH_BLOCK)].map((element) => ({
        element,
        radius: parseFloat(getComputedStyle(element).borderTopLeftRadius) || 0,
      }));
      blocksDirty = false;
    };
    const mutationObserver = new MutationObserver(() => {
      blocksDirty = true;
    });
    mutationObserver.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ["open", "class"] });

    const occludeBlocks = () => {
      if (blocksDirty) collectBlocks();
      const origin = canvas.getBoundingClientRect();
      context.save();
      context.globalCompositeOperation = "destination-out";
      context.shadowBlur = 0;
      context.fillStyle = "#000";
      context.beginPath();
      for (const { element, radius } of blocks) {
        const rect = element.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) continue;
        if (rect.bottom < origin.top || rect.top > origin.bottom || rect.right < origin.left || rect.left > origin.right) continue;
        const x = rect.left - origin.left;
        const y = rect.top - origin.top;
        if (typeof context.roundRect === "function") context.roundRect(x, y, rect.width, rect.height, radius);
        else context.rect(x, y, rect.width, rect.height);
      }
      context.fill();
      context.restore();
    };

    const visitCircle = (
      centerX: number,
      centerY: number,
      radius: number,
      visit: (index: number, distance: number, edgeNoise: number, dx: number, dy: number) => void,
    ) => {
      const firstColumn = Math.max(0, Math.floor((centerX - radius - offsetX) / spacing));
      const lastColumn = Math.min(columns - 1, Math.ceil((centerX + radius - offsetX) / spacing));
      const firstRow = Math.max(0, Math.floor((centerY - radius - offsetY) / spacing));
      const lastRow = Math.min(rows - 1, Math.ceil((centerY + radius - offsetY) / spacing));

      for (let row = firstRow; row <= lastRow; row += 1) {
        const y = offsetY + row * spacing;
        for (let column = firstColumn; column <= lastColumn; column += 1) {
          const x = offsetX + column * spacing;
          const index = row * columns + column;
          const dx = x - centerX;
          const dy = y - centerY;
          const edgeNoise = edgeNoiseField[index];
          // sqrt 而非 hypot：hypot 要做溢出保护，在这个热循环里明显更慢
          const distance = Math.sqrt(dx * dx + dy * dy) / edgeNoise;
          if (distance <= radius) visit(index, distance, edgeNoise, dx, dy);
        }
      }
    };

    const stamp = (x: number, y: number, radius: number, power: number) => {
      visitCircle(x, y, radius, (index, distance) => {
        const radial = Math.max(0, 1 - distance / radius);
        const body = Math.pow(radial, 0.82);
        const value = body * power;
        energy[index] = Math.max(energy[index], value);
      });
    };

    const stampTrail = (
      x: number,
      y: number,
      radius: number,
      power: number,
      directionX: number,
      directionY: number,
      phase: number,
    ) => {
      visitCircle(x, y, radius * 1.42, (index, _distance, _edgeNoise, dx, dy) => {
        const along = dx * directionX + dy * directionY;
        const across = -dx * directionY + dy * directionX;
        const brokenEdge =
          0.88 +
          seed[index] * 0.17 +
          Math.sin(phase + seed[index] * 21.7) * 0.075 +
          Math.cos(phase * 0.63 + seed[index] * 13.1) * 0.04;
        const alongRadius = radius * (1.18 + seed[index] * 0.2) * brokenEdge;
        const acrossRadius = radius * (0.58 + seed[index] * 0.15) * brokenEdge;
        const ellipticalDistance = Math.hypot(along / alongRadius, across / acrossRadius);
        if (ellipticalDistance >= 1) return;
        const edgeRatio = Math.abs(across) / acrossRadius;
        const breakup =
          seed[index] * 0.72 +
          (0.5 + 0.5 * Math.sin(phase * 0.37 + seed[index] * 29.3)) * 0.28;
        if (edgeRatio > 0.62 && breakup < (edgeRatio - 0.62) * 1.65) return;
        const body = Math.pow(1 - ellipticalDistance, 0.76);
        energy[index] = Math.max(energy[index], body * power);
      });
    };

    const pinTrailCore = (x: number, y: number) => {
      const column = Math.round((x - offsetX) / spacing);
      const row = Math.round((y - offsetY) / spacing);
      if (column < 0 || row < 0 || column >= columns || row >= rows) return;
      const index = row * columns + column;
      energy[index] = Math.max(energy[index], 1.07);
    };

    const addPulseField = (pulse: ClickPulse, now: number) => {
      const age = now - pulse.born;
      if (age <= pulse.duration) {
        const progress = Math.min(1, Math.max(0, age / pulse.duration));
        // 参考里的扩散是「先快后缓、一直在推」，不是弹一下就到位
        const expansion = 1 - Math.pow(1 - progress, 2.1);
        const radius = 18 + pulse.radius * expansion;
        // 扩散途中就开始随水流偏移，而不是等到余韵阶段才动
        const seconds = age / 1000;
        const cx = pulse.x + seconds * pulse.driftA * 6.5;
        const cy = pulse.y + seconds * pulse.driftB * 4.2;
        // 中心随扩散逐渐熄灭，形成向外推的壳——参考里中段能明显看到中间先空
        const hollow = Math.max(0, progress - 0.34) / 0.66;
        // 两个权重每帧算一次（不是每格）：噪声场是静态的，靠这两个系数
        // 随时间起伏，团块才会在扩散过程中持续变形
        const wa = 0.17 + Math.sin(now * 0.00061 + pulse.lobeA) * 0.05;
        const wb = 0.14 + Math.cos(now * 0.00047 + pulse.lobeB) * 0.04;
        visitCircle(cx, cy, radius * LOBE_SPAN, (index, distance, _edge, dx, dy) => {
          // 二倍角恒等式代替 atan2 + sin/cos：cos2θ=(dx²-dy²)/d²，sin2θ=2dxdy/d²
          const d2 = dx * dx + dy * dy || 1;
          const angular = ((dx * dx - dy * dy) * pulse.la + 2 * dx * dy * pulse.lb) / d2;
          const localRadius =
            radius * (1 + angular * 0.12 + noiseA[index] * wa + noiseB[index] * wb);
          const radial = Math.max(0, 1 - distance / localRadius);
          if (radial <= 0) return;
          const body = Math.pow(radial, 0.8) * (1 - hollow * 0.66 * Math.pow(radial, 2.4));
          pulseEnergy[index] += body * pulse.power * (0.62 + 0.38 * (0.5 + 0.5 * noiseB[index]));
        });
        return;
      }

      const after = Math.min(1, (age - pulse.duration) / pulse.afterlife);
      const afterSeconds = (age - pulse.duration) / 1000;
      // 位移要接上扩散阶段已经走过的那一段，否则进入余韵时中心会瞬间跳回点击点。
      // 方向取自每次点击随机的 driftA/driftB——原先是固定往同一边飘，
      // 连点几下会看到一列朝同一方向排开的团块，那也是"规则感"的来源之一。
      const carried = pulse.duration / 1000;
      const elapsed = carried + afterSeconds;
      const driftX = elapsed * pulse.driftA * 6.5 + afterSeconds * 3.4;
      const driftY =
        elapsed * pulse.driftB * 4.2 +
        Math.sin(after * Math.PI * 1.7 + pulse.x * 0.009) * 8 * after;
      const centerX = pulse.x + driftX;
      const centerY = pulse.y + driftY;
      const reach = 18 + pulse.radius + (38 + pulse.power * 9) * (1 - Math.pow(1 - after, 1.65));
      const band = 21 + after * 13;
      const bodyStrength = pulse.power * 0.48 * Math.pow(1 - after, 1.12);
      const wa2 = 0.17 + Math.sin(now * 0.00061 + pulse.lobeA) * 0.05;
      const wb2 = 0.14 + Math.cos(now * 0.00047 + pulse.lobeB) * 0.04;
      const strength = 0.17 * Math.pow(1 - after, 0.68);
      // 团块与外圈光环合并成一次遍历：分两次扫会把这一段的开销翻倍，
      // 而它们用的是同一个 localReach
      visitCircle(centerX, centerY, (reach + band) * LOBE_SPAN, (index, distance, _edge, dx, dy) => {
        const d2 = dx * dx + dy * dy || 1;
        const angular = ((dx * dx - dy * dy) * pulse.la + 2 * dx * dy * pulse.lb) / d2;
        const localReach = reach * (1 + angular * 0.12 + noiseA[index] * wa2 + noiseB[index] * wb2);
        const radial = 1 - distance / localReach;
        if (radial > 0) {
          // 余韵阶段中心已经空了，只剩外围一圈慢慢散开
          const body = Math.pow(radial, 0.78) * (1 - 0.66 * Math.pow(radial, 2.4));
          pulseEnergy[index] += body * bodyStrength * (0.62 + 0.38 * (0.5 + 0.5 * noiseB[index]));
        }
        const ringDistance = Math.abs(distance - localReach);
        if (ringDistance > band) return;
        const trace = Math.pow(1 - ringDistance / band, 1.35);
        pulseEnergy[index] += trace * strength * (0.62 + seed[index] * 0.5);
      });
    };

    // 滚出视口的模块不该继续跑动画。每个模块各有一份 canvas 与 rAF 循环，
    // 效果铺满全站后，不做视口门控就等于同时跑五六个循环。
    let onScreen = true;

    const ensureAnimation = () => {
      if (!reduced && onScreen && frame === 0 && document.visibilityState === "visible") {
        previousTime = performance.now();
        frame = requestAnimationFrame(draw);
      }
    };

    const viewportObserver = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        if (!onScreen && frame !== 0) {
          cancelAnimationFrame(frame);
          frame = 0;
        } else if (onScreen) {
          ensureAnimation();
        }
      },
      { rootMargin: "120px" },
    );
    viewportObserver.observe(canvas);

    const spawnTrail = (from: PointerSample, to: PointerSample) => {
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const distance = Math.hypot(dx, dy);
      const elapsed = Math.max(12, to.time - from.time);
      if (distance < 1 || elapsed > 120) {
        stamp(to.x, to.y, mobile ? 22 : 27, 1.05);
        pinTrailCore(to.x, to.y);
        ensureAnimation();
        return;
      }
      const speed = Math.min(2.2, distance / elapsed);
      const radius = (mobile ? 23 : 28) - speed * (mobile ? 1.25 : 1.8);
      const power = 1.12 - speed * 0.035;
      const count = Math.max(
        1,
        Math.min(10, Math.ceil(distance / (spacing * (1.28 + speed * 0.24)))),
      );
      const directionX = dx / distance;
      const directionY = dy / distance;
      const normalX = -directionY;
      const normalY = directionX;
      for (let index = 1; index <= count; index += 1) {
        const progress = index / count;
        const phase =
          to.time * 0.011 +
          (from.x + dx * progress) * 0.017 -
          (from.y + dy * progress) * 0.013;
        const lateralOffset =
          (Math.sin(phase * 1.73) * 0.34 + Math.sin(phase * 0.47) * 0.18) * spacing;
        const directionalPower = power * (0.86 + progress * 0.14);
        const directionalRadius = radius * (0.82 + 0.15 * Math.sin(phase * 1.11));
        stampTrail(
          from.x + dx * progress + normalX * lateralOffset,
          from.y + dy * progress + normalY * lateralOffset,
          directionalRadius,
          directionalPower,
          directionX,
          directionY,
          phase,
        );
      }
      pinTrailCore(to.x, to.y);
      ensureAnimation();
    };

    const spawnBurst = (x: number, y: number) => {
      if (reduced) return;
      const now = performance.now();
      const samePool = now - lastClick.time < 680 && Math.hypot(x - lastClick.x, y - lastClick.y) < 64;
      const stack = samePool ? Math.min(8, lastClick.stack + 1) : 1;
      lastClick = { x, y, time: now, stack };
      pulses.push({
        x,
        y,
        born: now,
        duration: 1150 + stack * 85,
        afterlife: 4200 + stack * 220,
        radius: (mobile ? 85 : 124) + (stack - 1) * (mobile ? 36 : 55),
        power: 1.34 + (stack - 1) * 0.2,
        // 每次点击各不相同：同一个位置连点两下也不该摊开同一个形状
        lobeA: Math.random() * Math.PI * 2,
        lobeB: Math.random() * Math.PI * 2,
        lobeC: Math.random() * Math.PI * 2,
        la: Math.random() * 2 - 1,
        lb: Math.random() * 2 - 1,
        driftA: Math.random() * 2 - 1,
        driftB: Math.random() * 2 - 1,
      });
      if (pulses.length > MAX_PULSES) pulses.splice(0, pulses.length - MAX_PULSES);
      stamp(x, y, mobile ? 31 : 40, 1.34 + stack * 0.1);
      ensureAnimation();
    };

    const sampleEnergy = (column: number, row: number) => {
      if (column < 0 || row < 0 || column >= columns - 1 || row >= rows - 1) return 0;
      const left = Math.floor(column);
      const top = Math.floor(row);
      const xMix = column - left;
      const yMix = row - top;
      const topLeft = energy[top * columns + left];
      const topRight = energy[top * columns + left + 1];
      const bottomLeft = energy[(top + 1) * columns + left];
      const bottomRight = energy[(top + 1) * columns + left + 1];
      const topValue = topLeft + (topRight - topLeft) * xMix;
      const bottomValue = bottomLeft + (bottomRight - bottomLeft) * xMix;
      return topValue + (bottomValue - topValue) * yMix;
    };

    function draw(now: number) {
      const elapsed = Math.min(48, Math.max(4, now - previousTime));
      const delta = elapsed / 1000;
      previousTime = now;
      context.clearRect(0, 0, width, height);

      pulseEnergy.fill(0);
      const activePulses: ClickPulse[] = [];
      for (const pulse of pulses) {
        if (now - pulse.born <= pulse.duration + pulse.afterlife) {
          addPulseField(pulse, now);
          activePulses.push(pulse);
        }
      }
      pulses = activePulses;

      for (let index = 0; index < energy.length; index += 1) {
        if (pulseEnergy[index] > 0) {
          energy[index] = Math.max(energy[index], Math.min(2.15, pulseEnergy[index]));
        }
      }

      let alive = pulses.length > 0;
      const time = now * 0.001;
      /**
       * 衰减速率跟能量挂钩：**高能量退得慢、低能量退得快**。
       *
       * 按每秒 10 帧的参考帧逐格数（每格 0.2 秒）：`o` 从 0.2 秒一直存在到
       * 约 2.4–2.6 秒，占整个约 4.8 秒生命周期的**一半**；`>` 与 `-` 合起来
       * 才占另一半。也就是亮核会稳稳地撑很久，一旦暗下去就迅速塌掉。
       *
       * 曾经写反过（高能量快、低能量慢），依据是更粗的一组抽帧——那组里
       * `o` 早已消失的那几帧被误当成「`o` 一闪即逝」，其实已经过了 2.5 秒。
       *
       * 两个预算好的 exp 之间线性插值，避免逐格调用 exp。
       */
      const decayHigh = Math.exp(-0.38 * delta);
      const decayLow = Math.exp(-1.55 * delta);
      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          const index = row * columns + column;
          const center = energy[index];
          const lowEnergyMobility = Math.min(1, Math.max(0.14, 1.08 - center));
          const flowAngle =
            -0.22 +
            Math.sin(row * 0.074 + time * 0.43) * 0.42 +
            Math.cos(column * 0.061 - time * 0.31) * 0.33 +
            Math.sin((column + row) * 0.034 + time * 0.23) * 0.24;
          const gust =
            15 +
            8 * (0.5 + 0.5 * Math.sin(column * 0.039 - row * 0.052 + time * 0.37)) +
            seed[index] * 3;
          const windX = (7 + Math.cos(flowAngle) * gust) * lowEnergyMobility;
          const windY =
            (Math.sin(flowAngle) * gust * 0.72 + Math.cos(column * 0.028 + time * 0.29) * 3.5) *
            lowEnergyMobility;
          const carried = sampleEnergy(
            column - (windX * delta) / spacing,
            row - (windY * delta) / spacing,
          );
          const left = column > 0 ? energy[index - 1] : center;
          const right = column + 1 < columns ? energy[index + 1] : center;
          const up = row > 0 ? energy[index - columns] : center;
          const down = row + 1 < rows ? energy[index + columns] : center;
          const upperLeft = row > 0 && column > 0 ? energy[index - columns - 1] : center;
          const lowerRight = row + 1 < rows && column + 1 < columns
            ? energy[index + columns + 1]
            : center;
          const cardinal = (left + right + up + down) * 0.25;
          const diagonal = (upperLeft + lowerRight) * 0.5;
          const carrier = seed[index] < 0.25
            ? left
            : seed[index] < 0.5
              ? right
              : seed[index] < 0.75
                ? up
                : down;
          const neighborhood = cardinal * 0.72 + diagonal * 0.12 + carrier * 0.16;
          const diffusion = Math.min(0.08, delta * (1.72 + seed[index] * 0.56));
          const spread = carried + (neighborhood - carried) * diffusion;
          const value = spread * (decayLow + (decayHigh - decayLow) * Math.min(1, center));
          nextEnergy[index] = value > 0.014 ? value : 0;
          if (nextEnergy[index] > 0) alive = true;
        }
      }
      const previousEnergy = energy;
      energy = nextEnergy;
      nextEnergy = previousEnergy;

      context.save();
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.font = `500 ${mobile ? 10.5 : 11.5}px "SFMono-Regular", "Cascadia Mono", "Segoe UI Mono", Consolas, monospace`;
      context.shadowColor = "rgba(218, 227, 255, 0.2)";
      // 逐字符阴影很贵。点击范围按参考放大后，一次爆发能点亮几千个格子，
      // 阴影会直接吃掉整帧预算。少量字符时保留这层微光，大面积时关掉——
      // 那种密度下本来也看不出有没有阴影。
      context.shadowBlur = litLastFrame < SHADOW_BUDGET ? 1.5 : 0;

      // 字符一律同一个不透明度，不随能量明暗变化。
      //
      // 参考帧实测：沿一条水平线从核心扫到外缘，字符峰值亮度稳定在 239–255，
      // 而背景由 151 升到 212——**变的是背景，不是字符**。此前照着"对比度在降"
      // 做了明暗渐变，是把背景渐变错认成了字符明暗。
      //
      // 能量现在只决定两件事：显示哪个字符（o / > / _），以及显不显示。
      context.fillStyle = GLYPH_FILL;
      let lit = 0;
      for (let row = 0; row < rows; row += 1) {
        const y = offsetY + row * spacing;
        for (let column = 0; column < columns; column += 1) {
          const index = row * columns + column;
          const value = energy[index];
          const visibilityFloor = 0.032 + seed[index] * 0.023;
          if (value <= visibilityFloor) continue;
          lit += 1;
          const tier = value + (seed[index] - 0.5) * 0.055;
          // 阈值回到 0.88 / 0.25：时间占比由上面的衰减速率控制，不该靠抬高
          // 阈值去压缩 o——那会让亮核直接消失，而参考里它是撑满前半程的。
          const glyph = tier >= 0.88 ? glyphSet[0] : tier >= 0.25 ? glyphSet[1] : glyphSet[2];
          context.fillText(glyph, offsetX + column * spacing, y);
        }
      }
      litLastFrame = lit;
      context.restore();
      occludeBlocks();

      if (alive && document.visibilityState === "visible") frame = requestAnimationFrame(draw);
      else frame = 0;
    }

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1 : 1.25);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      rebuildGrid();
      blocksDirty = true; // 断点切换时圆角可能变化（如手机上的 24px）
    };

    const onPointerMove = (event: PointerEvent) => {
      // 指针在卡片上：不画拖尾，并断开轨迹，免得离开卡片时从卡片另一侧连一条线过来
      if (onGlyphBlock(event)) {
        lastPointer = null;
        return;
      }
      const bounds = canvas.getBoundingClientRect();
      const inside =
        event.clientX >= bounds.left &&
        event.clientX <= bounds.right &&
        event.clientY >= bounds.top &&
        event.clientY <= bounds.bottom;
      if (!inside) {
        lastPointer = null;
        return;
      }
      const sample = {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
        time: performance.now(),
      };
      if (lastPointer) spawnTrail(lastPointer, sample);
      else {
        stamp(sample.x, sample.y, mobile ? 32 : 38, 1.05);
        pinTrailCore(sample.x, sample.y);
        ensureAnimation();
      }
      lastPointer = sample;
    };
    const onPointerDown = (event: PointerEvent) => {
      if (onInteractive(event) || onGlyphBlock(event)) return;
      const bounds = canvas.getBoundingClientRect();
      if (
        event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom
      ) return;
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      spawnBurst(x, y);
      lastPointer = { x, y, time: performance.now() };
    };
    const onPointerLeave = () => { lastPointer = null; };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        cancelAnimationFrame(frame);
        frame = 0;
      } else if (pulses.length > 0 || energy.some((value) => value > 0)) ensureAnimation();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas.parentElement ?? canvas);
    resize();
    if (!reduced) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("pointerdown", onPointerDown, { passive: true });
      document.documentElement.addEventListener("pointerleave", onPointerLeave);
      document.addEventListener("visibilitychange", onVisibility);
    }
    window.addEventListener("resize", resize);

    return () => {
      mutationObserver.disconnect();
      viewportObserver.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      resizeObserver.disconnect();
    };
  }, [canvasRef, reduced]);
}

export function AtlasFlowAtmosphere({ still = false }: { still?: boolean }) {
  const fluidCanvasRef = useRef<HTMLCanvasElement>(null);
  const glyphCanvasRef = useRef<HTMLCanvasElement>(null);
  useFluidField(fluidCanvasRef, still);
  // 字符场铺满整个视口、叠在流体之上，只在卡片以外的背景处绘制与触发（见 GLYPH_BLOCK）
  useGlyphField(glyphCanvasRef);

  return (
    <div className="atlas-flow-atmosphere" aria-hidden="true">
      <canvas className="atlas-flow-fluid" ref={fluidCanvasRef} />
      <canvas className="atlas-background-glyphs" ref={glyphCanvasRef} />
    </div>
  );
}
