/*
 * @Author: 秦少卫
 * @Date: 2024-07-06 12:34:00
 * @LastEditors: 秦少卫
 * @LastEditTime: 2024-07-06 17:11:03
 * @Description: 基础元素类型添加
 */

import { fabric } from 'fabric';
import type { IEditor, IPluginTempl } from '@kuaitu/core';
import { v4 as uuid } from 'uuid';

type IPlugin = Pick<AddBaseTypePlugin, 'addBaseType' | 'createImgByElement'>;

declare module '@kuaitu/core' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface IEditor extends IPlugin {}
}

export default class AddBaseTypePlugin implements IPluginTempl {
  static pluginName = 'AddBaseTypePlugin';
  static apis = ['addBaseType', 'createImgByElement'];
  constructor(public canvas: fabric.Canvas, public editor: IEditor) {
    this.editor = editor;
    this.canvas = canvas;
  }

  addBaseType(
    item: fabric.Object,
    optons?: {
      event: DragEvent;
      scale: boolean;
      center: boolean;
    }
  ) {
    const { event = false, scale = false, center = true } = optons || {};
    item.set({
      id: uuid(),
    });
    scale && this._toScale(item);
    event && this._toEvent(item, event);
    this.canvas.add(item);
    if (!event && center) {
      this._toCenter(item);
    }
    this.canvas.setActiveObject(item);
    this.canvas.renderAll();
    this.editor.saveState();
  }

  _toEvent(item: fabric.Object, event: DragEvent) {
    const { left, top } = this.canvas.getSelectionElement().getBoundingClientRect();
    if (event.x < left || event.y < top || item.width === undefined) return;
    const point = {
      x: event.x - left,
      y: event.y - top,
    };
    const pointerVpt = this.canvas.restorePointerVpt(point);
    item.set({
      left: pointerVpt.x,
      top: pointerVpt.y,
    });
  }

  _toCenter(item: fabric.Object) {
    this.canvas.setActiveObject(item);
    this.editor.position('center');
  }

  _toScale(item: fabric.Object) {
    const { width } = this.editor.getWorkspase();
    if (width === undefined) return;
    item.scaleToWidth(width / 2);
  }

  createImgByElement(target: HTMLImageElement) {
    return new Promise((resolve) => {
      const imgType = this.getImageExtension(target.src);
      if (imgType === 'svg') {
        fabric.loadSVGFromURL(target.src, (objects) => {
          const item = fabric.util.groupSVGElements(objects, {
            shadow: '',
            fontFamily: 'arial',
            name: 'svg元素',
          });
          resolve(item);
        });
      } else {
        // 直接使用已加载完成的图片元素构造实例，避免二次加载。
        // 不再走 fabric.Image.fromURL + crossOrigin：
        // dataURL 场景下部分移动端浏览器对 dataURL+crossOrigin 组合加载失败，
        // 导致 Promise 永不 resolve、图片无法插入。
        const instance = new fabric.Image(target);
        resolve(instance);
      }
    });
  }

  getImageExtension(imageUrl: string) {
    // dataURL：从 mime 提取扩展名（data:image/png;base64,xxx → png）
    if (/^data:/.test(imageUrl)) {
      const mime = imageUrl.substring(5, imageUrl.indexOf(';'));
      const ext = (mime.split('/')[1] || '').toLowerCase();
      return ext.replace('svg+xml', 'svg').replace('jpeg', 'jpg');
    }
    const pathParts = imageUrl.split('/');
    const filename = pathParts[pathParts.length - 1];
    const fileParts = filename.split('.');
    return fileParts[fileParts.length - 1];
  }

  destroy() {
    console.log('pluginDestroy');
  }
}
