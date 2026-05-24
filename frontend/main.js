const { app, BrowserWindow } = require('electron');
const path = require('path');
const http = require('http');

let mainWindow;
const serverUrl = 'http://localhost:3000';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 850,
    title: "Sonoray ERP Desktop",
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Start by showing our beautiful local loading screen
  mainWindow.loadFile(path.join(__dirname, 'loading.html'));

  // Start polling the server
  checkServerAndLoad();
}

function checkServerAndLoad() {
  http.get(serverUrl, (res) => {
    // If we receive any response, the server is running! Load it directly.
    if (mainWindow) {
      mainWindow.loadURL(serverUrl);
    }
  }).on('error', (err) => {
    // Server is not running yet. Retry in 2 seconds.
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        checkServerAndLoad();
      }
    }, 2000);
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
