import { type FeatureCollection } from 'geojson';
import {
  type GeoJSONSource,
  type LngLatBoundsLike,
  type LngLatLike,
  Map,
  type MapSourceDataEvent,
  type PaddingOptions,
  type StyleSpecification,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import markerBlue from '../../assets/icons/defi-map-marker-blue.svg';
import markerGreen from '../../assets/icons/defi-map-marker-green.svg';
import markerOrange from '../../assets/icons/defi-map-marker-orange.svg';
import markerPlusBlue from '../../assets/icons/defi-map-marker-plus-blue.svg';
import markerRed from '../../assets/icons/defi-map-marker-red.svg';
import markerGradientM from '../../assets/icons/map-marker-count-gradient-m.svg';
import markerGradientS from '../../assets/icons/map-marker-count-gradient-s.svg';
import markerGradientXl from '../../assets/icons/map-marker-count-gradient-xl.svg';
import markerGradientXs from '../../assets/icons/map-marker-count-gradient-xs.svg';
import { type MapEventCallback, OverlayType } from '../../model/map';
import { requestStyleSpecification } from '../../services/map-style.service';
import { OpeningHoursController } from '../opening-hours/controller';
import { type AvailabilityFilter } from '../opening-hours/feature-status';
import { type OpeningHoursStatusMap } from '../opening-hours/types';
import {
  EMERGENCY_MODE_STATE,
  MARKER_BLUE_IMAGE_ID,
  MARKER_GRADIENT_M_IMAGE_ID,
  MARKER_GRADIENT_S_IMAGE_ID,
  MARKER_GRADIENT_XL_IMAGE_ID,
  MARKER_GRADIENT_XS_IMAGE_ID,
  MARKER_GREEN_IMAGE_ID,
  MARKER_ORANGE_IMAGE_ID,
  MARKER_PLUS_BLUE_IMAGE_ID,
  MARKER_RED_IMAGE_ID,
} from './configuration/constants';
import { MapConfiguration } from './configuration/map.configuration';
import { OverlayManager } from './overlay-manager/overlay-manager';
import { AedCreateOverlayStrategy } from './overlay-manager/overlays/aed-create.overlay';
import { AedStatusOverlayStrategy } from './overlay-manager/overlays/aed-status.overlay';
import { AedOverlayStrategy } from './overlay-manager/overlays/aed.overlay';
import { UserLocationOverlayStrategy } from './overlay-manager/overlays/user-location.overlay';

interface MapInstanceProps {
  container: string | HTMLElement;
  baseLayer: string;
  overlays: OverlayType[];
  hash: boolean;
  onEvent?: MapEventCallback;
}

export class MapInstance {
  // set once the map has loaded
  private mapInstance: Map | null = null;
  // the map from the start, so it can be removed even before it has loaded
  private readonly map: Map;
  private overlayManager: OverlayManager;
  private openingHours: OpeningHoursController;
  private aedStatusOverlay: AedStatusOverlayStrategy;
  // ensures overlays are only applied once (map styledata may fire multiple times)
  private overlaysLoaded = false;
  private activeBaseLayer: string;
  private onEvent: MapEventCallback | undefined;
  private emergencyMode = false;

  constructor(props: MapInstanceProps) {
    this.onEvent = props.onEvent;
    this.handleMapEvent('init', 'loading');

    this.overlayManager = new OverlayManager(props.onEvent);
    this.activeBaseLayer = props.baseLayer;
    const map = new Map({
      container: props.container,
      style: MapConfiguration.baseLayers[this.activeBaseLayer],
      bounds: MapConfiguration.defaultBounds,
      fitBoundsOptions: {
        center: MapConfiguration.defaultCenter,
      },
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
      hash: props.hash,
    });
    this.map = map;

    // computes the open/closed status of all AEDs, shared by the AED overlays
    this.openingHours = new OpeningHoursController({
      map,
      getDataUrl: () => MapConfiguration.aedGeoJsonUrl,
      sourceId: MapConfiguration.aedSourceId,
    });

    this.overlayManager.registerOverlay(
      OverlayType.aedAll,
      new AedOverlayStrategy(map, this.openingHours)
    );
    this.aedStatusOverlay = new AedStatusOverlayStrategy(map, this.openingHours);
    this.overlayManager.registerOverlay(OverlayType.aedByStatus, this.aedStatusOverlay);
    this.overlayManager.registerOverlay(
      OverlayType.userLocation,
      new UserLocationOverlayStrategy(map)
    );
    this.overlayManager.registerOverlay(OverlayType.aedCreate, new AedCreateOverlayStrategy(map));

    map.on('styledata', () => void this.loadOverlays(map, props.overlays));
    map.on('load', () => this.init(map));
    map.on('sourcedataloading', e => {
      this.handleMapEvent(e.sourceId, 'loading');
    });
    map.on('sourcedata', e => {
      this.handleMapEvent(e.sourceId, e.isSourceLoaded ? 'loaded' : 'loading');
    });
    map.on('sourcedataabort', e => {
      this.handleMapEvent(e.sourceId, 'abort');
    });
  }

  public async loadOverlays(map: Map, overlays: OverlayType[]) {
    if (this.overlaysLoaded) {
      return;
    }

    for (const overlay of overlays) {
      await this.overlayManager.applyOverlay(map, overlay);
    }

    this.overlaysLoaded = true;
  }

  public init = (map: Map) => {
    const images = [
      { id: MARKER_GREEN_IMAGE_ID, url: markerGreen },
      { id: MARKER_ORANGE_IMAGE_ID, url: markerOrange },
      { id: MARKER_RED_IMAGE_ID, url: markerRed },
      { id: MARKER_GRADIENT_XS_IMAGE_ID, url: markerGradientXs },
      { id: MARKER_GRADIENT_S_IMAGE_ID, url: markerGradientS },
      { id: MARKER_GRADIENT_M_IMAGE_ID, url: markerGradientM },
      { id: MARKER_GRADIENT_XL_IMAGE_ID, url: markerGradientXl },
      { id: MARKER_PLUS_BLUE_IMAGE_ID, url: markerPlusBlue },
      { id: MARKER_BLUE_IMAGE_ID, url: markerBlue },
    ];

    images.forEach(image => {
      const img = new Image();
      img.src = image.url;
      img.onload = () => {
        // need to scale the image to 4x for hig-res displays
        img.width = img.width * 4;
        img.height = img.height * 4;
        map.addImage(image.id, img);
      };
    });

    this.mapInstance = map;
    map.setGlobalStateProperty(EMERGENCY_MODE_STATE, this.emergencyMode);
    // the AEDs are already rendered (as unknown), the status follows once it is computed
    this.openingHours.start();
    console.log('Map initialized');
    this.handleMapEvent('init', 'loaded');
  };

  public async setActiveBaseLayer(id: string) {
    if (!this.mapInstance || this.activeBaseLayer === id) {
      return;
    }

    // claimed before awaiting the style, so a second call for the same layer arriving while this
    // one is still loading is dropped instead of swapping the style twice
    this.activeBaseLayer = id;

    let style = await this.getBaseLayerStyleSpec(id);
    style = await this.overlayManager.applyActiveOverlaysOnStyle(style);

    this.mapInstance?.setStyle(style, { diff: true });
  }

  public async applyOverlay(overlayId: OverlayType) {
    if (!this.mapInstance) {
      return;
    }

    await this.overlayManager.applyOverlay(this.mapInstance, overlayId);
  }

  public removeOverlay(overlayId: OverlayType) {
    if (!this.mapInstance) {
      return;
    }

    this.overlayManager.removeOverlay(this.mapInstance, overlayId);
  }

  public async refreshActiveOverlays() {
    if (!this.mapInstance) {
      return;
    }

    await this.overlayManager.refreshActiveOverlays(this.mapInstance);
  }

  public easeTo(coordinates: LngLatLike, zoom?: number) {
    this.mapInstance?.easeTo({
      center: coordinates,
      zoom: zoom ?? this.mapInstance.getZoom(),
    });
  }

  public fitBounds(bounds: LngLatBoundsLike, padding: number | PaddingOptions = 10) {
    // not mapInstance: the first GPS fix at app start often arrives before the map has loaded, and
    // useUserLocation zooms to it only once
    this.map.fitBounds(bounds, {
      padding,
      maxZoom: 18,
    });
  }

  public zoomIn() {
    this.mapInstance?.zoomIn();
  }

  public zoomOut() {
    this.mapInstance?.zoomOut();
  }

  public resetNorth() {
    this.mapInstance?.resetNorth();
  }

  /** Calls the listener with the bearing now and on every rotation, returns a function to unsubscribe. */
  public subscribeBearing = (listener: (bearing: number) => void) => {
    // not mapInstance: works before the map has loaded
    const map = this.map;
    const onRotate = () => listener(map.getBearing());
    onRotate();
    map.on('rotate', onRotate);

    return () => {
      map.off('rotate', onRotate);
    };
  };

  /**
   * Calls the listener with the source id whenever a source is (re-)added, e.g. after a filter
   * change swapped the AED source - its feature state is gone then. Returns a function to unsubscribe.
   */
  public subscribeSourceAdded = (listener: (sourceId: string) => void) => {
    const map = this.map;
    const onSourceData = (e: MapSourceDataEvent) => {
      if (e.sourceDataType === 'metadata') {
        listener(e.sourceId);
      }
    };
    map.on('sourcedata', onSourceData);

    return () => {
      map.off('sourcedata', onSourceData);
    };
  };

  public getCenter = () => {
    return this.mapInstance?.getCenter().toArray() ?? MapConfiguration.defaultCenter;
  };

  public remove = () => {
    this.openingHours.dispose();

    // not mapInstance: a map removed before its load event (e.g. React StrictMode's double
    // mount) would otherwise keep running, loading its own data in the same container
    if (this.mapInstance) {
      this.mapInstance.remove();
      return;
    }

    // removing a map also removes its position from the URL hash, which the map replacing
    // this one still has to read
    const href = window.location.href;
    this.map.remove();
    window.history.replaceState(window.history.state, '', href);
  };

  /** The current status per opening_hours value, null until it is computed. */
  public getOpeningHoursStatusMap = () => {
    return this.openingHours.getStatusMap();
  };

  /** Calls the listener whenever the opening status changes, returns a function to unsubscribe. */
  public subscribeOpeningHoursStatus = (listener: (statusMap: OpeningHoursStatusMap) => void) => {
    return this.openingHours.subscribeStatus(listener);
  };

  /** All AEDs from memory, whichever AED overlay is active. Null until they are loaded. */
  public getAllAeds = () => {
    return this.openingHours.getAllAeds();
  };

  /** Dims all AEDs except those with the `emergency` feature state, see `EMERGENCY_MODE_STATE`. */
  public setEmergencyMode = (on: boolean) => {
    // Kept and applied on load: before that maplibre throws "Style is not done loading", e.g.
    // when the emergency view is turned on at app start.
    this.emergencyMode = on;
    this.mapInstance?.setGlobalStateProperty(EMERGENCY_MODE_STATE, on);
  };

  /** The statuses (or `ALWAYS_AVAILABLE`) the `aedByStatus` overlay shows. */
  public setAedStatusFilter = (statuses: readonly AvailabilityFilter[]) => {
    this.aedStatusOverlay.setStatuses(statuses);
  };

  public getActiveMapInteractions = () => {
    return this.overlayManager.getActiveMapInteractions();
  };

  public getActiveOverlaySourceIds = () => {
    return this.overlayManager.getActiveSourceIds();
  };

  public setGeoJSONSourceData = (sourceId: string, data: FeatureCollection | null) => {
    if (!this.mapInstance) {
      return;
    }

    const source = this.mapInstance?.getSource<GeoJSONSource>(sourceId);
    if (!source) {
      console.debug('Source not found', sourceId);
      return;
    }

    if (!data) {
      source.setData({ type: 'FeatureCollection', features: [] });
      return;
    }

    source.setData(data);
  };

  public async getGeoJsonSourceData(sourceId: string): Promise<FeatureCollection> {
    if (!this.mapInstance) {
      return { type: 'FeatureCollection', features: [] };
    }

    const source = this.mapInstance.getSource<GeoJSONSource>(sourceId)!;
    if (!source) {
      return { type: 'FeatureCollection', features: [] };
    }

    return (await source.getData()) as FeatureCollection;
  }

  public setFeatureState = (
    sourceId: string,
    featureId: string | number | undefined,
    state: Record<string, boolean | string | number>
  ) => {
    if (!this.mapInstance) {
      return;
    }

    this.mapInstance.setFeatureState({ source: sourceId, id: featureId }, state);
  };

  private getBaseLayerStyleSpec = async (baseLayerId: string): Promise<StyleSpecification> => {
    const baseLayerStyle = MapConfiguration.baseLayers[baseLayerId];
    if (!this.mapInstance || !baseLayerStyle) {
      return this.getEmptyStyleSpec();
    }

    let styleSpec: StyleSpecification | null = null;
    if (typeof baseLayerStyle === 'string') {
      styleSpec = await requestStyleSpecification(baseLayerStyle);
    } else {
      styleSpec = baseLayerStyle;
    }

    if (!styleSpec) {
      return this.getEmptyStyleSpec();
    }

    return styleSpec;
  };

  private getEmptyStyleSpec = (): StyleSpecification => {
    return { layers: {}, sources: {}, version: 8 } as StyleSpecification;
  };

  private handleMapEvent(source: string, state: 'loading' | 'loaded' | 'abort' | 'error') {
    this.onEvent?.({
      type: 'map-state',
      source: source,
      state: state,
    });
  }
}
