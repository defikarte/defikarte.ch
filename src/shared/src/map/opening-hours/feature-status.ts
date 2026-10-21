import { type GeoJsonProperties } from 'geojson';
import { OPENING_HOURS_PROPERTY } from './schedules';
import { OH_STATUS, type OpeningHoursStatus, type OpeningHoursStatusMap } from './types';

export const ACCESS_PROPERTY = 'access';

/** `access` values that are never available to the public, whatever the opening hours. */
export const NOT_ACCESSIBLE_VALUES: readonly string[] = ['no', 'private'];

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

/** Filter value for the open AEDs with `opening_hours=24/7`, split off from `OH_STATUS.OPEN`. */
export const ALWAYS_AVAILABLE = '24/7';

/** A status, or `ALWAYS_AVAILABLE`; as a filter, `OH_STATUS.OPEN` then means "open, but not 24/7". */
export type AvailabilityFilter = OpeningHoursStatus | typeof ALWAYS_AVAILABLE;

/**
 * The filter group of a feature: `ALWAYS_AVAILABLE` if it is open with `opening_hours=24/7`,
 * otherwise its status. The groups don't overlap, every AED is in exactly one.
 */
export const availabilityGroup = (
  properties: GeoJsonProperties,
  statusMap: OpeningHoursStatusMap | null
): AvailabilityFilter => {
  const status = featureStatus(properties, statusMap);
  return status === OH_STATUS.OPEN && properties?.[OPENING_HOURS_PROPERTY] === ALWAYS_AVAILABLE
    ? ALWAYS_AVAILABLE
    : status;
};

/** Whether the feature is in one of the filter groups. */
export const matchesAvailabilityFilters = (
  properties: GeoJsonProperties,
  statusMap: OpeningHoursStatusMap | null,
  filters: readonly AvailabilityFilter[]
): boolean => filters.includes(availabilityGroup(properties, statusMap));
