import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Lets the dev dashboard call fetch('/api/...') without CORS or a
      // VITE_API_BASE_URL, forwarding to a locally running server/api.js.
      '/api': {
        target: process.env.WATCHER_API_URL ?? 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
});
