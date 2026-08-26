import { MapConfiguration } from '@defikarte/shared';
import AppConfiguration from '../configuration/app.configuration';
import { usePersistenceState } from './usePersistenceState';

/**
 * The active base layer id, persisted in local storage. Shared between the map and the map design
 * settings screen - the settings screen writes it, the map picks it up when it mounts again.
 */
export const useBaseLayer = () =>
  usePersistenceState<string>(
    AppConfiguration.baseLayerLocalStorageKey,
    MapConfiguration.osmVectorBasemapId
  );
