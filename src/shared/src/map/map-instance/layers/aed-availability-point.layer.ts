import { type FilterSpecification, type LayerSpecification } from 'maplibre-gl';
import {
  COLORS,
  FEATURE_STATE,
  IMAGE_SCALE,
  MARKER_GREEN_IMAGE_ID,
} from '../configuration/constants';

const layerFilter: FilterSpecification = ['!', ['has', 'point_count']];

export const createAedAvailabilityPointLayers = (
  baseId: string,
  source: string
): LayerSpecification[] => {
  const result = [];
  const singlePointLayer: LayerSpecification = {
    id: `${baseId}-single-point`,
    source: source,
    type: 'symbol',
    paint: {
      'icon-opacity': ['case', ['boolean', ['feature-state', FEATURE_STATE.EDITING], false], 0, 1],
    },
    layout: {
      'icon-allow-overlap': true,
      'icon-image': MARKER_GREEN_IMAGE_ID,
      'icon-size': IMAGE_SCALE,
      'icon-anchor': 'bottom',
    },
    filter: layerFilter,
  };

  const singlePointCircleLayer: LayerSpecification = {
    id: `${baseId}-single-point-circle`,
    source: source,
    type: 'circle',
    paint: {
      'circle-color': COLORS.SECONDARY_GREEN_01,
      'circle-radius': [
        'case',
        ['boolean', ['feature-state', FEATURE_STATE.EDITING], false],
        0,
        [
          'case',
          ['boolean', ['feature-state', FEATURE_STATE.SELECTED], false],
          30, // selected
          20, // not selected
        ],
      ],
      'circle-opacity': 0.6,
      'circle-translate': [0, -18],
      'circle-translate-anchor': 'viewport',
    },
    filter: layerFilter,
  };

  result.push(singlePointCircleLayer);
  result.push(singlePointLayer);

  return result;
};
