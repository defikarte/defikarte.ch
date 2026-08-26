import { MapConfiguration } from '@defikarte/shared';
import { createContext, type ReactNode, use, useMemo } from 'react';
import AppConfiguration from '../configuration/app.configuration';
import { usePersistenceState } from './usePersistenceState';

type BaseLayerContextValue = [string, (value: string) => void];

const BaseLayerContext = createContext<BaseLayerContextValue | null>(null);

/**
 * Holds the single instance of the persisted base layer state. The map and the map design settings
 * screen are mounted at the same time, so they have to read from and write to the same state -
 * usePersistenceState alone gives every caller its own useState, which would not sync live.
 */
export const BaseLayerProvider = ({ children }: { children: ReactNode }) => {
  const [baseLayer, setBaseLayer] = usePersistenceState<string>(
    AppConfiguration.baseLayerLocalStorageKey,
    MapConfiguration.osmVectorBasemapId
  );
  const value = useMemo<BaseLayerContextValue>(() => [baseLayer, setBaseLayer], [baseLayer, setBaseLayer]);

  return <BaseLayerContext value={value}>{children}</BaseLayerContext>;
};

/**
 * The active base layer id, persisted in local storage. Shared between the map and the map design
 * settings screen - the settings screen writes it, the mounted map applies it right away.
 */
export const useBaseLayer = (): BaseLayerContextValue => {
  const context = use(BaseLayerContext);
  if (!context) {
    throw new Error('useBaseLayer must be used within a BaseLayerProvider');
  }

  return context;
};
