import { type GeoJsonProperties } from 'geojson';
import { OPENING_HOURS_PROPERTY } from './schedules';
import { OH_STATUS, type OpeningHoursStatus, type OpeningHoursStatusMap } from './types';

export const ACCESS_PROPERTY = 'access';

/** `access` values that are never available to the public, whatever the opening hours. */
export const NOT_ACCESSIBLE_VALUES = ['no', 'private'];

/**
 * The current status of a feature, the same rules as `OH_STATUS_EXPRESSION` (keep both in sync):
 * `access=no`/`private` is never available, otherwise the status of its `opening_hours` value. Until the
 * status is computed (or if it cannot be), `24/7` counts as open and everything else as unknown.
 */
export const featureStatus = (
  properties: GeoJsonProperties,
  statusMap: OpeningHoursStatusMap | null
): OpeningHoursStatus => {
  if (NOT_ACCESSIBLE_VALUES.includes(properties?.[ACCESS_PROPERTY] as string)) {
    return OH_STATUS.CLOSED;
  }

  const value: unknown = properties?.[OPENING_HOURS_PROPERTY];
  if (typeof value !== 'string') {
    return OH_STATUS.UNKNOWN;
  }

  return statusMap?.[value] ?? (value === '24/7' ? OH_STATUS.OPEN : OH_STATUS.UNKNOWN);
};
