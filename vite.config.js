import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.js'), // Your main entry file
      name: 'index', // UMD name (optional unless using UMD)
      fileName: (format) => `index.${format}.js`, // Output filenames
      formats: ['es', 'cjs'], // or ['es', 'umd'] if you want UMD
    },
    rollupOptions: {
      external: ['react', 'vue'], // external dependencies (don't bundle them)
      output: {
        globals: {
          react: 'React',
          vue: 'Vue'
        }
      }
    },
    outDir: 'dist', // Optional, default is 'dist'
    emptyOutDir: true, // Clear the output directory before building
  }
});
