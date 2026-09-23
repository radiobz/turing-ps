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

## 功能

- **美颜**：磨皮、美白（GPUPixel WASM）、瘦脸、大眼、口红、腮红（face-api.js 人脸检测 + 自研液化/彩妆算法，纯本地）
- **一键工具**：一键提亮（自动曝光）、一键打印、相框、抠图（四角背景移除 + 魔棒点击选背景）、插画特效（13 种）
- **装饰与文字**：21 款内置贴纸、8 种文字特效（霓虹/鎏金/渐变/投影/描边/漫画/柔光）
- 基座能力：图层、滤镜、文字/艺术字、裁剪、素材库、模板、快捷键、右键菜单、历史撤销、PSD 导入
- PWA：可安装到桌面（manifest + 图标）

## 路线图

- [x] M1 工程骨架：基座整合（vue-fabric-editor）、品牌改造、构建打通
- [x] M2 编辑能力：图层、滤镜、文字、绘制、撤销/重做、美颜（磨皮/美白 + 瘦脸/大眼）
- [x] M3 特效/抠图：相框、插画特效、一键提亮、一键打印、抠图、装饰贴纸、文字特效
- [x] M4 发布：GitHub Pages 演示站点（自动部署）、PWA
- [ ] 可选增强：口红（GPUPixel 扩展编译）、rembg 深度抠图服务（需 Docker）

## 合规声明

本项目基于 [vue-fabric-editor](https://github.com/ikuaitu/vue-fabric-editor)（MIT）二次开发，上游许可证与版权声明保留在 `UPSTREAM-LICENSE-vue-fabric-editor.md`。所有依赖均为可免费商用许可（MIT / Apache-2.0 / CC0 等），全程避开付费路径。
