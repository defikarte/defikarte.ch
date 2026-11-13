import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useRouter } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import type { MapSearch } from '../routes/index';

/** Returns true when it consumed the back, so nothing further happens. */
type BackHandler = () => boolean;

// Screens that claim back before the route fallback, last registered first. Module-level on
// purpose: there is only one app and one back button, so a context would add nothing.
const handlers: { current: BackHandler }[] = [];

/**
 * Where back leads from a route: up the screen hierarchy, not through browser history. The tab
 * roots lead to the map, the start tab, as Material asks for a bottom navigation. null on the map.
 */
export const getBackTarget = (pathname: string): string | null => {
  if (pathname.startsWith('/settings/')) {
    return '/settings';
  }

  // the status page is opened from the version line on About
  if (pathname === '/status') {
    return '/about';
  }

  return pathname === '/' ? null : '/';
};

/** Lets a screen handle back first while `enabled`, e.g. to close a sheet it shows. */
export const useBackHandler = (handler: BackHandler, enabled: boolean) => {
  // a ref, so a handler that is a new closure on every render does not re-register each time
  const ref = useRef(handler);
  useEffect(() => {
    ref.current = handler;
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }

    handlers.push(ref);
    return () => {
      handlers.splice(handlers.indexOf(ref), 1);
    };
  }, [enabled]);
};

/**
 * Wires the Android system back (gesture and button). Without a listener, Capacitor leaves back to
 * the Activity, which closes the app from every screen. iOS has no system back - the settings
 * pages handle the edge swipe themselves, see useEdgeSwipeBack.
 */
export const useAndroidBackButton = () => {
  const router = useRouter();

  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') {
      return;
    }

    const listener = App.addListener('backButton', () => {
      if ([...handlers].reverse().some(handler => handler.current())) {
        return;
      }

      // read at call time, so the listener never has to be re-registered
      const { pathname, search } = router.state.location;

      // dropping the param is what cancels the create flow, see Map.tsx
      if ((search as MapSearch).create) {
        void router.navigate({ to: '/', search: {}, replace: true });
        return;
      }

      const target = getBackTarget(pathname);
      if (target) {
        void router.navigate({ to: target });
        return;
      }

      void App.exitApp();
    });

    return () => {
      void listener.then(handle => handle.remove());
    };
  }, [router]);
};
