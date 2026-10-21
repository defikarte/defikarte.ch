import { createContext, type ReactNode, use, useMemo } from 'react';
import AppConfiguration from '../configuration/app.configuration';
import { usePersistenceState } from './usePersistenceState';

// a string, because usePersistenceState stores everything but arrays as one
export type EmergencyDefault = 'on' | 'off';

type EmergencyDefaultContextValue = [EmergencyDefault, (value: EmergencyDefault) => void];

const EmergencyDefaultContext = createContext<EmergencyDefaultContextValue | null>(null);

/**
 * Holds the single instance of the persisted "emergency view on by default" setting, shared by the
 * map and the settings screen like `BaseLayerProvider`.
 */
export const EmergencyDefaultProvider = ({ children }: { children: ReactNode }) => {
  const [value, setValue] = usePersistenceState<EmergencyDefault>(
    AppConfiguration.emergencyViewLocalStorageKey,
    'off'
  );
  const context = useMemo<EmergencyDefaultContextValue>(() => [value, setValue], [value, setValue]);

  return <EmergencyDefaultContext value={context}>{children}</EmergencyDefaultContext>;
};

/** Whether the emergency view is turned on when the app starts, persisted in local storage. */
export const useEmergencyDefault = (): EmergencyDefaultContextValue => {
  const context = use(EmergencyDefaultContext);
  if (!context) {
    throw new Error('useEmergencyDefault must be used within an EmergencyDefaultProvider');
  }

  return context;
};
