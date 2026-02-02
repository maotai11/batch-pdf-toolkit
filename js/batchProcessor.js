/**
 * Batch Processor Module
 * 負責批量處理邏輯
 */

class BatchProcessor {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.currentProgress = 0;
    this.totalTasks = 0;
  }

  /**
   * 分塊處理任務佇列
   * @param {Array} tasks - 任務陣列
   * @param {number} chunkSize - 每批處理數量
   * @param {Function} onProgress - 進度回調
   * @returns {Promise<Array>} 處理結果
   */
  async processQueue(tasks, chunkSize = 10, onProgress = null) {
    this.processing = true;
    this.totalTasks = tasks.length;
    this.currentProgress = 0;
    
    const results = [];
    
    // 分塊處理，避免記憶體溢出
    for (let i = 0; i < tasks.length; i += chunkSize) {
      const chunk = tasks.slice(i, i + chunkSize);
      
      // 並行處理當前塊
      const chunkResults = await Promise.all(
        chunk.map(async (task, index) => {
          try {
            const result = await task.execute();
            this.currentProgress++;
            
            if (onProgress) {
              onProgress({
                current: this.currentProgress,
                total: this.totalTasks,
                percentage: Math.round((this.currentProgress / this.totalTasks) * 100),
                taskIndex: i + index
              });
            }
            
            return { success: true, result, index: i + index };
          } catch (error) {
            console.error(`任務 ${i + index} 失敗:`, error);
            return { success: false, error: error.message, index: i + index };
          }
        })
      );
      
      results.push(...chunkResults);
      
      // 給瀏覽器喘息時間
      await this.delay(50);
    }
    
    this.processing = false;
    return results;
  }

  /**
   * 批量旋轉頁面
   * @param {Array} pages - 頁面陣列 [{fileName, pageNum, pdfLoader}]
   * @param {number} degrees - 旋轉角度
   * @param {Function} onProgress - 進度回調
   * @returns {Promise<Array>}
   */
  async batchRotate(pages, degrees, onProgress = null) {
    const tasks = pages.map(page => ({
      execute: async () => {
        // 這裡只記錄旋轉資訊，實際旋轉在匯出時處理
        return {
          fileName: page.fileName,
          pageNum: page.pageNum,
          rotation: degrees
        };
      }
    }));
    
    return await this.processQueue(tasks, 20, onProgress);
  }

  /**
   * 批量合併 PDF
   * @param {Array} files - 檔案陣列
   * @param {Object} pdfLoader - PDF 載入器
   * @param {Function} onProgress - 進度回調
   * @returns {Promise<Object>}
   */
  async batchMerge(files, pdfLoader, onProgress = null) {
    const allPages = [];
    
    for (let i = 0; i < files.length; i++) {
      const fileInfo = pdfLoader.getFileInfo(files[i]);
      if (!fileInfo) continue;
      
      for (let pageNum = 1; pageNum <= fileInfo.pageCount; pageNum++) {
        allPages.push({
          fileName: files[i],
          pageNum: pageNum,
          originalFileName: files[i],
          originalPageNum: pageNum
        });
      }
      
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: files.length,
          percentage: Math.round(((i + 1) / files.length) * 100),
          stage: 'collecting'
        });
      }
    }
    
    return {
      pages: allPages,
      totalPages: allPages.length
    };
  }

  /**
   * 批量拆分為單頁
   * @param {Array} files - 檔案陣列
   * @param {Object} pdfLoader - PDF 載入器
   * @param {Function} onProgress - 進度回調
   * @returns {Promise<Array>}
   */
  async batchSplit(files, pdfLoader, onProgress = null) {
    const splitPages = [];
    
    for (let i = 0; i < files.length; i++) {
      const fileInfo = pdfLoader.getFileInfo(files[i]);
      if (!fileInfo) continue;
      
      for (let pageNum = 1; pageNum <= fileInfo.pageCount; pageNum++) {
        splitPages.push({
          fileName: files[i],
          pageNum: pageNum,
          exportAsIndividual: true
        });
      }
      
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: files.length,
          percentage: Math.round(((i + 1) / files.length) * 100)
        });
      }
    }
    
    return splitPages;
  }

  /**
   * 擷取特定頁面
   * @param {string} fileName - 檔案名稱
   * @param {Array} pageNumbers - 頁碼陣列
   * @param {Object} pdfLoader - PDF 載入器
   * @returns {Promise<Array>}
   */
  async extractPages(fileName, pageNumbers, pdfLoader) {
    const fileInfo = pdfLoader.getFileInfo(fileName);
    if (!fileInfo) {
      throw new Error(`找不到檔案: ${fileName}`);
    }
    
    const extractedPages = [];
    
    for (const pageNum of pageNumbers) {
      if (pageNum >= 1 && pageNum <= fileInfo.pageCount) {
        extractedPages.push({
          fileName: fileName,
          pageNum: pageNum,
          originalPageNum: pageNum
        });
      }
    }
    
    return extractedPages;
  }

  /**
   * 重新排序頁面
   * @param {Array} pages - 頁面陣列
   * @param {Array} newOrder - 新順序陣列（索引）
   * @returns {Array}
   */
  reorderPages(pages, newOrder) {
    return newOrder.map(index => pages[index]);
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
   * 取消當前處理
   */
  cancel() {
    this.processing = false;
    this.queue = [];
    console.log('批量處理已取消');
  }

  /**
   * 獲取處理進度
   * @returns {Object}
   */
  getProgress() {
    return {
      current: this.currentProgress,
      total: this.totalTasks,
      percentage: this.totalTasks > 0 
        ? Math.round((this.currentProgress / this.totalTasks) * 100) 
        : 0,
      processing: this.processing
    };
  }

  /**
   * 估算處理時間
   * @param {number} taskCount - 任務數量
   * @param {number} avgTimePerTask - 每個任務平均時間（毫秒）
   * @returns {string}
   */
  estimateTime(taskCount, avgTimePerTask = 500) {
    const totalMs = taskCount * avgTimePerTask;
    const seconds = Math.ceil(totalMs / 1000);
    
    if (seconds < 60) {
      return `約 ${seconds} 秒`;
    } else {
      const minutes = Math.ceil(seconds / 60);
      return `約 ${minutes} 分鐘`;
    }
  }

  /**
   * 批量裁切頁面
   * @param {Array} pages - 頁面陣列
   * @param {Object} cropData - 裁切資料 {x, y, width, height}
   * @param {Function} onProgress - 進度回調
   * @returns {Promise<Array>}
   */
  async batchCrop(pages, cropData, onProgress = null) {
    const tasks = pages.map(page => ({
      execute: async () => {
        return {
          fileName: page.fileName,
          pageNum: page.pageNum,
          crop: cropData
        };
      }
    }));
    
    return await this.processQueue(tasks, 15, onProgress);
  }

  /**
   * 記憶體優化：清理中間結果
   */
  cleanup() {
    this.queue = [];
    this.currentProgress = 0;
    this.totalTasks = 0;
    
    // 強制垃圾回收（如果可用）
    if (global.gc) {
      global.gc();
    }
  }
}

export default BatchProcessor;
