import type { FeatureCollection } from 'geojson';

export interface AedDataInfo {
  // when the backend built the data (top-level timestamp of /v3/aed)
  timestamp: string;
  aedCount: number;
  // when this device loaded it
  loadedAt: Date;
}

// module scope, so pages without a map (e.g. the status page) can read it
let info: AedDataInfo | null = null;

/** Records the AED data the map has loaded. Data without a timestamp (built in memory) is ignored. */
export const setAedDataInfo = (data: FeatureCollection) => {
  const timestamp = (data as FeatureCollection & { timestamp?: string }).timestamp;
  if (!timestamp) {
    return;
  }

  info = { timestamp, aedCount: data.features?.length ?? 0, loadedAt: new Date() };
};

/** The AED data loaded on this device, null until the map has loaded it. */
export const getAedDataInfo = (): AedDataInfo | null => info;
