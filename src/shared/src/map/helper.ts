import { type FeatureCollection } from 'geojson';
import { type InteractionLayer } from '../model/map';
import { MapConfiguration } from './map-instance/configuration/map.configuration';
import ClusterZoomInteraction from './map-instance/interactions/cluster-zoom.interaction';
import CursorClickableInteraction from './map-instance/interactions/cursor-clickable.interaction';
import ItemMoveInteraction from './map-instance/interactions/item-move.interaction';
import ItemSelectInteraction from './map-instance/interactions/item-select.interaction';
import { type MapInstance } from './map-instance/map-instance';

export const getRelevantInteractions = (interactions: readonly InteractionLayer[] | undefined) => {
  return interactions?.filter(
    interaction =>
      interaction instanceof ItemSelectInteraction ||
      interaction instanceof ClusterZoomInteraction ||
      interaction instanceof CursorClickableInteraction
  );
};

export const createFeature = (featureId: number | string, center: number[], isEdit: boolean) => {
  return {
    type: 'FeatureCollection',
    features: [
      {
        geometry: { coordinates: center, type: 'Point' },
        type: 'Feature',
        properties: {
          isEdit: isEdit,
        },
        id: featureId,
      },
    ],
  } as FeatureCollection;
};

export const getMoveInteraction = (map: MapInstance | null) => {
  return map
    ?.getActiveMapInteractions()
    .find(
      i => i instanceof ItemMoveInteraction && i.sourceId === MapConfiguration.aedCreateSourceId
    ) as ItemMoveInteraction;
};

export const deselectAllFeatures = (map: MapInstance | null) => {
  map?.getActiveMapInteractions()?.forEach(interaction => {
    if (interaction instanceof ItemSelectInteraction) {
      interaction.deselectFeatures();
    }
  });
};

export const getActiveAedOverlay = (map: MapInstance | null) => {
  return map
    ?.getActiveOverlaySourceIds()
    .find(
      id => id === MapConfiguration.aedSourceId || id === MapConfiguration.aedAvailabilitySourceId
    );
};
