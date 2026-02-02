/**
 * PDF Loader Module
 * 負責 PDF 檔案的載入與解析
 */

class PDFLoader {
  constructor() {
    this.loadedFiles = [];
  }

  /**
   * 載入單一 PDF 檔案
   * @param {File} file - 檔案物件
   * @returns {Promise<Object>} PDF 文件資訊
   */
  async loadFile(file) {
    // TODO: 實作 PDF 載入邏輯
    console.log('Loading PDF:', file.name);
    return {
      fileName: file.name,
      size: file.size,
      pageCount: 0
    };
  }

  /**
   * 批量載入 PDF 檔案
   * @param {FileList} files - 檔案清單
   * @returns {Promise<Array>} PDF 文件資訊陣列
   */
  async loadMultipleFiles(files) {
    // TODO: 實作批量載入邏輯
    console.log('Loading multiple PDFs:', files.length);
    return [];
  }
}

export default PDFLoader;