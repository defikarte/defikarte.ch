import { type Feature, type GeoJsonProperties, type Point } from 'geojson';
import {
  type LayerSpecification,
  type Map,
  type MapGeoJSONFeature,
  type SourceSpecification,
} from 'maplibre-gl';
import { ALWAYS_AVAILABLE, type AvailabilityFilter } from '../map/opening-hours/feature-status';

// the AEDs shown by their current status; the values are the opening hours status characters,
// split into groups that don't overlap (`availabilityGroup`): `alwaysAvailable` the open AEDs
// with `opening_hours=24/7`, `available` the other open ones
export const FilterType = {
  available: '1',
  notAvailable: '0',
  unknown: '?',
  alwaysAvailable: ALWAYS_AVAILABLE,
} as const satisfies Record<string, AvailabilityFilter>;
export type FilterType = (typeof FilterType)[keyof typeof FilterType];

export const OverlayType = {
  aedAll: 'aedAll',
  aedByStatus: 'aedByStatus',
  userLocation: 'userLocation',
  aedCreate: 'aedCreate',
} as const;
export type OverlayType = (typeof OverlayType)[keyof typeof OverlayType];

export const CreateMode = {
  none: 0,
  position: 1,
  form: 2,
} as const;
export type CreateMode = (typeof CreateMode)[keyof typeof CreateMode];

export interface InteractionLayer {
  on(layerIds: string[]): void;
  off(): void;
}

export interface OverlayStrategy {
  getSourceId(): string;
  createSource(): SourceSpecification | Promise<SourceSpecification>;
  createLayers(): LayerSpecification[];
  registerInteractions(map: Map, onEvent?: MapEventCallback): void;
  getInteractions(): readonly InteractionLayer[] | null;
  cleanup(map: Map): void;
}

export interface RefreshableOverlayStrategy {
  refreshSourceData(map: Map): Promise<void>;
}

export type MapEventCallback = (event: MapEvent) => void;

export type MapEvent = MapInteractionEvent | MapStateEvent;

export type MapInteractionEvent = (ItemSelectEvent | ItemMoveEvent) & BaseEvent;

export interface BaseEvent {
  layerIds?: string[];
  source?: string;
}

export interface ItemSelectEvent {
  type: 'item-select';
  data: MapGeoJSONFeature | null;
}

export interface ItemMoveEvent {
  type: 'item-move';
  data: Feature<Point, GeoJsonProperties> | null;
}

export interface MapStateEvent {
  type: 'map-state';
  source: string;
  state: 'loading' | 'loaded' | 'abort' | 'error';
}
