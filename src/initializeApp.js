const { app, BrowserWindow, Tray, Menu } = require('electron');
const path = require('path');
const WebSocket = require('ws');

let mainWindow;
let tray;
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

function createTray() {
  tray = new Tray(path.resolve(__dirname, 'assets/tray-icon.png'));
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show App', click: () => mainWindow.show() },
    { label: 'Quit', click: () => app.quit() },
  ]);
  tray.setToolTip('Electron App');
  tray.setContextMenu(contextMenu);
  tray.on('click', () => mainWindow.show());
}

function createWindow() {
  try {
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

    mainWindow.on('close', (event) => {
      event.preventDefault();
      mainWindow.hide();
    });
  } catch (error) {
    console.error('❌ Error creating window:', error);
  }
}

async function initializeApp() {
  try {
    await app.whenReady();
    createWindow();
    createTray();
    startWebSocketServer();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  } catch (error) {
    console.error('❌ Error initializing application:', error);
  }
}

function sendLogMessage(message, success) {
  try {
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
      windows.forEach((win) => win.webContents.send('log-message', message));
    }
    return { success, message };
  } catch (error) {
    console.error('❌ Error sending log message:', error);
    return { success: false, message: 'Error sending log message' };
  }
}

function getPrinters() {
  try {
    const window = BrowserWindow.getAllWindows()[0];
    if (!window) return [];

    const printers = window.webContents.getPrinters();
    return printers;
  } catch (error) {
    console.error('❌ Error getting printers:', error);
    return [];
  }
}

module.exports = { initializeApp, sendLogMessage, getPrinters };
