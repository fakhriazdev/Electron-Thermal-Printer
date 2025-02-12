const {
  initializeApp,
  sendLogMessage,
  getPrinters,
} = require('./initializeApp');
const { BrowserWindow, ipcMain } = require('electron');
const { PosPrinter } = require('@plick/electron-pos-printer');

const data = [
  {
    type: 'text',
    value: 'Test Print - Node Printer',
    style: { fontWeight: 'bold', textAlign: 'center', fontSize: '16px' },
  },
  {
    type: 'text',
    value: '------------------------------',
    style: { textAlign: 'center' },
  },
  {
    type: 'text',
    value: 'Hello, this is a test print!',
    style: { textAlign: 'center', fontSize: '12px' },
  },
  {
    type: 'text',
    value: '------------------------------',
    style: { textAlign: 'center' },
  },
  {
    type: 'text',
    value: 'Print Test Completed.',
    style: { textAlign: 'center', fontSize: '12px' },
  },
  {
    type: 'raw',
    value: '\x1B\x70\x00\x19\xFA',
  },
];

initializeApp();
ipcMain.handle('print-test', async (_, printerName) => {
  if (!printerName) {
    return sendLogMessage('⚠️ Printer name is required', false);
  }

  const options = {
    preview: false,
    silent: true,
    margin: '0px',
    copies: 1,
    printerName: printerName,
    timeOutPerLine: 400,
    pageSize: '80mm',
  };

  try {
    await PosPrinter.print(data, options);
    return sendLogMessage('✅ Print job sent successfully!', true);
  } catch (error) {
    console.error('Print error:', error);
    return sendLogMessage(`⚠️ Print error: ${error.message}`, false);
  }
});

ipcMain.handle('get-printers', async () => {
  return await getPrinters();
});

// function sendLogMessage(message, success) {
//   const windows = BrowserWindow.getAllWindows();
//   if (windows.length > 0) {
//     windows.forEach((win) => win.webContents.send('log-message', message));
//   }
//   return { success, message };
// }
