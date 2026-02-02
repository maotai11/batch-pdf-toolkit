/**
 * UI Controller Module
 * 負責 UI 互動控制
 */

class UIController {
  constructor() {
    this.elements = {};
    this.progressBar = null;
    this.currentQuality = 0.85;
  }

  /**
   * 初始化 UI
   */
  init() {
    // 快取 DOM 元素
    this.elements = {
      // 檔案上傳
      uploadArea: document.getElementById('upload-area'),
      fileInput: document.getElementById('file-input'),
      fileItems: document.getElementById('file-items'),
      
      // 工具列按鈕
      btnRotateLeft: document.getElementById('btn-rotate-left'),
      btnRotateRight: document.getElementById('btn-rotate-right'),
      btnCrop: document.getElementById('btn-crop'),
      btnText: document.getElementById('btn-text'),
      btnRect: document.getElementById('btn-rect'),
      btnCircle: document.getElementById('btn-circle'),
      btnDelete: document.getElementById('btn-delete'),
      
      // 頂部按鈕
      btnClearAll: document.getElementById('btn-clear-all'),
      btnExport: document.getElementById('btn-export'),
      
      // 縮圖容器
      pageThumbnails: document.getElementById('page-thumbnails'),
      
      // 屬性面板
      qualitySlider: document.getElementById('quality-slider'),
      qualityValue: document.getElementById('quality-value'),
      qualityHint: document.getElementById('quality-hint'),
      namingRule: document.getElementById('naming-rule'),
      namingPreview: document.getElementById('naming-preview'),
      
      // 批量操作
      btnBatchRotate: document.getElementById('btn-batch-rotate'),
      btnBatchMerge: document.getElementById('btn-batch-merge'),
      btnBatchSplit: document.getElementById('btn-batch-split'),
      btnBatchExtract: document.getElementById('btn-batch-extract'),
      
      // 頁面資訊
      currentPageInfo: document.getElementById('current-page-info'),
      totalPagesInfo: document.getElementById('total-pages-info'),
      fileSizeInfo: document.getElementById('file-size-info'),
      
      // 進度條
      progressContainer: document.getElementById('progress-container'),
      progressText: document.getElementById('progress-text'),
      progressFill: document.getElementById('progress-fill')
    };
    
    this.bindEvents();
    this.updateNamingPreview();
    
    console.log('✓ UI 控制器已初始化');
  }

  /**
   * 綁定事件
   */
  bindEvents() {
    // 檔案上傳
    this.elements.uploadArea.addEventListener('click', () => {
      this.elements.fileInput.click();
    });
    
    this.elements.uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.elements.uploadArea.classList.add('drag-over');
    });
    
    this.elements.uploadArea.addEventListener('dragleave', () => {
      this.elements.uploadArea.classList.remove('drag-over');
    });
    
    this.elements.uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      this.elements.uploadArea.classList.remove('drag-over');
      const files = e.dataTransfer.files;
      this.trigger('files-dropped', files);
    });
    
    this.elements.fileInput.addEventListener('change', (e) => {
      const files = e.target.files;
      this.trigger('files-selected', files);
    });
    
    // 品質滑桿
    this.elements.qualitySlider.addEventListener('input', (e) => {
      const quality = parseInt(e.target.value);
      this.currentQuality = quality / 100;
      this.elements.qualityValue.textContent = quality;
      this.updateQualityHint(quality);
      this.trigger('quality-changed', this.currentQuality);
    });
    
    // 命名規則
    this.elements.namingRule.addEventListener('input', () => {
      this.updateNamingPreview();
      this.trigger('naming-rule-changed', this.elements.namingRule.value);
    });
    
    // 變數按鈕
    document.querySelectorAll('.var-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.insertNamingVariable(btn.dataset.var);
      });
    });
    
    // 工具按鈕
    this.elements.btnRotateLeft.addEventListener('click', () => this.trigger('rotate-left'));
    this.elements.btnRotateRight.addEventListener('click', () => this.trigger('rotate-right'));
    this.elements.btnCrop.addEventListener('click', () => this.trigger('crop'));
    this.elements.btnText.addEventListener('click', () => this.trigger('add-text'));
    this.elements.btnRect.addEventListener('click', () => this.trigger('add-rect'));
    this.elements.btnCircle.addEventListener('click', () => this.trigger('add-circle'));
    this.elements.btnDelete.addEventListener('click', () => this.trigger('delete-selected'));
    
    // 頂部按鈕
    this.elements.btnClearAll.addEventListener('click', () => this.trigger('clear-all'));
    this.elements.btnExport.addEventListener('click', () => this.trigger('export-pdf'));
    
    // 批量操作
    this.elements.btnBatchRotate.addEventListener('click', () => this.trigger('batch-rotate'));
    this.elements.btnBatchMerge.addEventListener('click', () => this.trigger('batch-merge'));
    this.elements.btnBatchSplit.addEventListener('click', () => this.trigger('batch-split'));
    this.elements.btnBatchExtract.addEventListener('click', () => this.trigger('batch-extract'));
  }

  /**
   * 事件監聽系統
   */
  eventListeners = {};
  
  on(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }
  
  trigger(event, data) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => callback(data));
    }
  }

  /**
   * 更新檔案列表
   * @param {Array} files - 檔案資訊陣列
   */
  updateFileList(files) {
    this.elements.fileItems.innerHTML = '';
    
    files.forEach((fileInfo, index) => {
      const item = document.createElement('div');
      item.className = 'file-item';
      item.dataset.index = index;
      item.dataset.fileName = fileInfo.fileName;
      
      item.innerHTML = `
        <div class="file-item-name">${fileInfo.fileName}</div>
        <div class="file-item-info">${fileInfo.pageCount} 頁 · ${this.formatFileSize(fileInfo.size)}</div>
      `;
      
      item.addEventListener('click', () => {
        this.selectFile(index);
        this.trigger('file-selected', { index, fileInfo });
      });
      
      this.elements.fileItems.appendChild(item);
    });
  }

  /**
   * 選擇檔案
   * @param {number} index - 檔案索引
   */
  selectFile(index) {
    document.querySelectorAll('.file-item').forEach(item => {
      item.classList.remove('active');
    });
    
    const item = this.elements.fileItems.querySelector(`[data-index="${index}"]`);
    if (item) {
      item.classList.add('active');
    }
  }

  /**
   * 更新縮圖列表
   * @param {Array} thumbnails - 縮圖陣列
   */
  updateThumbnails(thumbnails) {
    this.elements.pageThumbnails.innerHTML = '';
    
    thumbnails.forEach((thumb, index) => {
      const thumbDiv = document.createElement('div');
      thumbDiv.className = 'thumbnail';
      thumbDiv.dataset.pageNum = thumb.pageNum;
      
      const img = document.createElement('img');
      img.src = thumb.dataUrl;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'contain';
      
      const label = document.createElement('div');
      label.className = 'thumbnail-label';
      label.textContent = `p.${thumb.pageNum}`;
      
      thumbDiv.appendChild(img);
      thumbDiv.appendChild(label);
      
      thumbDiv.addEventListener('click', () => {
        this.selectThumbnail(thumb.pageNum);
        this.trigger('thumbnail-clicked', thumb);
      });
      
      this.elements.pageThumbnails.appendChild(thumbDiv);
    });
  }

  /**
   * 選擇縮圖
   * @param {number} pageNum - 頁碼
   */
  selectThumbnail(pageNum) {
    document.querySelectorAll('.thumbnail').forEach(thumb => {
      thumb.classList.remove('active');
    });
    
    const thumb = this.elements.pageThumbnails.querySelector(`[data-page-num="${pageNum}"]`);
    if (thumb) {
      thumb.classList.add('active');
    }
  }

  /**
   * 更新進度條
   * @param {number} percentage - 進度百分比 (0-100)
   * @param {string} text - 進度文字
   */
  updateProgress(percentage, text = '處理中...') {
    this.elements.progressContainer.classList.add('show');
    this.elements.progressFill.style.width = percentage + '%';
    this.elements.progressText.textContent = text;
  }

  /**
   * 隱藏進度條
   */
  hideProgress() {
    this.elements.progressContainer.classList.remove('show');
  }

  /**
   * 插入命名變數
   * @param {string} variable - 變數名稱
   */
  insertNamingVariable(variable) {
    const input = this.elements.namingRule;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const text = input.value;
    
    input.value = text.substring(0, start) + variable + text.substring(end);
    input.focus();
    input.selectionStart = input.selectionEnd = start + variable.length;
    
    this.updateNamingPreview();
  }

  /**
   * 更新命名預覽
   */
  updateNamingPreview() {
    const rule = this.elements.namingRule.value;
    const previews = this.generateNamingPreview(rule);
    this.elements.namingPreview.textContent = previews.join(', ');
  }

  /**
   * 生成命名預覽
   * @param {string} rule - 命名規則
   * @returns {Array<string>}
   */
  generateNamingPreview(rule) {
    const now = new Date();
    const examples = [];
    
    for (let i = 1; i <= 3; i++) {
      let example = rule
        .replace(/{原始檔名}/g, '報告')
        .replace(/{頁碼}/g, String(i))
        .replace(/{流水號}/g, String(i).padStart(4, '0'))
        .replace(/{日期}/g, now.toISOString().split('T')[0])
        .replace(/{時間}/g, now.toTimeString().split(' ')[0].replace(/:/g, '-'))
        .replace(/{自訂文字}/g, '範例');
      
      examples.push(example + '.pdf');
    }
    
    return examples;
  }

  /**
   * 更新品質提示
   * @param {number} quality - 品質 (0-100)
   */
  updateQualityHint(quality) {
    let hint = '';
    if (quality >= 90) {
      hint = '最高品質';
    } else if (quality >= 80) {
      hint = '建議值';
    } else if (quality >= 60) {
      hint = '中等品質';
    } else {
      hint = '較小檔案';
    }
    this.elements.qualityHint.textContent = hint;
  }

  /**
   * 更新頁面資訊
   * @param {Object} info - 頁面資訊
   */
  updatePageInfo(info) {
    this.elements.currentPageInfo.value = info.current || '未載入';
    this.elements.totalPagesInfo.value = info.total || '0';
    this.elements.fileSizeInfo.value = info.size || '-';
  }

  /**
   * 顯示通知
   * @param {string} message - 訊息
   * @param {string} type - 類型 (success, error, info)
   */
  showNotification(message, type = 'info') {
    // 簡單的 alert 實現，可替換為更美觀的通知元件
    const prefix = type === 'error' ? '❌ ' : type === 'success' ? '✓ ' : 'ℹ️ ';
    alert(prefix + message);
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
   * 清空檔案列表
   */
  clearFileList() {
    this.elements.fileItems.innerHTML = '';
  }

  /**
   * 清空縮圖列表
   */
  clearThumbnails() {
    this.elements.pageThumbnails.innerHTML = '';
  }

  /**
   * 獲取當前品質
   * @returns {number}
   */
  getCurrentQuality() {
    return this.currentQuality;
  }

  /**
   * 獲取命名規則
   * @returns {string}
   */
  getNamingRule() {
    return this.elements.namingRule.value;
  }

  /**
   * 啟用/停用按鈕
   * @param {string} buttonId - 按鈕 ID
   * @param {boolean} enabled - 是否啟用
   */
  setButtonEnabled(buttonId, enabled) {
    const button = document.getElementById(buttonId);
    if (button) {
      button.disabled = !enabled;
    }
  }
}

export default UIController;
