import { type MapGeoJSONFeature } from 'maplibre-gl';
import { useEffect, useRef } from 'react';
import { type MapInteractionEvent } from '../../model/map';
import { getActiveAedOverlay } from '../helper';
import { type MapInstance } from '../map-instance/map-instance';

interface UseAedDeepLinkProps {
  map: MapInstance | null;
  // OSM node id from the url (web: `/map/aed/123`), selects that AED once the AEDs are loaded
  aedId?: string;
  selectFeatureOnMap: (event: MapInteractionEvent) => boolean;
}

/**
 * Opens the detail view of the AED given in the url, like a click on its marker. Works on the AEDs
 * in memory, so it never makes a request. Runs once per id: later map changes don't reselect it.
 */
export const useAedDeepLink = ({ map, aedId, selectFeatureOnMap }: UseAedDeepLinkProps) => {
  // the select handler is recreated on every render, the effect must not re-run for that
  const selectRef = useRef(selectFeatureOnMap);
  selectRef.current = selectFeatureOnMap;
  const handledIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!map || !aedId || handledIdRef.current === aedId) return;

    const select = () => {
      const sourceId = getActiveAedOverlay(map);
      const data = map.getAllAeds();
      if (handledIdRef.current === aedId || !sourceId || !data) return;

      const feature = data.features.find(f => String(f.id) === aedId);
      if (!feature) {
        // unknown or deleted AED: the map just stays where the url hash put it
        handledIdRef.current = aedId;
        return;
      }

      const selected = selectRef.current({
        type: 'item-select',
        source: sourceId,
        data: { ...feature, source: sourceId } as unknown as MapGeoJSONFeature,
      });
      if (selected) handledIdRef.current = aedId;
    };

    select();
    // the AEDs may only finish loading after the map is created
    return map.subscribeOpeningHoursStatus(select);
  }, [map, aedId]);
};
