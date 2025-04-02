import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: './',
  build: {
    outDir: 'examples-dist',
    rollupOptions: {
      input: {
        main: 'index.html',
        door: resolve(__dirname, 'examples/door.html'),
        wall: resolve(__dirname, 'examples/wall.html'),
        spaceContainer: resolve(__dirname, 'examples/spaceContainer.html'),
      },
      output: {
        entryFileNames: 'assets/js/[name]-[hash].js', // JS files inside assets/js
        chunkFileNames: 'assets/chunks/[name]-[hash].js', // Chunked JS files
        assetFileNames: 'assets/static/[name]-[hash][extname]', // Organize static files
      },
    },
  },
  server: {
    port: 5555
  }
});