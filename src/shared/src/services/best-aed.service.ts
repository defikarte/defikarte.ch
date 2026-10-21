import { type Feature, type FeatureCollection, type Point } from 'geojson';
import { featureStatus } from '../map/opening-hours/feature-status';
import { OH_STATUS, type OpeningHoursStatusMap } from '../map/opening-hours/types';
import { distanceBetweenPoints } from './coordinate-calculation.service';
import { type NearbyAed } from './nearby-aed.service';

export const BEST_AED_COUNT = 3;

/**
 * The best AEDs to go to from the given position: only those available now (open or 24/7),
 * closest first. Closed, unknown hours and not publicly accessible AEDs are left out.
 */
export const findBestAeds = (
  data: FeatureCollection,
  position: { lat: number; lon: number },
  statusMap: OpeningHoursStatusMap | null,
  count = BEST_AED_COUNT
): NearbyAed[] =>
  (data.features ?? [])
    .reduce<NearbyAed[]>((acc, feature) => {
      if (feature.geometry?.type !== 'Point') return acc;
      if (featureStatus(feature.properties, statusMap) !== OH_STATUS.OPEN) return acc;

      const [lon, lat] = feature.geometry.coordinates;
      const distance = distanceBetweenPoints(position, { lat, lon });
      acc.push({ feature: feature as Feature<Point>, distance });

      return acc;
    }, [])
    .sort((a, b) => a.distance - b.distance)
    .slice(0, count);
