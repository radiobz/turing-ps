/**
 * 装饰贴纸库：自绘简洁 SVG（几何图形），无版权风险，可自由商用
 */
export interface StickerItem {
  key: string;
  name: string;
  svg: string;
}

const S = (body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="72" height="72">${body}</svg>`;

export const STICKERS: StickerItem[] = [
  {
    key: 'star',
    name: '星星',
    svg: S(
      '<path d="M50 12 L61 37 L88 38 L67 55 L74 82 L50 66 L26 82 L33 55 L12 38 L39 37 Z" fill="#ffc53d" stroke="#d48806" stroke-width="2"/>'
    ),
  },
  {
    key: 'heart',
    name: '爱心',
    svg: S(
      '<path d="M50 84 C22 62 10 42 26 30 C38 21 52 27 50 40 C48 27 62 21 74 30 C90 42 78 62 50 84 Z" fill="#f5222d" stroke="#a8071a" stroke-width="2"/>'
    ),
  },
  {
    key: 'flower',
    name: '花朵',
    svg: S(
      '<circle cx="50" cy="26" r="14" fill="#ff85c0"/><circle cx="70" cy="38" r="14" fill="#ffadd2"/><circle cx="66" cy="62" r="14" fill="#ff85c0"/><circle cx="34" cy="62" r="14" fill="#ffadd2"/><circle cx="30" cy="38" r="14" fill="#ff85c0"/><circle cx="50" cy="48" r="12" fill="#fff566" stroke="#d4b106" stroke-width="2"/>'
    ),
  },
  {
    key: 'music',
    name: '音符',
    svg: S(
      '<rect x="40" y="18" width="4" height="48" rx="2" fill="#333"/><rect x="44" y="16" width="24" height="4" rx="2" fill="#333"/><rect x="44" y="42" width="24" height="4" rx="2" fill="#333"/><circle cx="36" cy="68" r="9" fill="#333"/><circle cx="64" cy="48" r="9" fill="#333"/>'
    ),
  },
  {
    key: 'crown',
    name: '皇冠',
    svg: S(
      '<path d="M20 72 L10 32 L34 48 L50 22 L66 48 L90 32 L80 72 Z" fill="#fadb14" stroke="#d4b106" stroke-width="2"/><rect x="20" y="72" width="60" height="8" rx="2" fill="#d4b106"/>'
    ),
  },
  {
    key: 'bubble',
    name: '气泡',
    svg: S(
      '<rect x="14" y="20" width="72" height="52" rx="12" fill="#2d8cf0"/><path d="M34 72 L28 88 L48 72 Z" fill="#2d8cf0"/><circle cx="34" cy="42" r="4" fill="#fff"/><circle cx="50" cy="42" r="4" fill="#fff"/><circle cx="66" cy="42" r="4" fill="#fff"/>'
    ),
  },
  {
    key: 'sparkle',
    name: '闪光',
    svg: S(
      '<path d="M50 4 L57 32 L50 26 L43 32 Z" fill="#ffec3d"/><path d="M50 96 L57 68 L50 74 L43 68 Z" fill="#ffec3d"/><path d="M4 50 L32 43 L26 50 L32 57 Z" fill="#ffec3d"/><path d="M96 50 L68 43 L74 50 L68 57 Z" fill="#ffec3d"/><path d="M50 30 L62 44 L50 70 L38 44 Z" fill="#faad14" stroke="#d48806" stroke-width="1.5"/>'
    ),
  },
  {
    key: 'moon',
    name: '月亮',
    svg: S(
      '<path d="M64 10 A46 46 0 1 0 90 64 A36 36 0 1 1 64 10 Z" fill="#fadb14" stroke="#d4b106" stroke-width="2"/>'
    ),
  },
  {
    key: 'butterfly',
    name: '蝴蝶',
    svg: S(
      '<ellipse cx="34" cy="34" rx="22" ry="28" fill="#9254de" opacity="0.9"/><ellipse cx="66" cy="34" rx="22" ry="28" fill="#b37feb" opacity="0.9"/><ellipse cx="34" cy="34" rx="8" ry="14" fill="#f0f5ff" opacity="0.6"/><ellipse cx="66" cy="34" rx="8" ry="14" fill="#f0f5ff" opacity="0.6"/><rect x="47" y="28" width="6" height="46" rx="3" fill="#531dab"/>'
    ),
  },
  {
    key: 'arrow',
    name: '箭头',
    svg: S(
      '<path d="M8 44 H64 V30 L92 52 L64 74 V60 H8 Z" fill="#f5222d" stroke="#a8071a" stroke-width="2"/>'
    ),
  },
  {
    key: 'cloud',
    name: '云朵',
    svg: S(
      '<circle cx="34" cy="56" r="20" fill="#fff" stroke="#c5cad1" stroke-width="2"/><circle cx="58" cy="44" r="26" fill="#fff" stroke="#c5cad1" stroke-width="2"/><circle cx="76" cy="60" r="18" fill="#fff" stroke="#c5cad1" stroke-width="2"/><rect x="34" y="58" width="42" height="22" rx="11" fill="#fff" stroke="#c5cad1" stroke-width="2"/>'
    ),
  },
  {
    key: 'rainbow',
    name: '彩虹',
    svg: S(
      '<g fill="none" stroke-width="7"><path d="M18 68 A32 32 0 0 1 82 68" stroke="#f5222d"/><path d="M24 68 A26 26 0 0 1 76 68" stroke="#fa8c16"/><path d="M30 68 A20 20 0 0 1 70 68" stroke="#fadb14"/><path d="M36 68 A14 14 0 0 1 64 68" stroke="#52c41a"/><path d="M42 68 A8 8 0 0 1 58 68" stroke="#2d8cf0"/></g>'
    ),
  },
  {
    key: 'gift',
    name: '礼物',
    svg: S(
      '<rect x="20" y="40" width="60" height="46" rx="6" fill="#ff85c0" stroke="#d45a8f" stroke-width="2"/><path d="M50 40 L50 86 M20 58 L80 58" stroke="#d45a8f" stroke-width="3"/><rect x="20" y="52" width="60" height="8" fill="#eb2f96"/><path d="M50 40 C50 28 28 26 28 34 C28 42 50 40 50 40 Z" fill="#f5222d"/><path d="M50 40 C50 28 72 26 72 34 C72 42 50 40 50 40 Z" fill="#f5222d"/>'
    ),
  },
];
