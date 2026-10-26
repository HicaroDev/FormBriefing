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
        formsHub: resolve(__dirname, 'forms-hub.html'),
        crm: resolve(__dirname, 'crm.html'),
        formBuilder: resolve(__dirname, 'form-builder.html'),
        projects: resolve(__dirname, 'projects.html'),
        projectDetail: resolve(__dirname, 'project-detail.html'),
        clientTracking: resolve(__dirname, 'client-tracking.html'),
      }
    }
  }
});
