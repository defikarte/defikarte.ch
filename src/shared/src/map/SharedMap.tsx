import {
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { type ApiClient } from '../api/api-client';
import { type LocationProvider } from '../model/location-provider';
import {
  CreateMode,
  FilterType,
  type MapEvent,
  type MapEventCallback,
  type MapInteractionEvent,
  OverlayType,
} from '../model/map';
import { deselectAllFeatures } from './helper';
import { useFeatureSelection } from './hooks/useFeatureSelection';
import { useHandleCreateMode } from './hooks/useHandleCreateMode';
import { useMapEvents } from './hooks/useMapEvents';
import { defaultActiveOverlay, useOverlays } from './hooks/useOverlays';
import { useUserLocation } from './hooks/useUserLocation';
import {
  MapConfiguration,
  type MapConfigurationOptions,
} from './map-instance/configuration/map.configuration';
import { MapInstance } from './map-instance/map-instance';

export interface SharedMapState {
  mapInstance: MapInstance | null;
  isInitialized: boolean;
  activeBaseLayer: string;
  setActiveBaseLayer: (layer: string) => void;
  activeOverlays: FilterType[];
  setActiveOverlays: Dispatch<SetStateAction<FilterType[]>>;
  selectedFeature: MapInteractionEvent | null;
  editFeature: MapInteractionEvent | null;
  setEditFeature: Dispatch<SetStateAction<MapInteractionEvent | null>>;
  createMode: CreateMode;
  setCreateMode: Dispatch<SetStateAction<CreateMode>>;
  userLocation: GeolocationPosition | null;
  isGpsActive: boolean;
  setIsGpsActive: Dispatch<SetStateAction<boolean>>;
  locationError: string | null;
  handleSelectOrCenterFeatureOnMap: (event: MapEvent) => void;
  handleEditFeature: (event: MapInteractionEvent) => void;
  handleOnCreateStart: () => void;
  selectFeatureOnMap: (event: MapInteractionEvent) => boolean;
  deselectAll: () => void;
}

interface SharedMapProps {
  config: MapConfigurationOptions;
  apiClient: ApiClient;
  locationProvider: LocationProvider;
  isHash: boolean;
  persistedBaseLayer?: string;
  onBaseLayerChange?: (layer: string) => void;
  children: (state: SharedMapState) => ReactNode;
  splashScreen?: ReactNode;
}

export const SharedMap = ({
  config,
  apiClient,
  locationProvider,
  isHash,
  persistedBaseLayer,
  onBaseLayerChange,
  children,
  splashScreen,
}: SharedMapProps) => {
  // Initialize MapConfiguration before the map instance is created below.
  useEffect(() => {
    MapConfiguration.init(config);
  }, [config]);

  const defaultBaseLayer = persistedBaseLayer || MapConfiguration.osmBaseMapId;

  const mapInstanceRef = useRef<MapInstance | null>(null);
  const mapInstance = mapInstanceRef.current;
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const { isInitialized, handleMapEvent } = useMapEvents();
  const [activeBaseLayer, setActiveBaseLayerState] = useState<string>(defaultBaseLayer);
  const [selectedFeature, setSelectedFeature] = useState<MapInteractionEvent | null>(null);
  const [editFeature, setEditFeature] = useState<MapInteractionEvent | null>(null);
  const { activeOverlays, setActiveOverlays } = useOverlays(mapInstance);
  const [createMode, setCreateMode] = useHandleCreateMode({
    map: mapInstance,
    feature: editFeature ?? null,
  });
  const {
    userLocation: userLocationData,
    isActive: isGpsActive,
    setIsActive: setIsGpsActive,
    error: locationError,
  } = useUserLocation({ map: mapInstance, locationProvider });
  const { handleSelectOrCenterFeatureOnMap, selectFeatureOnMap, handleEditFeature } =
    useFeatureSelection({ map: mapInstance, setEditFeature, setCreateMode });

  const setActiveBaseLayer = useCallback(
    (layer: string) => {
      setActiveBaseLayerState(layer);
      onBaseLayerChange?.(layer);
    },
    [onBaseLayerChange]
  );

  // map event handling
  const onMapEvent: MapEventCallback = useCallback(
    event => {
      if (event.type === 'item-select') {
        setSelectedFeature(event);
      }

      handleMapEvent(event);
    },
    [handleMapEvent]
  );

  // map initialization
  useEffect(() => {
    if (mapContainerRef.current && !mapInstanceRef.current && activeBaseLayer) {
      const map = new MapInstance({
        container: mapContainerRef.current,
        baseLayer: activeBaseLayer,
        overlays: [defaultActiveOverlay, OverlayType.userLocation],
        onEvent: onMapEvent,
        hash: isHash,
        apiClient: apiClient,
      });
      mapInstanceRef.current = map;
      return () => mapInstanceRef.current?.remove();
    }
  }, [activeBaseLayer, isHash, onMapEvent, apiClient]);

  const handleOnCreateStart = () => {
    setEditFeature(null);
    setCreateMode(CreateMode.position);
  };

  const deselectAll = () => {
    deselectAllFeatures(mapInstance);
  };

  const mapState: SharedMapState = {
    mapInstance,
    isInitialized,
    activeBaseLayer,
    setActiveBaseLayer,
    activeOverlays,
    setActiveOverlays,
    selectedFeature,
    editFeature,
    setEditFeature,
    createMode,
    setCreateMode,
    userLocation: userLocationData,
    isGpsActive,
    setIsGpsActive,
    locationError,
    handleSelectOrCenterFeatureOnMap,
    handleEditFeature,
    handleOnCreateStart,
    selectFeatureOnMap,
    deselectAll,
  };

  return (
    <div className="relative flex-grow w-full h-full">
      <div className="h-full w-full">
        <div className="h-full w-full" ref={mapContainerRef} />
      </div>
      {!isInitialized && splashScreen}
      {children(mapState)}
    </div>
  );
};
