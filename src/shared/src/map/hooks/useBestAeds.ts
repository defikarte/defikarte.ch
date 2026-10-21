import { useEffect, useState } from 'react';
import { findBestAeds } from '../../services/best-aed.service';
import { distanceBetweenPoints } from '../../services/coordinate-calculation.service';
import { type NearbyAed } from '../../services/nearby-aed.service';
import { getActiveAedOverlay } from '../helper';
import { FEATURE_STATE } from '../map-instance/configuration/constants';
import { MapConfiguration } from '../map-instance/configuration/map.configuration';
import { type MapInstance } from '../map-instance/map-instance';

// GPS jitters by a few metres on every tick - only rank again once the user really moved
const MIN_MOVE_METERS = 25;

const aedSourceIds = [MapConfiguration.aedSourceId, MapConfiguration.aedAvailabilitySourceId];

interface UseBestAedsProps {
  map: MapInstance | null;
  isActive: boolean;
  userLocation: GeolocationPosition | null;
  // the one of them drawn like a selected AED - the best one if none (or one no longer listed) is given
  selectedId?: string | number | null;
}

/**
 * The best AEDs around the user (see `findBestAeds`), highlighted on the map while all other AEDs
 * are dimmed. Works on the AEDs in memory, so it never makes a request.
 */
export const useBestAeds = ({ map, isActive, userLocation, selectedId }: UseBestAedsProps) => {
  const [bestAeds, setBestAeds] = useState<NearbyAed[]>([]);
  // the position the list was ranked for
  const [rankedAt, setRankedAt] = useState<{ lat: number; lon: number } | null>(null);
  // bumped whenever an AED source is (re-)added, which drops the highlight
  const [sourceVersion, setSourceVersion] = useState(0);

  const lat = userLocation?.coords.latitude;
  const lon = userLocation?.coords.longitude;

  useEffect(() => {
    if (!isActive || lat === undefined || lon === undefined) {
      setRankedAt(null);
      return;
    }

    setRankedAt(prev =>
      prev && distanceBetweenPoints(prev, { lat, lon }) < MIN_MOVE_METERS ? prev : { lat, lon }
    );
  }, [isActive, lat, lon]);

  useEffect(() => {
    if (!map || !rankedAt) {
      setBestAeds(prev => (prev.length ? [] : prev));
      return;
    }

    const rank = () => {
      const data = map.getAllAeds();
      if (data) setBestAeds(findBestAeds(data, rankedAt, map.getOpeningHoursStatusMap()));
    };

    rank();
    // the status changes over time, and the AEDs may only finish loading after the first fix
    return map.subscribeOpeningHoursStatus(rank);
  }, [map, rankedAt]);

  useEffect(() => {
    if (!map || !isActive) return;

    map.setEmergencyMode(true);
    const unsubscribe = map.subscribeSourceAdded(sourceId => {
      if (aedSourceIds.includes(sourceId)) setSourceVersion(v => v + 1);
    });

    return () => {
      unsubscribe();
      map.setEmergencyMode(false);
    };
  }, [map, isActive]);

  // The cleanup removes the highlight as soon as the list changes or the view is turned off.
  useEffect(() => {
    const sourceId = getActiveAedOverlay(map);
    if (!map || !sourceId || bestAeds.length === 0) return;

    const selected = bestAeds.some(({ feature }) => feature.id === selectedId)
      ? selectedId
      : bestAeds[0].feature.id;
    const setEmergency = (value: boolean) =>
      bestAeds.forEach(({ feature }) =>
        map.setFeatureState(sourceId, feature.id, {
          [FEATURE_STATE.EMERGENCY]: value,
          [FEATURE_STATE.EMERGENCY_SELECTED]: value && feature.id === selected,
        })
      );

    setEmergency(true);
    return () => {
      // a source removed by a filter change took its feature state with it
      if (getActiveAedOverlay(map) === sourceId) setEmergency(false);
    };
  }, [map, bestAeds, sourceVersion, selectedId]);

  return { bestAeds };
};
