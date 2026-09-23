/**
 * 图像工具算法库（纯 Canvas 像素处理，全部本地执行）
 *
 * 覆盖：一键提亮（自动曝光）、插画特效（素描/油画/马赛克/像素化/复古/黑白）、
 *       抠图（背景色 flood-fill 移除）。
 * 所有函数输入/输出均为 RGBA ImageData，不依赖外部库。
 */

/** 一键提亮：直方图自动曝光（取 p2~p98 区间做线性拉伸，并轻微提亮） */
export function autoBrighten(data, width, height) {
  const total = width * height;
  // 亮度直方图
  const hist = new Uint32Array(256);
  for (let i = 0; i < total; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    hist[((r * 299 + g * 587 + b * 114) / 1000) | 0]++;
  }
  // 累计直方图求 p2 / p98
  const cum = new Uint32Array(256);
  let acc = 0;
  for (let i = 0; i < 256; i++) {
    acc += hist[i];
    cum[i] = acc;
  }
  const loTarget = total * 0.02;
  const hiTarget = total * 0.98;
  let lo = 0;
  let hi = 255;
  for (let i = 0; i < 256; i++) {
    if (cum[i] >= loTarget) {
      lo = i;
      break;
    }
  }
  for (let i = 255; i >= 0; i--) {
    if (cum[i] <= hiTarget) {
      hi = i;
      break;
    }
  }
  if (hi - lo < 8) {
    lo = 0;
    hi = 255;
  }
  const range = hi - lo;
  const out = new Uint8ClampedArray(data.length);
  // 先做对比度拉伸
  for (let i = 0; i < total; i++) {
    const idx = i * 4;
    out[idx] = clamp(((data[idx] - lo) * 255) / range);
    out[idx + 1] = clamp(((data[idx + 1] - lo) * 255) / range);
    out[idx + 2] = clamp(((data[idx + 2] - lo) * 255) / range);
    out[idx + 3] = data[idx + 3];
  }
  // 再做亮度校正：拉伸后平均亮度映射到目标亮度（140），避免过曝
  let sum = 0;
  for (let i = 0; i < total; i++) {
    sum += out[i * 4] * 299 + out[i * 4 + 1] * 587 + out[i * 4 + 2] * 114;
  }
  const avg = sum / total / 1000;
  let factor = 140 / (avg + 1);
  if (factor < 0.8) factor = 0.8;
  if (factor > 1.8) factor = 1.8;
  if (Math.abs(factor - 1) > 0.05) {
    for (let i = 0; i < total; i++) {
      const idx = i * 4;
      out[idx] = clamp(out[idx] * factor);
      out[idx + 1] = clamp(out[idx + 1] * factor);
      out[idx + 2] = clamp(out[idx + 2] * factor);
    }
  }
  return new ImageData(out, width, height);
}

/** 灰度 */
export function grayscale(data, width, height) {
  const out = new Uint8ClampedArray(data.length);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    const g = ((data[idx] * 299 + data[idx + 1] * 587 + data[idx + 2] * 114) / 1000) | 0;
    out[idx] = g;
    out[idx + 1] = g;
    out[idx + 2] = g;
    out[idx + 3] = data[idx + 3];
  }
  return new ImageData(out, width, height);
}

/** 3x3 box blur（迭代 blurIter 次） */
function boxBlur(data, width, height, blurIter) {
  let src = data;
  for (let iter = 0; iter < blurIter; iter++) {
    const dst = new Uint8ClampedArray(src.length);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0;
        let g = 0;
        let b = 0;
        let cnt = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
            const idx = (ny * width + nx) * 4;
            r += src[idx];
            g += src[idx + 1];
            b += src[idx + 2];
            cnt++;
          }
        }
        const idx = (y * width + x) * 4;
        dst[idx] = (r / cnt) | 0;
        dst[idx + 1] = (g / cnt) | 0;
        dst[idx + 2] = (b / cnt) | 0;
        dst[idx + 3] = src[idx + 3];
      }
    }
    src = dst;
  }
  return src;
}

/** 素描：灰度 → 反相模糊 → 颜色减淡混合 */
export function sketch(data, width, height) {
  const gray = grayscale(data, width, height).data;
  const inv = new Uint8ClampedArray(gray.length);
  for (let i = 0; i < gray.length; i++) inv[i] = 255 - gray[i];
  const blurred = boxBlur(inv, width, height, 3);
  const out = new Uint8ClampedArray(data.length);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    const grayV = gray[idx];
    const blurV = blurred[idx];
    // color dodge: result = gray / (255 - blur) * 255，防止除零
    const denom = 255 - blurV;
    let v = 255;
    if (denom > 0) v = Math.min(255, (grayV * 255) / denom);
    out[idx] = v;
    out[idx + 1] = v;
    out[idx + 2] = v;
    out[idx + 3] = data[idx + 3];
  }
  return new ImageData(out, width, height);
}

/** 油画：邻域主色量化 */
export function oilPaint(data, width, height, block) {
  block = block || 4;
  const out = new Uint8ClampedArray(data.length);
  const half = Math.max(1, block >> 1);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      // 收集邻域颜色桶（量化到 8 级）
      const buckets = {};
      for (let dy = -half; dy <= half; dy++) {
        for (let dx = -half; dx <= half; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const idx = (ny * width + nx) * 4;
          const key = (data[idx] >> 5) + '|' + (data[idx + 1] >> 5) + '|' + (data[idx + 2] >> 5);
          if (!buckets[key]) buckets[key] = { r: 0, g: 0, b: 0, n: 0 };
          const bkt = buckets[key];
          bkt.r += data[idx];
          bkt.g += data[idx + 1];
          bkt.b += data[idx + 2];
          bkt.n++;
        }
      }
      // 取出现最多的桶
      let best = null;
      for (const k in buckets) {
        if (!best || buckets[k].n > best.n) best = buckets[k];
      }
      const idx = (y * width + x) * 4;
      out[idx] = best ? (best.r / best.n) | 0 : data[idx];
      out[idx + 1] = best ? (best.g / best.n) | 0 : data[idx + 1];
      out[idx + 2] = best ? (best.b / best.n) | 0 : data[idx + 2];
      out[idx + 3] = data[idx + 3];
    }
  }
  return new ImageData(out, width, height);
}

/** 马赛克 */
export function mosaic(data, width, height, block) {
  block = block || 8;
  const out = new Uint8ClampedArray(data.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const bx = ((x / block) | 0) * block;
      const by = ((y / block) | 0) * block;
      let r = 0;
      let g = 0;
      let b = 0;
      let cnt = 0;
      const maxX = Math.min(width, bx + block);
      const maxY = Math.min(height, by + block);
      for (let yy = by; yy < maxY; yy++) {
        for (let xx = bx; xx < maxX; xx++) {
          const idx = (yy * width + xx) * 4;
          r += data[idx];
          g += data[idx + 1];
          b += data[idx + 2];
          cnt++;
        }
      }
      const idx = (y * width + x) * 4;
      out[idx] = (r / cnt) | 0;
      out[idx + 1] = (g / cnt) | 0;
      out[idx + 2] = (b / cnt) | 0;
      out[idx + 3] = data[idx + 3];
    }
  }
  return new ImageData(out, width, height);
}

/** 像素化：块内取左上角色 */
export function pixelate(data, width, height, block) {
  block = block || 6;
  const out = new Uint8ClampedArray(data.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const bx = ((x / block) | 0) * block;
      const by = ((y / block) | 0) * block;
      const sidx = (by * width + bx) * 4;
      const idx = (y * width + x) * 4;
      out[idx] = data[sidx];
      out[idx + 1] = data[sidx + 1];
      out[idx + 2] = data[sidx + 2];
      out[idx + 3] = data[sidx + 3];
    }
  }
  return new ImageData(out, width, height);
}

/** 复古（怀旧棕褐） */
export function vintage(data, width, height) {
  const out = new Uint8ClampedArray(data.length);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    out[idx] = clamp(r * 0.393 + g * 0.769 + b * 0.189);
    out[idx + 1] = clamp(r * 0.349 + g * 0.686 + b * 0.168);
    out[idx + 2] = clamp(r * 0.272 + g * 0.534 + b * 0.131);
    out[idx + 3] = data[idx + 3];
  }
  return new ImageData(out, width, height);
}

/** 反色 */
export function invert(data, width, height) {
  const out = new Uint8ClampedArray(data.length);
  for (let i = 0; i < width * height * 4; i += 4) {
    out[i] = 255 - data[i];
    out[i + 1] = 255 - data[i + 1];
    out[i + 2] = 255 - data[i + 2];
    out[i + 3] = data[i + 3];
  }
  return new ImageData(out, width, height);
}

/**
 * 抠图（背景色移除）：默认从图像四角取样背景色并从边缘 flood-fill；
 * 也可传入 seedPoints 指定背景种子点（魔棒模式：点击某处移除相似颜色）。
 * 容差内像素 alpha 置 0。tolerance 0-100。
 */
export function removeBackground(data, width, height, tolerance, seedPoints) {
  tolerance = tolerance === undefined ? 30 : tolerance;
  // 取样背景色：默认四角平均；指定种子点时取种子点颜色
  let bgR;
  let bgG;
  let bgB;
  if (seedPoints && seedPoints.length) {
    const p = seedPoints[0];
    const idx = (p.y * width + p.x) * 4;
    bgR = data[idx];
    bgG = data[idx + 1];
    bgB = data[idx + 2];
  } else {
    const corners = [
      data[0],
      data[1],
      data[2],
      data[(width - 1) * 4],
      data[(width - 1) * 4 + 1],
      data[(width - 1) * 4 + 2],
      data[(height - 1) * width * 4],
      data[(height - 1) * width * 4 + 1],
      data[(height - 1) * width * 4 + 2],
      data[((height - 1) * width + (width - 1)) * 4],
      data[((height - 1) * width + (width - 1)) * 4 + 1],
      data[((height - 1) * width + (width - 1)) * 4 + 2],
    ];
    bgR = (corners[0] + corners[3] + corners[6] + corners[9]) / 4;
    bgG = (corners[1] + corners[4] + corners[7] + corners[10]) / 4;
    bgB = (corners[2] + corners[5] + corners[8] + corners[11]) / 4;
  }

  const tol = tolerance * 2.55; // 0-100 → 0-255
  const out = new Uint8ClampedArray(data);
  const visited = new Uint8Array(width * height);
  const stack = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const p = y * width + x;
    if (visited[p]) return;
    visited[p] = 1;
    stack.push(p);
  };
  if (seedPoints && seedPoints.length) {
    for (const s of seedPoints) {
      push(s.x, s.y);
    }
  } else {
    // 从四边入栈
    for (let x = 0; x < width; x++) {
      push(x, 0);
      push(x, height - 1);
    }
    for (let y = 0; y < height; y++) {
      push(0, y);
      push(width - 1, y);
    }
  }

  while (stack.length) {
    const p = stack[stack.length - 1];
    stack.pop();
    const idx = p * 4;
    const dist =
      Math.abs(out[idx] - bgR) + Math.abs(out[idx + 1] - bgG) + Math.abs(out[idx + 2] - bgB);
    if (dist <= tol * 3) {
      out[idx + 3] = 0;
      const x = p % width;
      const y = (p / width) | 0;
      push(x + 1, y);
      push(x - 1, y);
      push(x, y + 1);
      push(x, y - 1);
    }
  }
  return new ImageData(out, width, height);
}

/** 高斯模糊（3x3 核迭代，radius=pass 数） */
export function gaussianBlur(data, width, height, radius) {
  radius = radius || 1;
  const kernel = [1, 2, 1, 2, 4, 2, 1, 2, 1];
  let cur = data;
  for (let pass = 0; pass < radius; pass++) {
    const out = new Uint8ClampedArray(cur.length);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0;
        let g = 0;
        let b = 0;
        let a = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const sx = Math.min(width - 1, Math.max(0, x + kx));
            const sy = Math.min(height - 1, Math.max(0, y + ky));
            const idx = (sy * width + sx) * 4;
            const w = kernel[(ky + 1) * 3 + (kx + 1)];
            r += cur[idx] * w;
            g += cur[idx + 1] * w;
            b += cur[idx + 2] * w;
            a += cur[idx + 3] * w;
          }
        }
        const idx = (y * width + x) * 4;
        out[idx] = (r / 16) | 0;
        out[idx + 1] = (g / 16) | 0;
        out[idx + 2] = (b / 16) | 0;
        out[idx + 3] = (a / 16) | 0;
      }
    }
    cur = out;
  }
  return new ImageData(cur, width, height);
}

/** 锐化（拉普拉斯增强） */
export function sharpen(data, width, height) {
  const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
  const out = new Uint8ClampedArray(data.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const sx = Math.min(width - 1, Math.max(0, x + kx));
          const sy = Math.min(height - 1, Math.max(0, y + ky));
          const idx = (sy * width + sx) * 4;
          const w = kernel[(ky + 1) * 3 + (kx + 1)];
          r += data[idx] * w;
          g += data[idx + 1] * w;
          b += data[idx + 2] * w;
        }
      }
      const idx = (y * width + x) * 4;
      out[idx] = clamp(r);
      out[idx + 1] = clamp(g);
      out[idx + 2] = clamp(b);
      out[idx + 3] = data[idx + 3];
    }
  }
  return new ImageData(out, width, height);
}

/** 浮雕 */
export function emboss(data, width, height) {
  const out = new Uint8ClampedArray(data.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const nx = Math.min(width - 1, x + 1);
      const ny = Math.min(height - 1, y + 1);
      const nIdx = (ny * width + nx) * 4;
      const r = data[idx] - data[nIdx] + 128;
      const g = data[idx + 1] - data[nIdx + 1] + 128;
      const b = data[idx + 2] - data[nIdx + 2] + 128;
      out[idx] = clamp(r);
      out[idx + 1] = clamp(g);
      out[idx + 2] = clamp(b);
      out[idx + 3] = data[idx + 3];
    }
  }
  return new ImageData(out, width, height);
}

/** 水墨画：灰度 + 高对比 + 轻模糊 */
export function ink(data, width, height) {
  // 灰度
  const gray = new Uint8ClampedArray(data.length);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    const v = (data[idx] * 299 + data[idx + 1] * 587 + data[idx + 2] * 114) / 1000;
    gray[idx] = v;
    gray[idx + 1] = v;
    gray[idx + 2] = v;
    gray[idx + 3] = data[idx + 3];
  }
  // 轻度模糊
  let cur = gray;
  const kernel = [1, 2, 1, 2, 4, 2, 1, 2, 1];
  for (let pass = 0; pass < 1; pass++) {
    const out = new Uint8ClampedArray(cur.length);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let v = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const sx = Math.min(width - 1, Math.max(0, x + kx));
            const sy = Math.min(height - 1, Math.max(0, y + ky));
            v += cur[(sy * width + sx) * 4] * kernel[(ky + 1) * 3 + (kx + 1)];
          }
        }
        const idx = (y * width + x) * 4;
        const nv = (v / 16) | 0;
        out[idx] = nv;
        out[idx + 1] = nv;
        out[idx + 2] = nv;
        out[idx + 3] = cur[idx + 3];
      }
    }
    cur = out;
  }
  // 对比度拉伸（水墨层次）
  let lo = 255;
  let hi = 0;
  for (let i = 0; i < width * height; i++) {
    const v = cur[i * 4];
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  const range = hi - lo > 8 ? hi - lo : 255;
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    const v = clamp(((cur[idx] - lo) * 255) / range);
    cur[idx] = v;
    cur[idx + 1] = v;
    cur[idx + 2] = v;
  }
  return new ImageData(cur, width, height);
}

/** 暖色调 */
export function warm(data, width, height) {
  const out = new Uint8ClampedArray(data.length);
  for (let i = 0; i < width * height * 4; i += 4) {
    out[i] = clamp(data[i] * 1.12);
    out[i + 1] = clamp(data[i + 1] * 1.02);
    out[i + 2] = clamp(data[i + 2] * 0.88);
    out[i + 3] = data[i + 3];
  }
  return new ImageData(out, width, height);
}

/** 冷色调 */
export function cool(data, width, height) {
  const out = new Uint8ClampedArray(data.length);
  for (let i = 0; i < width * height * 4; i += 4) {
    out[i] = clamp(data[i] * 0.88);
    out[i + 1] = clamp(data[i + 1] * 1.0);
    out[i + 2] = clamp(data[i + 2] * 1.12);
    out[i + 3] = data[i + 3];
  }
  return new ImageData(out, width, height);
}

function clamp(v) {
  return v < 0 ? 0 : v > 255 ? 255 : v | 0;
}
