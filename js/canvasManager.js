/**
 * Canvas Manager Module
 * 負責 Canvas 畫布與圖形物件管理
 */

class CanvasManager {
  constructor(canvasElement) {
    this.canvas = null;
    this.fabricCanvas = null;
    this.currentPage = null;
    this.currentFileName = null;
    this.currentPageNum = 1;
    this.rotation = 0; // 當前旋轉角度
    this.cropMode = false;
    this.cropRect = null;
    
    if (canvasElement) {
      this.init(canvasElement);
    }
  }

  /**
   * 初始化 Canvas
   * @param {HTMLCanvasElement} canvasElement - Canvas 元素
   */
  init(canvasElement) {
    this.canvas = canvasElement;
    
    // 初始化 fabric.js
    this.fabricCanvas = new fabric.Canvas(canvasElement, {
      selection: true,
      preserveObjectStacking: true
    });
    
    // 設定預設大小
    this.fabricCanvas.setWidth(800);
    this.fabricCanvas.setHeight(600);
    
    console.log('✓ Canvas 已初始化');
  }

  /**
   * 渲染 PDF 頁面到 Canvas
   * @param {Object} page - PDF 頁面物件
   * @param {string} fileName - 檔案名稱
   * @param {number} pageNum - 頁碼
   */
  async renderPage(page, fileName, pageNum) {
    if (!this.fabricCanvas) {
      throw new Error('Canvas 未初始化');
    }
    
    this.currentPage = page;
    this.currentFileName = fileName;
    this.currentPageNum = pageNum;
    
    // 清除現有物件（保留註解）
    const annotations = this.fabricCanvas.getObjects().filter(obj => obj.isAnnotation);
    this.fabricCanvas.clear();
    
    // 獲取頁面尺寸
    const viewport = page.getViewport({ scale: 1.5, rotation: this.rotation });
    
    // 調整 canvas 大小
    this.fabricCanvas.setWidth(viewport.width);
    this.fabricCanvas.setHeight(viewport.height);
    
    // 建立臨時 canvas 渲染 PDF
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = viewport.width;
    tempCanvas.height = viewport.height;
    
    const context = tempCanvas.getContext('2d');
    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;
    
    // 將渲染結果轉為 fabric.Image
    const imgUrl = tempCanvas.toDataURL();
    const imgElement = await this.loadImage(imgUrl);
    
    const fabricImage = new fabric.Image(imgElement, {
      left: 0,
      top: 0,
      selectable: false,
      evented: false
    });
    
    this.fabricCanvas.setBackgroundImage(fabricImage, this.fabricCanvas.renderAll.bind(this.fabricCanvas));
    
    // 恢復註解
    annotations.forEach(obj => this.fabricCanvas.add(obj));
    
    this.fabricCanvas.renderAll();
    
    console.log(`✓ 已渲染頁面: ${fileName} - 第 ${pageNum} 頁`);
  }

  /**
   * 旋轉頁面
   * @param {number} degrees - 旋轉角度（90, -90, 180）
   */
  async rotatePage(degrees) {
    this.rotation = (this.rotation + degrees) % 360;
    
    if (this.currentPage) {
      await this.renderPage(this.currentPage, this.currentFileName, this.currentPageNum);
    }
  }

  /**
   * 啟用裁切模式
   */
  enableCropMode() {
    this.cropMode = true;
    
    // 建立裁切矩形
    this.cropRect = new fabric.Rect({
      left: 50,
      top: 50,
      width: this.fabricCanvas.width - 100,
      height: this.fabricCanvas.height - 100,
      fill: 'rgba(0,0,0,0.3)',
      stroke: '#667eea',
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      cornerColor: '#667eea',
      cornerSize: 10,
      transparentCorners: false,
      isCropRect: true
    });
    
    this.fabricCanvas.add(this.cropRect);
    this.fabricCanvas.setActiveObject(this.cropRect);
    this.fabricCanvas.renderAll();
  }

  /**
   * 應用裁切
   */
  applyCrop() {
    if (!this.cropRect) return;
    
    const cropData = {
      x: this.cropRect.left,
      y: this.cropRect.top,
      width: this.cropRect.width * this.cropRect.scaleX,
      height: this.cropRect.height * this.cropRect.scaleY
    };
    
    // 移除裁切矩形
    this.fabricCanvas.remove(this.cropRect);
    this.cropRect = null;
    this.cropMode = false;
    
    console.log('✓ 裁切已應用:', cropData);
    return cropData;
  }

  /**
   * 取消裁切
   */
  cancelCrop() {
    if (this.cropRect) {
      this.fabricCanvas.remove(this.cropRect);
      this.cropRect = null;
    }
    this.cropMode = false;
    this.fabricCanvas.renderAll();
  }

  /**
   * 添加文字註解
   * @param {string} text - 文字內容
   * @param {string} textColor - 文字顏色
   * @param {string} backgroundColor - 背景顏色
   */
  addText(text = '輸入文字', textColor = '#333', backgroundColor = null) {
    const textObj = new fabric.IText(text, {
      left: 100,
      top: 100,
      fontSize: 20,
      fill: textColor,
      backgroundColor: backgroundColor,
      fontFamily: 'Arial',
      isAnnotation: true
    });
    
    this.fabricCanvas.add(textObj);
    this.fabricCanvas.setActiveObject(textObj);
    this.fabricCanvas.renderAll();
  }

  /**
   * 添加矩形註解
   */
  addRectangle() {
    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      width: 150,
      height: 100,
      fill: 'rgba(102, 126, 234, 0.3)',
      stroke: '#667eea',
      strokeWidth: 2,
      isAnnotation: true
    });
    
    this.fabricCanvas.add(rect);
    this.fabricCanvas.setActiveObject(rect);
    this.fabricCanvas.renderAll();
  }

  /**
   * 添加圓形註解
   */
  addCircle() {
    const circle = new fabric.Circle({
      left: 100,
      top: 100,
      radius: 50,
      fill: 'rgba(102, 126, 234, 0.3)',
      stroke: '#667eea',
      strokeWidth: 2,
      isAnnotation: true
    });
    
    this.fabricCanvas.add(circle);
    this.fabricCanvas.setActiveObject(circle);
    this.fabricCanvas.renderAll();
  }

  /**
   * 刪除選取的物件
   */
  deleteSelected() {
    const activeObjects = this.fabricCanvas.getActiveObjects();
    
    if (activeObjects.length > 0) {
      activeObjects.forEach(obj => {
        if (obj.isAnnotation || obj.isCropRect) {
          this.fabricCanvas.remove(obj);
        }
      });
      
      this.fabricCanvas.discardActiveObject();
      this.fabricCanvas.renderAll();
    }
  }

  /**
   * 清除所有註解
   */
  clearAnnotations() {
    const annotations = this.fabricCanvas.getObjects().filter(obj => obj.isAnnotation);
    annotations.forEach(obj => this.fabricCanvas.remove(obj));
    this.fabricCanvas.renderAll();
  }

  /**
   * 獲取 Canvas 的 DataURL
   * @param {number} quality - JPEG 品質 (0-1)
   * @returns {string} Base64 圖片
   */
  toDataURL(quality = 0.85) {
    return this.fabricCanvas.toDataURL({
      format: 'jpeg',
      quality: quality,
      multiplier: 1
    });
  }

  /**
   * 獲取 Canvas 的 Blob
   * @param {number} quality - JPEG 品質 (0-1)
   * @returns {Promise<Blob>}
   */
  toBlob(quality = 0.85) {
    return new Promise((resolve) => {
      this.fabricCanvas.getElement().toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', quality);
    });
  }

  /**
   * 載入圖片
   * @param {string} url - 圖片 URL
   * @returns {Promise<HTMLImageElement>}
   */
  loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  /**
   * 重設 Canvas
   */
  reset() {
    if (this.fabricCanvas) {
      this.fabricCanvas.clear();
      this.currentPage = null;
      this.currentFileName = null;
      this.currentPageNum = 1;
      this.rotation = 0;
      this.cropMode = false;
      this.cropRect = null;
    }
  }

  /**
   * 釋放資源
   */
  dispose() {
    if (this.fabricCanvas) {
      this.fabricCanvas.dispose();
      this.fabricCanvas = null;
    }
    this.canvas = null;
    this.currentPage = null;
    
    console.log('✓ Canvas 資源已釋放');
  }

  /**
   * 獲取當前頁面資訊
   * @returns {Object}
   */
  getCurrentPageInfo() {
    return {
      fileName: this.currentFileName,
      pageNum: this.currentPageNum,
      rotation: this.rotation,
      width: this.fabricCanvas ? this.fabricCanvas.width : 0,
      height: this.fabricCanvas ? this.fabricCanvas.height : 0
    };
  }

  /**
   * 設定 Canvas 尺寸
   * @param {number} width - 寬度
   * @param {number} height - 高度
   */
  setSize(width, height) {
    if (this.fabricCanvas) {
      this.fabricCanvas.setWidth(width);
      this.fabricCanvas.setHeight(height);
      this.fabricCanvas.renderAll();
    }
  }

  /**
   * 匯出為圖片（含註解）
   * @param {number} quality - 品質
   * @returns {Promise<Blob>}
   */
  async exportAsImage(quality = 0.85) {
    // 確保所有物件都已渲染
    this.fabricCanvas.renderAll();
    
    // 使用 html2canvas 捕捉完整畫布（包含註解）
    const canvasElement = this.fabricCanvas.getElement();
    const canvas = await html2canvas(canvasElement, {
      backgroundColor: '#ffffff',
      scale: 1,
      logging: false
    });
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', quality);
    });
  }
}

export default CanvasManager;
