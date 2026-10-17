import { toIsoDate } from './time';
import { type CompiledWeek, DEFAULT_HOLIDAY_REGION, type HolidayRegion } from './types';
import { type OpeningHoursWorker } from './worker-client';

/**
 * Source of compiled opening hours. The status logic and the map only depend on this interface,
 * so the browser compilation can be replaced by precompiled data from a backend.
 */
export interface ScheduleCompiler {
  getCompiledWeek(schedules: string[], weekStart: Date): Promise<CompiledWeek>;
}

/** Compiles the schedules in the opening hours web worker. */
export class WorkerCompiler implements ScheduleCompiler {
  private readonly client: OpeningHoursWorker;
  private readonly region: HolidayRegion;

  constructor(client: OpeningHoursWorker, region: HolidayRegion = DEFAULT_HOLIDAY_REGION) {
    this.client = client;
    this.region = region;
  }

  public getCompiledWeek(schedules: string[], weekStart: Date): Promise<CompiledWeek> {
    return this.client.request({
      type: 'compile',
      schedules,
      weekStartMs: weekStart.getTime(),
      region: this.region,
    });
  }
}

/** 32-bit FNV-1a hash of the schedule list, as hex string. */
export const hashSchedules = (schedules: string[]): string => {
  let hash = 0x811c9dc5;
  for (const schedule of schedules) {
    for (let i = 0; i < schedule.length; i++) {
      hash ^= schedule.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    // separator, so ['ab', 'c'] and ['a', 'bc'] differ
    hash ^= 0xff;
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(16);
};

// bump when the compiled format or the compile logic changes
const CACHE_VERSION = 1;
const DB_NAME = 'defikarte-opening-hours';
const STORE_NAME = 'compiled-weeks';

const requestToPromise = <T>(request: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
  });

/**
 * Keeps the last compiled week in IndexedDB, so a reload within the same week with unchanged
 * data skips the compilation. Works without storage: every failure falls back to the inner compiler.
 */
export class CachedCompiler implements ScheduleCompiler {
  private readonly inner: ScheduleCompiler;
  private db: Promise<IDBDatabase | null> | null = null;

  constructor(inner: ScheduleCompiler) {
    this.inner = inner;
  }

  public async getCompiledWeek(schedules: string[], weekStart: Date): Promise<CompiledWeek> {
    const key = `${CACHE_VERSION}:${toIsoDate(weekStart)}:${schedules.length}:${hashSchedules(schedules)}`;

    const cached = await this.read(key);
    if (cached) {
      return cached;
    }

    const compiled = await this.inner.getCompiledWeek(schedules, weekStart);
    void this.write(key, compiled);
    return compiled;
  }

  private openDb(): Promise<IDBDatabase | null> {
    this.db ??= (async () => {
      try {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
        return await requestToPromise(request);
      } catch (error) {
        console.debug('opening hours: cache not available', error);
        return null;
      }
    })();

    return this.db;
  }

  private async read(key: string): Promise<CompiledWeek | null> {
    try {
      const db = await this.openDb();
      if (!db) {
        return null;
      }

      const store = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME);
      const result = (await requestToPromise(store.get(key))) as CompiledWeek | undefined;
      return result ?? null;
    } catch (error) {
      console.debug('opening hours: cache read failed', error);
      return null;
    }
  }

  private async write(key: string, compiled: CompiledWeek): Promise<void> {
    try {
      const db = await this.openDb();
      if (!db) {
        return;
      }

      // only the latest week is useful, older entries are dropped
      const store = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME);
      store.clear();
      await requestToPromise(store.put(compiled, key));
    } catch (error) {
      console.debug('opening hours: cache write failed', error);
    }
  }
}
