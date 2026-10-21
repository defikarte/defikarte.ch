import {
  AttributionControl,
  CompassControl,
  CreateAedControl,
  CreateMode,
  DetailView,
  FEATURE_STATE,
  FilterType,
  type Notification,
  SearchControl,
  SharedMap,
  type SharedMapState,
  usePrevious,
} from '@defikarte/shared';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import backend from '../../api/backend';
import iconCheckCircleGreen from '../../assets/icons/icon-check-circle-green.svg';
import iconCrossmarkCircleRed from '../../assets/icons/icon-crossmark-circle-red.svg';
import iconGpsWarningCircleRed from '../../assets/icons/icon-gps-warning-circle-red.svg';
import { CustomToast } from '../../components/ui/custom-toast/CustomToast';
import AppConfiguration from '../../configuration/app.configuration';
import { useAppReady } from '../../hooks/useAppReady';
import { useBackHandler } from '../../hooks/useBackHandler';
import { useBaseLayer } from '../../hooks/useBaseLayer';
import type { MapSearch } from '../../routes/index';
import { CapacitorGeolocationService } from '../../services/capacitor-geolocation.service';
import { getWalkingDirectionsUrl } from '../../services/navigation.service';
import { EmergencyControl } from './emergency/EmergencyControl';
import { useEmergencyView } from './emergency/useEmergencyView';

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
  const emergency = useEmergencyView({
    map: mapInstance,
    isAvailable: createMode === CreateMode.none,
    userLocation,
    isGpsActive,
    setIsGpsActive,
    selectedFeature,
    deselectAll,
  });
  // closing the detail view leaves an item-select event without data, not null - and a tap on one
  // of the emergency view's AEDs is shown in that view instead
  const showDetailView = !!selectedFeature?.data && !emergency.isViewAedTapped;

  // The emergency view is about AEDs usable now, so turning it on always shows them on the map.
  // The other filters stay as the user set them.
  useEffect(() => {
    if (!emergency.isActive) {
      return;
    }

    // (instead of only the 24h ones, which are a part of them)
    setActiveOverlays(prev =>
      prev.includes(FilterType.available)
        ? prev
        : [...prev.filter(x => x !== FilterType.alwaysAvailable), FilterType.available]
    );
  }, [emergency.isActive, setActiveOverlays]);

  // Android back closes the detail view before it leaves the map
  useBackHandler(() => {
    deselectAll();
    return true;
  }, isActive && showDetailView && createMode === CreateMode.none);

  // ...and the emergency view, while it is the one on screen (GPS stays on, as with its close button)
  useBackHandler(() => {
    emergency.toggle();
    return true;
  }, isActive && emergency.isActive && !showDetailView && createMode === CreateMode.none);

  // ...and cancels an edit, the way the form's cancel button does. A create-new flow needs nothing
  // here: back drops its ?create param, and the effect below cancels it.
  useBackHandler(() => {
    mapInstance?.setFeatureState(editFeature?.source ?? '', editFeature?.data?.id, {
      [FEATURE_STATE.EDITING]: false,
    });
    setEditFeature(null);
    setCreateMode(CreateMode.none);
    return true;
  }, isActive && createMode !== CreateMode.none && !!editFeature);

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

    // param removed (Android back via useAndroidBackButton, or the "home" nav item) -> cancel the flow
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
            setIsGpsActive={emergency.setIsGpsActiveFromSearch}
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
            isActive={emergency.isActive}
            onToggle={emergency.toggle}
            userLocation={userLocation}
            locationError={locationError}
            onRetryLocation={emergency.retryLocation}
            bestAeds={emergency.bestAeds}
            selectedAed={emergency.selectedAed}
            onSelect={emergency.select}
            onEdit={handleEditFeature}
            isVisible={!showDetailView}
            isCollapsed={emergency.isFabCollapsed}
            onCollapse={emergency.collapseFab}
          />
          {selectedFeature && showDetailView && (
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
