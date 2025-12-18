import { existsSync } from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

import { app, BrowserWindow } from 'electron';

const isDev = process.env.NODE_ENV === 'development';

const resolvePreloadPath = () => {
  const preloadPath = path.join(__dirname, isDev ? 'preload.ts' : 'preload.js');

  if (isDev && !existsSync(preloadPath)) {
    return path.join(__dirname, 'preload.js');
  }

  return preloadPath;
};

const resolveRendererUrl = () =>
  isDev
    ? 'http://localhost:5173'
    : pathToFileURL(path.join(__dirname, '../dist/index.html')).toString();

export const getUserDataPath = (...segments: string[]) =>
  path.join(app.getPath('userData'), ...segments);

const applyDevPreloadSupport = () => {
  if (!isDev) {
    return;
  }

  const tsNodeRegisterOption = '--require ts-node/register/transpile-only';
  const existingNodeOptions = process.env.NODE_OPTIONS ?? '';

  if (!existingNodeOptions.includes(tsNodeRegisterOption)) {
    process.env.NODE_OPTIONS = [existingNodeOptions, tsNodeRegisterOption]
      .filter(Boolean)
      .join(' ');
  }

  if (!process.env.TS_NODE_PROJECT) {
    process.env.TS_NODE_PROJECT = path.join(app.getAppPath(), 'electron/tsconfig.json');
  }
};

const createMainWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    title: 'TangoCard',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: resolvePreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
      devTools: isDev,
      webviewTag: false
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  void mainWindow.loadURL(resolveRendererUrl());
};

void app.whenReady().then(() => {
  applyDevPreloadSupport();
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
