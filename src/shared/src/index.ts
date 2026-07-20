// API
export { ApiClient } from './api/api-client';
export { type ApiConfiguration, type RequestOptions } from './model/common';

// Model types
export { type LocationProvider } from './model/location-provider';
export {
  CreateMode,
  FilterType,
  OverlayType,
  type BaseEvent,
  type InteractionLayer,
  type ItemMoveEvent,
  type ItemSelectEvent,
  type MapEvent,
  type MapEventCallback,
  type MapInteractionEvent,
  type MapStateEvent,
  type OverlayStrategy,
  type RefreshableOverlayStrategy,
} from './model/map';

// Services
export { requestAedDataByCurrentAvailability } from './services/aed-data.service';
export { searchAed } from './services/aed-search.service';
export { distanceBetweenPoints } from './services/coordinate-calculation.service';
export { requestStyleSpecification } from './services/map-style.service';
export { isOpeningHourValid, isOpenNow } from './services/opening-hours.service';

// Map instance & configuration
export {
  COLORS,
  FEATURE_STATE,
  IMAGE_SCALE,
  MARKER_BLUE_IMAGE_ID,
  MARKER_GRADIENT_M_IMAGE_ID,
  MARKER_GRADIENT_S_IMAGE_ID,
  MARKER_GRADIENT_XL_IMAGE_ID,
  MARKER_GRADIENT_XS_IMAGE_ID,
  MARKER_GREEN_IMAGE_ID,
  MARKER_ORANGE_IMAGE_ID,
  MARKER_PLUS_BLUE_IMAGE_ID,
} from './map/map-instance/configuration/constants';
export {
  MapConfiguration,
  type MapConfigurationOptions,
} from './map/map-instance/configuration/map.configuration';
export { default as ClusterZoomInteraction } from './map/map-instance/interactions/cluster-zoom.interaction';
export { default as CursorClickableInteraction } from './map/map-instance/interactions/cursor-clickable.interaction';
export { default as ItemMoveInteraction } from './map/map-instance/interactions/item-move.interaction';
export { default as ItemSelectInteraction } from './map/map-instance/interactions/item-select.interaction';
export { MapInstance } from './map/map-instance/map-instance';
export { OverlayManager } from './map/map-instance/overlay-manager/overlay-manager';

// Map helper & utils
export {
  createFeature,
  deselectAllFeatures,
  getActiveAedOverlay,
  getMoveInteraction,
  getRelevantInteractions,
} from './map/helper';
export { calculateBounds, createUserLocationData } from './map/location-utils';

// Hooks
export { useHandleCreateMode } from './map/hooks/useHandleCreateMode';
export { useMapEvents } from './map/hooks/useMapEvents';
export { usePrevious } from './map/hooks/usePrevious';
export { useUserLocation } from './map/hooks/useUserLocation';
export { useOnOutsideKeyDown } from './hooks/useOnOutsideKeyDown';
export { useOnOutsidePointerDown } from './hooks/useOnOutsidePointerDown';

// UI components
export { MapIconButton } from './components/ui/map-icon-button/MapIconButton';

// SharedMap component
export { AttributionControl } from './map/controls/attribution-control/AttributionControl';
export { SearchControl } from './map/controls/search-control/SearchControl';
export { SharedMap, type SharedMapState } from './map/SharedMap';
