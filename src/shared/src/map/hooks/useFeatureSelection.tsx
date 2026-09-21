import { type Point } from 'geojson';
import { type Dispatch, type SetStateAction } from 'react';
import { CreateMode, type MapEvent, type MapInteractionEvent } from '../../model/map';
import { FEATURE_STATE } from '../map-instance/configuration/constants';
import ItemSelectInteraction from '../map-instance/interactions/item-select.interaction';
import { type MapInstance } from '../map-instance/map-instance';

interface UseFeatureSelectionProps {
  map: MapInstance | null;
  setEditFeature: Dispatch<SetStateAction<MapInteractionEvent | null>>;
  setCreateMode: Dispatch<SetStateAction<CreateMode>>;
}

/**
 * Handlers for selecting, centering and editing features on the map.
 */
export const useFeatureSelection = ({
  map,
  setEditFeature,
  setCreateMode,
}: UseFeatureSelectionProps) => {
  const selectFeatureOnMap = (event: MapInteractionEvent): boolean => {
    if (event.type !== 'item-select' || !event.data) return false;

    let result = false;
    map?.getActiveMapInteractions()?.forEach(interaction => {
      if (
        interaction instanceof ItemSelectInteraction &&
        interaction.sourceId === event.data?.source
      ) {
        interaction.selectFeature(event.data, null);
        result = true;
      }
    });

    return result;
  };

  const centerFeatureOnMap = (event: MapInteractionEvent | null) => {
    if (!event || !event.data) return;
    const bbox = event.data.geometry.bbox;
    if (bbox?.length === 4) {
      map?.fitBounds([
        [bbox[0], bbox[1]],
        [bbox[2], bbox[3]],
      ]);

      return;
    }
    const coordinates = (event.data.geometry as Point).coordinates;
    map?.easeTo(coordinates as [number, number], 18);
  };

  const handleSelectOrCenterFeatureOnMap = (event: MapEvent) => {
    if (event.type !== 'item-select' || !event.data) return;

    const interactionExecuted = selectFeatureOnMap(event);
    if (!interactionExecuted) {
      centerFeatureOnMap(event);
    }
  };

  const handleEditFeature = (event: MapInteractionEvent) => {
    if (!event || !event.data) return;
    centerFeatureOnMap(event);
    setEditFeature(event);
    map?.setFeatureState(event.source ?? '', event.data.id, {
      [FEATURE_STATE.EDITING]: true,
    });
    setCreateMode(CreateMode.form);
  };

  return {
    handleSelectOrCenterFeatureOnMap,
    selectFeatureOnMap,
    handleEditFeature,
  };
};
