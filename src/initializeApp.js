const { app, BrowserWindow } = require('electron');
const path = require('path');
const WebSocket = require('ws');

let mainWindow;
const wss = new WebSocket.Server({ port: 8080 });

app.setLoginItemSettings({
  openAtLogin: true,
  path: app.getPath('exe'),
});

async function startWebSocketServer() {
  wss.on('connection', (ws) => {
    ws.isAlive = true;

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    sendLogMessage('✅ Client connected to WebSocket', true);

    ws.on('message', (message) => {
      console.log('📩 Received:', message);

      if (message === 'PRINT') {
        sendLogMessage('🖨 Print command received', true);
      }
    });

    ws.on('close', () => {
      sendLogMessage('❌ Client disconnected', false);
    });

    ws.on('error', (error) => {
      console.error('❌ WebSocket Error:', error);
      sendLogMessage('❌ WebSocket Error: ' + error.message, false);
      ws.terminate();
    });
  });

  setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) {
        console.warn('⚠️ Terminating inactive client connection...');
        ws.terminate();
        return;
      }
      ws.isAlive = false;
      ws.ping(); // Kirim "ping" untuk memastikan client masih aktif
    });
  }, 30000);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 490,
    height: 625,
    resizable: false,
    maximizable: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.resolve(__dirname, 'preload.js'),
      devTools: true,
    },
  });

  mainWindow.loadFile(path.resolve(__dirname, 'pages', 'index.html'));

  //mainWindow.webContents.openDevTools();
}

async function initializeApp() {
  await app.whenReady();
  createWindow();
  startWebSocketServer();

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

function sendLogMessage(message, success) {
  const windows = BrowserWindow.getAllWindows();
  if (windows.length > 0) {
    windows.forEach((win) => win.webContents.send('log-message', message));
  }
  return { success, message };
}

async function getPrinters() {
  const window = BrowserWindow.getAllWindows()[0];
  if (!window) return [];

  const printers = await window.webContents.getPrintersAsync();
  return printers;
}

module.exports = { initializeApp, sendLogMessage, getPrinters };
