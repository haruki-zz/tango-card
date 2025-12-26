import { app, BrowserWindow } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV === 'development';
const preloadScript = (() => {
  const preloadMjs = path.join(__dirname, '../preload/index.mjs');
  const preloadJs = path.join(__dirname, '../preload/index.js');
  return fs.existsSync(preloadMjs) ? preloadMjs : preloadJs;
})();

const createMainWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    minWidth: 960,
    minHeight: 640,
    webPreferences: {
      preload: preloadScript,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (process.platform === 'win32') {
    app.setAppUserModelId('com.haruki.tango-card');
  }

  const rendererUrl = process.env['ELECTRON_RENDERER_URL'];
  if (rendererUrl) {
    mainWindow.loadURL(rendererUrl);
    if (isDev) {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
};

app.whenReady().then(() => {
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
