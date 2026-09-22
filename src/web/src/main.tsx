import { createRouter, RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './i18n/i18n.ts';
import './index.css';
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
    <RouterProvider router={router} />
  </StrictMode>
);
