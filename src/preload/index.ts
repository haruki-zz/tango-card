import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('platformInfo', {
  platform: process.platform,
  node: process.versions.node,
  chrome: process.versions.chrome,
  electron: process.versions.electron,
});
