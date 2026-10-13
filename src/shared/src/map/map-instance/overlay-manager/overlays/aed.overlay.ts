import {
  type FilterSpecification,
  type GeoJSONSource,
  type LayerSpecification,
  type Map,
} from 'maplibre-gl';
import {
  type InteractionLayer,
  type MapEventCallback,
  type OverlayStrategy,
  type RefreshableOverlayStrategy,
} from '../../../../model/map';
import { MapConfiguration } from '../../configuration/map.configuration';
import ClusterZoomInteraction from '../../interactions/cluster-zoom.interaction';
import CursorClickableInteraction from '../../interactions/cursor-clickable.interaction';
import ItemSelectInteraction from '../../interactions/item-select.interaction';
import { createAedClusterLayers } from '../../layers/aed-cluster.layer';
import { createAedPointLayers } from '../../layers/aed-point.layer';
import { createAedSource } from '../../sources/aed.source';

export class AedOverlayStrategy implements OverlayStrategy, RefreshableOverlayStrategy {
  private interactions: InteractionLayer[] = [];
  private filter: FilterSpecification | null = null;
  private aedPointLayers: LayerSpecification[] = [];
  private aedClusterLayers: LayerSpecification[] = [];

  constructor(filter: FilterSpecification | null = null) {
    this.filter = filter;
  }

  getSourceId() {
    return MapConfiguration.aedSourceId;
  }

  createSource() {
    return createAedSource(MapConfiguration.aedGeoJsonUrl, this.filter);
  }

  refreshSourceData(map: Map): Promise<void> {
    const source = map.getSource<GeoJSONSource>(this.getSourceId());
    if (!source) {
      console.warn('Source not found', this.getSourceId());
      return Promise.resolve();
    }

    source.setData(MapConfiguration.aedGeoJsonUrl);
    return Promise.resolve();
  }

  createLayers(): LayerSpecification[] {
    const aedPointLayers = createAedPointLayers(
      MapConfiguration.aedPointLayerId,
      this.getSourceId()
    );
    const aedClusterLayers = createAedClusterLayers(
      MapConfiguration.aedPointLayerId,
      this.getSourceId()
    );

    this.aedPointLayers = aedPointLayers;
    this.aedClusterLayers = aedClusterLayers;

    return [...aedPointLayers, ...aedClusterLayers];
  }

  registerInteractions(map: Map, onEvent?: MapEventCallback) {
    const layers = [
      ...this.aedPointLayers.map(layer => layer.id),
      ...this.aedClusterLayers.map(layer => layer.id),
    ];
    const cursorClickableInteraction = new CursorClickableInteraction(map, layers);
    const clusterZoomInteraction = new ClusterZoomInteraction(
      map,
      this.aedClusterLayers.map(layer => layer.id)
    );
    const itemSelectInteraction = new ItemSelectInteraction(
      map,
      this.getSourceId(),
      this.aedPointLayers.map(layer => layer.id),
      onEvent
    );

    this.interactions = [cursorClickableInteraction, clusterZoomInteraction, itemSelectInteraction];

    cursorClickableInteraction.on();
    clusterZoomInteraction.on();
    itemSelectInteraction.on();
  }

  getInteractions() {
    return this.interactions as readonly InteractionLayer[];
  }

  cleanup(map: Map) {
    const layers = [...this.aedPointLayers, ...this.aedClusterLayers];
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
