import { app, BrowserWindow } from 'electron';
import { setupSecurePOSPrinter } from 'electron-secure-pos-printer';
import Electron from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename); // You need this for resolving paths

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadFile(join(__dirname, 'pages', 'index.html'));
  //mainWindow.webContents.openDevTools();
}

// Initialize the app
export function initializeApp() {
  app.whenReady().then(() => {
    createWindow();
    setupSecurePOSPrinter(Electron);

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}
