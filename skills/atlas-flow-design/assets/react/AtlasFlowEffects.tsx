"use client";

import { useEffect, useRef } from "react";
import type { RefObject } from "react";

const glyphSet = ["o", ">", "_"] as const;

type ClickPulse = {
  x: number;
  y: number;
  born: number;
  duration: number;
  afterlife: number;
  radius: number;
  power: number;
};

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

function useFluidField(canvasRef: RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", {
      alpha: false,
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
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(max-width: 780px)").matches;
    let width = 1;
    let height = 1;
    let frame = 0;
    let energy = 0;
    let pointerX = 0.5;
    let pointerY = 0.52;

    const resize = () => {
      width = Math.max(1, window.innerWidth);
      height = Math.max(1, window.innerHeight);
      const quality = mobile ? 0.58 : Math.min(1, (window.devicePixelRatio || 1) * 0.72);
      canvas.width = Math.max(1, Math.round(width * quality));
      canvas.height = Math.max(1, Math.round(height * quality));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const draw = (now: number) => {
      gl.useProgram(program);
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(resolution, canvas.width, canvas.height);
      gl.uniform2f(pointer, pointerX, pointerY);
      gl.uniform1f(time, reduced ? 18.0 : now * 0.001);
      gl.uniform1f(energyLocation, energy);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      energy *= 0.965;
      if (!reduced && document.visibilityState === "visible") frame = requestAnimationFrame(draw);
    };

    const onPointerMove = (event: PointerEvent) => {
      pointerX += (event.clientX / width - pointerX) * 0.72;
      pointerY += (1 - event.clientY / height - pointerY) * 0.72;
      energy = Math.max(energy, 0.22);
    };
    const onPointerDown = (event: PointerEvent) => {
      pointerX = event.clientX / width;
      pointerY = 1 - event.clientY / height;
      energy = 1;
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        cancelAnimationFrame(frame);
        frame = 0;
      } else if (!reduced && frame === 0) {
        frame = requestAnimationFrame(draw);
      }
    };

    resize();
    frame = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    if (!reduced) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("pointerdown", onPointerDown, { passive: true });
      document.addEventListener("visibilitychange", onVisibility);
    }

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("visibilitychange", onVisibility);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, [canvasRef]);
}

function useGlyphField(canvasRef: RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resolvedContext = canvas.getContext("2d");
    if (!resolvedContext) return;
    const context: CanvasRenderingContext2D = resolvedContext;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          seed[row * columns + column] = hash(column, row);
        }
      }
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
          const edgeNoise =
            0.91 +
            seed[index] * 0.13 +
            Math.sin(column * 0.47 + row * 0.19) * 0.035 +
            Math.cos(row * 0.38 - column * 0.16) * 0.025;
          const distance = Math.hypot(dx, dy) / edgeNoise;
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
        const expansion = 1 - Math.pow(1 - progress, 2.7);
        const radius = 18 + pulse.radius * expansion;
        visitCircle(pulse.x, pulse.y, radius * 1.12, (index, distance) => {
          const movingEdge =
            1 +
            Math.sin(seed[index] * 17.4 + now * 0.0031) * 0.065 +
            Math.cos(seed[index] * 31.7 - now * 0.0019) * 0.035;
          const radial = Math.max(0, 1 - distance / (radius * movingEdge));
          const body = Math.pow(radial, 0.8);
          pulseEnergy[index] += body * pulse.power;
        });
        return;
      }

      const after = Math.min(1, (age - pulse.duration) / pulse.afterlife);
      const afterSeconds = (age - pulse.duration) / 1000;
      const driftX = afterSeconds * (7.5 + Math.sin(pulse.born * 0.0017) * 2.6);
      const driftY =
        afterSeconds * (1.4 + Math.cos(pulse.born * 0.0011) * 2.2) +
        Math.sin(after * Math.PI * 1.7 + pulse.x * 0.009) * 8 * after;
      const centerX = pulse.x + driftX;
      const centerY = pulse.y + driftY;
      const reach = 18 + pulse.radius + (38 + pulse.power * 9) * (1 - Math.pow(1 - after, 1.65));
      const band = 21 + after * 13;
      const bodyStrength = pulse.power * 0.48 * Math.pow(1 - after, 1.12);
      visitCircle(centerX, centerY, reach, (index, distance) => {
        const movingEdge =
          1 +
          Math.sin(seed[index] * 19.1 + now * 0.0024) * 0.075 +
          Math.cos(seed[index] * 27.3 - now * 0.0016) * 0.045;
        const radial = Math.max(0, 1 - distance / (reach * movingEdge));
        const body = Math.pow(radial, 0.78);
        pulseEnergy[index] += body * bodyStrength;
      });

      const strength = 0.17 * Math.pow(1 - after, 0.68);
      visitCircle(centerX, centerY, reach + band, (index, distance) => {
        const ringDistance = Math.abs(distance - reach);
        if (ringDistance > band) return;
        const trace = Math.pow(1 - ringDistance / band, 1.35);
        const brokenEdge = 0.62 + seed[index] * 0.5;
        pulseEnergy[index] += trace * strength * brokenEdge;
      });
    };

    const ensureAnimation = () => {
      if (!reduced && frame === 0 && document.visibilityState === "visible") {
        previousTime = performance.now();
        frame = requestAnimationFrame(draw);
      }
    };

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
        duration: 430 + stack * 24,
        afterlife: 4400 + stack * 180,
        radius: (mobile ? 88 : 110) + (stack - 1) * (mobile ? 18 : 25),
        power: 1.42 + (stack - 1) * 0.25,
      });
      if (pulses.length > 10) pulses.splice(0, pulses.length - 10);
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
      const decay = Math.exp(-0.46 * delta);
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
          const value = spread * decay;
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
      context.shadowBlur = 1.5;

      for (let row = 0; row < rows; row += 1) {
        const y = offsetY + row * spacing;
        for (let column = 0; column < columns; column += 1) {
          const index = row * columns + column;
          const value = energy[index];
          const visibilityFloor = 0.032 + seed[index] * 0.023;
          if (value <= visibilityFloor) continue;
          const tier = value + (seed[index] - 0.5) * 0.055;
          const glyph = tier >= 0.88 ? glyphSet[0] : tier >= 0.25 ? glyphSet[1] : glyphSet[2];
          const alpha = Math.min(0.94, 0.13 + Math.pow(Math.min(1, value), 0.7) * 0.76);
          context.fillStyle = `rgba(250,252,255,${alpha.toFixed(3)})`;
          context.fillText(glyph, offsetX + column * spacing, y);
        }
      }
      context.restore();

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
    };

    const onPointerMove = (event: PointerEvent) => {
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
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      resizeObserver.disconnect();
    };
  }, [canvasRef]);
}

export function AtlasFlowAtmosphere() {
  const fluidCanvasRef = useRef<HTMLCanvasElement>(null);
  useFluidField(fluidCanvasRef);

  return (
    <div className="atlas-flow-atmosphere" aria-hidden="true">
      <canvas className="atlas-flow-fluid" ref={fluidCanvasRef} />
    </div>
  );
}

export function SectionGlyphField() {
  const glyphCanvasRef = useRef<HTMLCanvasElement>(null);
  useGlyphField(glyphCanvasRef);

  return <canvas className="atlas-section-glyphs" ref={glyphCanvasRef} aria-hidden="true" />;
}
