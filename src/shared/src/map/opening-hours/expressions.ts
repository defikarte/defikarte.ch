import { type ExpressionSpecification } from 'maplibre-gl';
import {
  COLORS,
  MARKER_GREEN_IMAGE_ID,
  MARKER_ORANGE_IMAGE_ID,
  MARKER_RED_IMAGE_ID,
  OH_STATUS_STATE,
} from '../map-instance/configuration/constants';
import { OH_IDX_PROPERTY } from './schedule-index';
import { OH_STATUS } from './types';

/**
 * The current opening status of a feature: its character in the `oh_status` global state string.
 * Evaluates to '?' (unknown) as long as the feature has no `oh_idx` or the status is not computed yet.
 */
export const OH_STATUS_EXPRESSION: ExpressionSpecification = [
  'case',
  ['has', OH_IDX_PROPERTY],
  [
    'slice',
    ['to-string', ['global-state', OH_STATUS_STATE]],
    ['get', OH_IDX_PROPERTY],
    ['+', ['get', OH_IDX_PROPERTY], 1],
  ],
  OH_STATUS.UNKNOWN,
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
