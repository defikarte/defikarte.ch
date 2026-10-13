import {
  type GeoJSONSource,
  type GeoJSONSourceSpecification,
  type LayerSpecification,
  type Map,
} from 'maplibre-gl';
import { type ApiClient } from '../../../../api/api-client';
import {
  type InteractionLayer,
  type MapEventCallback,
  type OverlayStrategy,
  type RefreshableOverlayStrategy,
} from '../../../../model/map';
import { requestAedDataByCurrentAvailability } from '../../../../services/aed-data.service';
import { MapConfiguration } from '../../configuration/map.configuration';
import ClusterZoomInteraction from '../../interactions/cluster-zoom.interaction';
import CursorClickableInteraction from '../../interactions/cursor-clickable.interaction';
import ItemSelectInteraction from '../../interactions/item-select.interaction';
import { createAedAvailabilityPointLayers } from '../../layers/aed-availability-point.layer';
import { createAedClusterLayers } from '../../layers/aed-cluster.layer';
import { createAedSource } from '../../sources/aed.source';

export class AedAvailabilityOverlayStrategy implements OverlayStrategy, RefreshableOverlayStrategy {
  private interactions: InteractionLayer[] = [];
  private aedPointLayers: LayerSpecification[] = [];
  private aedClusterLayers: LayerSpecification[] = [];
  private map: Map;
  private abortController: AbortController | null = null;
  private apiClient: ApiClient;

  constructor(map: Map, apiClient: ApiClient) {
    this.map = map;
    this.apiClient = apiClient;
  }

  getSourceId() {
    return MapConfiguration.aedAvailabilitySourceId;
  }

  async createSource(): Promise<GeoJSONSourceSpecification> {
    // optimize performance when base-layer changes and source is already loaded
    const source = this.map.getSource(this.getSourceId())!;
    if (source) {
      return source.serialize() as GeoJSONSourceSpecification;
    }

    // Abort any previous request
    this.abortOngoingRequest();
    this.abortController = new AbortController();

    // takes long, but on the backend I am not able to filter by availability
    const data = await requestAedDataByCurrentAvailability(this.apiClient, {
      signal: this.abortController.signal,
    });
    return createAedSource(data);
  }

  async refreshSourceData(map: Map): Promise<void> {
    const source = map.getSource<GeoJSONSource>(this.getSourceId())!;
    if (!source) {
      console.warn('Source not found', this.getSourceId());
      return;
    }

    // Abort any previous request
    this.abortOngoingRequest();
    this.abortController = new AbortController();

    const data = await requestAedDataByCurrentAvailability(this.apiClient, {
      signal: this.abortController.signal,
    });
    source.setData(data);
  }

  createLayers(): LayerSpecification[] {
    const aedPointLayers = createAedAvailabilityPointLayers(
      MapConfiguration.aedAvailabilityPointLayerId,
      this.getSourceId()
    );
    const aedClusterLayers = createAedClusterLayers(
      MapConfiguration.aedAvailabilityPointLayerId,
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
    // Abort any ongoing request
    this.abortOngoingRequest();

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

  private abortOngoingRequest() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}
