import { defineConfig } from 'vite';
import { resolve } from 'path';
import { globSync } from 'glob';
import { trackPlugin } from './scripts/trackings.js';
import path from 'path';

// Dynamically find all HTML files in the examples folder
function getExampleInputs() {
  const inputs = {
    main: resolve(__dirname, 'examples/src/index.html'),
  };

  // Find all HTML files in examples folder recursively
  const exampleFiles = globSync('examples/src/**/*.html');

  exampleFiles.forEach((file) => {
    // Create a unique key from the file path (e.g., 'primitives-line' from 'examples/src/primitives/line.html')
    const relativePath = path.relative('examples/src', file);
    const key = relativePath.replace(/\.html$/, '').replace(/[\/\\]/g, '-');
    inputs[key] = resolve(__dirname, file);
  });

  return inputs;
}

export default defineConfig({
  base: './',
  resolve: {
    dedupe: ['three'],
    alias: {
      '@src': resolve(__dirname, 'src'),
    },
  },
  optimizeDeps: {
    exclude: ['opengeometry'],
  },
  plugins: [trackPlugin()],
  build: {
    target: 'esnext',  // Enable top-level await support
    outDir: 'examples/dist',
    rollupOptions: {
      input: getExampleInputs(),
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
