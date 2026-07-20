import { useEffect, useState } from 'react';
import { FilterType, OverlayType } from '../../model/map';
import { type MapInstance } from '../map-instance/map-instance';

const createFilterKey = (filter: FilterType | FilterType[]) => {
  if (Array.isArray(filter)) {
    return filter.sort().join('');
  }

  return filter;
};

const defaultOverlay: FilterType[] = [FilterType.alwaysAvailable, FilterType.withOpeningHours];
const filterToOverlayMapping = {
  [createFilterKey(FilterType.alwaysAvailable)]: OverlayType.aedAlwaysAvailable,
  [createFilterKey(FilterType.withOpeningHours)]: OverlayType.aedWithOpeningHours,
  [createFilterKey(FilterType.byAvailability)]: OverlayType.aedByCurrentAvailability,
  [createFilterKey([FilterType.alwaysAvailable, FilterType.withOpeningHours])]: OverlayType.aedAll,
};

/**
 * The overlay used for the initial map creation, before any filter changes.
 */
export const defaultActiveOverlay =
  filterToOverlayMapping[createFilterKey(defaultOverlay)] || OverlayType.aedAll;

/**
 * Owns the active overlay filters and keeps the map's applied overlay in sync with them.
 */
export const useOverlays = (map: MapInstance | null) => {
  const [activeOverlays, setActiveOverlays] = useState<FilterType[]>(defaultOverlay);

  useEffect(() => {
    const filterKey = createFilterKey(activeOverlays);
    const activeOverlay = filterToOverlayMapping[filterKey];

    void map?.applyOverlay(activeOverlay);

    return () => {
      map?.removeOverlay(activeOverlay);
    };
  }, [map, activeOverlays]);

  return { activeOverlays, setActiveOverlays };
};
