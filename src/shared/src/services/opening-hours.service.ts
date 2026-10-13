import opening_hours from 'opening_hours';

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
    const oh = new opening_hours(value);

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
