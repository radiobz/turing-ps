/**
 * 人脸液化算法：瘦脸（局部向面中心收缩）与大眼（眼部区域放大）
 * 纯像素级 Canvas 实现，与 face-api.js 检测结果解耦，可独立单测
 */

export interface LiquifyPoint {
  x: number;
  y: number;
}

export interface LiquifyParams {
  /** 面中心（收缩方向参考点） */
  faceCenter: LiquifyPoint;
  /** 脸颊轮廓控制点（瘦脸作用点） */
  slimPoints: LiquifyPoint[];
  /** 瘦脸影响半径（相对脸宽比例，默认 0.5） */
  slimRadiusRatio: number;
  /** 瘦脸强度 0-1 */
  slimStrength: number;
  /** 左右眼中心（大眼作用点） */
  eyePoints: LiquifyPoint[];
  /** 大眼影响半径（相对脸宽比例，默认 0.22） */
  eyeRadiusRatio: number;
  /** 大眼强度 0-1 */
  eyeStrength: number;
}

function clamp(v: number, min: number, max: number) {
  return v < min ? min : v > max ? max : v;
}

/**
 * 对图像执行液化变形，返回新 ImageData
 * 每个目标像素计算多个控制点叠加位移后，反向采样源像素
 */
export function faceLiquify(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  params: LiquifyParams
): ImageData {
  const { faceCenter, slimPoints, eyePoints } = params;
  const faceW = faceWidth(data, width, height, params);
  if (faceW <= 0) {
    // 无有效人脸数据，原样返回
    const copy = new Uint8ClampedArray(data);
    return new ImageData(copy, width, height);
  }

  const slimR = Math.max(8, faceW * params.slimRadiusRatio);
  const eyeR = Math.max(5, faceW * params.eyeRadiusRatio);
  const out = new Uint8ClampedArray(data.length);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let ox = 0;
      let oy = 0;

      // 瘦脸：像素向面中心方向收缩（源采样偏向面中心外侧→内容内收）
      for (const p of slimPoints) {
        const dx = x - p.x;
        const dy = y - p.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < slimR * slimR) {
          const d = Math.sqrt(d2) / slimR; // 0..1
          const w = params.slimStrength * (1 - d * d);
          // 向面中心方向位移（采样位置偏向面中心）
          const cdx = faceCenter.x - p.x;
          const cdy = faceCenter.y - p.y;
          const cd = Math.sqrt(cdx * cdx + cdy * cdy) || 1;
          ox += (cdx / cd) * w;
          oy += (cdy / cd) * w;
        }
      }

      // 大眼：眼部区域向外采样（放大）
      for (const p of eyePoints) {
        const dx = x - p.x;
        const dy = y - p.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < eyeR * eyeR) {
          const d = Math.sqrt(d2) / eyeR;
          const w = params.eyeStrength * (1 - d * d);
          const dd = Math.sqrt(d2) || 1;
          ox -= (dx / dd) * w;
          oy -= (dy / dd) * w;
        }
      }

      // 反向采样
      const sx = clamp(Math.round(x + ox), 0, width - 1);
      const sy = clamp(Math.round(y + oy), 0, height - 1);
      const si = (sy * width + sx) * 4;
      const di = (y * width + x) * 4;
      out[di] = data[si];
      out[di + 1] = data[si + 1];
      out[di + 2] = data[si + 2];
      out[di + 3] = data[si + 3];
    }
  }
  return new ImageData(out, width, height);
}

/** 估算脸宽：取脸颊两侧控制点最大跨距（默认用图像宽度的 80% 兜底） */
function faceWidth(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  params: LiquifyParams
): number {
  const pts = params.slimPoints.length
    ? params.slimPoints
    : params.eyePoints.length
    ? params.eyePoints
    : [];
  if (pts.length >= 2) {
    let minX = Infinity;
    let maxX = -Infinity;
    for (const p of pts) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
    }
    const span = maxX - minX;
    if (span > 10) return span * 1.4;
  }
  return Math.max(width, height) * 0.8;
}
