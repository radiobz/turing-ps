# 图灵PS（Turing PS）

浏览器端在线修图工具：无需安装、无需上传，打开即用。基于开源免费组件组合，零付费路径。

> 状态：设计定稿（v1.0）｜许可证：MIT（规划中，待定稿）

## 文档

- [设计文档](docs/DESIGN.md) — 开源方案调研、技术选型、架构与里程碑

## 开源组件（全部可免费商用）

| 能力 | 项目 | License |
|---|---|---|
| 编辑器骨架 / 图层 / 素材 / 文字特效 | vue-fabric-editor | MIT |
| 美颜（美白/磨皮/瘦脸/大眼/口红） | GPUPixel（WASM 集成） | Apache-2.0 |
| 抠图 | rembg（自托管服务） | MIT |
| 插画 / 艺术滤镜 | pixels.js | MIT |
| 装饰素材 | OpenStickers 等可商用素材 | Craftwork / CC0 |

## 快速开始（占位，待 M1 实现）

```bash
npm install
npm run dev
```

## 路线图

M1 骨架 → M2 编辑能力（图层/滤镜/文字/美颜/撤销） → M3 特效/抠图 → M4 发布（GitHub Pages）
