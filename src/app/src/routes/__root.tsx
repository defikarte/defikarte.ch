import { createRootRoute, Outlet, useRouterState } from '@tanstack/react-router';
import { Toaster } from 'react-hot-toast';
import { NavBar } from '../app/layout/nav-bar/NavBar';
import { Map } from '../features/map/Map';

function RootComponent() {
  const pathname = useRouterState({ select: state => state.location.pathname });
  const isMapRoute = pathname === '/';

  return (
    <div className="w-full h-screen flex flex-col">
      <Toaster
        position="top-center"
        containerStyle={{ zIndex: 50, top: '1rem', left: '1rem', right: '1rem' }}
        toastOptions={{ duration: 7200 }}
      />
      <main className="grow relative overflow-hidden">
        {/* The map is mounted by the root layout and only hidden on other routes, so navigating
            away keeps the maplibre instance alive with its position, selection and create flow.
            "invisible" instead of "hidden" on purpose: the container keeps its box, so the canvas
            keeps its size and needs no resize when it comes back. */}
        <div
          className={`absolute inset-0 ${isMapRoute ? '' : 'invisible pointer-events-none'}`}
          aria-hidden={!isMapRoute}
          inert={!isMapRoute}
        >
          <Map isActive={isMapRoute} />
        </div>
        {!isMapRoute && (
          <div className="absolute inset-0 overflow-auto">
            <Outlet />
          </div>
        )}
      </main>
      <nav className="shrink-0">
        <NavBar />
      </nav>
    </div>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
});
