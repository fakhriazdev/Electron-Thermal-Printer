const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const printer = require('printer'); // ✅ Gunakan printer untuk pencetakan thermal

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 490,
    height: 625,
    resizable: false,
    maximizable: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false, // ✅ Keamanan lebih baik
      preload: path.resolve(__dirname, 'preload.js'),
      devTools: true,
    },
  });

  mainWindow.loadFile(path.resolve(__dirname, 'pages', 'index.html'));
  mainWindow.webContents.openDevTools();
}

async function initializeApp() {
  await app.whenReady();
  createWindow();

  // ✅ Handle mendapatkan daftar printer
  ipcMain.handle('get-printers', async () => {
    try {
      const printers = printer.getPrinters();
      return printers.map((p) => ({
        name: p.name,
        isDefault: p.isDefault,
        status: p.status,
      }));
    } catch (error) {
      console.error('Error fetching printers:', error);
      return [];
    }
  });

  // ✅ Handle pencetakan thermal printer
  ipcMain.handle('print-test', async (_, printerName) => {
    if (!printerName) {
      return { success: false, message: 'Printer name is required' };
    }

    // Data struk dalam format ESC/POS
    const testPrintData = `
      Test Print - Node Printer\n
      ------------------------------\n
      Hello, this is a test print!\n
      ------------------------------\n
      Print Test Completed.\n
    `;

    try {
      printer.printDirect({
        printer: printerName,
        text: testPrintData,
        type: 'RAW', // ✅ ESC/POS format untuk thermal printer
        success: (jobID) => {
          console.log(`Print job sent successfully! Job ID: ${jobID}`);
        },
        error: (err) => {
          console.error('Print error:', err);
        },
      });

      return { success: true, message: 'Print job sent successfully!' };
    } catch (error) {
      console.error('Print error:', error);
      return { success: false, message: error.message };
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}

module.exports = { initializeApp };
