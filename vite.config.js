import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // GitHub Pages serves the demo from /Mind-Mapper/
  base: process.env.BASE_PATH || '/',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Split rarely-changing libraries into their own files so browsers cache them across releases
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) return 'react';
          if (id.includes('node_modules/@xyflow') || id.includes('node_modules/d3-')) return 'flow';
        },
      },
    },
  },
  server: {
    port: 3000,
    // Forward API calls to the Express server during development
    proxy: { '/api': 'http://localhost:5000' },
  },
  test: {
    environment: 'jsdom',
  },
});
