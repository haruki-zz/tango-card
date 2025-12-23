import path from 'node:path';
import { app, BrowserWindow, ipcMain } from 'electron';
import { registerIpcHandlers } from './ipcHandlers';
import { initializeDatabase } from './db/database';

const isDev = !app.isPackaged;

async function createWindow() {
  const preloadPath = isDev
    ? path.resolve(__dirname, '../../dist/preload/index.js')
    : path.join(__dirname, '../preload/index.js');

  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      // 关闭 sandbox 以便 preload 能访问 Node 模块并正确暴露 window.api
      sandbox: false
    }
  });

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
    return;
  }

  const indexHtml = path.join(__dirname, '../renderer/index.html');
  await mainWindow.loadFile(indexHtml);
}

app.whenReady().then(async () => {
  const database = initializeDatabase();
  await registerIpcHandlers(ipcMain, { database });
  await createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
