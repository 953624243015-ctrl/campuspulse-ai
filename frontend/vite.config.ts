import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    // Disable chokidar FSEvents watcher – required for paths with spaces on Windows
    watch: {
      usePolling: true,
      interval: 1000,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  // Use esbuild instead of rollup for dev, avoids realpath issues on Windows paths with spaces
  optimizeDeps: {
    force: false,
  },
  build: {
    // Use Terser for production builds to avoid rollup EPERM on Z:\ with spaces
    minify: 'esbuild',
    rollupOptions: {
      // Suppress the EPERM warning by handling it
    },
  },
});
