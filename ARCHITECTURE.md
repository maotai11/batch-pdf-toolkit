# 🏗️ 架構設計文件

## 系統架構概覽

```
┌─────────────────────────────────────────────────────────────┐
│                      index.html (UI Layer)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ 工具列       │  │ 畫布區域     │  │ 屬性面板     │      │
│  │ - 旋轉/裁切  │  │ - Canvas     │  │ - 匯出設定   │      │
│  │ - 註解工具   │  │ - 縮圖列表   │  │ - 命名規則   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                          ↓ ↑ 事件綁定 & 渲染
┌─────────────────────────────────────────────────────────────┐
│                    JavaScript Modules                        │
├─────────────────────────────────────────────────────────────┤
│  uiController.js          │  負責 UI 互動邏輯               │
│  ├─ 事件監聽              │                                 │
│  ├─ 工具列控制            │                                 │
│  └─ 匯出設定面板          │                                 │
├─────────────────────────────────────────────────────────────┤
│  pdfLoader.js             │  PDF 檔案載入與解析            │
│  ├─ pdf.js 初始化         │                                 │
│  ├─ 檔案讀取              │                                 │
│  └─ 頁面資訊提取          │                                 │
├─────────────────────────────────────────────────────────────┤
│  canvasManager.js         │  Canvas 畫布管理               │
│  ├─ fabric.js/konva.js    │                                 │
│  ├─ 頁面渲染              │                                 │
│  ├─ 圖形物件操作          │                                 │
│  └─ 記憶體管理            │                                 │
├─────────────────────────────────────────────────────────────┤
│  batchProcessor.js        │  批量處理邏輯                   │
│  ├─ 任務佇列              │                                 │
│  ├─ 分塊處理              │                                 │
│  └─ 進度追蹤              │                                 │
├─────────────────────────────────────────────────────────────┤
│  pdfExporter.js           │  PDF 匯出與壓縮                │
│  ├─ html2canvas 整合      │                                 │
│  ├─ 壓縮品質控制          │                                 │
│  ├─ 命名規則解析          │                                 │
│  └─ 檔案生成              │                                 │
└─────────────────────────────────────────────────────────────┘
                          ↓ ↑ 依賴
┌─────────────────────────────────────────────────────────────┐
│                    External Libraries                        │
├─────────────────────────────────────────────────────────────┤
│  pdf.js        │  PDF 解析與渲染                            │
│  fabric.js     │  Canvas 物件模型管理                       │
│  html2canvas   │  DOM 轉 Canvas 圖像                        │
│  pdf-lib       │  PDF 結構優化（可選）                      │
└─────────────────────────────────────────────────────────────┘
```

## 核心模組職責

### 1. uiController.js (UI 控制器)

**職責：** 處理所有使用者互動與 UI 狀態管理

**主要功能：**
- 工具列按鈕事件綁定
- 檔案拖放處理
- 匯出設定面板互動
- 命名規則變數按鈕插入
- 壓縮品質滑桿控制
- 進度條顯示

**關鍵方法：**
```javascript
class UIController {
  init()                          // 初始化 UI
  bindEvents()                    // 綁定事件監聽
  updateProgress(percentage)      // 更新進度
  showExportSettings()            // 顯示匯出設定
  insertNamingVariable(variable)  // 插入命名變數
  updateCompressionPreview(quality) // 更新壓縮預覽
}
```

---

### 2. pdfLoader.js (PDF 載入器)

**職責：** 處理 PDF 檔案的讀取與解析

**主要功能：**
- 使用 FileReader API 讀取本地檔案
- 使用 pdf.js 解析 PDF 結構
- 提取頁面數量、尺寸、元資料
- 管理多檔案載入佇列

**關鍵方法：**
```javascript
class PDFLoader {
  async loadFile(file)            // 載入單一檔案
  async loadMultipleFiles(files)  // 批量載入
  async getPageInfo(pdfDoc, pageNum) // 取得頁面資訊
  getMetadata(pdfDoc)             // 取得文件元資料
}
```

**資料結構：**
```javascript
{
  fileName: "document.pdf",
  pdfDoc: <pdf.js Document>,
  pageCount: 10,
  pages: [
    { pageNum: 1, width: 595, height: 842, rotation: 0 },
    // ...
  ]
}
```

---

### 3. canvasManager.js (Canvas 管理器)

**職責：** 管理 Canvas 畫布與圖形物件

**主要功能：**
- 初始化 fabric.js Canvas
- 渲染 PDF 頁面到 Canvas
- 處理旋轉、裁切、縮放操作
- 管理圖形物件（文字、線條、矩形）
- 記憶體釋放與優化

**關鍵方法：**
```javascript
class CanvasManager {
  init(canvasElement)             // 初始化 Canvas
  async renderPage(pdfPage)       // 渲染 PDF 頁面
  rotatePage(angle)               // 旋轉當前頁面
  cropPage(x, y, width, height)   // 裁切頁面
  addText(text, x, y)             // 添加文字註解
  addShape(type, options)         // 添加圖形
  clearCanvas()                   // 清空畫布
  dispose()                       // 釋放資源
}
```

**效能優化：**
- 使用 `requestAnimationFrame` 優化渲染
- 實現虛擬滾動（僅渲染可見頁面）
- 頁面切換時釋放舊 Canvas 記憶體

---

### 4. batchProcessor.js (批量處理器)

**職責：** 處理大量 PDF 的批量操作

**主要功能：**
- 任務佇列管理
- 分塊處理（防止瀏覽器凍結）
- 進度追蹤與回報
- 錯誤處理與重試機制

**關鍵方法：**
```javascript
class BatchProcessor {
  async processQueue(tasks, chunkSize=10) // 分塊處理任務
  async mergePDFs(pdfList)                // 合併多個 PDF
  async extractPages(pdf, pageRanges)     // 擷取指定頁面
  async reorderPages(pdf, newOrder)       // 重新排序頁面
  trackProgress(callback)                 // 追蹤進度
}
```

**分塊處理範例：**
```javascript
async function processInChunks(items, chunkSize) {
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    await Promise.all(chunk.map(item => processItem(item)));
    
    // 更新進度
    const progress = ((i + chunkSize) / items.length) * 100;
    updateProgress(Math.min(progress, 100));
    
    // 讓出控制權給瀏覽器
    await new Promise(resolve => setTimeout(resolve, 0));
  }
}
```

---

### 5. pdfExporter.js (PDF 匯出器)

**職責：** 處理最終 PDF 的生成與匯出

**主要功能：**
- 整合 html2canvas 轉換 Canvas 為圖像
- 控制 JPEG 壓縮品質
- 解析命名規則並生成檔名
- 使用 pdf.js 或 pdf-lib 生成最終 PDF
- 觸發瀏覽器下載

**關鍵方法：**
```javascript
class PDFExporter {
  async exportToPDF(canvasData, options) // 匯出為 PDF
  async compressImage(canvas, quality)   // 壓縮圖像
  parseNamingRule(rule, context)         // 解析命名規則
  generateFileName(rule, pageNum, originalName) // 生成檔名
  downloadFile(blob, fileName)           // 觸發下載
}
```

**命名規則解析器：**
```javascript
function parseNamingRule(rule, context) {
  const variables = {
    '{原始檔名}': context.originalName,
    '{頁碼}': context.pageNum,
    '{流水號}': String(context.serialNum).padStart(4, '0'),
    '{日期}': new Date().toISOString().split('T')[0],
    '{時間}': new Date().toTimeString().split(' ')[0].replace(/:/g, '-'),
    '{自訂文字}': context.customText || ''
  };
  
  let result = rule;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(key, 'g'), value);
  }
  
  return result;
}
```

---

## 資料流程

### 單檔編輯流程

```
1. 使用者上傳 PDF
   ↓
2. pdfLoader.loadFile(file)
   ↓
3. canvasManager.renderPage(pdfPage)
   ↓
4. 使用者在 Canvas 上操作（旋轉/裁切/註解）
   ↓
5. 點擊「匯出」按鈕
   ↓
6. pdfExporter.exportToPDF(canvasData, { quality: 0.85 })
   ↓
7. 瀏覽器下載 PDF
```

### 批量處理流程

```
1. 使用者上傳多個 PDF
   ↓
2. pdfLoader.loadMultipleFiles(files)
   ↓
3. 選擇批量操作（合併/擷取/重排）
   ↓
4. batchProcessor.processQueue(tasks)
   ├─ 每 10 個檔案為一組處理
   ├─ 更新進度條
   └─ 處理完成後進入下一組
   ↓
5. 設定匯出命名規則
   ↓
6. pdfExporter.parseNamingRule(rule, context)
   ↓
7. 批量下載 PDF
```

---

## 效能優化策略

### 記憶體管理

1. **頁面切換時釋放資源**
   ```javascript
   canvasManager.dispose(); // 清除舊 Canvas
   URL.revokeObjectURL(blobUrl); // 釋放 Blob URL
   ```

2. **限制同時渲染的頁面數量**
   - 使用虛擬滾動，只渲染可見區域
   - 超出視窗的頁面用縮圖佔位符替代

3. **分批處理大量檔案**
   - 每次處理 10-20 個檔案
   - 使用 `setTimeout(fn, 0)` 讓出控制權

### 壓縮優化

1. **動態調整 JPEG 品質**
   - 預設 0.85（平衡品質與大小）
   - 提供滑桿讓使用者調整（0.1-1.0）

2. **圖像預處理**
   - 使用 `canvas.toDataURL('image/jpeg', quality)`
   - 可選：整合 browser-image-compression

3. **PDF 結構優化**
   - 使用 pdf-lib 移除重複物件
   - 壓縮內嵌字體

---

## 錯誤處理

### 檔案載入錯誤

```javascript
try {
  const pdfDoc = await pdfLoader.loadFile(file);
} catch (error) {
  if (error.name === 'PasswordException') {
    alert('此 PDF 已加密，請移除密碼後重試');
  } else if (error.name === 'InvalidPDFException') {
    alert('檔案損壞或格式不正確');
  } else {
    alert('載入失敗：' + error.message);
  }
}
```

### 記憶體不足

```javascript
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason.message.includes('Out of memory')) {
    alert('記憶體不足，請減少檔案數量或關閉其他分頁');
  }
});
```

---

## 測試策略

### 單元測試（未來）

- `pdfLoader.js`：測試各種 PDF 格式載入
- `pdfExporter.js`：測試命名規則解析器
- `batchProcessor.js`：測試分塊處理邏輯

### 效能測試

- 載入 1000 個 PDF 檔案的記憶體使用
- 批量合併 100 個 PDF 的處理時間
- 壓縮品質對檔案大小的影響

### 相容性測試

- Chrome 最新穩定版（主要支援）
- Chrome 前兩個版本（盡力支援）

---

## 安全性考量

1. **檔案來源檢查**
   - 只接受本地上傳的檔案
   - 不允許從 URL 載入（防止 CSRF）

2. **XSS 防護**
   - 使用者輸入的命名規則需過濾特殊字元
   - 避免在 `innerHTML` 中直接插入使用者輸入

3. **隱私保護**
   - 不傳送任何資料到伺服器
   - 不使用第三方追蹤服務

---

## 未來擴充方向

- [ ] **Web Workers**：將 PDF 解析移到背景執行緒
- [ ] **IndexedDB**：暫存大檔案以減少記憶體壓力
- [ ] **OCR 支援**：使用 Tesseract.js 辨識掃描 PDF
- [ ] **浮水印功能**：批量添加文字或圖片浮水印
- [ ] **PWA 化**：支援離線安裝與更新

---

**文件版本：** 1.0  
**最後更新：** 2026-02-02
