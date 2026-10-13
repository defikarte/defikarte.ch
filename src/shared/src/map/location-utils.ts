import circle from '@turf/circle';
import type { Feature, FeatureCollection, Point, Position } from 'geojson';
import { LngLatBounds, type LngLatLike } from 'maplibre-gl';

export const calculateBounds = (position: GeolocationPosition): LngLatBounds => {
  const userLocationExtend = circle(
    [position.coords.longitude, position.coords.latitude],
    position.coords.accuracy / 1000,
    {
      units: 'kilometers',
    }
  );
  const bounds = new LngLatBounds();
  userLocationExtend.geometry.coordinates[0].forEach((coordinate: Position) => {
    bounds.extend(coordinate as LngLatLike);
  });

  return bounds;
};

export const createUserLocationData = (position: GeolocationPosition) => {
  const coordinates = [position.coords.longitude, position.coords.latitude];
  const accuracy = position.coords.accuracy;
  const userLocationPoint = {
    geometry: { type: 'Point', coordinates: coordinates },
    type: 'Feature',
    properties: { accuracy },
  } as Feature<Point>;

  const userLocation = circle(userLocationPoint, accuracy / 1000, {
    steps: 64,
    units: 'kilometers',
    properties: {
      accuracy: accuracy,
    },
  });

  return {
    type: 'FeatureCollection',
    features: [userLocation, userLocationPoint],
  } as FeatureCollection;
};
