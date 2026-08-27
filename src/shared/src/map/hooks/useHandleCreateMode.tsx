import { type Feature } from 'geojson';
import { type Dispatch, type SetStateAction, useEffect, useRef, useState } from 'react';
import { CreateMode, type MapInteractionEvent, OverlayType } from '../../model/map';
import {
  createFeature,
  deselectAllFeatures,
  getMoveInteraction,
  getRelevantInteractions,
} from '../helper';
import { MapConfiguration } from '../map-instance/configuration/map.configuration';
import type ItemMoveInteraction from '../map-instance/interactions/item-move.interaction';
import { type MapInstance } from '../map-instance/map-instance';

const featureId = 42;

const getFeaturePosition = (feature: Feature | null): [number, number] => {
  if (feature?.geometry?.type !== 'Point') {
    return [0, 0];
  }
  const coordinates = feature.geometry.coordinates;
  return [coordinates[0], coordinates[1]];
};

interface UseHandleCreateModeProps {
  map: MapInstance | null;
  feature: MapInteractionEvent | null;
}

export const useHandleCreateMode = ({
  map,
  feature,
}: UseHandleCreateModeProps): [CreateMode, Dispatch<SetStateAction<CreateMode>>] => {
  const [createMode, setCreateMode] = useState<CreateMode>(CreateMode.none);
  // Tracks whether a create/edit flow is currently set up on the map (overlay applied, base
  // interactions switched off). It has to be updated synchronously: the effect can be re-entered
  // while an earlier run is still awaiting below, and a flag written after an await goes stale and
  // silently skips the teardown - which strands the create marker and leaves the map interactions
  // switched off, with no UI left to dismiss it.
  const isFlowActiveRef = useRef(false);

  useEffect(() => {
    const wasFlowActive = isFlowActiveRef.current;
    const isFlowActive = createMode !== CreateMode.none;
    isFlowActiveRef.current = isFlowActive;

    const init = async () => {
      // case start creating or editing AED
      if (isFlowActive && !wasFlowActive) {
        deselectAllFeatures(map);
        getRelevantInteractions(map?.getActiveMapInteractions())?.forEach(interaction => {
          interaction.off();
        });

        await map?.applyOverlay(OverlayType.aedCreate);

        const isEdit = !!feature;
        const center = isEdit ? getFeaturePosition(feature.data) : map?.getCenter();
        const data = createFeature(featureId, center!, isEdit);
        map?.setGeoJSONSourceData(MapConfiguration.aedCreateSourceId, data);
        const interaction: ItemMoveInteraction | undefined = getMoveInteraction(map);
        await interaction?.setFeaturePosition(featureId, center!);
      }

      // case change position of AED
      if (createMode === CreateMode.position) {
        const interaction: ItemMoveInteraction | undefined = getMoveInteraction(map);
        interaction?.on();
      }

      // case only change attribtutes, edit of position not allowed
      if (createMode === CreateMode.form) {
        const interaction: ItemMoveInteraction | undefined = getMoveInteraction(map);
        interaction?.off();
      }

      // case edit or create is cancelled / finished
      if (!isFlowActive && wasFlowActive) {
        map?.removeOverlay(OverlayType.aedCreate);
        getRelevantInteractions(map?.getActiveMapInteractions())?.forEach(interaction => {
          interaction.on();
        });
      }
    };

    void init();
  }, [map, createMode, feature]);

  return [createMode, setCreateMode];
};
