/**
 * Data contract for precompiled opening hours. Shared with a possible backend implementation,
 * so keep it stable: the map style and the status logic only depend on these types.
 */

/** Minutes since Monday 00:00 local wall-clock time. Range 0..10080. */
export type MinuteOfWeek = number;

/**
 * [start, end, unknown]. start inclusive, end exclusive. unknown = true if the opening_hours
 * rule marks this period as "unknown" (e.g. comments / "unknown" modifier).
 */
export type Interval = [MinuteOfWeek, MinuteOfWeek, boolean];

/** null = opening_hours missing, empty or unparseable -> status "unknown". */
export type CompiledSchedule = Interval[] | null;

export interface CompiledWeek {
  /** ISO date of the Monday this data is valid for, e.g. "2026-10-12" */
  weekStart: string;
  /** same order as the opening_hours values they were compiled from */
  schedules: CompiledSchedule[];
}

/** '1' = open, '0' = closed, '?' = unknown */
export type OpeningHoursStatus = '1' | '0' | '?';

export const OH_STATUS = {
  OPEN: '1',
  CLOSED: '0',
  UNKNOWN: '?',
} as const satisfies Record<string, OpeningHoursStatus>;

/**
 * Current status per `opening_hours` value; the map style looks up each feature's status here.
 * Unknown values are left out.
 */
export type OpeningHoursStatusMap = Record<string, OpeningHoursStatus>;

/**
 * Location passed to opening_hours.js. It decides which public holidays apply (`PH`) and is the
 * reference point for sunrise/sunset rules: schedules are compiled per unique string, not per
 * location, so a single coordinate is used for all of them.
 */
export interface HolidayRegion {
  lat: number;
  lon: number;
  address: {
    country_code: string;
    state: string;
  };
}

// centre of Switzerland
export const DEFAULT_HOLIDAY_REGION: HolidayRegion = {
  lat: 46.8,
  lon: 8.23,
  address: { country_code: 'ch', state: '' },
};
