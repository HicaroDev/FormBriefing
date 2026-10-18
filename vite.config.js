import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html'),
        portal: resolve(__dirname, 'portal.html'),
        clientForm: resolve(__dirname, 'client-form.html'),
        pilates: resolve(__dirname, 'pilates.html'),
        physio: resolve(__dirname, 'physio.html'),
        events: resolve(__dirname, 'events.html'),
        universal: resolve(__dirname, 'universal.html')
      }
    }
  }
});
