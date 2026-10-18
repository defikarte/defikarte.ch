import opening_hours from 'opening_hours';
import { DEFAULT_HOLIDAY_REGION } from '../map/opening-hours/types';

// Cache for parsed opening hours to avoid expensive re-parsing
const openingHoursCache = new Map<string, opening_hours>();
const validationCache = new Map<string, boolean>();

// Cache size limit to prevent memory leaks
const MAX_CACHE_SIZE = 1000;

const getOrCreateOpeningHours = (value: string): opening_hours | null => {
  if (!value || value === '') {
    return null;
  }

  if (openingHoursCache.has(value)) {
    return openingHoursCache.get(value)!;
  }

  try {
    // without a region, public holidays (PH) are evaluated with the German calendar
    const oh = new opening_hours(value, DEFAULT_HOLIDAY_REGION);

    // Clear cache if it gets too large
    if (openingHoursCache.size >= MAX_CACHE_SIZE) {
      const firstKey = openingHoursCache.keys().next().value;
      if (firstKey !== undefined) {
        openingHoursCache.delete(firstKey);
      }
    }

    openingHoursCache.set(value, oh);
    return oh;
  } catch {
    return null;
  }
};

export const isOpeningHourValid = (value: string) => {
  if (value === '' || value === null) {
    return true;
  }

  if (validationCache.has(value)) {
    return validationCache.get(value)!;
  }

  const oh = getOrCreateOpeningHours(value);
  const valid = oh !== null;

  // Clear cache if it gets too large
  if (validationCache.size >= MAX_CACHE_SIZE) {
    const firstKey = validationCache.keys().next().value;
    if (firstKey !== undefined) {
      validationCache.delete(firstKey);
    }
  }

  validationCache.set(value, valid);
  return valid;
};
