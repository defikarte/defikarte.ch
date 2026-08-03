import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Ensure a single React copy is used when importing components from the
  // linked @defikarte/shared workspace package (otherwise hooks in shared
  // components resolve a duplicate React and throw "invalid hook call").
  // react-i18next has to be deduped too: it is a peer dependency of shared, but
  // shared/node_modules holds its own copy pinned to a different React.
  resolve: {
    dedupe: ['react', 'react-dom', 'react-i18next'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
