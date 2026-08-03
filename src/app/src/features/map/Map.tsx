import {
  AttributionControl,
  CreateAedControl,
  CreateMode,
  DetailView,
  type Notification,
  SearchControl,
  SharedMap,
  type SharedMapState,
  usePrevious,
} from '@defikarte/shared';
import { useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import backend from '../../api/backend';
import iconCheckCircleGreen from '../../assets/icons/icon-check-circle-green.svg';
import iconCrossmarkCircleRed from '../../assets/icons/icon-crossmark-circle-red.svg';
import { CustomToast } from '../../components/ui/custom-toast/CustomToast';
import AppConfiguration from '../../configuration/app.configuration';
import { usePersistenceState } from '../../hooks/usePersistenceState';
import { CapacitorGeolocationService } from '../../services/capacitor-geolocation.service';

const mapConfig = {
  baseUrl: AppConfiguration.baseUrl,
  backendApiKey: AppConfiguration.backendApiKey,
  maptilerApiKey: AppConfiguration.maptilerApiKey,
};

interface MapProps {
  autoStartCreate?: boolean;
}

export const Map = ({ autoStartCreate }: MapProps) => {
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
        <MapControls mapState={mapState} autoStartCreate={autoStartCreate} />
      )}
    </SharedMap>
  );
};

interface MapControlsProps {
  mapState: SharedMapState;
  autoStartCreate?: boolean;
}

const MapControls = ({ mapState, autoStartCreate }: MapControlsProps) => {
  const {
    mapInstance,
    apiClient,
    isInitialized,
    activeBaseLayer,
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
    handleSelectOrCenterFeatureOnMap,
    handleEditFeature,
    handleOnCreateStart,
    selectFeatureOnMap,
    deselectAll,
  } = mapState;
  const navigate = useNavigate();
  const prevCreateMode = usePrevious(createMode);
  // Editing is started from the detail view, which only renders while createMode is none - so an
  // edit never carries the ?create=true param and never highlights the create nav button.
  const isCreatingNew = createMode !== CreateMode.none && !editFeature;

  // create / edit result handling
  const notifyAed = useCallback(({ type, title, message }: Notification) => {
    toast.custom(
      toastInstance => (
        <CustomToast
          toastInstance={toastInstance}
          icon={type === 'success' ? iconCheckCircleGreen : iconCrossmarkCircleRed}
          title={title}
          message={message}
        />
      ),
      {
        id: 'aed-toast',
      }
    );
  }, []);

  // ?create=true is the single source of truth for "a create-new flow is open", so the nav bar can
  // highlight the create button for exactly as long as the flow runs. The effect re-runs on every
  // render because handleOnCreateStart is not memoised in SharedMap, so each branch is guarded to
  // be idempotent. prevCreateMode is what tells "the param just appeared" apart from
  // "the flow just ended" - both look like autoStartCreate && createMode === none.
  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    if (autoStartCreate) {
      // flow finished (submit or the cancel button) -> drop the param, without a history entry
      if (createMode === CreateMode.none && prevCreateMode !== CreateMode.none) {
        void navigate({ to: '/', search: {}, replace: true });
        return;
      }

      // param present but no create-new flow running -> start one. Waiting for isInitialized
      // matters: create mode only sets up the aedCreate overlay on the none -> position
      // transition, which needs a map instance. This also covers tapping create while an edit is
      // open, which switches over to creating a new AED instead of leaving the edit form up.
      if (!isCreatingNew) {
        handleOnCreateStart();
      }

      return;
    }

    // param removed (hardware back, or the "home" nav item) -> cancel the flow
    if (isCreatingNew) {
      setCreateMode(CreateMode.none);
    }
  }, [
    autoStartCreate,
    isInitialized,
    createMode,
    prevCreateMode,
    isCreatingNew,
    handleOnCreateStart,
    setCreateMode,
    navigate,
  ]);

  return (
    <>
      {createMode !== CreateMode.none && (
        <CreateAedControl
          map={mapInstance}
          apiClient={apiClient}
          createMode={createMode}
          feature={editFeature}
          setEditFeature={setEditFeature}
          setCreateMode={setCreateMode}
          onFeatureSelect={selectFeatureOnMap}
          onNotify={notifyAed}
          compact
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
            compact
          />
          <AttributionControl activeBaseLayer={activeBaseLayer} />
          {selectedFeature && (
            <DetailView
              feature={selectedFeature.data}
              userLocation={userLocation}
              onCenterFeature={() => handleSelectOrCenterFeatureOnMap(selectedFeature)}
              onClose={() => deselectAll()}
              onEdit={() => handleEditFeature(selectedFeature)}
              compact
            />
          )}
        </>
      )}
    </>
  );
};
