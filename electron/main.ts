import { app, BrowserWindow } from 'electron';
import path from 'path';
import { pathToFileURL } from 'url';

const isDev = process.env.NODE_ENV === 'development';

const createMainWindow = () => {
  const preloadPath = isDev
    ? path.join(__dirname, 'preload.ts')
    : path.join(__dirname, 'preload.js');

  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  if (isDev) {
    void mainWindow.loadURL('http://localhost:5173');
  } else {
    const indexHtml = pathToFileURL(path.join(__dirname, '../dist/index.html')).toString();
    void mainWindow.loadURL(indexHtml);
  }
};

void app.whenReady().then(() => {
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
