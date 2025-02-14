const { app, BrowserWindow, Tray, Menu } = require('electron');
const {openCashDrawer} = require('@achyutlabsau/cashdrawer');
const path = require('path');
const os =  require('os')
const WebSocket = require('ws');
let mainWindow;
let tray;
const clients = new Map();
const wss = new WebSocket.Server({ host: '0.0.0.0', port: 8080 });

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name in interfaces) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address; // Ambil IP lokal
      }
    }
  }
  return '127.0.0.1'; // Default fallback
}

console.log(`✅ WebSocket Server running at ws://${getLocalIP()}:8080`);

//memastikan aplikasi automatis terbuka saat device menyala
app.setLoginItemSettings({
  openAtLogin: true,
  path: app.getPath('exe'),
});

// config websocket
async function startWebSocketServer() {
  wss.on('connection', (ws, req) => {
    ws.isAlive = true;
    const clientIP = req.socket.remoteAddress; // Dapatkan IP Address client
    const clientID = `Client-${clients.size + 1}`; // Buat ID unik

    clients.set(ws, { id: clientID, ip: clientIP });

    console.log(`✅ ${clientID} connected from ${clientIP}`);
    sendLogMessage(`✅ ${clientID} connected from ${clientIP}`, true);
    
    // Kirim daftar client yang terhubung ke UI
    broadcastClients();

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        console.log('📩 Received:', data);

        if (data.command === 'DEVICE_INFO') {
            // Simpan informasi browser & device ke client map
            clients.set(ws, {
                id: clientID,
                ip: clientIP,
                browser: data.data.userAgent,
                platform: data.data.platform,
                language: data.data.language,
            });

            console.log(`🌍 ${clientID} Info: Browser=${data.browser}, Platform=${data.platform}, Language=${data.language}`);
            broadcastClients(); // Update daftar client
        }

        if (data.command === 'PRINT') {
            sendLogMessage('🖨 Print command received', true);
        }

    } catch (error) {
        console.error('❌ Error parsing message:', error);
        sendLogMessage('❌ Invalid message format received', false);
    }
   });

    ws.on('close', () => {
      console.log(`❌ ${clientID} disconnected`);
      sendLogMessage(`❌ ${clientID} disconnected`, false);
      clients.delete(ws);
      broadcastClients(); // Perbarui daftar setelah client disconnect
    });

    ws.on('error', (error) => {
      console.error(`❌ WebSocket Error from ${clientID}:`, error);
      sendLogMessage(`❌ WebSocket Error from ${clientID}: ${error.message}`, false);
      clients.delete(ws);
      broadcastClients();
    });
  });

  // Cek koneksi setiap 30 detik
  setInterval(() => {
    wss.clients.forEach((ws) => {
       if (!ws.isAlive) {
          console.warn(`⚠️ ${clients.get(ws)?.id} is inactive, disconnecting...`);
          ws.terminate();
          clients.delete(ws);
          broadcastClients();
          return;
       }
       ws.isAlive = false;
       ws.ping();
    });
 }, 30000);
}

// Kirim daftar client yang terhubung ke UI
const broadcastClients = () => {
  const clientList = Array.from(clients.values()).map(client => ({
      id: client.id,
      ip: client.ip,
      browser: client.browser || 'Unknown',
      platform: client.platform || 'Unknown',
      language: client.language || 'Unknown'
  }));

  mainWindow.webContents.send('update-client-list', clientList);
};

// memastikan aplikasi berjalan di background saat menekan close
function createTray() {
  tray = new Tray(path.resolve(__dirname, 'assets/tray-icon.png'));
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show App', click: () => mainWindow.show() },
    { 
      label: 'Quit', 
      click: () => {
        console.log("🚪 Exiting application...");
        if (mainWindow) {
          mainWindow.destroy(); 
        }
        wss.close();
        app.quit(); 
        
      } 
    },
  ]);
  tray.setToolTip('AMS Tools');
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

//mengirimkan aktivity ke log
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

//mendapatkan informasi Printer yang tersedia
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


module.exports = { initializeApp, sendLogMessage, getPrinters,openCashDrawer };
