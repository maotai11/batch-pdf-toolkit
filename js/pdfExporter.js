/**
 * PDF Exporter Module
 * 負責 PDF 匯出與壓縮
 */

class PDFExporter {
  constructor() {
    this.defaultQuality = 0.85;
    this.PDFLib = window.PDFLib || null;
  }

  /**
   * 匯出為 PDF
   * @param {Array} pages - 頁面陣列 [{canvas, fileName, pageNum}]
   * @param {Object} options - 匯出選項
   * @returns {Promise<Blob>}
   */
  async exportToPDF(pages, options = {}) {
    const quality = options.quality || this.defaultQuality;
    const namingRule = options.namingRule || '{原始檔名}-{頁碼}';
    
    if (pages.length === 0) {
      throw new Error('沒有頁面可匯出');
    }
    
    // 使用 pdf-lib 建立新 PDF
    const { PDFDocument } = this.PDFLib;
    const pdfDoc = await PDFDocument.create();
    
    for (let i = 0; i < pages.length; i++) {
      const pageData = pages[i];
      
      // 將 Canvas 轉為圖片
      const imageData = await this.canvasToImage(pageData.canvas, quality);
      
      // 嵌入圖片到 PDF
      const image = await pdfDoc.embedJpg(imageData);
      const page = pdfDoc.addPage([image.width, image.height]);
      
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: image.width,
        height: image.height
      });
    }
    
    // 儲存 PDF
    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  }

  /**
   * 將 Canvas 轉為圖片資料
   * @param {HTMLCanvasElement|Object} canvas - Canvas 元素或 CanvasManager
   * @param {number} quality - JPEG 品質 (0-1)
   * @returns {Promise<ArrayBuffer>}
   */
  async canvasToImage(canvas, quality = 0.85) {
    let canvasElement;
    
    // 如果是 CanvasManager 物件
    if (canvas.fabricCanvas) {
      canvasElement = canvas.fabricCanvas.getElement();
    } else {
      canvasElement = canvas;
    }
    
    // 轉為 Blob
    const blob = await new Promise((resolve) => {
      canvasElement.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', quality);
    });
    
    // 轉為 ArrayBuffer
    return await blob.arrayBuffer();
  }

  /**
   * 匯出單一頁面
   * @param {Object} pageData - 頁面資料
   * @param {Object} options - 選項
   * @returns {Promise<Blob>}
   */
  async exportSinglePage(pageData, options = {}) {
    const quality = options.quality || this.defaultQuality;
    const fileName = this.parseNamingRule(options.namingRule || '{原始檔名}-{頁碼}', {
      originalName: pageData.fileName,
      pageNum: pageData.pageNum,
      serialNum: 1,
      customText: options.customText || ''
    });
    
    const { PDFDocument } = this.PDFLib;
    const pdfDoc = await PDFDocument.create();
    
    const imageData = await this.canvasToImage(pageData.canvas, quality);
    const image = await pdfDoc.embedJpg(imageData);
    const page = pdfDoc.addPage([image.width, image.height]);
    
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height
    });
    
    const pdfBytes = await pdfDoc.save();
    return {
      blob: new Blob([pdfBytes], { type: 'application/pdf' }),
      fileName: fileName
    };
  }

  /**
   * 批量匯出（拆分為多個檔案）
   * @param {Array} pages - 頁面陣列
   * @param {Object} options - 選項
   * @param {Function} onProgress - 進度回調
   * @returns {Promise<Array>}
   */
  async exportMultiple(pages, options = {}, onProgress = null) {
    const results = [];
    
    for (let i = 0; i < pages.length; i++) {
      const pageData = pages[i];
      
      const result = await this.exportSinglePage(pageData, {
        ...options,
        namingRule: options.namingRule || '{原始檔名}-p{頁碼}'
      });
      
      // 解析檔名
      const fileName = this.parseNamingRule(
        options.namingRule || '{原始檔名}-p{頁碼}',
        {
          originalName: pageData.fileName.replace('.pdf', ''),
          pageNum: pageData.pageNum,
          serialNum: i + 1,
          customText: options.customText || ''
        }
      );
      
      results.push({
        blob: result.blob,
        fileName: fileName + '.pdf'
      });
      
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: pages.length,
          percentage: Math.round(((i + 1) / pages.length) * 100)
        });
      }
    }
    
    return results;
  }

  /**
   * 解析命名規則
   * @param {string} rule - 命名規則
   * @param {Object} context - 上下文資訊
   * @returns {string} 解析後的檔名
   */
  parseNamingRule(rule, context) {
    const now = new Date();
    
    const variables = {
      '{原始檔名}': context.originalName || '',
      '{頁碼}': String(context.pageNum || ''),
      '{流水號}': String(context.serialNum || 0).padStart(4, '0'),
      '{日期}': now.toISOString().split('T')[0],
      '{時間}': now.toTimeString().split(' ')[0].replace(/:/g, '-'),
      '{自訂文字}': context.customText || ''
    };

    let result = rule;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
    }

    // 清理不合法的檔名字元
    result = result.replace(/[<>:"/\\|?*]/g, '-');
    
    return result;
  }

  /**
   * 預覽命名規則
   * @param {string} rule - 命名規則
   * @param {number} count - 預覽數量
   * @returns {Array<string>} 預覽結果
   */
  previewNamingRule(rule, count = 3) {
    const previews = [];
    const sampleName = '報告';
    
    for (let i = 1; i <= count; i++) {
      const fileName = this.parseNamingRule(rule, {
        originalName: sampleName,
        pageNum: i,
        serialNum: i,
        customText: '範例'
      });
      previews.push(`${fileName}.pdf`);
    }
    
    return previews;
  }

  /**
   * 估算檔案大小
   * @param {number} pageCount - 頁面數量
   * @param {number} quality - 品質 (0-1)
   * @returns {string} 估算大小
   */
  estimateFileSize(pageCount, quality = 0.85) {
    // 假設每頁平均大小（根據品質調整）
    const avgPageSize = 200 * 1024 * quality; // 200KB base
    const totalBytes = pageCount * avgPageSize;
    
    return this.formatFileSize(totalBytes);
  }

  /**
   * 格式化檔案大小
   * @param {number} bytes - 位元組數
   * @returns {string}
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
  }

  /**
   * 下載檔案
   * @param {Blob} blob - 檔案 Blob
   * @param {string} fileName - 檔案名稱
   */
  downloadFile(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * 批量下載（使用 ZIP）
   * @param {Array} files - 檔案陣列 [{blob, fileName}]
   * @param {string} zipName - ZIP 檔名
   */
  async downloadAsZip(files, zipName = 'output.zip') {
    // 注意：需要額外引入 JSZip 庫
    // 這裡提供介面，實際使用時需要載入 JSZip
    console.warn('批量下載需要 JSZip 庫支援');
    
    // 暫時改為逐一下載
    for (const file of files) {
      this.downloadFile(file.blob, file.fileName);
      await this.delay(300); // 避免瀏覽器阻擋
    }
  }

  /**
   * 壓縮 PDF（使用 pdf-lib 優化）
   * @param {Blob} pdfBlob - PDF Blob
   * @returns {Promise<Blob>}
   */
  async compressPDF(pdfBlob) {
    const { PDFDocument } = this.PDFLib;
    
    // 讀取原始 PDF
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    
    // 重新儲存（pdf-lib 會進行基本優化）
    const compressedBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false
    });
    
    return new Blob([compressedBytes], { type: 'application/pdf' });
  }

  /**
   * 延遲執行
   * @param {number} ms - 毫秒數
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 驗證命名規則
   * @param {string} rule - 命名規則
   * @returns {Object} 驗證結果
   */
  validateNamingRule(rule) {
    if (!rule || rule.trim() === '') {
      return { valid: false, error: '命名規則不能為空' };
    }
    
    // 檢查是否包含變數
    const hasVariable = /{原始檔名}|{頁碼}|{流水號}|{日期}|{時間}|{自訂文字}/.test(rule);
    
    if (!hasVariable) {
      return { 
        valid: false, 
        error: '建議至少包含一個變數以區分不同檔案' 
      };
    }
    
    return { valid: true };
  }
}

export default PDFExporter;
