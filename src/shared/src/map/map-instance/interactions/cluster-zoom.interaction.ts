import { type Point } from 'geojson';
import {
  type GeoJSONSource,
  type Map,
  type MapGeoJSONFeature,
  type MapMouseEvent,
} from 'maplibre-gl';
import { type InteractionLayer } from '../../../model/map';

export default class ClusterZoomInteraction implements InteractionLayer {
  private mapInstance: Map;
  private layerIds: string[] = [];

  constructor(mapInstance: Map, layerIds: string[]) {
    this.mapInstance = mapInstance;
    this.layerIds = layerIds;
  }

  public on = (): void => {
    this.mapInstance.on('click', this.layerIds, e => void this.zoomToCluster(e));
  };

  public off = (): void => {
    this.mapInstance.off('click', this.layerIds, e => void this.zoomToCluster(e));
  };

  private zoomToCluster = async (e: MapMouseEvent & { features?: MapGeoJSONFeature[] }) => {
    const layer = e.features?.[0].layer;
    const source = e.features?.[0].source;
    if (!layer || !source) {
      return;
    }

    const features = this.mapInstance.queryRenderedFeatures(e.point, {
      layers: [layer.id],
    });

    const clusterId = features[0].properties.cluster_id as number;
    const zoom = await this.mapInstance
      .getSource<GeoJSONSource>(source)
      ?.getClusterExpansionZoom(clusterId);

    const coordinates = (features[0].geometry as Point).coordinates;
    this.mapInstance.easeTo({
      center: [coordinates[0], coordinates[1]],
      zoom,
    });
  };
}
