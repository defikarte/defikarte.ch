import { AttributionControl, SharedMap, type SharedMapState } from '@defikarte/shared';
import { useMemo } from 'react';
import backend from '../../api/backend';
import AppConfiguration from '../../configuration/app.configuration';
import { usePersistenceState } from '../../hooks/usePersistenceState';
import { CapacitorGeolocationService } from '../../services/capacitor-geolocation.service';

const mapConfig = {
  baseUrl: AppConfiguration.baseUrl,
  backendApiKey: AppConfiguration.backendApiKey,
  maptilerApiKey: AppConfiguration.maptilerApiKey,
};

export const Map = () => {
  const locationProvider = useMemo(() => new CapacitorGeolocationService(), []);
  const [persistedBaseLayer, setPersistedBaseLayer] = usePersistenceState<string>(
    AppConfiguration.baseLayerLocalStorageKey,
    'osm-vector'
  );

  return (
    <SharedMap
      config={mapConfig}
      apiClient={backend}
      locationProvider={locationProvider}
      isHash={false}
      persistedBaseLayer={persistedBaseLayer}
      onBaseLayerChange={setPersistedBaseLayer}
    >
      {(mapState: SharedMapState) => (
        <>
          <AttributionControl activeBaseLayer={mapState.activeBaseLayer} />
        </>
      )}
    </SharedMap>
  );
};
