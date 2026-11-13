import { createContext, type ReactNode, use, useMemo } from 'react';
import AppConfiguration from '../configuration/app.configuration';
import { usePersistenceState } from './usePersistenceState';

// a string, because usePersistenceState stores everything but arrays as one
export type StartView = 'map' | 'location' | 'emergency';

type StartViewContextValue = [StartView, (value: StartView) => void];

const StartViewContext = createContext<StartViewContextValue | null>(null);

// the former "emergency view on start" setting carries over until the user picks a start view
const legacyStartView = (): StartView =>
  localStorage.getItem(AppConfiguration.legacyEmergencyViewLocalStorageKey) === 'on'
    ? 'emergency'
    : 'map';

/**
 * Holds the single instance of the persisted start view setting, shared by the map and the settings
 * screen like `BaseLayerProvider`.
 */
export const StartViewProvider = ({ children }: { children: ReactNode }) => {
  const [value, setValue] = usePersistenceState<StartView>(
    AppConfiguration.startViewLocalStorageKey,
    legacyStartView()
  );
  const context = useMemo<StartViewContextValue>(() => [value, setValue], [value, setValue]);

  return <StartViewContext value={context}>{children}</StartViewContext>;
};

/**
 * What the map shows when the app starts: the overview, the user's position or the emergency view,
 * persisted in local storage.
 */
export const useStartView = (): StartViewContextValue => {
  const context = use(StartViewContext);
  if (!context) {
    throw new Error('useStartView must be used within a StartViewProvider');
  }

  return context;
};
