# 📄 Batch PDF Toolkit

> 離線 PDF 批量處理工具：旋轉、裁切、合併、重排、自訂命名規則，支援單檔編輯與大量處理

## ✨ 核心特性

### 🎨 單檔編輯
- **所見即所得 (WYSIWYG)** Canvas 編輯體驗
- 支援旋轉、裁切、添加文字/圖形註解
- 即時預覽編輯效果

### 📦 批量處理
- **最多處理 1000 個 PDF 檔案**
- 支援批量旋轉、裁切、擷取特定頁
- 多檔案合併與頁面重新排序
- 直覺顯示原頁碼與新頁碼對照

### 🎯 進階功能
- **自訂命名規則**：支援變數（{原始檔名}、{流水號}、{日期}、{頁碼}）
- **智能壓縮**：可調整 JPEG 品質（0.1-1.0）減少檔案大小
- **處理進度顯示**：明確的操作回饋與進度條
- **完全離線**：無需網路連線，資料不上傳

## 🚀 快速開始

### 線上使用
1. 下載 `index.html` 檔案
2. 使用 Chrome 瀏覽器開啟
3. 開始處理你的 PDF！

### 本地開發
```bash
# 克隆倉庫
git clone https://github.com/maotai11/batch-pdf-toolkit.git
cd batch-pdf-toolkit

# 直接用 Chrome 開啟 index.html 即可
```

## 📁 專案結構

```
batch-pdf-toolkit/
├── index.html              # 主程式（內含所有 CSS 樣式）
├── js/
│   ├── pdfLoader.js        # PDF 解析與載入
│   ├── canvasManager.js    # Canvas 畫布管理
│   ├── batchProcessor.js   # 批量處理邏輯
│   ├── pdfExporter.js      # PDF 匯出與壓縮
│   └── uiController.js     # UI 互動控制
├── README.md               # 專案說明文件
└── LICENSE                 # 授權條款
```

## 🛠️ 技術棧

| 功能 | 使用技術 |
|------|---------|
| PDF 解析 | [pdf.js](https://mozilla.github.io/pdf.js/) |
| Canvas 圖形 | [fabric.js](http://fabricjs.com/) / [konva.js](https://konvajs.org/) |
| DOM 轉 Canvas | [html2canvas](https://html2canvas.hertzen.com/) |
| 壓縮優化 | Canvas JPEG 品質調整 + [pdf-lib](https://pdf-lib.js.org/)（可選） |

## 📖 使用指南

### 1️⃣ 載入 PDF
- 拖曳檔案到視窗
- 點擊「選擇檔案」按鈕
- 支援單檔或多檔同時載入

### 2️⃣ 編輯操作
- **旋轉**：選擇頁面後點擊旋轉按鈕（90°/180°/270°）
- **裁切**：拖曳裁切框調整範圍
- **註解**：使用工具列添加文字或圖形

### 3️⃣ 批量處理
- **合併**：選擇多個檔案後點擊「合併」
- **擷取**：指定頁碼範圍（例如：1-3, 5, 7-10）
- **重排**：拖曳縮圖調整頁面順序

### 4️⃣ 匯出設定
- **壓縮品質**：拖曳滑桿調整（預設 0.85）
- **命名規則**：
  - 輸入範例：`報告-{原始檔名}-{頁碼}`
  - 輸出範例：`報告-原始文件-1.pdf`、`報告-原始文件-2.pdf`
- **預覽檔名**：即時顯示輸出檔名

## 🎨 命名規則變數

| 變數 | 說明 | 範例 |
|------|------|------|
| `{原始檔名}` | 上傳的檔案名稱 | `document.pdf` → `document` |
| `{頁碼}` | 當前頁碼（從 1 開始） | `1`, `2`, `3` |
| `{流水號}` | 全域流水號（4 位數） | `0001`, `0002` |
| `{日期}` | 當前日期 | `2026-02-02` |
| `{時間}` | 當前時間 | `14-30-45` |
| `{自訂文字}` | 在第一頁輸入的自訂名稱 | 使用者輸入 |

### 命名範例
```
輸入規則：報告-{原始檔名}-{日期}-頁{頁碼}
輸出結果：報告-年度總結-2026-02-02-頁1.pdf
         報告-年度總結-2026-02-02-頁2.pdf
```

## ⚡ 效能最佳化

- **記憶體管理**：處理完成後自動釋放 Canvas 資源
- **分塊處理**：大量檔案分批處理，避免瀏覽器當機
- **非同步載入**：使用 Web Workers 處理 PDF 解析（未來規劃）
- **智能壓縮**：根據圖像內容動態調整壓縮參數

## 🔒 隱私保護

- ✅ **完全離線運行**：所有處理在瀏覽器本地完成
- ✅ **無資料上傳**：檔案不會傳送到任何伺服器
- ✅ **無追蹤代碼**：不使用 Google Analytics 或其他追蹤工具

## 📝 開發計畫

- [ ] 基礎架構搭建
- [ ] PDF 載入與渲染
- [ ] Canvas 編輯功能
- [ ] 批量處理邏輯
- [ ] 匯出與壓縮功能
- [ ] 命名規則解析器
- [ ] UI/UX 優化
- [ ] 效能壓力測試（1000 檔案）
- [ ] 使用文件撰寫

## 🤝 貢獻指南

歡迎提交 Issue 或 Pull Request！

1. Fork 此倉庫
2. 建立功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 📄 授權條款

MIT License - 詳見 [LICENSE](LICENSE) 檔案

## 🙏 致謝

- [Mozilla PDF.js](https://mozilla.github.io/pdf.js/) - PDF 渲染引擎
- [Fabric.js](http://fabricjs.com/) - Canvas 物件模型
- [html2canvas](https://html2canvas.hertzen.com/) - DOM 轉圖像

---

**⚠️ 注意事項**

- 僅在 **Chrome 最新穩定版**測試，其他瀏覽器可能不相容
- 處理大量檔案時建議關閉其他分頁以釋放記憶體
- 建議單次處理檔案數量不超過 500 個以獲得最佳效能

**🔗 相關連結**

- [問題回報](https://github.com/maotai11/batch-pdf-toolkit/issues)
- [功能建議](https://github.com/maotai11/batch-pdf-toolkit/discussions)
