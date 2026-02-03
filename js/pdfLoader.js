/**
 * PDF Loader Module
 * 負責 PDF 檔案的載入與解析
 */

class PDFLoader {
  constructor() {
    this.loadedFiles = [];
    this.pdfDocuments = new Map(); // fileName -> pdfDoc
    
    // 設定 pdf.js worker
    if (typeof pdfjsLib !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
  }

  /**
   * 載入單一 PDF 檔案
   * @param {File} file - 檔案物件
   * @returns {Promise<Object>} PDF 文件資訊
   */
  async loadFile(file) {
    try {
      // 讀取檔案為 ArrayBuffer
      const arrayBuffer = await this.fileToArrayBuffer(file);
      
      // 使用 pdf.js 載入 PDF
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdfDoc = await loadingTask.promise;
      
      // 儲存文件
      this.pdfDocuments.set(file.name, pdfDoc);
      
      const fileInfo = {
        fileName: file.name,
        size: file.size,
        pageCount: pdfDoc.numPages,
        pdfDoc: pdfDoc,
        file: file
      };
      
      this.loadedFiles.push(fileInfo);
      
      console.log(`✓ 已載入 PDF: ${file.name} (${pdfDoc.numPages} 頁)`);
      
      return fileInfo;
    } catch (error) {
      console.error(`✗ 載入 PDF 失敗: ${file.name}`, error);
      throw new Error(`無法載入 ${file.name}: ${error.message}`);
    }
  }

  /**
   * 批量載入 PDF 檔案
   * @param {FileList|Array} files - 檔案清單
   * @param {Function} onProgress - 進度回調
   * @returns {Promise<Array>} PDF 文件資訊陣列
   */
  async loadMultipleFiles(files, onProgress = null) {
    const filesArray = Array.from(files);
    const results = [];
    
    for (let i = 0; i < filesArray.length; i++) {
      try {
        const fileInfo = await this.loadFile(filesArray[i]);
        results.push(fileInfo);
        
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: filesArray.length,
            percentage: Math.round(((i + 1) / filesArray.length) * 100),
            fileName: filesArray[i].name
          });
        }
      } catch (error) {
        console.error(`批量載入錯誤:`, error);
        results.push({
          fileName: filesArray[i].name,
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * 獲取 PDF 的特定頁面
   * @param {string} fileName - 檔案名稱
   * @param {number} pageNum - 頁碼（從 1 開始）
   * @returns {Promise<Object>} PDF 頁面物件
   */
  async getPage(fileName, pageNum) {
    const pdfDoc = this.pdfDocuments.get(fileName);
    if (!pdfDoc) {
      throw new Error(`找不到 PDF 文件: ${fileName}`);
    }
    
    if (pageNum < 1 || pageNum > pdfDoc.numPages) {
      throw new Error(`頁碼超出範圍: ${pageNum} (總頁數: ${pdfDoc.numPages})`);
    }
    
    return await pdfDoc.getPage(pageNum);
  }

  /**
   * 渲染 PDF 頁面到 Canvas
   * @param {Object} page - PDF 頁面物件
   * @param {HTMLCanvasElement} canvas - Canvas 元素
   * @param {number} scale - 縮放比例
   * @returns {Promise<void>}
   */
  async renderPageToCanvas(page, canvas, scale = 1.5) {
    const viewport = page.getViewport({ scale });
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    const context = canvas.getContext('2d');
    
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };
    
    await page.render(renderContext).promise;
  }

  /**
   * 獲取頁面縮圖
   * @param {string} fileName - 檔案名稱
   * @param {number} pageNum - 頁碼
   * @param {number} maxWidth - 最大寬度
   * @returns {Promise<string>} Base64 圖片
   */
  async getThumbnail(fileName, pageNum, maxWidth = 120) {
    const page = await this.getPage(fileName, pageNum);
    const viewport = page.getViewport({ scale: 1 });
    
    // 計算縮圖比例
    const scale = maxWidth / viewport.width;
    const thumbnailViewport = page.getViewport({ scale });
    
    // 建立臨時 canvas
    const canvas = document.createElement('canvas');
    canvas.width = thumbnailViewport.width;
    canvas.height = thumbnailViewport.height;
    
    const context = canvas.getContext('2d');
    await page.render({
      canvasContext: context,
      viewport: thumbnailViewport
    }).promise;
    
    return canvas.toDataURL('image/jpeg', 0.7);
  }

  /**
   * 獲取所有頁面的縮圖
   * @param {string} fileName - 檔案名稱
   * @param {Function} onProgress - 進度回調
   * @returns {Promise<Array>} 縮圖陣列
   */
  async getAllThumbnails(fileName, onProgress = null) {
    const pdfDoc = this.pdfDocuments.get(fileName);
    if (!pdfDoc) {
      throw new Error(`找不到 PDF 文件: ${fileName}`);
    }
    
    const thumbnails = [];
    
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const thumbnail = await this.getThumbnail(fileName, i);
      thumbnails.push({
        pageNum: i,
        dataUrl: thumbnail
      });
      
      if (onProgress) {
        onProgress({
          current: i,
          total: pdfDoc.numPages,
          percentage: Math.round((i / pdfDoc.numPages) * 100)
        });
      }
    }
    
    return thumbnails;
  }

  /**
   * 獲取 PDF 文件物件
   * @param {string} fileName - 檔案名稱
   * @returns {Object|null} PDF 文件物件
   */
  getPdfDocument(fileName) {
    return this.pdfDocuments.get(fileName);
  }

  /**
   * 移除已載入的 PDF
   * @param {string} fileName - 檔案名稱
   */
  removeFile(fileName) {
    const pdfDoc = this.pdfDocuments.get(fileName);
    if (pdfDoc) {
      pdfDoc.destroy();
      this.pdfDocuments.delete(fileName);
    }
    
    this.loadedFiles = this.loadedFiles.filter(f => f.fileName !== fileName);
  }

  /**
   * 清空所有已載入的 PDF
   */
  clearAll() {
    // 釋放所有 PDF 文件
    for (const [fileName, pdfDoc] of this.pdfDocuments) {
      pdfDoc.destroy();
    }
    
    this.pdfDocuments.clear();
    this.loadedFiles = [];
    
    console.log('已清空所有 PDF 文件');
  }

  /**
   * 將 File 轉換為 ArrayBuffer
   * @param {File} file - 檔案物件
   * @returns {Promise<ArrayBuffer>}
   */
  fileToArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('檔案讀取失敗'));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * 格式化檔案大小
   * @param {number} bytes - 位元組數
   * @returns {string} 格式化後的大小
   */
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
  }

  /**
   * 獲取已載入的檔案列表
   * @returns {Array} 檔案資訊陣列
   */
  getLoadedFiles() {
    return this.loadedFiles;
  }

  /**
   * 獲取檔案資訊
   * @param {string} fileName - 檔案名稱
   * @returns {Object|null} 檔案資訊
   */
  getFileInfo(fileName) {
    return this.loadedFiles.find(f => f.fileName === fileName);
  }
}

export default PDFLoader;
