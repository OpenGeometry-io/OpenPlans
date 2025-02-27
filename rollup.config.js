import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
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
  external: ['three'],
  plugins: [
    resolve(),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,                // Enable type declaration files
      declarationDir: 'dist/types',     // Place declaration files in dist/types
      outDir: 'dist',                   // Place all JS files in dist
      rootDir: 'src',                   // Ensure TypeScript files are compiled from src
    })
  ]
});
