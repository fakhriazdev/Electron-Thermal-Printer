const {
  initializeApp,
  sendLogMessage,
  getPrinters,
} = require('./initializeApp');
const { app, ipcMain, webContents } = require('electron');
const { PosPrinter } = require('@plick/electron-pos-printer');
const fs = require('fs');
const path = require('path');

const data = [
  {
    type: 'image',
    path: path.resolve(__dirname, 'assets/logo.jpeg'), // Can be a URL or change the key to "path" if you want to use a local file on disk
    position: 'left', // position of image: 'left' | 'center' | 'right'
    width: '60px', // width of image in px; default: auto
    height: '40px', // width of image in px; default: 50 or '50px'
  },
  {
    type: 'text', // 'text' | 'barCode' | 'qrCode' | 'image' | 'table' | 'divider'
    value: '7777 - CELCIUS',
    style: { textAlign: 'left', fontSize: '12px' },
  },
  {
    type: 'divider', // we could style it using the style property, we can use divider anywhere, except on the table header
  },
];

const envFilePath = path.join(app.getPath('userData'), 'env.txt');

initializeApp();
ipcMain.handle('print-test', async () => {
  const printerName = await fs.promises.readFile(envFilePath, 'utf-8');
  console.log(`Using printer: ${printerName}`);

  const options = {
    preview: false,
    silent: true,
    printerName: 'CITIZEN CT-D150',
    margin: '0 1 0 1',
    copies: 1,
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

ipcMain.handle('get-saved-printer', async () => {
  try {
    if (!fs.existsSync(envFilePath)) {
      await fs.promises.writeFile(envFilePath, '', 'utf-8'); // Buat file jika belum ada
    }
    return await fs.promises.readFile(envFilePath, 'utf-8');
  } catch (error) {
    console.error('Error reading saved printer:', error);
    return '';
  }
});

ipcMain.on('save-printer', async (_, printerName) => {
  try {
    await fs.promises.writeFile(envFilePath, printerName, 'utf-8');
    sendLogMessage(`✅ Printer "${printerName}" saved successfully!`, true);
  } catch (error) {
    sendLogMessage(`⚠️ Failed to save printer: ${error.message}`, false);
  }
});

ipcMain.handle('get-printers', async (event) => {
  return event.sender.getPrinters();
});

// function sendLogMessage(message, success) {
//   const windows = BrowserWindow.getAllWindows();
//   if (windows.length > 0) {
//     windows.forEach((win) => win.webContents.send('log-message', message));
//   }
//   return { success, message };
// }
