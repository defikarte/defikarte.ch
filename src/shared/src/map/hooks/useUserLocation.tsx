import { useCallback, useEffect, useState } from 'react';
import { type LocationProvider } from '../../model/location-provider';
import { calculateBounds, createUserLocationData } from '../location-utils';
import { MapConfiguration } from '../map-instance/configuration/map.configuration';
import { type MapInstance } from '../map-instance/map-instance';
import { usePrevious } from './usePrevious';

const geolocationOptions: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 1000 * 60 * 5, // 5 minutes
};

interface Props {
  map: MapInstance | null;
  locationProvider: LocationProvider;
}

export const useUserLocation = ({ map, locationProvider }: Props) => {
  const [userLocation, setUserLocation] = useState<GeolocationPosition | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previousIsActive = usePrevious(isActive);

  const isPositionValid = (position: GeolocationPosition): boolean => {
    const isAccurate = position.coords.accuracy < 1000;
    return isAccurate;
  };

  const handleError = useCallback((msg: string) => {
    setError(msg);
    setIsActive(false);
    setUserLocation(null);
  }, []);

  const watchUserPosition = useCallback(() => {
    if (!map) {
      return;
    }

    locationProvider.watchPosition(
      pos => {
        if (!isPositionValid(pos)) {
          handleError('locationNotAccurate');
          return;
        }

        setError(null);
        map.setGeoJSONSourceData(
          MapConfiguration.userLocationSourceId,
          createUserLocationData(pos)
        );
        setUserLocation(pos);
      },
      error => {
        handleError(error.message);
      },
      geolocationOptions
    );
  }, [locationProvider, handleError, map]);

  useEffect(() => {
    const handleIsActive = async () => {
      setError(null);
      if (isActive) {
        try {
          const currentPostion = await locationProvider.getCurrentPosition({
            ...geolocationOptions,
            timeout: 5000,
          });

          if (
            previousIsActive !== isActive &&
            isActive &&
            currentPostion &&
            isPositionValid(currentPostion)
          ) {
            map?.setGeoJSONSourceData(
              MapConfiguration.userLocationSourceId,
              createUserLocationData(currentPostion)
            );
            map?.fitBounds(calculateBounds(currentPostion));
            setUserLocation(currentPostion);
            setError(null);
          }

          watchUserPosition();
        } catch (error) {
          if (error instanceof Error && error.cause instanceof GeolocationPositionError) {
            handleError(error.message);
          } else {
            handleError('unknownLocationErrorOccurred');
          }
        }
      } else {
        map?.setGeoJSONSourceData(MapConfiguration.userLocationSourceId, null);
        locationProvider.clearWatch();
        setUserLocation(null);
      }
    };

    void handleIsActive();
  }, [
    locationProvider,
    isActive,
    previousIsActive,
    map,
    handleError,
    watchUserPosition,
    setUserLocation,
  ]);

  return { userLocation, isActive, error, setIsActive };
};
