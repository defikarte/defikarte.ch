/**
 * Parses opening hours and prepares the AED data off the main thread: with ~17k features,
 * neither the GeoJSON handling nor opening_hours.js parsing may block the map.
 */
import { type Feature, type FeatureCollection } from 'geojson';
import { compileWeek } from './compile';
import { indexSchedules, OH_IDX_PROPERTY } from './schedule-index';
import { OH_STATUS } from './types';
import {
  type WorkerRequest,
  type WorkerRequestMessage,
  type WorkerResponseMessage,
  type WorkerResults,
} from './worker-protocol';

// the features of the last `index` request, used to build the "available now" data
let indexedFeatures: Feature[] = [];

const toJsonBlob = (features: Feature[]) => {
  const data: FeatureCollection = { type: 'FeatureCollection', features };
  return new Blob([JSON.stringify(data)], { type: 'application/json' });
};

const handleRequest = async (
  request: WorkerRequest
): Promise<WorkerResults[keyof WorkerResults]> => {
  switch (request.type) {
    case 'index': {
      const response = await fetch(request.url, { cache: request.cache });
      if (!response.ok) {
        throw new Error(`Request AED-data failed with status ${response.status}`);
      }

      const data = (await response.json()) as FeatureCollection;
      const schedules = indexSchedules(data);
      indexedFeatures = data.features;

      return { data: toJsonBlob(data.features), schedules };
    }
    case 'compile':
      return compileWeek(request.schedules, request.weekStartMs, request.region);
    case 'filterOpen': {
      const { status } = request;
      const open = indexedFeatures.filter(feature => {
        const index = feature.properties?.[OH_IDX_PROPERTY] as number;
        return status[index] === OH_STATUS.OPEN;
      });

      return toJsonBlob(open);
    }
  }
};

self.addEventListener('message', (event: MessageEvent<WorkerRequestMessage>) => {
  const { id } = event.data;
  const reply = (message: WorkerResponseMessage) => self.postMessage(message);

  // never throw to the main thread, every failure is answered as error
  handleRequest(event.data).then(
    result => reply({ id, result }),
    (error: unknown) => reply({ id, error: String(error) })
  );
});
