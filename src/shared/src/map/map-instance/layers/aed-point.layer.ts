import { type FilterSpecification, type LayerSpecification } from 'maplibre-gl';
import {
  OH_STATUS_EXPRESSION,
  ohStatusColorExpression,
  ohStatusIconExpression,
} from '../../opening-hours/expressions';
import { OH_STATUS } from '../../opening-hours/types';
import { COLORS, FEATURE_STATE, IMAGE_SCALE } from '../configuration/constants';

const noClusterFilter: FilterSpecification = ['!', ['has', 'point_count']];

export const createAedPointLayers = (baseId: string, source: string): LayerSpecification[] => {
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
      // green = open, red = closed, orange = unknown
      'icon-image': ohStatusIconExpression,
      'icon-size': IMAGE_SCALE,
      'icon-anchor': 'bottom',
    },
    filter: noClusterFilter,
  };

  const singlePointCircleLayer: LayerSpecification = {
    id: `${baseId}-single-point-circle`,
    source: source,
    type: 'circle',
    paint: {
      'circle-color': [
        'case',
        ['boolean', ['feature-state', FEATURE_STATE.NEARBY], false],
        [
          'case',
          ['boolean', ['feature-state', FEATURE_STATE.SELECTED], false],
          COLORS.SECONDARY_ORANGE_02, // the nearby AED currently shown
          COLORS.SECONDARY_ORANGE_01,
        ],
        ohStatusColorExpression,
      ],
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
      'circle-opacity': [
        'case',
        ['boolean', ['feature-state', FEATURE_STATE.NEARBY], false],
        ['case', ['boolean', ['feature-state', FEATURE_STATE.SELECTED], false], 0.8, 0.5],
        ['match', OH_STATUS_EXPRESSION, OH_STATUS.OPEN, 0.6, 0.4],
      ],
      // an outline, so the nearby ring also stands out on the orange ring of AEDs with unknown availability
      'circle-stroke-width': [
        'case',
        ['boolean', ['feature-state', FEATURE_STATE.NEARBY], false],
        2,
        0,
      ],
      'circle-stroke-color': COLORS.SECONDARY_ORANGE_02,
      'circle-stroke-opacity': 0.6,
      'circle-translate': [0, -18],
      'circle-translate-anchor': 'viewport',
    },
    filter: noClusterFilter,
  };

  // order is important
  result.push(singlePointCircleLayer);
  result.push(singlePointLayer);

  return result;
};
