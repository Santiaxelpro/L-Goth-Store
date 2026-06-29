import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'utils': ['dompurify', 'clsx'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/products': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/csrf-token': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/add': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/update-price': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/update-stock': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/update-image': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/delete': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
     '/health': {
       target: 'http://localhost:8080',
       changeOrigin: true,
     },
     '/contacto': {
       target: 'http://localhost:8080',
       changeOrigin: true,
     },
     '/create-order': {
       target: 'http://localhost:8080',
       changeOrigin: true,
     },
   },
  },
  preview: {
    port: 4173,
  },
});
