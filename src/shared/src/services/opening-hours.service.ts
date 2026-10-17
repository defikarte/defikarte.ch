import { type GeoJsonProperties } from 'geojson';
import opening_hours from 'opening_hours';
import { type AedAvailability } from '../model/aed';

// Without a location the library evaluates public holidays (PH) with the German calendar.
// All AEDs are in Switzerland, so a fixed position in the middle of the country is precise enough.
const SWISS_NOMINATIM = {
  lat: 46.8,
  lon: 8.2,
  address: { country_code: 'ch', state: '' },
};

// Cache for parsed opening hours to avoid expensive re-parsing
const openingHoursCache = new Map<string, opening_hours>();
const validationCache = new Map<string, boolean>();

// Cache size limit to prevent memory leaks
const MAX_CACHE_SIZE = 5000;

const getOrCreateOpeningHours = (value: string): opening_hours | null => {
  if (!value || value === '') {
    return null;
  }

  if (openingHoursCache.has(value)) {
    return openingHoursCache.get(value)!;
  }

  try {
    const oh = new opening_hours(value, SWISS_NOMINATIM);

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

export const isOpenNow = (openingHours: string) => {
  if (!openingHours || openingHours === '') {
    return false;
  }

  const oh = getOrCreateOpeningHours(openingHours);
  if (!oh) {
    return false;
  }

  return oh.getState();
};

export const getAedAvailability = (
  properties: GeoJsonProperties,
  now: Date = new Date()
): AedAvailability => {
  if (properties?.access === 'no') {
    return 'closed';
  }

  const openingHours = properties?.opening_hours as string | undefined;
  if (openingHours === '24/7') {
    return 'open';
  }

  const oh = openingHours ? getOrCreateOpeningHours(openingHours) : null;
  if (!oh || oh.getUnknown(now)) {
    return 'unknown';
  }

  return oh.getState(now) ? 'open' : 'closed';
};
