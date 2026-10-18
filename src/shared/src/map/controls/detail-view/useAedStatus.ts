import { type GeoJsonProperties } from 'geojson';
import { useCallback, useSyncExternalStore } from 'react';
import { type MapInstance } from '../../map-instance/map-instance';
import { featureStatus } from '../../opening-hours/feature-status';
import { type OpeningHoursStatus } from '../../opening-hours/types';

const noSubscription = () => () => {};

/**
 * The current status of an AED, from the same opening hours status as the markers on the map,
 * so both always match. Updates when an opening or closing time is crossed.
 */
export const useAedStatus = (
  map: MapInstance | null,
  properties: GeoJsonProperties
): OpeningHoursStatus => {
  const subscribe = useCallback(
    (onChange: () => void) => map?.subscribeOpeningHoursStatus(onChange) ?? noSubscription(),
    [map]
  );
  const statusMap = useSyncExternalStore(
    map ? subscribe : noSubscription,
    () => map?.getOpeningHoursStatusMap() ?? null
  );

  return featureStatus(properties, statusMap);
};
