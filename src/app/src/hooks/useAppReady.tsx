import { createContext, type ReactNode, use, useCallback, useEffect, useMemo, useState } from 'react';

/** How long the splash may stay up if the map never reports itself initialised. */
const SPLASH_TIMEOUT_MS = 5000;

type AppReadyContextValue = [boolean, () => void];

const AppReadyContext = createContext<AppReadyContextValue | null>(null);

/**
 * Holds "the app has something to show" - the map reports it, the root layout uses it to take the
 * splash down. It lives in a context because the two are far apart: the flag comes out of
 * SharedMap's render prop deep inside the map, while the splash has to cover the nav bar too and
 * can only be rendered at the root.
 */
export const AppReadyProvider = ({ children }: { children: ReactNode }) => {
  const [isReady, setIsReady] = useState(false);
  const markReady = useCallback(() => setIsReady(true), []);

  // Without this a map that never initialises - no network on a cold start, say - would leave the
  // splash up forever, because nothing else hides it.
  useEffect(() => {
    const timeout = setTimeout(markReady, SPLASH_TIMEOUT_MS);

    return () => clearTimeout(timeout);
  }, [markReady]);

  const value = useMemo<AppReadyContextValue>(() => [isReady, markReady], [isReady, markReady]);

  return <AppReadyContext value={value}>{children}</AppReadyContext>;
};

/**
 * Whether the app is ready to be shown, and the callback that says so. Read by the root layout to
 * drop the splash screen, called by the map once it is initialised.
 */
export const useAppReady = (): AppReadyContextValue => {
  const context = use(AppReadyContext);
  if (!context) {
    throw new Error('useAppReady must be used within an AppReadyProvider');
  }

  return context;
};
