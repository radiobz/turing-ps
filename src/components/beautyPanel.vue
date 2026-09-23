<template>
  <Modal
    v-model="visible"
    :title="$t('beauty.title')"
    width="640"
    :mask-closable="false"
    @on-cancel="reset"
  >
    <div class="beauty-panel">
      <!-- 状态提示 -->
      <Alert v-if="!selectedImage" type="warning" show-icon>{{ $t('beauty.noImage') }}</Alert>

      <div v-else class="beauty-body">
        <!-- 预览 -->
        <div class="beauty-preview">
          <canvas ref="previewCanvasRef"></canvas>
          <div v-if="loading" class="beauty-loading">
            <Spin size="large"></Spin>
          </div>
        </div>

        <!-- 参数 -->
        <div class="beauty-controls">
          <div class="beauty-item">
            <span class="beauty-label">{{ $t('beauty.smoothing') }}</span>
            <Slider
              v-model="params.smoothing"
              :min="0"
              :max="10"
              :step="0.1"
              @on-change="onParamChange"
            />
            <span class="beauty-value">{{ params.smoothing.toFixed(1) }}</span>
          </div>
          <div class="beauty-item">
            <span class="beauty-label">{{ $t('beauty.whitening') }}</span>
            <Slider
              v-model="params.whitening"
              :min="0"
              :max="10"
              :step="0.1"
              @on-change="onParamChange"
            />
            <span class="beauty-value">{{ params.whitening.toFixed(1) }}</span>
          </div>
          <div class="beauty-tip">{{ $t('beauty.tip') }}</div>
        </div>
      </div>
    </div>

    <template #footer>
      <Button @click="reset">{{ $t('beauty.reset') }}</Button>
      <Button @click="close">{{ $t('cancel') }}</Button>
      <Button type="primary" :loading="loading" :disabled="!selectedImage" @click="apply">
        {{ $t('beauty.apply') }}
      </Button>
    </template>
  </Modal>
</template>

<script setup name="BeautyPanel">
import { Message } from 'view-ui-plus';
import useSelect from '@/hooks/select';
import {
  loadGpupixel,
  initGpupixel,
  setBeautyParams,
  processImageData,
  DEFAULT_BEAUTY_PARAMS,
} from '@/utils/gpupixel';

const { canvasEditor } = useSelect();

const visible = ref(false);
const loading = ref(false);
const selectedImage = ref(false);
const previewCanvasRef = ref();
const params = reactive({
  smoothing: DEFAULT_BEAUTY_PARAMS.smoothing,
  whitening: DEFAULT_BEAUTY_PARAMS.whitening,
});

// 原图（应用时使用，保持原分辨率）
let srcImageData = null;
// 预览图（缩小尺寸，实时预览更快）
let previewImageData = null;
let activeObject = null;
let debounceTimer = null;

/** 打开面板 */
function open() {
  const obj = canvasEditor.canvas.getActiveObjects()[0];
  if (!obj || obj.type !== 'image') {
    selectedImage.value = false;
    activeObject = null;
  } else {
    activeObject = obj;
    selectedImage.value = true;
  }
  visible.value = true;
  if (selectedImage.value) {
    loadImage();
  }
}

function close() {
  visible.value = false;
  reset();
}

/** 从 fabric 图片对象取原图数据 */
function loadImage() {
  loading.value = true;
  try {
    const src =
      activeObject._element && activeObject._element.src
        ? activeObject._element.src
        : activeObject.getSrc();
    const img = new Image();
    img.onload = () => {
      // 原图 ImageData
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

      // 预览 ImageData（缩放至 480 内）
      const pScale = Math.min(1, 480 / Math.max(w, h));
      const pw = Math.round(w * pScale);
      const ph = Math.round(h * pScale);
      const pCanvas = document.createElement('canvas');
      pCanvas.width = pw;
      pCanvas.height = ph;
      const pCtx = pCanvas.getContext('2d', { willReadFrequently: true });
      pCtx.drawImage(img, 0, 0, pw, ph);
      previewImageData = pCtx.getImageData(0, 0, pw, ph);

      // 初始化 GPUPixel（首次）
      ensureEngine()
        .then(() => {
          drawPreview(previewImageData);
          loading.value = false;
        })
        .catch(() => {
          loading.value = false;
        });
    };
    img.onerror = () => {
      Message.error('图片读取失败');
      loading.value = false;
    };
    img.src = src;
  } catch (e) {
    Message.error(`图片读取失败：${e.message}`);
    loading.value = false;
  }
}

async function ensureEngine() {
  await loadGpupixel();
  await initGpupixel();
}

/** 绘制预览 canvas */
function drawPreview(data) {
  const canvas = previewCanvasRef.value;
  if (!canvas) return;
  canvas.width = data.width;
  canvas.height = data.height;
  const ctx = canvas.getContext('2d');
  ctx.putImageData(data, 0, 0);
}

/** 滑块变化 → 节流实时预览 */
function onParamChange() {
  if (!previewImageData) return;
  setBeautyParams(params);
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    try {
      const out = processImageData(previewImageData);
      previewImageData = out;
      drawPreview(out);
    } catch (e) {
      Message.error(`预览处理失败：${e.message}`);
    }
  }, 200);
}

/** 应用：全分辨率处理并替换画布对象 */
function apply() {
  if (!activeObject || !srcImageData) return;
  loading.value = true;
  try {
    setBeautyParams(params);
    const out = processImageData(srcImageData);
    const canvas = document.createElement('canvas');
    canvas.width = out.width;
    canvas.height = out.height;
    const ctx = canvas.getContext('2d');
    ctx.putImageData(out, 0, 0);
    const dataUrl = canvas.toDataURL('image/png');
    activeObject.setSrc(dataUrl, () => {
      canvasEditor.canvas.renderAll();
      loading.value = false;
      Message.success('美颜已应用');
      visible.value = false;
      reset();
    });
  } catch (e) {
    Message.error(`应用失败：${e.message}`);
    loading.value = false;
  }
}

function reset() {
  params.smoothing = DEFAULT_BEAUTY_PARAMS.smoothing;
  params.whitening = DEFAULT_BEAUTY_PARAMS.whitening;
  setBeautyParams({ ...DEFAULT_BEAUTY_PARAMS });
  if (previewImageData && srcImageData) {
    // 重新取原预览数据
    const pScale = Math.min(1, 480 / Math.max(srcImageData.width, srcImageData.height));
    const pw = Math.round(srcImageData.width * pScale);
    const ph = Math.round(srcImageData.height * pScale);
    const pCanvas = document.createElement('canvas');
    pCanvas.width = pw;
    pCanvas.height = ph;
    const pCtx = pCanvas.getContext('2d', { willReadFrequently: true });
    pCtx.drawImage(activeObject._element, 0, 0, pw, ph);
    previewImageData = pCtx.getImageData(0, 0, pw, ph);
    drawPreview(previewImageData);
  }
}

defineExpose({ open, close });

window.addEventListener('beauty-open', () => open());
</script>

<style scoped lang="less">
.beauty-panel {
  min-height: 200px;

  .beauty-body {
    display: flex;
    gap: 20px;
  }

  .beauty-preview {
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

    .beauty-loading {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.6);
    }
  }

  .beauty-controls {
    width: 260px;

    .beauty-item {
      display: flex;
      align-items: center;
      margin-bottom: 16px;

      .beauty-label {
        width: 70px;
        flex-shrink: 0;
        font-size: 14px;
      }

      .beauty-value {
        width: 40px;
        text-align: right;
        color: #808695;
        font-size: 12px;
      }
    }

    .beauty-tip {
      color: #808695;
      font-size: 12px;
      line-height: 1.6;
      margin-top: 8px;
    }
  }
}
</style>
