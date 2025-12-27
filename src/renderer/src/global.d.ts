import type { RendererApi } from '@shared/ipc';

declare global {
  interface Window {
    platformInfo: {
      platform: NodeJS.Platform;
      node: string;
      chrome: string;
      electron: string;
    };
    api: RendererApi;
  }
}

export {};
