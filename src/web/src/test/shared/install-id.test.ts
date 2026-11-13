import { ApiClient, getInstallId, INSTALL_ID_HEADER } from '@defikarte/shared';
import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';
import { type FeatureCollection } from 'geojson';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe('getInstallId', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('creates a uuid once and keeps it', () => {
    const first = getInstallId();
    const second = getInstallId();

    expect(first).toMatch(UUID);
    expect(second).toBe(first);
    expect(localStorage.getItem('defikarte-install-id')).toBe(first);
  });

  it('replaces a stored value that is no uuid', () => {
    localStorage.setItem('defikarte-install-id', 'something else');

    expect(getInstallId()).toMatch(UUID);
  });

  it('returns nothing if the storage is not available', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(getInstallId()).toBeUndefined();
  });
});

describe('ApiClient install id header', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  const feature: FeatureCollection = {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', id: '42', properties: {}, geometry: { type: 'Point', coordinates: [8, 47] } },
    ],
  };

  const createClient = () => {
    const configs: InternalAxiosRequestConfig[] = [];
    const adapter: AxiosAdapter = config => {
      configs.push(config);
      return Promise.resolve({ data: {}, status: 200, statusText: '', headers: {}, config });
    };
    const client = new ApiClient({ baseUrl: 'https://example.org/api/', apiKey: 'key' });
    (client as unknown as { axiosInstance: { defaults: { adapter: AxiosAdapter } } }).axiosInstance.defaults.adapter = adapter;
    return { client, configs };
  };

  it('is sent when an AED is created, updated or removed', async () => {
    const { client, configs } = createClient();

    await client.postAedData(feature);
    await client.putAedData(feature);
    await client.requestAedRemoval('42', { reason: 'stolen', reporter: 'Anna' });

    const installId = getInstallId();
    expect(installId).toMatch(UUID);
    expect(configs).toHaveLength(3);
    for (const config of configs) {
      expect(config.headers.get(INSTALL_ID_HEADER)).toBe(installId);
    }
  });

  it('is not sent when reading', async () => {
    const { client, configs } = createClient();

    await client.requestAedData();

    expect(configs[0].headers.has(INSTALL_ID_HEADER)).toBe(false);
  });

  it('is left out, but the call still goes through, if the id cannot be kept', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const { client, configs } = createClient();

    await client.postAedData(feature);

    expect(configs).toHaveLength(1);
    expect(configs[0].headers.has(INSTALL_ID_HEADER)).toBe(false);
  });
});
