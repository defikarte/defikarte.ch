import { type FeatureCollection } from 'geojson';
import {
  type GeoJSONSource,
  type LngLatBoundsLike,
  type LngLatLike,
  Map,
  type StyleSpecification,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { type ApiClient } from '../../api/api-client';
import markerBlue from '../../assets/icons/defi-map-marker-blue.svg';
import markerGreen from '../../assets/icons/defi-map-marker-green.svg';
import markerOrange from '../../assets/icons/defi-map-marker-orange.svg';
import markerPlusBlue from '../../assets/icons/defi-map-marker-plus-blue.svg';
import markerGradientM from '../../assets/icons/map-marker-count-gradient-m.svg';
import markerGradientS from '../../assets/icons/map-marker-count-gradient-s.svg';
import markerGradientXl from '../../assets/icons/map-marker-count-gradient-xl.svg';
import markerGradientXs from '../../assets/icons/map-marker-count-gradient-xs.svg';
import { type MapEventCallback, OverlayType } from '../../model/map';
import { requestStyleSpecification } from '../../services/map-style.service';
import {
  MARKER_BLUE_IMAGE_ID,
  MARKER_GRADIENT_M_IMAGE_ID,
  MARKER_GRADIENT_S_IMAGE_ID,
  MARKER_GRADIENT_XL_IMAGE_ID,
  MARKER_GRADIENT_XS_IMAGE_ID,
  MARKER_GREEN_IMAGE_ID,
  MARKER_ORANGE_IMAGE_ID,
  MARKER_PLUS_BLUE_IMAGE_ID,
} from './configuration/constants';
import { MapConfiguration } from './configuration/map.configuration';
import { alwaysAvailableFilterOverride, restrictedFilterOverride } from './filter/aed.filter';
import { OverlayManager } from './overlay-manager/overlay-manager';
import { AedAvailabilityOverlayStrategy } from './overlay-manager/overlays/aed-availability.overlay';
import { AedCreateOverlayStrategy } from './overlay-manager/overlays/aed-create.overlay';
import { AedOverlayStrategy } from './overlay-manager/overlays/aed.overlay';
import { UserLocationOverlayStrategy } from './overlay-manager/overlays/user-location.overlay';

interface MapInstanceProps {
  container: string | HTMLElement;
  baseLayer: string;
  overlays: OverlayType[];
  hash: boolean;
  apiClient: ApiClient;
  onEvent?: MapEventCallback;
}

export class MapInstance {
  private mapInstance: Map | null = null;
  private overlayManager: OverlayManager;
  // ensures overlays are only applied once (map styledata may fire multiple times)
  private overlaysLoaded = false;
  private activeBaseLayer: string;
  private onEvent: MapEventCallback | undefined;

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

    this.overlayManager.registerOverlay(OverlayType.aedAll, new AedOverlayStrategy());
    this.overlayManager.registerOverlay(
      OverlayType.aedWithOpeningHours,
      new AedOverlayStrategy(restrictedFilterOverride)
    );
    this.overlayManager.registerOverlay(
      OverlayType.aedAlwaysAvailable,
      new AedOverlayStrategy(alwaysAvailableFilterOverride)
    );
    this.overlayManager.registerOverlay(
      OverlayType.aedByCurrentAvailability,
      new AedAvailabilityOverlayStrategy(map, props.apiClient)
    );
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

  public fitBounds(bounds: LngLatBoundsLike) {
    this.mapInstance?.fitBounds(bounds, {
      padding: 10,
      maxZoom: 18,
    });
  }

  public zoomIn() {
    this.mapInstance?.zoomIn();
  }

  public zoomOut() {
    this.mapInstance?.zoomOut();
  }

  public getCenter = () => {
    return this.mapInstance?.getCenter().toArray() ?? MapConfiguration.defaultCenter;
  };

  public remove = () => {
    this.mapInstance?.remove();
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
