import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import { defineConfig } from 'rollup';

export default defineConfig({
  input: 'src/index.ts',
  output: [
    {
      dir: 'dist/',
      format: 'esm',
      sourcemap: true,
      entryFileNames: '[name].js'
    }
  ],
  external: ['three', 'opengeometry', 'camera-controls', 'jspdf'],
  plugins: [
    resolve(),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',      // Use the tsconfig file for TypeScript options
      declaration: true,                // Enable type declaration files
      declarationDir: 'dist/types',     // Place declaration files in dist/types
      outDir: 'dist',                   // Place all JS files in dist
      rootDir: '.',                     // Compile facade and internal workspace sources together
      include: ['src/**/*', 'packages/**/*'],
    })
  ]
});
