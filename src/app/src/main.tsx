import { createRouter, RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './i18n/i18n.ts';
import './app/styles/index.css';
import { AppReadyProvider } from './hooks/useAppReady';
import { BaseLayerProvider } from './hooks/useBaseLayer';
import { StartViewProvider } from './hooks/useStartView';
import { routeTree } from './routeTree.gen';

const router = createRouter({
  routeTree,
  context: {
    isMapFullscreen: undefined!,
    setIsMapFullscreen: undefined!,
  },
});

// Register router types for typesafety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppReadyProvider>
      <BaseLayerProvider>
        <StartViewProvider>
          <RouterProvider router={router} />
        </StartViewProvider>
      </BaseLayerProvider>
    </AppReadyProvider>
  </StrictMode>
);
