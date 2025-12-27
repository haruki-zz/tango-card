import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  main: {
    build: {
      outDir: 'dist-electron/main',
      rollupOptions: {
        output: {
          entryFileNames: '[name].js',
        },
      },
    },
    resolve: {
      alias: {
        '@main': path.resolve(__dirname, 'src/main'),
        '@shared': path.resolve(__dirname, 'src/shared'),
      },
    },
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    build: {
      outDir: 'dist-electron/preload',
      rollupOptions: {
        output: {
          entryFileNames: '[name].js',
        },
      },
    },
    resolve: {
      alias: {
        '@preload': path.resolve(__dirname, 'src/preload'),
        '@shared': path.resolve(__dirname, 'src/shared'),
      },
    },
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    build: {
      outDir: 'dist',
    },
    resolve: {
      alias: {
        '@renderer': path.resolve(__dirname, 'src/renderer/src'),
      },
    },
    plugins: [react()],
  },
});
