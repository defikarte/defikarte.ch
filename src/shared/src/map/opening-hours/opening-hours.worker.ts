/**
 * Parses opening hours off the main thread: compiling the ~2k unique values of all AEDs with
 * opening_hours.js takes around a second and must not block the map.
 */
import { type FeatureCollection } from 'geojson';
import { compileWeek } from './compile';
import {
  type WorkerRequest,
  type WorkerRequestMessage,
  type WorkerResponseMessage,
  type WorkerResults,
} from './worker-protocol';

const handleRequest = async (
  request: WorkerRequest
): Promise<WorkerResults[keyof WorkerResults]> => {
  switch (request.type) {
    case 'load': {
      const response = await fetch(request.url, { cache: request.cache });
      if (!response.ok) {
        throw new Error(`Request AED-data failed with status ${response.status}`);
      }

      return (await response.json()) as FeatureCollection;
    }
    case 'compile':
      return compileWeek(request.schedules, request.weekStartMs, request.region);
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
