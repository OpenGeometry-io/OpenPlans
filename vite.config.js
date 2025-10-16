import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: './',
  build: {
    outDir: 'examples-dist',
    rollupOptions: {
      input: {
        main: 'index.html',
        // Primitives (referenced in index.html)
        line: resolve(__dirname, 'examples/primitives/line.html'),
        polyline: resolve(__dirname, 'examples/primitives/polyline.html'),
        arc: resolve(__dirname, 'examples/primitives/arc.html'),  
        rectangle: resolve(__dirname, 'examples/primitives/rectangle.html'),
        
        // Shapes (referenced in index.html)
        cuboid: resolve(__dirname, 'examples/shapes/cuboid.html'),
        cylinder: resolve(__dirname, 'examples/shapes/cylinder.html'),
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