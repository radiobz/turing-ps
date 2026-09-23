<template>
  <Modal
    v-model="visible"
    :title="$t('enhance.title')"
    width="680"
    :mask-closable="false"
    @on-cancel="close"
  >
    <div class="enhance-panel">
      <Alert v-if="!selectedImage" type="warning" show-icon>
        {{ $t('beauty.noImage') }}
      </Alert>

      <div v-else>
        <!-- 工具切换 -->
        <Tabs v-model="tool" @on-click="onToolChange">
          <TabPane :label="$t('enhance.brighten')" name="brighten" />
          <TabPane :label="$t('enhance.print')" name="print" />
          <TabPane :label="$t('enhance.frame')" name="frame" />
          <TabPane :label="$t('enhance.removeBg')" name="removeBg" />
          <TabPane :label="$t('enhance.effects')" name="effects" />
          <TabPane :label="$t('enhance.sticker')" name="sticker" />
          <TabPane :label="$t('enhance.textEffect')" name="textEffect" />
        </Tabs>

        <div class="enhance-body">
          <!-- 提亮 -->
          <div v-if="tool === 'brighten'" class="enhance-simple">
            <p class="enhance-desc">{{ $t('enhance.brightenTip') }}</p>
            <Button type="primary" :loading="loading" @click="applyBrighten">
              {{ $t('enhance.brightenBtn') }}
            </Button>
          </div>

          <!-- 打印 -->
          <div v-if="tool === 'print'" class="enhance-simple">
            <p class="enhance-desc">{{ $t('enhance.printTip') }}</p>
            <Button type="primary" :loading="loading" @click="doPrint">
              {{ $t('enhance.printBtn') }}
            </Button>
          </div>

          <!-- 相框 -->
          <div v-if="tool === 'frame'" class="enhance-simple">
            <p class="enhance-desc">{{ $t('enhance.frameTip') }}</p>
            <div class="frame-options">
              <div
                v-for="f in framePresets"
                :key="f.name"
                class="frame-option"
                :class="{ active: frameName === f.name }"
                @click="selectFrame(f)"
              >
                <span
                  class="frame-swatch"
                  :style="{ background: f.color, borderWidth: Math.min(6, f.width) + 'px' }"
                ></span>
                <span class="frame-label">{{ f.label }}</span>
              </div>
            </div>
            <div class="enhance-actions">
              <Button type="primary" :loading="loading" @click="applyFrame">
                {{ $t('enhance.apply') }}
              </Button>
            </div>
          </div>

          <!-- 抠图 -->
          <div v-if="tool === 'removeBg'" class="enhance-with-preview">
            <div class="enhance-preview">
              <canvas ref="previewCanvasRef"></canvas>
              <div v-if="loading" class="enhance-loading">
                <Spin size="large"></Spin>
              </div>
            </div>
            <div class="enhance-controls">
              <div class="enhance-item">
                <span class="enhance-label">{{ $t('enhance.tolerance') }}</span>
                <Slider
                  v-model="removeBgTolerance"
                  :min="0"
                  :max="100"
                  :step="1"
                  @on-change="previewRemoveBg"
                />
                <span class="enhance-value">{{ removeBgTolerance }}</span>
              </div>
              <p class="enhance-desc">{{ $t('enhance.removeBgTip') }}</p>
              <div class="enhance-actions">
                <Button type="primary" :loading="loading" @click="applyRemoveBg">
                  {{ $t('enhance.apply') }}
                </Button>
              </div>
            </div>
          </div>

          <!-- 插画特效 -->
          <div v-if="tool === 'effects'" class="enhance-with-preview">
            <div class="enhance-preview">
              <canvas ref="previewCanvasRef"></canvas>
              <div v-if="loading" class="enhance-loading">
                <Spin size="large"></Spin>
              </div>
            </div>
            <div class="enhance-controls">
              <div class="effect-list">
                <Button
                  v-for="fx in effectList"
                  :key="fx.key"
                  :type="effectKey === fx.key ? 'primary' : 'default'"
                  size="small"
                  class="effect-btn"
                  @click="previewEffect(fx.key)"
                >
                  {{ fx.label }}
                </Button>
              </div>
              <div class="enhance-actions">
                <Button type="primary" :loading="loading" @click="applyEffect">
                  {{ $t('enhance.apply') }}
                </Button>
              </div>
            </div>
          </div>

          <!-- 装饰贴纸 -->
          <div v-if="tool === 'sticker'" class="sticker-box">
            <p class="enhance-desc">{{ $t('enhance.stickerTip') }}</p>
            <div class="sticker-grid">
              <div
                v-for="st in STICKERS"
                :key="st.key"
                class="sticker-item"
                :title="st.name"
                @click="insertSticker(st)"
              >
                <span class="sticker-svg" v-html="st.svg"></span>
                <span class="sticker-name">{{ st.name }}</span>
              </div>
            </div>
          </div>

          <!-- 文字特效 -->
          <div v-if="tool === 'textEffect'" class="text-effect-box">
            <p class="enhance-desc">{{ $t('enhance.textEffectTip') }}</p>
            <div class="text-effect-list">
              <Button
                v-for="fx in TEXT_EFFECTS"
                :key="fx.key"
                size="small"
                class="effect-btn"
                @click="applyTextEffectFx(fx.key)"
              >
                {{ fx.name }}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <Button @click="close">{{ $t('cancel') }}</Button>
    </template>
  </Modal>
</template>

<script setup name="EnhancePanel">
import { Message } from 'view-ui-plus';
import { fabric } from 'fabric';
import useSelect from '@/hooks/select';
import { STICKERS } from '@/utils/stickers';
import { TEXT_EFFECTS, applyTextEffect } from '@/utils/textEffects';
import {
  autoBrighten,
  sketch,
  oilPaint,
  mosaic,
  pixelate,
  vintage,
  invert,
  grayscale,
  removeBackground,
} from '@/utils/imageFilter';

const { canvasEditor } = useSelect();

const visible = ref(false);
const loading = ref(false);
const selectedImage = ref(false);
const tool = ref('brighten');
const previewCanvasRef = ref();
const removeBgTolerance = ref(30);
const frameName = ref('none');
const effectKey = ref('');

let srcImageData = null;
let previewImageData = null;
let activeObject = null;

// 相框预设
const framePresets = [
  { name: 'none', label: '无', color: 'transparent', width: 0 },
  { name: 'black', label: '黑', color: '#000000', width: 6 },
  { name: 'white', label: '白', color: '#ffffff', width: 6 },
  { name: 'gold', label: '金', color: '#d4af37', width: 8 },
  { name: 'red', label: '红', color: '#c0392b', width: 5 },
];

// 插画特效列表
const effectList = [
  { key: 'sketch', label: '素描' },
  { key: 'oil', label: '油画' },
  { key: 'mosaic', label: '马赛克' },
  { key: 'pixel', label: '像素化' },
  { key: 'vintage', label: '复古' },
  { key: 'gray', label: '黑白' },
  { key: 'invert', label: '反色' },
];

/** 打开面板，tool: brighten|print|frame|removeBg|effects|sticker|textEffect */
function open(t = 'brighten') {
  tool.value = t;
  // 贴纸与文字特效不依赖选中图片
  if (t === 'sticker' || t === 'textEffect') {
    selectedImage.value = true;
    activeObject = null;
    visible.value = true;
    return;
  }
  const obj = canvasEditor.canvas.getActiveObjects()[0];
  if (!obj || obj.type !== 'image') {
    selectedImage.value = false;
    activeObject = null;
  } else {
    activeObject = obj;
    selectedImage.value = true;
  }
  visible.value = true;
  if (selectedImage.value && t !== 'print') {
    loadImage();
  }
}

function close() {
  visible.value = false;
}

function onToolChange() {
  if (selectedImage.value && tool.value !== 'print') {
    loadImage();
  }
}

/** 读取选中图片到 ImageData（限制最大边 2048） */
function loadImage() {
  loading.value = true;
  try {
    const src = (activeObject._element && activeObject._element.src) || activeObject.getSrc();
    const img = new Image();
    img.onload = () => {
      const maxEdge = 2048;
      const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, w, h);
      srcImageData = ctx.getImageData(0, 0, w, h);

      // 预览用缩小图
      const pScale = Math.min(1, 460 / Math.max(w, h));
      const pw = Math.round(w * pScale);
      const ph = Math.round(h * pScale);
      const pCanvas = document.createElement('canvas');
      pCanvas.width = pw;
      pCanvas.height = ph;
      const pCtx = pCanvas.getContext('2d', { willReadFrequently: true });
      pCtx.drawImage(img, 0, 0, pw, ph);
      previewImageData = pCtx.getImageData(0, 0, pw, ph);
      drawPreview(previewImageData);
      loading.value = false;
    };
    img.onerror = () => {
      Message.error('图片读取失败');
      loading.value = false;
    };
    img.src = src;
  } catch (e) {
    Message.error('图片读取失败');
    loading.value = false;
  }
}

function drawPreview(data) {
  const canvas = previewCanvasRef.value;
  if (!canvas) return;
  canvas.width = data.width;
  canvas.height = data.height;
  const ctx = canvas.getContext('2d');
  ctx.putImageData(data, 0, 0);
}

/** 用处理结果替换画布对象 */
function applyToCanvas(out) {
  if (!activeObject) return;
  loading.value = true;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = out.width;
    canvas.height = out.height;
    const ctx = canvas.getContext('2d');
    ctx.putImageData(out, 0, 0);
    const dataUrl = canvas.toDataURL('image/png');
    activeObject.setSrc(dataUrl, () => {
      canvasEditor.canvas.renderAll();
      loading.value = false;
      Message.success('已应用');
      visible.value = false;
    });
  } catch (e) {
    Message.error(`处理失败：${e.message}`);
    loading.value = false;
  }
}

/** 一键提亮 */
function applyBrighten() {
  if (!srcImageData) return;
  loading.value = true;
  try {
    const out = autoBrighten(srcImageData.data, srcImageData.width, srcImageData.height);
    applyToCanvas(out);
  } catch (e) {
    Message.error(`处理失败：${e.message}`);
    loading.value = false;
  }
}

/** 一键打印：导出画布到新窗口并调用浏览器打印 */
function doPrint() {
  loading.value = true;
  try {
    const dataUrl = canvasEditor.canvas.toDataURL({ format: 'png', multiplier: 2 });
    const win = window.open('', '_blank', 'width=900,height=1200');
    if (!win) {
      Message.warning('请允许弹出窗口以完成打印');
      loading.value = false;
      return;
    }
    win.document.write(
      '<!DOCTYPE html><html><head><title>图灵PS 打印</title>' +
        '<style>' +
        'body{margin:0;padding:24px;text-align:center;background:#fff}' +
        'img{max-width:100%;max-height:92vh;object-fit:contain}' +
        '@media print{body{padding:0}img{max-height:none;width:100%}}' +
        '</style></head><body><img src="' +
        dataUrl +
        '" onload="window.print();" /></body></html>'
    );
    win.document.close();
    loading.value = false;
  } catch (e) {
    Message.error(`打印失败：${e.message}`);
    loading.value = false;
  }
}

/** 相框选择 */
function selectFrame(f) {
  frameName.value = f.name;
}

/** 应用相框 */
function applyFrame() {
  if (!activeObject) return;
  const f = framePresets.find((x) => x.name === frameName.value) || framePresets[0];
  loading.value = true;
  try {
    activeObject.set({ stroke: f.color, strokeWidth: f.width, strokeUniform: true });
    canvasEditor.canvas.renderAll();
    loading.value = false;
    Message.success('相框已应用');
    visible.value = false;
  } catch (e) {
    Message.error(`相框应用失败：${e.message}`);
    loading.value = false;
  }
}

/** 抠图预览 */
function previewRemoveBg() {
  if (!previewImageData) return;
  try {
    const out = removeBackground(
      previewImageData.data,
      previewImageData.width,
      previewImageData.height,
      removeBgTolerance.value
    );
    previewImageData = out;
    drawPreview(out);
  } catch (e) {
    Message.error(`抠图失败：${e.message}`);
  }
}

/** 应用抠图 */
function applyRemoveBg() {
  if (!srcImageData) return;
  loading.value = true;
  try {
    const out = removeBackground(
      srcImageData.data,
      srcImageData.width,
      srcImageData.height,
      removeBgTolerance.value
    );
    applyToCanvas(out);
  } catch (e) {
    Message.error(`抠图失败：${e.message}`);
    loading.value = false;
  }
}

/** 特效预览 */
function previewEffect(key) {
  if (!previewImageData) return;
  effectKey.value = key;
  try {
    const fn = getEffectFn(key);
    const out = fn(previewImageData.data, previewImageData.width, previewImageData.height);
    previewImageData = out;
    drawPreview(out);
  } catch (e) {
    Message.error(`特效失败：${e.message}`);
  }
}

/** 应用特效 */
function applyEffect() {
  if (!srcImageData || !effectKey.value) {
    Message.warning('请先选择一个特效');
    return;
  }
  loading.value = true;
  try {
    const fn = getEffectFn(effectKey.value);
    const out = fn(srcImageData.data, srcImageData.width, srcImageData.height);
    applyToCanvas(out);
  } catch (e) {
    Message.error(`特效失败：${e.message}`);
    loading.value = false;
  }
}

function getEffectFn(key) {
  switch (key) {
    case 'sketch':
      return sketch;
    case 'oil':
      return oilPaint;
    case 'mosaic':
      return mosaic;
    case 'pixel':
      return pixelate;
    case 'vintage':
      return vintage;
    case 'gray':
      return grayscale;
    case 'invert':
      return invert;
    default:
      return grayscale;
  }
}

/** 插入装饰贴纸 */
function insertSticker(st) {
  try {
    fabric.loadSVGFromString(st.svg, (objects, options) => {
      const group = fabric.util.groupSVGElements(objects, options);
      group.set({ name: st.name, stickerKey: st.key });
      group.scaleToWidth(200);
      canvasEditor.addBaseType(group, { center: true });
      Message.success('已插入贴纸');
      visible.value = false;
    });
  } catch (e) {
    Message.error(`贴纸插入失败：${e.message}`);
  }
}

/** 应用文字特效 */
function applyTextEffectFx(key) {
  const obj = canvasEditor.canvas.getActiveObject();
  const t = obj && obj.type;
  if (!obj || (t !== 'text' && t !== 'i-text' && t !== 'textbox')) {
    Message.warning('请先在画布中选中一段文字');
    return;
  }
  try {
    applyTextEffect(obj, key);
    canvasEditor.canvas.renderAll();
    canvasEditor.saveState();
    Message.success('文字特效已应用');
  } catch (e) {
    Message.error(`文字特效失败：${e.message}`);
  }
}

defineExpose({ open, close });

window.addEventListener('enhance-open', (e) => open(e && e.detail));
</script>

<style scoped lang="less">
.enhance-panel {
  min-height: 220px;

  .enhance-body {
    margin-top: 16px;
  }

  .enhance-simple {
    padding: 24px 0;
    text-align: center;
  }

  .enhance-desc {
    color: #808695;
    font-size: 13px;
    margin-bottom: 16px;
    text-align: left;
  }

  .enhance-with-preview {
    display: flex;
    gap: 20px;

    .enhance-preview {
      position: relative;
      flex: 1;
      min-height: 200px;
      border: 1px dashed #dcdee2;
      border-radius: 4px;
      overflow: hidden;
      background: repeating-conic-gradient(#f5f5f5 0% 25%, #fff 0% 50%) 50% / 16px 16px;

      canvas {
        display: block;
        max-width: 100%;
        max-height: 320px;
        margin: auto;
      }

      .enhance-loading {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.6);
      }
    }

    .enhance-controls {
      width: 280px;

      .enhance-item {
        display: flex;
        align-items: center;
        margin-bottom: 12px;

        .enhance-label {
          width: 70px;
          flex-shrink: 0;
          font-size: 14px;
        }

        .enhance-value {
          width: 40px;
          text-align: right;
          color: #808695;
          font-size: 12px;
        }
      }

      .effect-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 12px;

        .effect-btn {
          margin: 0;
        }
      }

      .enhance-actions {
        margin-top: 12px;
      }
    }
  }

  .frame-options {
    display: flex;
    gap: 12px;
    justify-content: center;
    margin: 12px 0;

    .frame-option {
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 8px;
      border: 1px solid #dcdee2;
      border-radius: 4px;

      &.active {
        border-color: #2d8cf0;
        background: #f0faff;
      }

      .frame-swatch {
        width: 48px;
        height: 48px;
        border-radius: 4px;
        border-style: solid;
        border-color: #dcdee2;
        box-sizing: border-box;
      }

      .frame-label {
        font-size: 12px;
        color: #515a6e;
      }
    }
  }

  .sticker-box {
    .sticker-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;

      .sticker-item {
        width: 84px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        padding: 8px 4px;
        border: 1px solid #dcdee2;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          border-color: #2d8cf0;
          background: #f0faff;
          transform: translateY(-2px);
        }

        .sticker-svg {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
        }

        .sticker-name {
          font-size: 12px;
          color: #515a6e;
        }
      }
    }
  }

  .text-effect-box {
    .text-effect-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;

      .effect-btn {
        margin: 0;
      }
    }
  }
}
</style>
