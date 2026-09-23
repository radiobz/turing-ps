/**
 * 文字特效预设库：基于 fabric 原生能力（fill/stroke/shadow/gradient），全部本地实现
 */
import { fabric } from 'fabric';

export interface TextEffectItem {
  key: string;
  name: string;
  apply: (obj: fabric.Object) => void;
}

/** 清除既有特效，恢复为黑色纯文本 */
function resetStyle(obj: fabric.Object) {
  obj.set({
    fill: '#000000FF',
    stroke: null,
    strokeWidth: 0,
    shadow: null,
  });
}

export const TEXT_EFFECTS: TextEffectItem[] = [
  {
    key: 'neon',
    name: '霓虹发光',
    apply(obj) {
      resetStyle(obj);
      obj.set({
        fill: '#ffffff',
        shadow: new fabric.Shadow({ color: '#2d8cf0', blur: 18, offsetX: 0, offsetY: 0 }),
      });
    },
  },
  {
    key: 'gold',
    name: '鎏金立体',
    apply(obj) {
      resetStyle(obj);
      obj.set({
        fill: '#d4af37',
        stroke: '#8a6d1f',
        strokeWidth: 2,
        shadow: new fabric.Shadow({ color: '#8a6d1f', blur: 3, offsetX: 2, offsetY: 2 }),
      });
    },
  },
  {
    key: 'gradient',
    name: '渐变炫彩',
    apply(obj) {
      resetStyle(obj);
      const w = Math.max(obj.width || 200, 10);
      obj.set({
        fill: new fabric.Gradient({
          type: 'linear',
          coords: { x1: 0, y1: 0, x2: w, y2: 0 },
          colorStops: [
            { offset: 0, color: '#722ed1' },
            { offset: 0.5, color: '#2d8cf0' },
            { offset: 1, color: '#13c2c2' },
          ],
        }),
      });
    },
  },
  {
    key: 'shadow',
    name: '投影立体',
    apply(obj) {
      resetStyle(obj);
      obj.set({
        fill: '#2d8cf0',
        shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.45)', blur: 4, offsetX: 4, offsetY: 4 }),
      });
    },
  },
  {
    key: 'outline',
    name: '描边海报',
    apply(obj) {
      resetStyle(obj);
      obj.set({ fill: '#ffffff', stroke: '#f5222d', strokeWidth: 3 });
    },
  },
  {
    key: 'comic',
    name: '漫画体',
    apply(obj) {
      resetStyle(obj);
      obj.set({
        fill: '#fadb14',
        stroke: '#262626',
        strokeWidth: 2,
        shadow: new fabric.Shadow({ color: '#262626', blur: 0, offsetX: 4, offsetY: 4 }),
      });
    },
  },
  {
    key: 'soft',
    name: '柔光粉',
    apply(obj) {
      resetStyle(obj);
      obj.set({
        fill: '#ff85c0',
        shadow: new fabric.Shadow({ color: '#ff85c0', blur: 14, offsetX: 0, offsetY: 0 }),
      });
    },
  },
  {
    key: 'reset',
    name: '恢复默认',
    apply(obj) {
      resetStyle(obj);
    },
  },
];

/** 对画布文字对象应用预设特效 */
export function applyTextEffect(obj: fabric.Object, key: string) {
  const fx = TEXT_EFFECTS.find((x) => x.key === key);
  if (!fx || !obj) return;
  fx.apply(obj);
}
