import { useCallback, useEffect, useRef, useState } from 'react';
import { type LocationProvider } from '../../model/location-provider';
import { calculateBounds, createUserLocationData } from '../location-utils';
import { MapConfiguration } from '../map-instance/configuration/map.configuration';
import { type MapInstance } from '../map-instance/map-instance';

const geolocationOptions: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 1000 * 60 * 5, // 5 minutes
};

// a cold gps (or the permission prompt) easily takes longer than a few seconds for the first fix
const initialPositionTimeout = 15000;
// only tell the user about inaccurate data once it is clear no better fix is coming
const inaccurateWarningDelay = 15000;
const fatalErrorKeys = ['locationPermissionDenied', 'locationUnavailable'];

interface Props {
  map: MapInstance | null;
  locationProvider: LocationProvider;
}

const isPositionValid = (position: GeolocationPosition): boolean => {
  const isAccurate = position.coords.accuracy < 1000;
  return isAccurate;
};

const toErrorKey = (error: unknown): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === 'object' && error && 'message' in error && error.message) {
    return String(error.message);
  }
  return 'unknownLocationErrorOccurred';
};

export const useUserLocation = ({ map, locationProvider }: Props) => {
  const [userLocation, setUserLocation] = useState<GeolocationPosition | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasZoomedRef = useRef(false);
  const hasValidPositionRef = useRef(false);
  const inaccurateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearInaccurateTimer = useCallback(() => {
    if (inaccurateTimerRef.current !== null) {
      clearTimeout(inaccurateTimerRef.current);
      inaccurateTimerRef.current = null;
    }
  }, []);

  const handleError = useCallback(
    (msg: string) => {
      clearInaccurateTimer();
      setError(msg);
      setIsActive(false);
      setUserLocation(null);
    },
    [clearInaccurateTimer]
  );

  const applyPosition = useCallback(
    (pos: GeolocationPosition) => {
      if (!isPositionValid(pos)) {
        // iOS usually delivers a coarse fix first - wait for a better one instead of giving up
        if (!hasValidPositionRef.current && inaccurateTimerRef.current === null) {
          inaccurateTimerRef.current = setTimeout(() => {
            if (!hasValidPositionRef.current) {
              setError('locationNotAccurate');
            }
          }, inaccurateWarningDelay);
        }
        return;
      }

      hasValidPositionRef.current = true;
      clearInaccurateTimer();
      setError(null);
      map?.setGeoJSONSourceData(MapConfiguration.userLocationSourceId, createUserLocationData(pos));
      if (!hasZoomedRef.current) {
        hasZoomedRef.current = true;
        map?.fitBounds(calculateBounds(pos));
      }
      setUserLocation(pos);
    },
    [map, clearInaccurateTimer]
  );

  useEffect(() => {
    if (!isActive || !map) {
      return;
    }

    let cancelled = false;
    setError(null);
    hasZoomedRef.current = false;
    hasValidPositionRef.current = false;

    locationProvider.watchPosition(
      pos => {
        if (!cancelled) {
          applyPosition(pos);
        }
      },
      err => {
        if (!cancelled) {
          handleError(toErrorKey(err));
        }
      },
      geolocationOptions
    );

    // fast path for a cached fix - the watch is the source of truth, so only errors that will not
    // resolve by waiting (no permission, location services off) deactivate the location
    locationProvider
      .getCurrentPosition({ ...geolocationOptions, timeout: initialPositionTimeout })
      .then(pos => {
        if (!cancelled && pos) {
          applyPosition(pos);
        }
      })
      .catch((err: unknown) => {
        const key = toErrorKey(err);
        if (!cancelled && fatalErrorKeys.includes(key)) {
          handleError(key);
        }
      });

    return () => {
      cancelled = true;
      clearInaccurateTimer();
      locationProvider.clearWatch();
      map.setGeoJSONSourceData(MapConfiguration.userLocationSourceId, null);
      setUserLocation(null);
    };
  }, [isActive, map, locationProvider, applyPosition, handleError, clearInaccurateTimer]);

  return { userLocation, isActive, error, setIsActive };
};
