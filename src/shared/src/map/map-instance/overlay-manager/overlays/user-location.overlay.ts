import { type FeatureCollection } from 'geojson';
import { type GeoJSONSource, type LayerSpecification, type Map } from 'maplibre-gl';
import { type InteractionLayer, type OverlayStrategy } from '../../../../model/map';
import { MapConfiguration } from '../../configuration/map.configuration';
import { createUserLocationLayers } from '../../layers/user-location.layer';
import { createGeoJSONSource } from '../../sources/geojson.source';

export class UserLocationOverlayStrategy implements OverlayStrategy {
  private map: Map;

  constructor(map: Map) {
    this.map = map;
  }

  getSourceId() {
    return MapConfiguration.userLocationSourceId;
  }

  async createSource() {
    const source = this.map.getSource<GeoJSONSource>(this.getSourceId());
    let data: GeoJSON.GeoJSON = {
      type: 'FeatureCollection',
      features: [],
    } as FeatureCollection;
    if (source) {
      data = await source.getData();
    }

    return createGeoJSONSource(data);
  }

  createLayers(): LayerSpecification[] {
    return createUserLocationLayers(MapConfiguration.userLocationLayerId, this.getSourceId());
  }

  registerInteractions() {
    // No interactions for user location
  }

  getInteractions(): readonly InteractionLayer[] | null {
    return null;
  }

  cleanup(map: Map) {
    const layers = this.createLayers();
    layers.forEach(layer => {
      if (map.getLayer(layer.id)) {
        map.removeLayer(layer.id);
      }
    });
    if (map.getSource(this.getSourceId())) {
      map.removeSource(this.getSourceId());
    }
  }
}
