/**
 * GPUPixel WASM 集成模块
 *
 * 基于官方 pixpark/gpupixel v1.3.1 web sdk（Apache-2.0）封装。
 * 产物位于 public/gpupixel/（app.js + app.wasm + app.data + res/）。
 *
 * 官方 web sdk 当前暴露：
 *  - Init(resourcePath): 初始化（加载人脸模型与资源）
 *  - SetBeautyParams(smoothing, whitening): 磨皮 + 美白
 *  - ProcessImage(ptr, width, height): 处理 RGBA 图像（原地读写同一 buffer）
 *  - Destroy(): 释放
 */
import { Message } from 'view-ui-plus';

let moduleInstance: any = null;
let loadPromise: Promise<any> | null = null;

export interface BeautyParams {
  /** 磨皮强度 0-10 */
  smoothing: number;
  /** 美白强度 0-10 */
  whitening: number;
}

export const DEFAULT_BEAUTY_PARAMS: BeautyParams = {
  smoothing: 0,
  whitening: 0,
};

/** 加载 GPUPixel WASM（单例，可重复调用） */
export function loadGpupixel(): Promise<any> {
  if (moduleInstance) return Promise.resolve(moduleInstance);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    // Emscripten 产物挂载全局 Module
    const global = window as any;
    if (global.Module && global.Module._ProcessImage) {
      moduleInstance = global.Module;
      resolve(moduleInstance);
      return;
    }

    // WebGL 能力检测（GPUPixel 基于 GPU 渲染）
    if (!isWebGLAvailable()) {
      loadPromise = null;
      reject(new Error('当前浏览器不支持 WebGL，美颜功能不可用（GPUPixel 依赖 GPU 渲染）'));
      return;
    }

    // 预配置 Emscripten Module：
    // - locateFile: app.wasm / app.data 指向 public/gpupixel/
    // - canvas: 独立隐藏 canvas 提供 WebGL 上下文（不与编辑器画布冲突）
    const base = `${import.meta.env.BASE_URL}gpupixel/`;
    const glCanvas = document.createElement('canvas');
    glCanvas.id = 'gpupixel-gl-canvas';
    glCanvas.width = 4;
    glCanvas.height = 4;
    glCanvas.style.display = 'none';
    document.body.appendChild(glCanvas);
    global.Module = {
      ...(global.Module || {}),
      locateFile: (path: string) => `${base}${path}`,
      canvas: glCanvas,
    };

    const script = document.createElement('script');
    script.src = `${base}app.js`;
    script.onerror = () => {
      loadPromise = null;
      reject(new Error('GPUPixel WASM 脚本加载失败'));
    };
    script.onload = () => {
      // app.js 内部会异步加载 app.wasm / app.data
      global.Module.onRuntimeInitialized = () => {
        moduleInstance = global.Module;
        resolve(moduleInstance);
      };
    };
    document.body.appendChild(script);
  });
  return loadPromise;
}

/** 检测 WebGL 是否可用 */
function isWebGLAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch (e) {
    return false;
  }
}

/** 初始化 GPUPixel（加载人脸检测模型等资源） */
export async function initGpupixel(resourcePath = '/gpupixel'): Promise<boolean> {
  const mod = await loadGpupixel();
  const result = mod._Init(resourcePath);
  if (result < 0) {
    throw new Error(`GPUPixel 初始化失败（错误码 ${result}）`);
  }
  return true;
}

/** 设置磨皮/美白参数（0-10） */
export function setBeautyParams(params: BeautyParams) {
  if (!moduleInstance) return;
  moduleInstance._SetBeautyParams(Number(params.smoothing) || 0, Number(params.whitening) || 0);
}

/**
 * 处理一张图片（RGBA ImageData），返回处理后的 ImageData。
 * GPUPixel 以原地方式读写 WASM 内存。
 */
export function processImageData(imageData: ImageData): ImageData {
  if (!moduleInstance) {
    throw new Error('GPUPixel 未初始化，请先调用 loadGpupixel/initGpupixel');
  }
  const { data, width, height } = imageData;
  const ptr = moduleInstance._malloc(data.length);
  try {
    moduleInstance.HEAPU8.set(data, ptr);
    const result = moduleInstance._ProcessImage(ptr, width, height);
    if (result < 0) {
      throw new Error(`GPUPixel 图像处理失败（错误码 ${result}）`);
    }
    const out = new Uint8ClampedArray(moduleInstance.HEAPU8.buffer, ptr, data.length).slice();
    return new ImageData(out, width, height);
  } finally {
    moduleInstance._free(ptr);
  }
}

/** 释放 GPUPixel 资源 */
export function destroyGpupixel() {
  if (moduleInstance) {
    try {
      moduleInstance._Destroy();
    } catch (e) {
      // 忽略销毁异常
    }
  }
  moduleInstance = null;
  loadPromise = null;
}

/** 便捷入口：确保已初始化 */
export async function ensureGpupixel(): Promise<boolean> {
  try {
    await loadGpupixel();
    const initialized = await initGpupixel();
    return initialized;
  } catch (e: any) {
    Message.error(`美颜引擎加载失败：${e.message}`);
    throw e;
  }
}
