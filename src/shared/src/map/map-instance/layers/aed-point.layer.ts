import { type FilterSpecification, type LayerSpecification } from 'maplibre-gl';
import {
  EMERGENCY_DIMMED_EXPRESSION,
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
      'icon-opacity': [
        'case',
        ['boolean', ['feature-state', FEATURE_STATE.EDITING], false],
        0,
        EMERGENCY_DIMMED_EXPRESSION,
        0.3,
        1,
      ],
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
          [
            'any',
            ['boolean', ['feature-state', FEATURE_STATE.SELECTED], false],
            ['boolean', ['feature-state', FEATURE_STATE.EMERGENCY_SELECTED], false],
          ],
          30, // selected, or the AED the emergency view shows
          20, // not selected
        ],
      ],
      'circle-opacity': [
        'case',
        EMERGENCY_DIMMED_EXPRESSION,
        0.1,
        ['boolean', ['feature-state', FEATURE_STATE.NEARBY], false],
        ['case', ['boolean', ['feature-state', FEATURE_STATE.SELECTED], false], 0.8, 0.5],
        ['match', OH_STATUS_EXPRESSION, OH_STATUS.OPEN, 0.6, 0.4],
      ],
      // an outline, so the nearby ring also stands out on the orange ring of AEDs with unknown
      // availability - and a dark one marks the AEDs of the emergency view
      'circle-stroke-width': [
        'case',
        ['boolean', ['feature-state', FEATURE_STATE.NEARBY], false],
        2,
        ['boolean', ['feature-state', FEATURE_STATE.EMERGENCY], false],
        3,
        0,
      ],
      'circle-stroke-color': [
        'case',
        ['boolean', ['feature-state', FEATURE_STATE.NEARBY], false],
        COLORS.SECONDARY_ORANGE_02,
        COLORS.PRIMARY_100_GREEN_04,
      ],
      'circle-stroke-opacity': [
        'case',
        ['boolean', ['feature-state', FEATURE_STATE.NEARBY], false],
        0.6,
        1,
      ],
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
