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
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import backend from '../../api/backend';
import iconCheckCircleGreen from '../../assets/icons/icon-check-circle-green.svg';
import iconCrossmarkCircleRed from '../../assets/icons/icon-crossmark-circle-red.svg';
import { CustomToast } from '../../components/ui/custom-toast/CustomToast';
import AppConfiguration from '../../configuration/app.configuration';
import { useBaseLayer } from '../../hooks/useBaseLayer';
import type { MapSearch } from '../../routes/index';
import { CapacitorGeolocationService } from '../../services/capacitor-geolocation.service';

const mapConfig = {
  baseUrl: AppConfiguration.baseUrl,
  backendApiKey: AppConfiguration.backendApiKey,
  maptilerApiKey: AppConfiguration.maptilerApiKey,
};

interface MapProps {
  /** Whether the map is the screen currently shown - false while another route is on top of it. */
  isActive: boolean;
}

export const Map = ({ isActive }: MapProps) => {
  const locationProvider = useMemo(() => new CapacitorGeolocationService(), []);
  const [persistedBaseLayer, setPersistedBaseLayer] = useBaseLayer();
  // The map lives in the root layout, outside the "/" route, so the create param is read from the
  // router state instead of Route.useSearch().
  const autoStartCreate = useRouterState({
    select: state => (state.location.search as MapSearch).create,
  });

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
        <MapControls mapState={mapState} autoStartCreate={autoStartCreate} isActive={isActive} />
      )}
    </SharedMap>
  );
};

interface MapControlsProps {
  mapState: SharedMapState;
  autoStartCreate?: boolean;
  isActive: boolean;
}

const MapControls = ({ mapState, autoStartCreate, isActive }: MapControlsProps) => {
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
    // While another route is on top, the map keeps its create flow but the url no longer carries
    // the param, so syncing would cancel the flow - and its "flow finished" branch would navigate
    // away from the page the user is actually on.
    if (!isInitialized || !isActive) {
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
    isActive,
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
