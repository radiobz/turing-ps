# 图灵PS（Turing PS）

浏览器端在线修图工具：无需安装、无需上传，打开即用。基于开源免费组件组合，零付费路径。

> 状态：M1 工程骨架完成｜许可证：MIT

## 文档

- [设计文档](docs/DESIGN.md) — 开源方案调研、技术选型、架构与里程碑

## 开源组件（全部可免费商用）

| 能力 | 项目 | License |
|---|---|---|
| 编辑器骨架 / 图层 / 素材 / 文字特效 | [vue-fabric-editor](https://github.com/ikuaitu/vue-fabric-editor) | MIT |
| 美颜（美白/磨皮/瘦脸/大眼/口红） | GPUPixel（WASM 集成，规划中） | Apache-2.0 |
| 抠图 | rembg（自托管服务，规划中） | MIT |
| 插画 / 艺术滤镜 | pixels.js（规划中） | MIT |
| 装饰素材 | OpenStickers 等可商用素材（规划中） | Craftwork / CC0 |

## 快速开始

环境要求：Node.js ≥ 16、pnpm ≥ 9。

```bash
pnpm install    # 首次安装依赖（构建脚本已放行 esbuild/canvas/vue-demi）
pnpm dev        # 开发模式，默认 http://localhost:3000
pnpm build      # 生产构建，产物输出到 dist/
pnpm preview    # 本地预览生产产物
```

> 说明：生产构建 `APP_BASE_PATH=/turing-ps/`，本地 preview 访问路径为 `http://localhost:4173/turing-ps/`（GitHub Pages 项目站点同路径）。

## 路线图

- [x] M1 工程骨架：基座整合（vue-fabric-editor）、品牌改造、构建打通
- [ ] M2 编辑能力：图层、滤镜、文字、绘制、撤销/重做、美颜（GPUPixel）
- [ ] M3 特效/抠图：相框、插画特效、文字装饰特效、提亮、rembg 抠图
- [ ] M4 发布：一键打印、GitHub Pages 演示站点

## 合规声明

本项目基于 [vue-fabric-editor](https://github.com/ikuaitu/vue-fabric-editor)（MIT）二次开发，上游许可证与版权声明保留在 `UPSTREAM-LICENSE-vue-fabric-editor.md`。所有依赖均为可免费商用许可（MIT / Apache-2.0 / CC0 等），全程避开付费路径。
