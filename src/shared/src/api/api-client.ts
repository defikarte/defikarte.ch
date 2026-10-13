import axios, { type AxiosInstance } from 'axios';
import type { FeatureCollection } from 'geojson';
import type { ApiConfiguration, RequestOptions } from '../model/common';

export class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor(config: ApiConfiguration) {
    this.axiosInstance = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'x-functions-clientid': 'defikarte-app',
        'x-functions-key': config.apiKey,
      },
    });
  }

  public searchAddress = async (searchText: string, options?: RequestOptions) => {
    try {
      const response = await this.axiosInstance.get<FeatureCollection>(`/v3/search/${searchText}`, {
        method: 'GET',
        headers: {
          'ACCESS-Control-Allow-Origin': '*',
        },
        signal: options?.signal,
      });
      if (response.status === 200) {
        return response.data;
      }
    } catch (error) {
      // Don't log cancelled requests
      if (error instanceof Error && error.name === 'CanceledError') {
        return { type: 'FeatureCollection', features: [] } as FeatureCollection;
      }

      // todo: check for propper logging // error handling
      console.error(error);
    }

    return { type: 'FeatureCollection', features: [] } as FeatureCollection;
  };

  public requestAedData = async (options?: RequestOptions): Promise<FeatureCollection> => {
    try {
      const response = await this.axiosInstance.get<FeatureCollection>('/v3/aed', {
        method: 'GET',
        signal: options?.signal,
      });
      if (response.status === 200) {
        const data = response.data;
        return data;
      }
    } catch (error) {
      if (axios.isCancel(error)) {
        console.warn('Request AED-data is canceled.');
      } else {
        console.error(error);
      }
    }

    return {} as FeatureCollection;
  };

  public postAedData = async (data: FeatureCollection) => {
    return await this.axiosInstance.post<FeatureCollection>('v3/aed', {
      ...data,
      source: 'local_knowledge, defikarte.ch',
    });
  };

  public putAedData = async (data: FeatureCollection) => {
    if (!data.features[0].id) {
      throw new Error('AED data must have an id to be updated');
    }

    return await this.axiosInstance.put<FeatureCollection>(`v3/aed/${data.features[0].id}`, {
      ...data,
      source: 'local_knowledge, defikarte.ch',
    });
  };
}
