export {};

declare global {
  interface Window {
    api: import('../shared/apiTypes').ExposedApi;
  }
}
