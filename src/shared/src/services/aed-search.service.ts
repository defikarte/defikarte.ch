import type { FeatureCollection } from 'geojson';
import type { MapInstance } from '../map/map-instance/map-instance';

export const searchAed = async (searchText: string, sourceIds: string[], map: MapInstance) => {
  if (!searchText || searchText.length < 3) {
    return [];
  }

  const data: FeatureCollection = {
    features: [],
    type: 'FeatureCollection',
  };
  for (const sourceId of sourceIds) {
    const sourceData = await map.getGeoJsonSourceData(sourceId);
    sourceData.features.forEach(feature => {
      if (feature.properties) {
        feature.properties.source = sourceId;
      }
    });
    data.features.push(...sourceData.features);
  }

  // Pre-compute regex to avoid repeated calls
  const searchRegex = getSearchRegex(searchText);
  if (!searchRegex) {
    return [];
  }

  const results = data.features
    .map(feature => {
      const properties = feature.properties ?? {};
      const name = (properties.name as string) ?? '';
      const defibrillatorLocation = (properties['defibrillator:location'] as string) ?? '';
      const description = (properties.description as string) ?? '';
      const operator = (properties.operator as string) ?? '';

      const countMatches =
        doesTextMatchWithRegex(searchRegex, name) +
        doesTextMatchWithRegex(searchRegex, defibrillatorLocation) +
        doesTextMatchWithRegex(searchRegex, description) +
        doesTextMatchWithRegex(searchRegex, operator);

      return { feature, countMatches };
    })
    .filter(result => result.countMatches > 2)
    .sort((a, b) => b.countMatches - a.countMatches)
    .map(result => result.feature);

  return results;
};

// Cache for compiled regex patterns
const regexCache = new Map<string, RegExp>();
const MAX_REGEX_CACHE_SIZE = 100;

const getSearchRegex = (searchText: string): RegExp | null => {
  if (regexCache.has(searchText)) {
    return regexCache.get(searchText)!;
  }

  const searchTerms = searchText
    .toLowerCase()
    .split(' ')
    .map(term => term.trim())
    .filter(term => term !== '' && term.length > 2);

  if (searchTerms.length === 0) {
    return null;
  }

  const regex = new RegExp(searchTerms.join('|'), 'g');

  // Clear cache if it gets too large
  if (regexCache.size >= MAX_REGEX_CACHE_SIZE) {
    const firstKey = regexCache.keys().next().value;
    if (firstKey !== undefined) {
      regexCache.delete(firstKey);
    }
  }

  regexCache.set(searchText, regex);
  return regex;
};

const doesTextMatchWithRegex = (searchRegex: RegExp, value: string) => {
  if (!value) {
    return 0;
  }

  const matches = Array.from(value.toLowerCase().matchAll(searchRegex));

  return matches.reduce(
    (acc, match) => acc + (match[0].length > 3 ? match[0].length : match[0].length / 2),
    0
  );
};
