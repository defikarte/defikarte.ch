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
        0.5,
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
      // a nearby AED keeps the colour of its status, it stands out by opacity and outline
      'circle-color': ohStatusColorExpression,
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
        0.2,
        ['boolean', ['feature-state', FEATURE_STATE.NEARBY], false],
        ['case', ['boolean', ['feature-state', FEATURE_STATE.SELECTED], false], 0.8, 0.5],
        ['match', OH_STATUS_EXPRESSION, OH_STATUS.OPEN, 0.6, 0.4],
      ],
      // an outline in the status colour marks the nearby AEDs, a dark one the AEDs of the
      // emergency view
      'circle-stroke-width': [
        'case',
        ['boolean', ['feature-state', FEATURE_STATE.NEARBY], false],
        3,
        ['boolean', ['feature-state', FEATURE_STATE.EMERGENCY], false],
        2,
        0,
      ],
      'circle-stroke-color': [
        'case',
        ['boolean', ['feature-state', FEATURE_STATE.NEARBY], false],
        ohStatusColorExpression,
        COLORS.PRIMARY_100_GREEN_04,
      ],
      'circle-stroke-opacity': [
        'case',
        ['boolean', ['feature-state', FEATURE_STATE.NEARBY], false],
        0.9,
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
