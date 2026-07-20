import {
  AttributionControl,
  DetailView,
  SearchControl,
  SharedMap,
  type SharedMapState,
} from '@defikarte/shared';
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
      {(mapState: SharedMapState) => <MapControls mapState={mapState} />}
    </SharedMap>
  );
};

interface MapControlsProps {
  mapState: SharedMapState;
}

const MapControls = ({ mapState }: MapControlsProps) => {
  const {
    mapInstance,
    apiClient,
    activeBaseLayer,
    setActiveBaseLayer,
    activeOverlays,
    setActiveOverlays,
    selectedFeature,
    editFeature,
    setEditFeature,
    createMode,
    setCreateMode,
    userLocation,
    isGpsActive,
    setIsGpsActive,
    locationError,
    handleSelectOrCenterFeatureOnMap,
    handleEditFeature,
    handleOnCreateStart,
    selectFeatureOnMap,
    deselectAll,
  } = mapState;

  return (
    <>
      <SearchControl
        map={mapInstance}
        apiClient={apiClient}
        isGpsActive={isGpsActive}
        setIsGpsActive={setIsGpsActive}
        onFeatureSelect={handleSelectOrCenterFeatureOnMap}
        activeOverlays={activeOverlays}
        setActiveOverlays={setActiveOverlays}
      />
      <AttributionControl activeBaseLayer={activeBaseLayer} />
      {selectedFeature && (
        <DetailView
          feature={selectedFeature.data}
          userLocation={userLocation}
          onCenterFeature={() => handleSelectOrCenterFeatureOnMap(selectedFeature)}
          onClose={() => deselectAll()}
          onEdit={() => handleEditFeature(selectedFeature)}
        />
      )}
    </>
  );
};
