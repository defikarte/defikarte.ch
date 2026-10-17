import { type FeatureCollection } from 'geojson';
import {
  type FilterSpecification,
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
import { addAedAvailability } from '../../../../services/aed-data.service';
import { MapConfiguration } from '../../configuration/map.configuration';
import ClusterZoomInteraction from '../../interactions/cluster-zoom.interaction';
import CursorClickableInteraction from '../../interactions/cursor-clickable.interaction';
import ItemSelectInteraction from '../../interactions/item-select.interaction';
import { createAedClusterLayers } from '../../layers/aed-cluster.layer';
import { createAedPointLayers } from '../../layers/aed-point.layer';
import { createAedSource } from '../../sources/aed.source';
import { AvailabilityTicker } from '../availability-ticker';

export class AedOverlayStrategy implements OverlayStrategy, RefreshableOverlayStrategy {
  private interactions: InteractionLayer[] = [];
  private filter: FilterSpecification | null = null;
  private aedPointLayers: LayerSpecification[] = [];
  private aedClusterLayers: LayerSpecification[] = [];
  private map: Map;
  private apiClient: ApiClient;
  private abortController: AbortController | null = null;
  // raw data from the backend, kept to re-evaluate the availability without a new request
  private rawData: FeatureCollection | null = null;
  private availabilityKey = '';
  private ticker = new AvailabilityTicker(() => this.updateAvailability());

  constructor(map: Map, apiClient: ApiClient, filter: FilterSpecification | null = null) {
    this.map = map;
    this.apiClient = apiClient;
    this.filter = filter;
  }

  getSourceId() {
    return MapConfiguration.aedSourceId;
  }

  async createSource(): Promise<GeoJSONSourceSpecification> {
    // optimize performance when base-layer changes and source is already loaded
    const source = this.map.getSource(this.getSourceId());
    if (source) {
      return source.serialize() as GeoJSONSourceSpecification;
    }

    const data = await this.requestData();
    return createAedSource(data, this.filter);
  }

  async refreshSourceData(map: Map): Promise<void> {
    const source = map.getSource<GeoJSONSource>(this.getSourceId());
    if (!source) {
      console.warn('Source not found', this.getSourceId());
      return;
    }

    source.setData(await this.requestData());
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

    // started here, as this only runs once the overlay is actually applied
    this.ticker.start();
  }

  getInteractions() {
    return this.interactions as readonly InteractionLayer[];
  }

  cleanup(map: Map) {
    this.abortOngoingRequest();
    this.ticker.stop();
    this.rawData = null;

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

  private async requestData(): Promise<FeatureCollection> {
    this.abortOngoingRequest();
    this.abortController = new AbortController();

    this.rawData = await this.apiClient.requestAedData({ signal: this.abortController.signal });
    return this.withAvailability(this.rawData);
  }

  // re-evaluates the availability for the current time and only updates the map if it changed
  private updateAvailability() {
    const source = this.map.getSource<GeoJSONSource>(this.getSourceId());
    if (!source || !this.rawData) {
      return;
    }

    const previousKey = this.availabilityKey;
    const data = this.withAvailability(this.rawData);
    if (this.availabilityKey !== previousKey) {
      source.setData(data);
    }
  }

  private withAvailability(rawData: FeatureCollection): FeatureCollection {
    const data = addAedAvailability(rawData);
    this.availabilityKey = data.features.map(f => f.properties?.availability as string).join();
    return data;
  }

  private abortOngoingRequest() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}
