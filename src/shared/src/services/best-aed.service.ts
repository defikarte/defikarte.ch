import { type Feature, type FeatureCollection, type Point } from 'geojson';
import { featureStatus } from '../map/opening-hours/feature-status';
import { OH_STATUS, type OpeningHoursStatusMap } from '../map/opening-hours/types';
import { distanceBetweenPoints } from './coordinate-calculation.service';
import { type NearbyAed } from './nearby-aed.service';

export const BEST_AED_COUNT = 3;

// Within this distance an open AED is preferred over a closer one with unknown hours. Further
// away the distance alone counts, so a far open AED never beats a close one by its status.
export const BEST_AED_PREFERENCE_RADIUS_METERS = 1000;

/**
 * The best AEDs to go to from the given position: open ones (incl. 24/7) first, then those with
 * unknown hours, each closest first. Closed and not publicly accessible AEDs are left out.
 */
export const findBestAeds = (
  data: FeatureCollection,
  position: { lat: number; lon: number },
  statusMap: OpeningHoursStatusMap | null,
  count = BEST_AED_COUNT,
  preferenceRadius = BEST_AED_PREFERENCE_RADIUS_METERS
): NearbyAed[] => {
  const rank = (status: string, distance: number) =>
    distance > preferenceRadius ? 2 : status === OH_STATUS.OPEN ? 0 : 1;

  return (data.features ?? [])
    .reduce<(NearbyAed & { rank: number })[]>((acc, feature) => {
      if (feature.geometry?.type !== 'Point') return acc;

      const status = featureStatus(feature.properties, statusMap);
      if (status === OH_STATUS.CLOSED) return acc;

      const [lon, lat] = feature.geometry.coordinates;
      const distance = distanceBetweenPoints(position, { lat, lon });
      acc.push({ feature: feature as Feature<Point>, distance, rank: rank(status, distance) });

      return acc;
    }, [])
    .sort((a, b) => a.rank - b.rank || a.distance - b.distance)
    .slice(0, count)
    .map(({ feature, distance }) => ({ feature, distance }));
};
