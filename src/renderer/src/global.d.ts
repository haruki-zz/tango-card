declare global {
  interface Window {
    platformInfo: {
      platform: NodeJS.Platform;
      node: string;
      chrome: string;
      electron: string;
    };
  }
}

export {};
