import { type FeatureCollection } from 'geojson';
import { type GeoJSONSourceSpecification, type LayerSpecification, type Map } from 'maplibre-gl';
import {
  type InteractionLayer,
  type MapEventCallback,
  type OverlayStrategy,
} from '../../../../model/map';
import { MapConfiguration } from '../../configuration/map.configuration';
import ItemMoveInteraction from '../../interactions/item-move.interaction';
import { createAedCreateMarkerLayers as createAedCreatePointLayers } from '../../layers/aed-create-point.layer';
import { createGeoJSONSource } from '../../sources/geojson.source';

export class AedCreateOverlayStrategy implements OverlayStrategy {
  private interactions: InteractionLayer[] = [];
  private map: Map;

  constructor(map: Map) {
    this.map = map;
  }

  getSourceId() {
    return MapConfiguration.aedCreateSourceId;
  }

  createSource(): GeoJSONSourceSpecification {
    const source = this.map.getSource(this.getSourceId())!;
    if (source) {
      return source.serialize() as GeoJSONSourceSpecification;
    }

    const data: GeoJSON.GeoJSON = {
      type: 'FeatureCollection',
      features: [],
    } as FeatureCollection;

    return createGeoJSONSource(data);
  }

  createLayers(): LayerSpecification[] {
    return createAedCreatePointLayers(MapConfiguration.aedCreatePointLayerId, this.getSourceId());
  }

  registerInteractions(map: Map, onEvent?: MapEventCallback) {
    const itemMoveInteraction = new ItemMoveInteraction(map, this.getSourceId(), onEvent);
    this.interactions = [itemMoveInteraction];
    itemMoveInteraction.on();
  }

  getInteractions(): readonly InteractionLayer[] | null {
    return this.interactions as readonly InteractionLayer[];
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

    this.interactions.forEach(interaction => {
      interaction.off();
    });
  }
}
