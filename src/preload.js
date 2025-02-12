const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onLogMessage: (callback) => {
    ipcRenderer.removeAllListeners('log-message');
    ipcRenderer.on('log-message', (event, message) => {
      console.log('📜 Log dari Main Process:', message);
      callback(message);
    });
  },

  printReceipt: async (printerName) => {
    try {
      return await ipcRenderer.invoke('print-test', printerName);
    } catch (error) {
      console.error('❌ IPC print-receipt error:', error);
      return { success: false, message: error.message };
    }
  },

  getPrinters: async () => {
    return await ipcRenderer.invoke('get-printers');
  },
});
