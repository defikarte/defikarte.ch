import { type FeatureCollection } from 'geojson';

export const OH_IDX_PROPERTY = 'oh_idx';

/**
 * Deduplicates the `opening_hours` strings of all features and stores the index of each
 * feature's string in `properties.oh_idx`, so the map style can look up its status.
 *
 * Returns the list of unique strings (index = oh_idx). Returns null if every feature already
 * carries an integer `oh_idx` (precompiled by a backend): those are kept, and the matching
 * schedule list has to come from the same place.
 */
export const indexSchedules = (data: FeatureCollection): string[] | null => {
  const features = data.features;

  const alreadyIndexed =
    features.length > 0 &&
    features.every(feature => Number.isInteger(feature.properties?.[OH_IDX_PROPERTY]));
  if (alreadyIndexed) {
    console.debug('opening hours: features are already indexed', { features: features.length });
    return null;
  }

  const indexByValue = new Map<string, number>();
  const schedules: string[] = [];

  for (const feature of features) {
    const raw: unknown = feature.properties?.opening_hours;
    const value = typeof raw === 'string' ? raw.trim() : '';

    let index = indexByValue.get(value);
    if (index === undefined) {
      index = schedules.length;
      schedules.push(value);
      indexByValue.set(value, index);
    }

    feature.properties = { ...feature.properties, [OH_IDX_PROPERTY]: index };
  }

  console.debug('opening hours: indexed schedules', {
    features: features.length,
    uniqueSchedules: schedules.length,
  });

  return schedules;
};
