const { app, BrowserWindow, shell, ipcMain, session } = require('electron');
const path = require('path');

const PORT = 3000;
const preloadPath = path.join(__dirname, 'preload.js');
const { KRC_CLOUD_API_URL } = require('./cloud-config');

ipcMain.handle('krc-open-external', (_event, url) => {
  if (typeof url === 'string' && /^https?:\/\//i.test(url)) {
    return shell.openExternal(url);
  }
  return false;
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 700,
    show: false,
    backgroundColor: '#f4f7fb',
    title: 'KRC GROUP',
    icon: path.join(__dirname, 'public', 'assets', 'krc-icon.ico'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: true,
      preload: preloadPath
    }
  });

  // Keep external module pages inside the KRC & BRS <webview> by default.
  // The normal browser is used only when the user explicitly clicks Browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    return { action: 'deny' };
  });

  win.once('ready-to-show', () => win.show());
  win.loadURL(`http://localhost:${PORT}`);
}

app.whenReady().then(() => {
  process.env.KRC_DATA_DIR = path.join(app.getPath('userData'), 'data');
  if (KRC_CLOUD_API_URL) process.env.KRC_CLOUD_API_URL = KRC_CLOUD_API_URL;
  process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'krc-brs-local-session-secret-change-for-production';

  // Allow the embedded webview to use normal web storage/cookies for
  // Google Apps Script, Google Sheets and similar hosted KRC pages.
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const headers = { ...details.responseHeaders };
    delete headers['X-Frame-Options'];
    delete headers['x-frame-options'];
    callback({ responseHeaders: headers });
  });

  if (KRC_CLOUD_API_URL) {
    process.env.KRC_CLOUD_API_URL = KRC_CLOUD_API_URL;
    require('./desktop-server');
  } else {
    require('./server');
  }
  setTimeout(createWindow, 350);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
