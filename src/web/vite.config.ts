import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      routesDirectory: './src/routes',
      generatedRouteTree: './src/routeTree.gen.ts',
      routeFileIgnorePrefix: '-',
      quoteStyle: 'single',
    }),
    react(),
  ],
  // @defikarte/shared is a linked workspace package resolved as source, so its bare
  // imports resolve from src/shared/node_modules -- a directory owned by whichever
  // workspace ran `pnpm install` last. Dedupe forces every React-family module to
  // this app's copy; without it, hooks inside shared components resolve a second
  // React and throw "Invalid hook call". Keep this list in sync with vitest.config.ts.
  resolve: {
    dedupe: ['react', 'react-dom', 'react-i18next', 'react-responsive', 'react-hook-form'],
  },
  server: {
    watch: {
      usePolling: true,
    },
  },
});
