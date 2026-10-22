import { createContext, type ReactNode, use, useMemo } from 'react';
import AppConfiguration from '../configuration/app.configuration';
import { usePersistenceState } from './usePersistenceState';

// a string, because usePersistenceState stores everything but arrays as one
export type LocationDefault = 'on' | 'off';

type LocationDefaultContextValue = [LocationDefault, (value: LocationDefault) => void];

const LocationDefaultContext = createContext<LocationDefaultContextValue | null>(null);

/**
 * Holds the single instance of the persisted "locate the user on start" setting, shared by the map
 * and the settings screen like `EmergencyDefaultProvider`.
 */
export const LocationDefaultProvider = ({ children }: { children: ReactNode }) => {
  const [value, setValue] = usePersistenceState<LocationDefault>(
    AppConfiguration.locationLocalStorageKey,
    'off'
  );
  const context = useMemo<LocationDefaultContextValue>(() => [value, setValue], [value, setValue]);

  return <LocationDefaultContext value={context}>{children}</LocationDefaultContext>;
};

/** Whether the app requests the user's position and zooms to it on start, persisted in local storage. */
export const useLocationDefault = (): LocationDefaultContextValue => {
  const context = use(LocationDefaultContext);
  if (!context) {
    throw new Error('useLocationDefault must be used within a LocationDefaultProvider');
  }

  return context;
};
