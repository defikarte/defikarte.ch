import { type FeatureCollection } from 'geojson';
import { type CompiledWeek, type HolidayRegion } from './types';

export type WorkerRequest =
  // fetch and parse the AED GeoJSON, only needed if the map has not loaded all AEDs itself
  | { type: 'load'; url: string; cache?: RequestCache }
  | { type: 'compile'; schedules: string[]; weekStartMs: number; region: HolidayRegion };

export interface WorkerResults {
  load: FeatureCollection;
  compile: CompiledWeek;
}

export type WorkerRequestMessage = WorkerRequest & { id: number };

export type WorkerResponseMessage =
  | { id: number; result: WorkerResults[keyof WorkerResults] }
  | { id: number; error: string };
