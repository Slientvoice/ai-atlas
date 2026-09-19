import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  define: { __ATLAS_STATIC_BASE__: JSON.stringify('.') },
  plugins: [react()],
  build: {
    outDir: '.portal-build',
    emptyOutDir: true,
    rollupOptions: { input: 'portal.html' },
  },
});
