import {
  AttributionControl,
  CompassControl,
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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import backend from '../../api/backend';
import iconCheckCircleGreen from '../../assets/icons/icon-check-circle-green.svg';
import iconCrossmarkCircleRed from '../../assets/icons/icon-crossmark-circle-red.svg';
import iconGpsWarningCircleRed from '../../assets/icons/icon-gps-warning-circle-red.svg';
import { CustomToast } from '../../components/ui/custom-toast/CustomToast';
import AppConfiguration from '../../configuration/app.configuration';
import { useAppReady } from '../../hooks/useAppReady';
import { useBaseLayer } from '../../hooks/useBaseLayer';
import { useEmergencyDefault } from '../../hooks/useEmergencyDefault';
import type { MapSearch } from '../../routes/index';
import { CapacitorGeolocationService } from '../../services/capacitor-geolocation.service';
import { getWalkingDirectionsUrl } from '../../services/navigation.service';
import { EmergencyControl } from './emergency/EmergencyControl';

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
    createPosition,
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [, markReady] = useAppReady();
  const prevCreateMode = usePrevious(createMode);
  // Editing is started from the detail view, which only renders while createMode is none - so an
  // edit never carries the ?create=true param and never highlights the create nav button.
  const isCreatingNew = createMode !== CreateMode.none && !editFeature;
  const [emergencyDefault] = useEmergencyDefault();
  // the setting turns the view on at app start, together with its GPS request (below)
  const [isEmergencyActive, setIsEmergencyActive] = useState(() => emergencyDefault === 'on');
  const emergencyGpsStartedRef = useRef(false);

  // The emergency view is useless without the user's position, so turning it on always starts the
  // location request right away (a no-op if GPS is already on).
  const toggleEmergency = () => {
    if (isEmergencyActive) {
      // GPS stays on, the user keeps seeing their position
      setIsEmergencyActive(false);
      return;
    }

    setIsEmergencyActive(true);
    setIsGpsActive(true);
  };

  // Right at start, not after isInitialized: that only flips once every map source has loaded,
  // which can take long after the splash is gone (or never, e.g. offline). useUserLocation waits
  // for the map instance itself before it requests the permission and the position.
  useEffect(() => {
    if (emergencyGpsStartedRef.current) {
      return;
    }

    emergencyGpsStartedRef.current = true;
    if (isEmergencyActive) {
      setIsGpsActive(true);
    }
  }, [isEmergencyActive, setIsGpsActive]);

  // GPS turned off with the search bar button also ends the emergency view: without a position its
  // list would be stale. (A failed request turns GPS off too, but the view stays to offer a retry.)
  const setIsGpsActiveFromSearch: typeof setIsGpsActive = value => {
    const next = typeof value === 'function' ? value(isGpsActive) : value;
    if (!next) {
      setIsEmergencyActive(false);
    }
    setIsGpsActive(next);
  };

  // Requests the position again. A fatal error has already turned GPS off; an inaccurate fix keeps
  // it on, so it is turned off first - in a later tick, or React would batch both into a no-op.
  const retryLocation = () => {
    setIsGpsActive(false);
    setTimeout(() => setIsGpsActive(true));
  };

  // The splash covers everything until here, so the user never sees the empty map container while
  // maplibre boots. AppReadyProvider holds a timeout that gives up if the map never initialises.
  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    markReady();
  }, [isInitialized, markReady]);

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

  // location error handling
  useEffect(() => {
    if (!locationError) {
      return;
    }

    toast.custom(
      toastInstance => (
        <CustomToast
          toastInstance={toastInstance}
          icon={iconGpsWarningCircleRed}
          title={t('locationErrorTitle')}
          message={t(locationError)}
        />
      ),
      {
        id: 'location-toast',
      }
    );
  }, [locationError, t]);

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
          createPosition={createPosition}
          setEditFeature={setEditFeature}
          setCreateMode={setCreateMode}
          onFeatureSelect={selectFeatureOnMap}
          onNotify={notifyAed}
          userLocation={userLocation}
          compact
        />
      )}
      {createMode === CreateMode.none && (
        <>
          <SearchControl
            map={mapInstance}
            apiClient={apiClient}
            isGpsActive={isGpsActive}
            setIsGpsActive={setIsGpsActiveFromSearch}
            onFeatureSelect={handleSelectOrCenterFeatureOnMap}
            activeOverlays={activeOverlays}
            setActiveOverlays={setActiveOverlays}
            compact
          />
          <AttributionControl activeBaseLayer={activeBaseLayer} />
          {/* under the search bar (top-4 + 52px), right gutter independent of the search bar width */}
          <CompassControl map={mapInstance} className="absolute top-20 right-4 z-4" large />
          <EmergencyControl
            map={mapInstance}
            isActive={isEmergencyActive}
            onToggle={toggleEmergency}
            userLocation={userLocation}
            locationError={locationError}
            onRetryLocation={retryLocation}
            onFeatureSelect={handleSelectOrCenterFeatureOnMap}
            // closing the detail view leaves an item-select event without data, not null
            showList={!selectedFeature?.data}
          />
          {selectedFeature && (
            <DetailView
              map={mapInstance}
              feature={selectedFeature.data}
              userLocation={userLocation}
              onCenterFeature={() => handleSelectOrCenterFeatureOnMap(selectedFeature)}
              onClose={() => deselectAll()}
              onEdit={() => handleEditFeature(selectedFeature)}
              getDirectionsUrl={getWalkingDirectionsUrl}
              compact
            />
          )}
        </>
      )}
    </>
  );
};
