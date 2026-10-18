import { type ExpressionSpecification } from 'maplibre-gl';
import {
  COLORS,
  MARKER_GREEN_IMAGE_ID,
  MARKER_ORANGE_IMAGE_ID,
  MARKER_RED_IMAGE_ID,
  OH_STATUS_STATE,
} from '../map-instance/configuration/constants';
import { ACCESS_PROPERTY } from './feature-status';
import { OPENING_HOURS_PROPERTY } from './schedules';
import { OH_STATUS } from './types';

/**
 * The current opening status of a feature. `access=no` is never available; otherwise the status
 * is looked up by its `opening_hours` value in the `oh_status` global state. Until the status is
 * computed (or if it cannot be), `24/7` counts as open and everything else as unknown, like before
 * the status was computed from opening hours. `featureStatus` applies the same rules in JS.
 */
export const OH_STATUS_EXPRESSION: ExpressionSpecification = [
  'case',
  ['==', ['get', ACCESS_PROPERTY], 'no'],
  OH_STATUS.CLOSED,
  [
    'string',
    [
      'get',
      ['to-string', ['get', OPENING_HOURS_PROPERTY]],
      ['object', ['global-state', OH_STATUS_STATE], ['literal', {}]],
    ],
    ['match', ['get', OPENING_HOURS_PROPERTY], '24/7', OH_STATUS.OPEN, OH_STATUS.UNKNOWN],
  ],
];

export const ohStatusIconExpression: ExpressionSpecification = [
  'match',
  OH_STATUS_EXPRESSION,
  OH_STATUS.OPEN,
  MARKER_GREEN_IMAGE_ID,
  OH_STATUS.CLOSED,
  MARKER_RED_IMAGE_ID,
  MARKER_ORANGE_IMAGE_ID,
];

export const ohStatusColorExpression: ExpressionSpecification = [
  'match',
  OH_STATUS_EXPRESSION,
  OH_STATUS.OPEN,
  COLORS.SECONDARY_GREEN_01,
  OH_STATUS.CLOSED,
  COLORS.SECONDARY_RED_01,
  COLORS.SECONDARY_ORANGE_02,
];
