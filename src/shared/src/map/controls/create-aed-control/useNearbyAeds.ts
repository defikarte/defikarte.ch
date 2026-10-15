import { type FeatureCollection } from 'geojson';
import { useCallback, useEffect, useRef, useState } from 'react';
import { type ApiClient } from '../../../api/api-client';
import { findNearbyAeds, type NearbyAed } from '../../../services/nearby-aed.service';
import { getActiveAedOverlay } from '../../helper';
import { FEATURE_STATE } from '../../map-instance/configuration/constants';
import { MapConfiguration } from '../../map-instance/configuration/map.configuration';
import { type MapInstance } from '../../map-instance/map-instance';

interface UseNearbyAedsProps {
  map: MapInstance | null;
  apiClient: ApiClient;
  // only while the position of a new AED is chosen - an edited AED would be its own duplicate
  isActive: boolean;
  position: { lat: number; lon: number } | null;
}

/**
 * Finds the existing AEDs close to the position of a new one while it is placed, and highlights
 * them on the map. The hint is optional: a failed lookup yields no AEDs and never blocks creating.
 */
export const useNearbyAeds = ({ map, apiClient, isActive, position }: UseNearbyAedsProps) => {
  const [nearbyAeds, setNearbyAeds] = useState<NearbyAed[]>([]);
  // Loaded once per create flow (the owning control unmounts when it ends) and reused on every
  // marker move.
  const allAedsRef = useRef<Promise<FeatureCollection> | null>(null);

  const lookup = useCallback(
    async (target: { lat: number; lon: number }): Promise<NearbyAed[]> => {
      // The availability overlay only holds AEDs that are open right now, so it can't be used to
      // look for duplicates - request the full dataset instead.
      allAedsRef.current ??=
        getActiveAedOverlay(map) === MapConfiguration.aedSourceId && map
          ? map.getGeoJsonSourceData(MapConfiguration.aedSourceId)
          : apiClient.requestAedData();

      try {
        return findNearbyAeds(await allAedsRef.current, target);
      } catch (error) {
        console.error(error);
        allAedsRef.current = null;
        return [];
      }
    },
    [map, apiClient]
  );

  useEffect(() => {
    if (!isActive || !position) {
      setNearbyAeds(prev => (prev.length ? [] : prev));
      return;
    }

    let isCurrent = true;
    void lookup(position).then(result => {
      if (isCurrent) setNearbyAeds(result);
    });

    return () => {
      isCurrent = false;
    };
  }, [isActive, position, lookup]);

  // The cleanup removes the highlight again as soon as the list changes or the flow ends.
  useEffect(() => {
    const sourceId = getActiveAedOverlay(map);
    if (!map || !sourceId || nearbyAeds.length === 0) return;

    const setNearby = (value: boolean) =>
      nearbyAeds.forEach(({ feature }) =>
        map.setFeatureState(sourceId, feature.id, { [FEATURE_STATE.NEARBY]: value })
      );

    setNearby(true);
    return () => setNearby(false);
  }, [map, nearbyAeds]);

  /**
   * Waits for a lookup that may still be loading, so confirming right after placing the marker
   * can't skip the warning.
   */
  const checkNow = useCallback(async (): Promise<NearbyAed[]> => {
    if (!isActive || !position) return [];

    const result = await lookup(position);
    setNearbyAeds(result);
    return result;
  }, [isActive, position, lookup]);

  return { nearbyAeds, checkNow };
};
