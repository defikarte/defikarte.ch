import {
  ApiClient,
  getAedDataInfo,
  type HealthReport,
  OpeningHoursController,
  type OpeningHoursWorker,
  type ScheduleCompiler,
} from '@defikarte/shared';
import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';
import { type FeatureCollection } from 'geojson';
import { type Map } from 'maplibre-gl';
import { describe, expect, it, vi } from 'vitest';

const report: HealthReport = {
  status: 'unhealthy',
  aedCount: 15000,
  lastSuccessUtc: '2026-10-22T08:15:00Z',
  lastAttemptUtc: '2026-10-22T09:15:00Z',
  ageMinutes: 90,
  maxAgeMinutes: 60,
  consecutiveFailures: 3,
  reasons: ['stale'],
};

const createClient = (adapter: AxiosAdapter) => {
  const client = new ApiClient({ baseUrl: 'https://example.org/api/', apiKey: 'key' });
  const { axiosInstance } = client as unknown as {
    axiosInstance: { defaults: { adapter: AxiosAdapter } };
  };
  axiosInstance.defaults.adapter = adapter;
  return client;
};

describe('ApiClient.getHealth', () => {
  it('returns the report also when the backend answers 503', async () => {
    let config: InternalAxiosRequestConfig | undefined;
    const client = createClient(c => {
      config = c;
      return Promise.resolve({ data: report, status: 503, statusText: '', headers: {}, config: c });
    });

    await expect(client.getHealth()).resolves.toEqual(report);
    expect(config?.url).toBe('health');
    expect(config?.validateStatus?.(503)).toBe(true);
    expect(config?.validateStatus?.(500)).toBe(false);
  });

  it('returns null when the backend is unreachable', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const client = createClient(() => Promise.reject(new Error('Network Error')));

    await expect(client.getHealth()).resolves.toBeNull();
  });
});

describe('getAedDataInfo', () => {
  const flush = async () => {
    for (let i = 0; i < 10; i++) {
      await Promise.resolve();
    }
  };

  const startController = async (data: FeatureCollection) => {
    const map = {
      on: vi.fn(),
      off: vi.fn(),
      getSource: vi.fn(() => ({
        getData: () => Promise.resolve(data),
        serialize: () => ({ type: 'geojson', data: 'url' }),
      })),
      isSourceLoaded: vi.fn(() => true),
      setGlobalStateProperty: vi.fn(),
      getGlobalState: vi.fn(() => ({})),
    } as unknown as Map;
    const compiler = {
      getCompiledWeek: vi.fn(() => new Promise(() => undefined)),
    } as unknown as ScheduleCompiler;
    const controller = new OpeningHoursController({
      map,
      getDataUrl: () => 'https://example.org/aed',
      sourceId: 'aed-source',
      client: { request: vi.fn(), terminate: vi.fn() } as unknown as OpeningHoursWorker,
      compiler,
    });
    controller.start();
    await flush();
    controller.dispose();
  };

  it('is null until the map has loaded the AEDs', () => {
    expect(getAedDataInfo()).toBeNull();
  });

  it('records the timestamp of the data the map loaded', async () => {
    await startController({
      type: 'FeatureCollection',
      features: [],
      timestamp: '2026-10-22T08:15:00Z',
    } as FeatureCollection);

    expect(getAedDataInfo()).toMatchObject({ timestamp: '2026-10-22T08:15:00Z', aedCount: 0 });
  });

  it('keeps the timestamp when data built in memory (without timestamp) is set', async () => {
    await startController({ type: 'FeatureCollection', features: [] });

    expect(getAedDataInfo()?.timestamp).toBe('2026-10-22T08:15:00Z');
  });
});
