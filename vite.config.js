import { defineConfig } from 'vite';
import path from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [dts({
    insertTypesEntry: true, // adds "types" to package.json exports
  })],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'), // Your main entry file
      name: 'index', // UMD name (optional unless using UMD)
      fileName: (format) => `index.${format}.js`, // Output filenames
      formats: ['es', 'cjs'], // or ['es', 'umd'] if you want UMD
    },
    rollupOptions: {
      external: ['react'], // external dependencies (don't bundle them)
      output: {
        globals: {
          react: 'React',
        }
      }
    },
    outDir: 'dist', // Optional, default is 'dist'
    emptyOutDir: true, // Clear the output directory before building
  }
});
