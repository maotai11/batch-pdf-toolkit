/**
 * Main Application
 * 整合所有模組的主程式
 */

import PDFLoader from './pdfLoader.js';
import CanvasManager from './canvasManager.js';
import BatchProcessor from './batchProcessor.js';
import PDFExporter from './pdfExporter.js';
import UIController from './uiController.js';

class App {
  constructor() {
    this.pdfLoader = null;
    this.canvasManager = null;
    this.batchProcessor = null;
    this.pdfExporter = null;
    this.uiController = null;
    
    this.currentFile = null;
    this.currentPageNum = 1;
    this.loadedFiles = [];
  }

  /**
   * 初始化應用程式
   */
  async init() {
    console.log('🚀 啟動 Batch PDF Toolkit...');
    
    // 初始化各模組
    this.pdfLoader = new PDFLoader();
    this.canvasManager = new CanvasManager(document.getElementById('main-canvas'));
    this.batchProcessor = new BatchProcessor();
    this.pdfExporter = new PDFExporter();
    this.uiController = new UIController();
    
    // 初始化 UI
    this.uiController.init();
    
    // 綁定事件
    this.bindEvents();
    
    console.log('✅ 應用程式已就緒');
  }

  /**
   * 綁定事件
   */
  bindEvents() {
    // 檔案上傳事件
    this.uiController.on('files-selected', (files) => this.handleFilesUpload(files));
    this.uiController.on('files-dropped', (files) => this.handleFilesUpload(files));
    
    // 檔案選擇事件
    this.uiController.on('file-selected', ({ fileInfo }) => this.handleFileSelected(fileInfo));
    
    // 縮圖點擊事件
    this.uiController.on('thumbnail-clicked', (thumb) => this.handleThumbnailClicked(thumb));
    
    // 工具按鈕事件
    this.uiController.on('rotate-left', () => this.handleRotate(-90));
    this.uiController.on('rotate-right', () => this.handleRotate(90));
    this.uiController.on('crop', () => this.handleCrop());
    this.uiController.on('add-text', () => this.canvasManager.addText());
    this.uiController.on('add-rect', () => this.canvasManager.addRectangle());
    this.uiController.on('add-circle', () => this.canvasManager.addCircle());
    this.uiController.on('delete-selected', () => this.canvasManager.deleteSelected());
    
    // 頂部按鈕事件
    this.uiController.on('clear-all', () => this.handleClearAll());
    this.uiController.on('export-pdf', () => this.handleExport());
    
    // 批量操作事件
    this.uiController.on('batch-rotate', () => this.handleBatchRotate());
    this.uiController.on('batch-merge', () => this.handleBatchMerge());
    this.uiController.on('batch-split', () => this.handleBatchSplit());
    this.uiController.on('batch-extract', () => this.handleBatchExtract());
  }

  /**
   * 處理檔案上傳
   * @param {FileList} files - 檔案清單
   */
  async handleFilesUpload(files) {
    if (files.length === 0) return;
    
    this.uiController.updateProgress(0, '載入 PDF 檔案...');
    
    try {
      const results = await this.pdfLoader.loadMultipleFiles(files, (progress) => {
        this.uiController.updateProgress(
          progress.percentage,
          `載入中... ${progress.current}/${progress.total}`
        );
      });
      
      this.loadedFiles = this.pdfLoader.getLoadedFiles();
      this.uiController.updateFileList(this.loadedFiles);
      
      // 自動選擇第一個檔案
      if (this.loadedFiles.length > 0) {
        await this.handleFileSelected(this.loadedFiles[0]);
      }
      
      this.uiController.hideProgress();
      this.uiController.showNotification(`成功載入 ${results.length} 個 PDF 檔案`, 'success');
    } catch (error) {
      this.uiController.hideProgress();
      this.uiController.showNotification(`載入失敗: ${error.message}`, 'error');
    }
  }

  /**
   * 處理檔案選擇
   * @param {Object} fileInfo - 檔案資訊
   */
  async handleFileSelected(fileInfo) {
    this.currentFile = fileInfo.fileName;
    this.currentPageNum = 1;
    
    try {
      // 載入第一頁
      await this.loadPage(this.currentFile, 1);
      
      // 生成縮圖
      this.uiController.updateProgress(0, '生成縮圖...');
      const thumbnails = await this.pdfLoader.getAllThumbnails(this.currentFile, (progress) => {
        this.uiController.updateProgress(progress.percentage, `生成縮圖... ${progress.current}/${progress.total}`);
      });
      
      this.uiController.updateThumbnails(thumbnails);
      this.uiController.selectThumbnail(1);
      
      // 更新頁面資訊
      this.updatePageInfo();
      
      this.uiController.hideProgress();
    } catch (error) {
      this.uiController.hideProgress();
      this.uiController.showNotification(`載入頁面失敗: ${error.message}`, 'error');
    }
  }

  /**
   * 載入指定頁面
   * @param {string} fileName - 檔案名稱
   * @param {number} pageNum - 頁碼
   */
  async loadPage(fileName, pageNum) {
    const page = await this.pdfLoader.getPage(fileName, pageNum);
    await this.canvasManager.renderPage(page, fileName, pageNum);
    this.currentPageNum = pageNum;
    this.updatePageInfo();
  }

  /**
   * 處理縮圖點擊
   * @param {Object} thumb - 縮圖資訊
   */
  async handleThumbnailClicked(thumb) {
    try {
      await this.loadPage(this.currentFile, thumb.pageNum);
      this.uiController.selectThumbnail(thumb.pageNum);
    } catch (error) {
      this.uiController.showNotification(`載入頁面失敗: ${error.message}`, 'error');
    }
  }

  /**
   * 處理旋轉
   * @param {number} degrees - 旋轉角度
   */
  async handleRotate(degrees) {
    if (!this.canvasManager.currentPage) {
      this.uiController.showNotification('請先載入 PDF 檔案', 'error');
      return;
    }
    
    try {
      await this.canvasManager.rotatePage(degrees);
    } catch (error) {
      this.uiController.showNotification(`旋轉失敗: ${error.message}`, 'error');
    }
  }

  /**
   * 處理裁切
   */
  handleCrop() {
    if (!this.canvasManager.currentPage) {
      this.uiController.showNotification('請先載入 PDF 檔案', 'error');
      return;
    }
    
    if (this.canvasManager.cropMode) {
      // 應用裁切
      const cropData = this.canvasManager.applyCrop();
      this.uiController.showNotification('裁切已應用', 'success');
    } else {
      // 啟用裁切模式
      this.canvasManager.enableCropMode();
      this.uiController.showNotification('拖曳調整裁切區域，再次點擊裁切按鈕以應用', 'info');
    }
  }

  /**
   * 處理清空全部
   */
  handleClearAll() {
    if (confirm('確定要清空所有已載入的檔案嗎？')) {
      this.pdfLoader.clearAll();
      this.canvasManager.reset();
      this.loadedFiles = [];
      this.currentFile = null;
      this.currentPageNum = 1;
      
      this.uiController.clearFileList();
      this.uiController.clearThumbnails();
      this.updatePageInfo();
      
      this.uiController.showNotification('已清空所有檔案', 'success');
    }
  }

  /**
   * 處理匯出
   */
  async handleExport() {
    if (!this.canvasManager.currentPage) {
      this.uiController.showNotification('請先載入 PDF 檔案', 'error');
      return;
    }
    
    try {
      this.uiController.updateProgress(0, '準備匯出...');
      
      const quality = this.uiController.getCurrentQuality();
      const namingRule = this.uiController.getNamingRule();
      
      // 匯出當前頁面
      const result = await this.pdfExporter.exportSinglePage({
        canvas: this.canvasManager,
        fileName: this.currentFile,
        pageNum: this.currentPageNum
      }, {
        quality: quality,
        namingRule: namingRule
      });
      
      // 下載檔案
      this.pdfExporter.downloadFile(result.blob, result.fileName + '.pdf');
      
      this.uiController.hideProgress();
      this.uiController.showNotification('匯出成功！', 'success');
    } catch (error) {
      this.uiController.hideProgress();
      this.uiController.showNotification(`匯出失敗: ${error.message}`, 'error');
    }
  }

  /**
   * 處理批量旋轉
   */
  async handleBatchRotate() {
    const degrees = prompt('輸入旋轉角度（90, -90, 180）：', '90');
    if (!degrees) return;
    
    const rotation = parseInt(degrees);
    if (![90, -90, 180].includes(rotation)) {
      this.uiController.showNotification('無效的旋轉角度', 'error');
      return;
    }
    
    this.uiController.showNotification(`批量旋轉功能開發中...`, 'info');
  }

  /**
   * 處理批量合併
   */
  async handleBatchMerge() {
    if (this.loadedFiles.length < 2) {
      this.uiController.showNotification('至少需要 2 個 PDF 檔案才能合併', 'error');
      return;
    }
    
    try {
      this.uiController.updateProgress(0, '合併 PDF...');
      
      const fileNames = this.loadedFiles.map(f => f.fileName);
      const mergeResult = await this.batchProcessor.batchMerge(fileNames, this.pdfLoader, (progress) => {
        this.uiController.updateProgress(progress.percentage, `收集頁面... ${progress.current}/${progress.total}`);
      });
      
      this.uiController.showNotification(`已準備合併 ${mergeResult.totalPages} 頁，請在畫布中查看`, 'success');
      this.uiController.hideProgress();
    } catch (error) {
      this.uiController.hideProgress();
      this.uiController.showNotification(`合併失敗: ${error.message}`, 'error');
    }
  }

  /**
   * 處理批量拆分
   */
  async handleBatchSplit() {
    if (this.loadedFiles.length === 0) {
      this.uiController.showNotification('請先載入 PDF 檔案', 'error');
      return;
    }
    
    this.uiController.showNotification('批量拆分功能開發中...', 'info');
  }

  /**
   * 處理批量擷取
   */
  async handleBatchExtract() {
    if (!this.currentFile) {
      this.uiController.showNotification('請先選擇一個 PDF 檔案', 'error');
      return;
    }
    
    const pages = prompt('輸入要擷取的頁碼（用逗號分隔，例如：1,3,5）：');
    if (!pages) return;
    
    try {
      const pageNumbers = pages.split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p));
      
      const extractedPages = await this.batchProcessor.extractPages(this.currentFile, pageNumbers, this.pdfLoader);
      
      this.uiController.showNotification(`已擷取 ${extractedPages.length} 頁`, 'success');
    } catch (error) {
      this.uiController.showNotification(`擷取失敗: ${error.message}`, 'error');
    }
  }

  /**
   * 更新頁面資訊
   */
  updatePageInfo() {
    const fileInfo = this.currentFile ? this.pdfLoader.getFileInfo(this.currentFile) : null;
    
    this.uiController.updatePageInfo({
      current: this.currentFile ? `${this.currentFile} - 第 ${this.currentPageNum} 頁` : '未載入',
      total: fileInfo ? fileInfo.pageCount : 0,
      size: fileInfo ? PDFLoader.formatFileSize(fileInfo.size) : '-'
    });
  }
}

// 啟動應用程式
window.addEventListener('DOMContentLoaded', async () => {
  const app = new App();
  await app.init();
  
  // 暴露到全域以便除錯
  window.app = app;
});
