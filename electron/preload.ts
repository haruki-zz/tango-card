import { contextBridge, ipcRenderer } from 'electron';

import { createPreloadApi, freezePreloadApi } from './preload-api';

const electronAPI = freezePreloadApi(createPreloadApi(ipcRenderer));

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
