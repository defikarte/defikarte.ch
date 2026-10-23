import { useCallback, useEffect, useRef, useState } from 'react';
import type { ApiClient } from '../api/api-client';
import type { HealthReport } from '../model/common';
import { getAedDataInfo } from '../services/aed-data-info.service';

/**
 * Loads the backend health once per call of reload (and on mount) and reads the AED data the map
 * has loaded on this device.
 */
export const useServiceStatus = (apiClient: ApiClient) => {
  const [health, setHealth] = useState<HealthReport | null>(null);
  const [loading, setLoading] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  const reload = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    const report = await apiClient.getHealth({ signal: controller.signal });
    if (!controller.signal.aborted) {
      setHealth(report);
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    void reload();
    return () => abortRef.current?.abort();
  }, [reload]);

  return {
    health,
    loading,
    unreachable: !loading && !health,
    aedData: getAedDataInfo(),
    reload,
  };
};
