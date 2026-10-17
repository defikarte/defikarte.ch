import {
  type GeoJSONSource,
  type GeoJSONSourceSpecification,
  type LayerSpecification,
  type Map,
} from 'maplibre-gl';
import {
  type InteractionLayer,
  type MapEventCallback,
  type OverlayStrategy,
  type RefreshableOverlayStrategy,
} from '../../../../model/map';
import { type OpeningHoursController } from '../../../opening-hours/controller';
import { MapConfiguration } from '../../configuration/map.configuration';
import ClusterZoomInteraction from '../../interactions/cluster-zoom.interaction';
import CursorClickableInteraction from '../../interactions/cursor-clickable.interaction';
import ItemSelectInteraction from '../../interactions/item-select.interaction';
import { createAedAvailabilityPointLayers } from '../../layers/aed-availability-point.layer';
import { createAedClusterLayers } from '../../layers/aed-cluster.layer';
import { createAedSource } from '../../sources/aed.source';

/**
 * Shows only the AEDs open right now. The open AEDs are a separate source (built in the opening
 * hours worker) instead of a layer filter, so the clusters count only open AEDs as well.
 */
export class AedAvailabilityOverlayStrategy implements OverlayStrategy, RefreshableOverlayStrategy {
  private interactions: InteractionLayer[] = [];
  private aedPointLayers: LayerSpecification[] = [];
  private aedClusterLayers: LayerSpecification[] = [];
  private map: Map;
  private openingHours: OpeningHoursController;
  private unsubscribeOpenData: (() => void) | null = null;

  constructor(map: Map, openingHours: OpeningHoursController) {
    this.map = map;
    this.openingHours = openingHours;
  }

  getSourceId() {
    return MapConfiguration.aedAvailabilitySourceId;
  }

  createSource(): GeoJSONSourceSpecification {
    // follow the open AEDs while the overlay is active, the set changes as time passes
    this.unsubscribeOpenData ??= this.openingHours.subscribeOpenData(url => {
      this.map.getSource<GeoJSONSource>(this.getSourceId())?.setData(url);
    });

    // empty until the opening hours are computed
    return createAedSource(
      this.openingHours.getOpenSourceData() ?? { type: 'FeatureCollection', features: [] }
    );
  }

  refreshSourceData(): Promise<void> {
    // reloads in the background, the open AEDs follow through the subscription
    void this.openingHours.refresh();
    return Promise.resolve();
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
    this.unsubscribeOpenData?.();
    this.unsubscribeOpenData = null;

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
