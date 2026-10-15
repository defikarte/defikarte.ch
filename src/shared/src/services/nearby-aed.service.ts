import { type Feature, type FeatureCollection, type Point } from 'geojson';
import { distanceBetweenPoints } from './coordinate-calculation.service';

// Radius in which an existing AED counts as a potential duplicate of a new one. Indoor GPS is
// often off by 10-20 m, while real duplicates tend to be only a few metres apart.
export const NEARBY_AED_RADIUS_METERS = 25;

export interface NearbyAed {
  feature: Feature<Point>;
  distance: number;
}

/**
 * Returns the AEDs within `radius` metres of the given position, closest first. AEDs close
 * together are not necessarily duplicates (e.g. on different floors), so this only feeds a hint.
 */
export const findNearbyAeds = (
  data: FeatureCollection,
  position: { lat: number; lon: number },
  radius = NEARBY_AED_RADIUS_METERS
): NearbyAed[] => {
  // requestAedData resolves to an empty object when the request fails
  return (data.features ?? [])
    .reduce<NearbyAed[]>((acc, feature) => {
      if (feature.geometry?.type !== 'Point') return acc;

      const [lon, lat] = feature.geometry.coordinates;
      const distance = distanceBetweenPoints(position, { lat, lon });
      if (distance <= radius) {
        acc.push({ feature: feature as Feature<Point>, distance });
      }

      return acc;
    }, [])
    .sort((a, b) => a.distance - b.distance);
};
