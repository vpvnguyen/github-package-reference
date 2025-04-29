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
      formats: ['es', 'cjs'], // Output formats
      fileName: (format) => `index.${format}.js`, // Output filenames
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
