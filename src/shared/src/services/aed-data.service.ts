import type { Feature, FeatureCollection, Geometry } from 'geojson';
import { type ApiClient } from '../api/api-client';
import type { RequestOptions } from '../model/common';
import { isOpenNow } from './opening-hours.service';

export const requestAedDataByCurrentAvailability = async (
  apiClient: ApiClient,
  options?: RequestOptions
): Promise<FeatureCollection> => {
  const response = await apiClient.requestAedData(options);

  const features = response.features?.reduce<Feature<Geometry>[]>((acc, feature) => {
    if (feature.properties && isOpenNow(feature.properties.opening_hours as string)) {
      acc.push(feature);
    }

    return acc;
  }, []);

  return {
    type: 'FeatureCollection',
    features: features,
  };
};
