/**
 * 口红与腮红渲染：基于人脸关键点多边形/椭圆区域，使用 multiply 混合保持皮肤纹理
 * 纯 Canvas 2D 实现，无任何外部依赖
 */

export interface RegionPoint {
  x: number;
  y: number;
}

/** hex 颜色转 rgba 字符串 */
function hexToRgba(hex: string, alpha: number) {
  let h = hex.replace('#', '');
  if (h.length === 3) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** 在 ctx 上按多边形轮廓绘制口红（multiply 混合，保留纹理） */
export function applyLipstick(
  ctx: CanvasRenderingContext2D,
  points: RegionPoint[],
  color: string,
  strength: number
) {
  if (!points || points.length < 3 || strength <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.closePath();
  ctx.fillStyle = hexToRgba(color, Math.min(0.9, strength * 0.85));
  ctx.fill();
  ctx.restore();
}

/** 在 ctx 上按椭圆区域绘制腮红（multiply 混合） */
export function applyBlush(
  ctx: CanvasRenderingContext2D,
  center: RegionPoint,
  radius: number,
  color: string,
  strength: number
) {
  if (strength <= 0 || radius <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  const g = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, radius);
  g.addColorStop(0, hexToRgba(color, Math.min(0.55, strength * 0.5)));
  g.addColorStop(1, hexToRgba(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(center.x, center.y, radius, radius * 1.15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** 对 ImageData 应用口红+腮红，返回新 ImageData */
export function renderMakeup(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  opts: {
    mouthPoints?: RegionPoint[];
    innerMouthPoints?: RegionPoint[];
    lipstickColor?: string;
    lipstickStrength?: number;
    cheekPoints?: RegionPoint[];
    blushColor?: string;
    blushStrength?: number;
    faceWidth?: number;
  }
): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const img = new ImageData(data, width, height);
  ctx.putImageData(img, 0, 0);

  const faceW = opts.faceWidth || Math.max(width, height) * 0.8;

  if (opts.mouthPoints && opts.mouthPoints.length >= 3 && (opts.lipstickStrength || 0) > 0) {
    // 外唇整体
    applyLipstick(ctx, opts.mouthPoints, opts.lipstickColor || '#e04040', opts.lipstickStrength);
    // 内唇加深，增加唇妆层次
    if (opts.innerMouthPoints && opts.innerMouthPoints.length >= 3) {
      applyLipstick(
        ctx,
        opts.innerMouthPoints,
        opts.lipstickColor || '#e04040',
        Math.min(0.5, opts.lipstickStrength * 0.5)
      );
    }
  }

  if (opts.cheekPoints && opts.cheekPoints.length && (opts.blushStrength || 0) > 0) {
    const r = faceW * 0.16;
    for (const c of opts.cheekPoints) {
      applyBlush(ctx, c, r, opts.blushColor || '#ff6f91', opts.blushStrength);
    }
  }

  return ctx.getImageData(0, 0, width, height);
}
