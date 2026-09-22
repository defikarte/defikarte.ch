import { type FeatureCollection, type GeoJsonProperties, type Point } from 'geojson';
import {
  type GeoJSONSource,
  type Map,
  type MapGeoJSONFeature,
  type MapMouseEvent,
} from 'maplibre-gl';
import { type InteractionLayer, type MapEventCallback } from '../../../model/map';

export default class ItemMoveInteraction implements InteractionLayer {
  private mapInstance: Map;
  private moveFeatureId: Record<string, string | number | null> = {};
  private onEvent?: MapEventCallback;

  constructor(mapInstance: Map, sourceId: string, onEvent?: MapEventCallback) {
    this.mapInstance = mapInstance;
    this.sourceId = sourceId;
    this.onEvent = onEvent;
  }

  public readonly sourceId: string;

  public on = (): void => {
    this.mapInstance.on('click', this.setFeaturePositionMapEvent);
  };

  public off = (): void => {
    this.mapInstance.off('click', this.setFeaturePositionMapEvent);
  };

  public setFeaturePosition = async (
    featureId: number | string | undefined | null,
    coordinates: number[]
  ) => {
    if (!featureId) {
      console.warn('FeatureId is undefined or null');
      return;
    }

    this.moveFeatureId[this.sourceId] = featureId;
    const source = this.mapInstance.getSource<GeoJSONSource>(this.sourceId);
    if (!source) {
      console.warn('Source not found');
      return;
    }

    const geojson = (await source.getData()) as FeatureCollection<Point, GeoJsonProperties>;
    const feature = geojson.features.find(f => f.id === featureId);
    if (!feature) {
      console.warn('Feature not found', featureId);
      return;
    }

    feature.geometry.coordinates = coordinates;
    source.setData(geojson);

    this.onEvent?.({
      type: 'item-move',
      source: this.sourceId,
      data: feature,
    });
  };

  private setFeaturePositionMapEvent = (e: MapMouseEvent & { features?: MapGeoJSONFeature[] }) => {
    void this.setFeaturePosition(this.moveFeatureId[this.sourceId], e.lngLat.toArray());
  };
}
