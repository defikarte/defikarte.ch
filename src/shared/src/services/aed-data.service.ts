import type { Feature, FeatureCollection, Geometry } from 'geojson';
import { type ApiClient } from '../api/api-client';
import type { RequestOptions } from '../model/common';
import { getAedAvailability } from './opening-hours.service';

export const filterAedDataByCurrentAvailability = (
  data: FeatureCollection,
  now: Date = new Date()
): FeatureCollection => {
  const features = (data.features ?? []).reduce<Feature<Geometry>[]>((acc, feature) => {
    if (feature.properties && getAedAvailability(feature.properties, now) === 'open') {
      acc.push(feature);
    }

    return acc;
  }, []);

  return {
    type: 'FeatureCollection',
    features: features,
  };
};

export const requestAedDataByCurrentAvailability = async (
  apiClient: ApiClient,
  options?: RequestOptions
): Promise<FeatureCollection> => {
  const response = await apiClient.requestAedData(options);
  return filterAedDataByCurrentAvailability(response);
};

/**
 * Adds the `availability` property ('open' | 'closed' | 'unknown') to every feature, so map
 * layers can style AEDs by their availability at the given time.
 */
export const addAedAvailability = (
  data: FeatureCollection,
  now: Date = new Date()
): FeatureCollection => {
  return {
    type: 'FeatureCollection',
    features: (data.features ?? []).map(feature => ({
      ...feature,
      properties: {
        ...feature.properties,
        availability: getAedAvailability(feature.properties, now),
      },
    })),
  };
};
