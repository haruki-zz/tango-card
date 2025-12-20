import path from 'node:path';
import { app, BrowserWindow } from 'electron';

const isDev = !app.isPackaged;

async function createWindow() {
  const preloadPath = isDev
    ? path.join(__dirname, '../preload/index.ts')
    : path.join(__dirname, '../preload/index.js');

  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false
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

app.whenReady().then(createWindow);

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
