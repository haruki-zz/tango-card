import { contextBridge, ipcRenderer } from 'electron';
import { createPreloadApi } from './createApi';

const api = createPreloadApi(ipcRenderer.invoke.bind(ipcRenderer));

contextBridge.exposeInMainWorld('api', api);
