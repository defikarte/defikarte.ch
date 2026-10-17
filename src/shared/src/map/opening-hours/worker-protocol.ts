import { type CompiledWeek, type HolidayRegion } from './types';

export type WorkerRequest =
  // fetch the AED GeoJSON, add `oh_idx` to every feature and keep the result in the worker
  | { type: 'index'; url: string; cache?: RequestCache }
  | { type: 'compile'; schedules: string[]; weekStartMs: number; region: HolidayRegion }
  // the indexed features that are open according to the given status string
  | { type: 'filterOpen'; status: string };

export interface IndexResult {
  /** the indexed FeatureCollection as JSON, to be passed to the map as object URL */
  data: Blob;
  /** unique opening_hours strings, index = oh_idx; null if the data was already indexed */
  schedules: string[] | null;
}

export interface WorkerResults {
  index: IndexResult;
  compile: CompiledWeek;
  filterOpen: Blob;
}

export type WorkerRequestMessage = WorkerRequest & { id: number };

export type WorkerResponseMessage =
  | { id: number; result: WorkerResults[keyof WorkerResults] }
  | { id: number; error: string };
