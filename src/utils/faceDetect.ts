/**
 * face-api.js（MIT）人脸检测封装：加载模型 → 检测 68 点关键点 → 输出液化参数
 * 模型位于 public/models/face-api/
 */
import * as faceapi from 'face-api.js';

export type FaceResult = {
  faceCenter: { x: number; y: number };
  slimPoints: { x: number; y: number }[];
  eyePoints: { x: number; y: number }[];
} | null;

let modelReady = false;
let loading = false;

/** 加载模型（tiny 人脸检测 + 68 点关键点） */
export async function loadFaceModels(): Promise<boolean> {
  if (modelReady) return true;
  if (loading) return modelReady;
  loading = true;
  try {
    const base = `${import.meta.env.BASE_URL}models/face-api/`;
    await faceapi.nets.tinyFaceDetector.loadFromUri(base);
    await faceapi.nets.faceLandmark68Net.loadFromUri(base);
    modelReady = true;
  } catch (e) {
    console.error('人脸模型加载失败', e);
    modelReady = false;
  }
  loading = false;
  return modelReady;
}

/** 检测图像中最大的人脸，返回液化所需关键点 */
export async function detectFace(input: HTMLImageElement | HTMLCanvasElement): Promise<FaceResult> {
  const ok = await loadFaceModels();
  if (!ok) return null;
  try {
    const detection = await faceapi
      .detectSingleFace(input, new faceapi.TinyFaceDetectorOptions({ inputSize: 416 }))
      .withFaceLandmarks();
    if (!detection) return null;
    const pts = detection.landmarks.positions; // 68 点
    if (!pts || pts.length < 68) return null;
    // dlib 68 点约定：
    //   0-16 下颌轮廓（0 右侧脸颊 → 8 下巴 → 16 左侧脸颊）
    //   27-35 鼻部（30 为鼻尖）
    //   36-41 左眼，42-47 右眼
    const faceCenter = { x: pts[30].x, y: pts[30].y };
    // 瘦脸控制点：脸颊两侧靠内轮廓点（右侧 2/3/4，左侧 12/13/14）
    const slimPoints = [2, 3, 4, 12, 13, 14].map((i) => ({ x: pts[i].x, y: pts[i].y }));
    const eyeL = avg(pts.slice(36, 42));
    const eyeR = avg(pts.slice(42, 48));
    return {
      faceCenter,
      slimPoints,
      eyePoints: [eyeL, eyeR],
    };
  } catch (e) {
    console.error('人脸检测失败', e);
    return null;
  }
}

function avg(pts: { x: number; y: number }[]) {
  let x = 0;
  let y = 0;
  for (const p of pts) {
    x += p.x;
    y += p.y;
  }
  return { x: x / pts.length, y: y / pts.length };
}
