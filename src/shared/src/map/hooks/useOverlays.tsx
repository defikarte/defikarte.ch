import { useEffect, useState } from 'react';
import { FilterType, OverlayType } from '../../model/map';
import { type MapInstance } from '../map-instance/map-instance';

const allFilters: FilterType[] = Object.values(FilterType);

/**
 * The overlay used for the initial map creation, before any filter changes.
 */
export const defaultActiveOverlay = OverlayType.aedAll;

/**
 * Owns the active overlay filters and keeps the map's applied overlay in sync with them. With
 * all statuses selected the AEDs are shown as loaded, otherwise only those of the selected ones.
 */
export const useOverlays = (map: MapInstance | null) => {
  const [activeOverlays, setActiveOverlays] = useState<FilterType[]>(allFilters);
  const showsAll = allFilters.every(filter => activeOverlays.includes(filter));
  const activeOverlay = showsAll ? OverlayType.aedAll : OverlayType.aedByStatus;

  // before the overlay is applied, so it starts with the selected statuses
  useEffect(() => {
    if (!showsAll) {
      map?.setAedStatusFilter(activeOverlays);
    }
  }, [map, activeOverlays, showsAll]);

  useEffect(() => {
    void map?.applyOverlay(activeOverlay);

    return () => {
      map?.removeOverlay(activeOverlay);
    };
  }, [map, activeOverlay]);

  return { activeOverlays, setActiveOverlays };
};
