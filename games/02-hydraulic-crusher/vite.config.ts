import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@arcade/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts')
    }
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 10000000,
    chunkSizeWarningLimit: 2000
  }
});
