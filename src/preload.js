const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Menerima log dari main process dan meneruskannya ke renderer
  onLogMessage: (callback) => {
    ipcRenderer.removeAllListeners('log-message');
    ipcRenderer.on('log-message', (event, message) => {
      console.log('📜 Log dari Main Process:', message);
      callback(message);
    });
  },

  // Kirim perintah cetak ke main process
  printReceipt: async (printerName) => {
    try {
      return await ipcRenderer.invoke('print-test', printerName);
    } catch (error) {
      console.error('❌ IPC print-receipt error:', error);
      return { success: false, message: error.message };
    }
  },

  // Ambil daftar printer yang tersedia
  getPrinters: async () => {
    return await ipcRenderer.invoke('get-printers');
  },

  // Simpan nama printer ke env.txt
  savePrinter: (printerName) => {
    ipcRenderer.send('save-printer', printerName);
  },

  // Ambil printer yang tersimpan dari env.txt
  getSavedPrinter: async () => {
    return await ipcRenderer.invoke('get-saved-printer');
  },
});
