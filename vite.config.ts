import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@src': resolve(__dirname, 'src'),
      '@shared': resolve(__dirname, 'src/shared'),
      '@domain': resolve(__dirname, 'src/domain')
    }
  },
  build: {
    outDir: 'dist/renderer',
    sourcemap: true,
    rollupOptions: {
      input: resolve(__dirname, 'index.html')
    }
  }
});
