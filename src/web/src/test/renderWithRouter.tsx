import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { render } from '@testing-library/react';
import { type ReactNode } from 'react';

/**
 * Renders a component inside a minimal router, for components using `Link` or other router hooks.
 * The router renders asynchronously, so query with `findBy*` instead of `getBy*`.
 */
export const renderWithRouter = (ui: ReactNode) => {
  const router = createRouter({
    routeTree: createRootRoute({ component: () => ui }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
    context: {
      isMapFullscreen: false,
      setIsMapFullscreen: () => undefined,
    },
  });

  return render(<RouterProvider router={router} />);
};
