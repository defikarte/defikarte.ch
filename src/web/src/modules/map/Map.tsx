import {
  AttributionControl,
  CreateMode,
  DetailView,
  SearchControl,
  SharedMap,
  type SharedMapState,
} from '@defikarte/shared';
import { type Dispatch, type SetStateAction, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import backend from '../../api/backend';
import iconGpsWarningCircleRed from '../../assets/icons/icon-gps-warning-circle-red.svg';
import { CustomToast } from '../../components/ui/custom-toast/CustomToast';
import { SplashScreen } from '../../components/ui/splash-screen/SplashScreen';
import AppConfiguration from '../../configuration/app.configuration';
import { GeolocationService } from '../../services/geolocation.service';
import { CreateAedControl } from './controls/create-aed-control/CreateAedControl';
import { CreateButtonControl } from './controls/create-button-control/CreateButtonControl';
import { MapControl } from './controls/map-control/MapControl';
import { SponsorControl } from './controls/sponsor-control/SponsorControl';
import { usePersistenceState } from './hooks/usePersistenceState';

const mapConfig = {
  baseUrl: AppConfiguration.baseUrl,
  backendApiKey: AppConfiguration.backendApiKey,
  maptilerApiKey: AppConfiguration.maptilerApiKey,
};

interface MapProps {
  isHash: boolean;
  setIsFullscreen?: Dispatch<SetStateAction<boolean>>;
}

export const Map = ({ isHash, setIsFullscreen }: MapProps) => {
  const { t } = useTranslation();
  const locationProvider = useMemo(() => new GeolocationService(), []);
  const [persistedBaseLayer, setPersistedBaseLayer] = usePersistenceState<string>(
    AppConfiguration.baseLayerLocalStorageKey,
    'osm-vector'
  );

  return (
    <SharedMap
      config={mapConfig}
      apiClient={backend}
      locationProvider={locationProvider}
      isHash={isHash}
      persistedBaseLayer={persistedBaseLayer}
      onBaseLayerChange={setPersistedBaseLayer}
      splashScreen={<SplashScreen />}
    >
      {(mapState: SharedMapState) => (
        <MapControls mapState={mapState} setIsFullscreen={setIsFullscreen} t={t} />
      )}
    </SharedMap>
  );
};

interface MapControlsProps {
  mapState: SharedMapState;
  setIsFullscreen?: Dispatch<SetStateAction<boolean>>;
  t: (key: string) => string;
}

const MapControls = ({ mapState, setIsFullscreen, t }: MapControlsProps) => {
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

  // automaticly activate fullscreen for editing function
  useEffect(() => {
    if (!setIsFullscreen) {
      return;
    }

    setIsFullscreen(createMode === CreateMode.position || createMode === CreateMode.form);

    return () => {
      setIsFullscreen(false);
    };
  }, [createMode, setIsFullscreen]);

  // location error handling
  useEffect(() => {
    if (locationError) {
      toast.custom(toastInstance => (
        <CustomToast
          toastInstance={toastInstance}
          title={t('locationErrorTitle')}
          message={t(locationError)}
          icon={iconGpsWarningCircleRed}
        />
      ));
    }
  }, [locationError, t]);

  return (
    <>
      <MapControl
        map={mapInstance}
        setActiveBaseLayer={setActiveBaseLayer}
        activeBaseLayer={activeBaseLayer}
        createMode={createMode}
      />
      {createMode !== CreateMode.none && (
        <CreateAedControl
          map={mapInstance}
          createMode={createMode}
          feature={editFeature}
          setEditFeature={setEditFeature}
          setCreateMode={setCreateMode}
          onFeatureSelect={selectFeatureOnMap}
        />
      )}
      {createMode === CreateMode.none && (
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
          <CreateButtonControl onCreateStart={handleOnCreateStart} />
          <SponsorControl />
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
      )}
    </>
  );
};
