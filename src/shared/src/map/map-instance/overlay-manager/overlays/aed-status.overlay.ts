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
import { type AvailabilityFilter } from '../../../opening-hours/feature-status';
import { OH_STATUS } from '../../../opening-hours/types';
import { MapConfiguration } from '../../configuration/map.configuration';
import ClusterZoomInteraction from '../../interactions/cluster-zoom.interaction';
import CursorClickableInteraction from '../../interactions/cursor-clickable.interaction';
import ItemSelectInteraction from '../../interactions/item-select.interaction';
import { createAedAvailabilityPointLayers } from '../../layers/aed-availability-point.layer';
import { createAedClusterLayers } from '../../layers/aed-cluster.layer';
import { createAedSource } from '../../sources/aed.source';

/**
 * Shows only the AEDs in one of the selected groups right now (the statuses, with the 24/7 ones
 * split off, see `availabilityGroup`). They are a separate source
 * instead of a layer filter, so the clusters count only these AEDs as well.
 */
export class AedStatusOverlayStrategy implements OverlayStrategy, RefreshableOverlayStrategy {
  private interactions: InteractionLayer[] = [];
  private aedPointLayers: LayerSpecification[] = [];
  private aedClusterLayers: LayerSpecification[] = [];
  private map: Map;
  private openingHours: OpeningHoursController;
  private statuses: readonly AvailabilityFilter[] = [OH_STATUS.OPEN];
  private unsubscribeData: (() => void) | null = null;

  constructor(map: Map, openingHours: OpeningHoursController) {
    this.map = map;
    this.openingHours = openingHours;
  }

  /** Changes the shown statuses; while the overlay is active, only its data is replaced. */
  setStatuses(statuses: readonly AvailabilityFilter[]) {
    this.statuses = statuses;
    if (this.unsubscribeData) {
      this.unsubscribeData();
      this.unsubscribeData = null;
      this.subscribe();
    }
  }

  getSourceId() {
    return MapConfiguration.aedAvailabilitySourceId;
  }

  createSource(): GeoJSONSourceSpecification {
    // follow the AEDs while the overlay is active, the set changes as time passes
    if (!this.unsubscribeData) {
      this.subscribe();
    }

    // empty until the opening hours are computed
    return createAedSource(
      this.openingHours.getData(this.statuses) ?? { type: 'FeatureCollection', features: [] }
    );
  }

  private subscribe() {
    this.unsubscribeData = this.openingHours.subscribeData(this.statuses, data => {
      this.map.getSource<GeoJSONSource>(this.getSourceId())?.setData(data);
    });
  }

  refreshSourceData(): Promise<void> {
    // reloads in the background, the AEDs follow through the subscription
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
    this.unsubscribeData?.();
    this.unsubscribeData = null;

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
