import { app, BrowserWindow } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { registerIpcHandlers } from '@main/ipc/handlers';
import { ProviderSettingsStore } from '@main/provider-settings';
import { FileStorage } from '@main/storage';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV === 'development';
const preloadScript = (() => {
  const preloadMjs = path.join(__dirname, '../preload/index.mjs');
  const preloadJs = path.join(__dirname, '../preload/index.js');
  return fs.existsSync(preloadMjs) ? preloadMjs : preloadJs;
})();
const rendererIndexFile = path.join(__dirname, '..', '..', 'dist', 'index.html');

const createMainWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 1200,
    minHeight: 850,
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
    mainWindow.loadURL(rendererUrl).catch((error) => {
      console.error('加载渲染进程 URL 失败', error);
    });
    if (isDev) {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  } else {
    mainWindow
      .loadFile(rendererIndexFile)
      .catch((error) => {
        console.error('加载渲染进程文件失败', error);
      });
  }
};

app
  .whenReady()
  .then(async () => {
    const storage = new FileStorage();
    const providerStore = new ProviderSettingsStore();
    const initialProviderConfig = await providerStore.load();
    registerIpcHandlers({ storage, providerStore, initialProviderConfig });
    createMainWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      }
    });
  })
  .catch((error) => {
    console.error('应用初始化失败', error);
  });

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
