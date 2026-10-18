import { type Feature } from 'geojson';

export const OPENING_HOURS_PROPERTY = 'opening_hours';

/**
 * Collects the `opening_hours` values of the features that are not yet in `known` and adds them.
 * The raw values are kept (not trimmed): the map looks up each feature's status by its value.
 */
export const collectSchedules = (features: Feature[], known: Set<string>): string[] => {
  const added: string[] = [];

  for (const feature of features) {
    const value: unknown = feature.properties?.[OPENING_HOURS_PROPERTY];
    if (typeof value === 'string' && value.trim() !== '' && !known.has(value)) {
      known.add(value);
      added.push(value);
    }
  }

  return added;
};
