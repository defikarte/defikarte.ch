import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { createRootRoute, Outlet, useRouterState } from '@tanstack/react-router';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { NavBar } from '../app/layout/nav-bar/NavBar';
import { SplashScreen as AppSplashScreen } from '../components/ui/splash-screen/SplashScreen';
import { Map } from '../features/map/Map';
import { useAppReady } from '../hooks/useAppReady';

function RootComponent() {
  const pathname = useRouterState({ select: state => state.location.pathname });
  const [isReady] = useAppReady();
  const isMapRoute = pathname === '/';

  // The app draws under the system bars, so the bar icons sit on top of app content and have to be
  // told which background they are over. The enum reads backwards: Light means dark icons for a
  // light background (the map), Dark means light icons for a dark one (the green settings pages).
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    void SystemBars.setStyle({
      style: isMapRoute ? SystemBarsStyle.Light : SystemBarsStyle.Dark,
    });
  }, [isMapRoute]);

  // Hand the native launch splash over to the in-app one. Waiting for the frame after the first
  // paint is the point: hiding it any earlier would show the bare page between the two, and both
  // are the same white artwork, so handing over after the overlay is on screen makes the seam
  // invisible. The overlay itself stays until the map is ready.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => void SplashScreen.hide());
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="w-full h-dvh flex flex-col">
      {!isReady && <AppSplashScreen />}
      <Toaster
        position="top-center"
        containerStyle={{
          zIndex: 50,
          top: 'calc(1rem + var(--sa-top))',
          left: 'calc(1rem + var(--sa-left))',
          right: 'calc(1rem + var(--sa-right))',
        }}
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
