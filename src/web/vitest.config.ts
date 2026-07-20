import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Ensure a single React copy is used when importing components from the
  // linked @defikarte/shared workspace package (otherwise hooks in shared
  // components resolve a duplicate React and throw "invalid hook call").
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
