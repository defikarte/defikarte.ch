import { createRootRoute, Outlet } from '@tanstack/react-router';
import { Toaster } from 'react-hot-toast';
import { NavBar } from '../app/layout/nav-bar/NavBar';

function RootComponent() {
  return (
    <div className="w-full h-screen flex flex-col">
      <Toaster
        position="top-center"
        containerStyle={{ zIndex: 50, top: '1rem', left: '1rem', right: '1rem' }}
        toastOptions={{ duration: 7200 }}
      />
      <main className="grow overflow-auto">
        <Outlet />
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
