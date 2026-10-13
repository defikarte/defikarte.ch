import { type Map, type MapGeoJSONFeature, type MapMouseEvent } from 'maplibre-gl';
import { type InteractionLayer } from '../../../model/map';

export default class CursorClickableInteraction implements InteractionLayer {
  private mapInstance: Map;
  private layerIds: string[] = [];

  constructor(mapInstance: Map, layerIds: string[]) {
    this.mapInstance = mapInstance;
    this.layerIds = layerIds;
  }

  public on = (): void => {
    this.mapInstance.on('mouseenter', this.layerIds, this.mouseenter);
    this.mapInstance.on('mouseleave', this.layerIds, this.mouseleave);
  };

  public off = (): void => {
    this.mapInstance.off('mouseenter', this.layerIds, this.mouseenter);
    this.mapInstance.off('mouseleave', this.layerIds, this.mouseleave);
  };

  private mouseenter = (e: MapMouseEvent & { features?: MapGeoJSONFeature[] }) => {
    e.target.getCanvas().style.cursor = 'pointer';
  };

  private mouseleave = (e: MapMouseEvent & { features?: MapGeoJSONFeature[] }) => {
    e.target.getCanvas().style.cursor = '';
  };
}
