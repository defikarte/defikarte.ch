import { type GeoJSONSource, type Map, type MapSourceDataEvent } from 'maplibre-gl';
import { OH_STATUS_STATE } from '../map-instance/configuration/constants';
import { CachedCompiler, type ScheduleCompiler, WorkerCompiler } from './compiler';
import { StatusTracker } from './status';
import { toIsoDate, weekStart } from './time';
import { type CompiledWeek, DEFAULT_HOLIDAY_REGION, type HolidayRegion } from './types';
import { type OpeningHoursWorker, OpeningHoursWorkerClient } from './worker-client';

const TICK_INTERVAL_MS = 60_000;
// start anyway if the AED source does not load, e.g. because another overlay is shown
const SOURCE_LOAD_TIMEOUT_MS = 10_000;

type OpenDataListener = (url: string) => void;

interface OpeningHoursControllerOptions {
  map: Map;
  /** URL of the AED GeoJSON */
  getDataUrl: () => string;
  /** sources showing the full AED data, they get the indexed data once it is ready */
  sourceIds: string[];
  region?: HolidayRegion;
  /** defaults to the opening hours web worker */
  client?: OpeningHoursWorker;
  /** defaults to compiling in the worker, cached in IndexedDB */
  compiler?: ScheduleCompiler;
}

/**
 * Keeps the `oh_status` global state of the map up to date: one status character per unique
 * opening_hours value, which the AED layers look up by the `oh_idx` property of each feature.
 *
 * The map renders right away with the raw data (all AEDs unknown). The worker then indexes and
 * compiles the opening hours, and the controller swaps in the indexed data together with the
 * first status. Afterwards only the global state changes, at most once a minute.
 */
export class OpeningHoursController {
  private readonly map: Map;
  private readonly getDataUrl: () => string;
  private readonly sourceIds: string[];
  private readonly client: OpeningHoursWorker | null;
  private readonly compiler: ScheduleCompiler | null;

  private schedules: string[] | null = null;
  private tracker: StatusTracker | null = null;
  private status: string | null = null;
  // object URLs of the indexed data and of the currently open AEDs
  private dataUrl: string | null = null;
  private openDataUrl: string | null = null;
  private readonly openDataListeners = new Set<OpenDataListener>();

  // newer loads and filter requests supersede older ones still running
  private loadVersion = 0;
  private openDataVersion = 0;
  private compilingWeek: string | null = null;

  private tickTimeout: ReturnType<typeof setTimeout> | null = null;
  private tickInterval: ReturnType<typeof setInterval> | null = null;
  private stopWaitingForSource: (() => void) | null = null;
  private started = false;
  private disposed = false;

  constructor(options: OpeningHoursControllerOptions) {
    this.map = options.map;
    this.getDataUrl = options.getDataUrl;
    this.sourceIds = options.sourceIds;

    this.client =
      options.client ??
      (OpeningHoursWorkerClient.isSupported() ? new OpeningHoursWorkerClient() : null);
    this.compiler =
      options.compiler ??
      (this.client
        ? new CachedCompiler(
            new WorkerCompiler(this.client, options.region ?? DEFAULT_HOLIDAY_REGION)
          )
        : null);

    if (!this.client) {
      console.warn('opening hours: web workers are not supported, AED availability is unknown');
    }
  }

  /** Data for the AED sources: the indexed data if ready, otherwise the raw URL. */
  public getSourceData(): string {
    return this.dataUrl ?? this.getDataUrl();
  }

  /** Data of the currently open AEDs, null until it is computed. */
  public getOpenSourceData(): string | null {
    return this.openDataUrl;
  }

  /**
   * Calls the listener with new data whenever the set of open AEDs changes.
   * Returns a function to unsubscribe.
   */
  public subscribeOpenData(listener: OpenDataListener): () => void {
    this.openDataListeners.add(listener);
    if (this.openDataUrl) {
      listener(this.openDataUrl);
    } else {
      this.updateOpenData();
    }

    return () => {
      this.openDataListeners.delete(listener);
    };
  }

  public start() {
    if (this.started || this.disposed || !this.client) {
      return;
    }
    this.started = true;

    this.map.on('styledata', this.onStyleData);
    document.addEventListener('visibilitychange', this.onVisibilityChange);

    // align the ticks to the start of the next minute
    this.tickTimeout = setTimeout(
      () => {
        this.tick();
        this.tickInterval = setInterval(this.tick, TICK_INTERVAL_MS);
      },
      TICK_INTERVAL_MS - (Date.now() % TICK_INTERVAL_MS) + 50
    );

    // The map loads the AED data itself first, so it renders without waiting. The worker then
    // takes the same response from the HTTP cache instead of downloading it a second time.
    this.whenSourceLoaded(() => void this.load('force-cache'));
  }

  /** Reloads the AED data, e.g. after an AED was added. */
  public async refresh() {
    if (!this.client) {
      this.setSourcesData(this.getDataUrl());
      return;
    }

    await this.load();
  }

  public dispose() {
    this.disposed = true;
    this.stopWaitingForSource?.();
    this.map.off('styledata', this.onStyleData);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    if (this.tickTimeout) clearTimeout(this.tickTimeout);
    if (this.tickInterval) clearInterval(this.tickInterval);

    this.client?.terminate();
    this.openDataListeners.clear();
    if (this.dataUrl) URL.revokeObjectURL(this.dataUrl);
    if (this.openDataUrl) URL.revokeObjectURL(this.openDataUrl);
  }

  private whenSourceLoaded(callback: () => void) {
    const sourceId = this.sourceIds[0];
    const isLoaded = () => {
      try {
        return !!this.map.getSource(sourceId) && this.map.isSourceLoaded(sourceId);
      } catch {
        return false;
      }
    };

    if (isLoaded()) {
      callback();
      return;
    }

    const onSourceData = (event: MapSourceDataEvent) => {
      if (event.sourceId === sourceId && isLoaded()) {
        stop();
        callback();
      }
    };
    const timeout = setTimeout(() => {
      stop();
      callback();
    }, SOURCE_LOAD_TIMEOUT_MS);
    const stop = () => {
      this.map.off('sourcedata', onSourceData);
      clearTimeout(timeout);
      this.stopWaitingForSource = null;
    };

    this.map.on('sourcedata', onSourceData);
    this.stopWaitingForSource = stop;
  }

  /**
   * @param cache 'force-cache' takes the response the map has just loaded; a refresh uses the
   * default mode, which revalidates the cached response with the backend
   */
  private async load(cache?: RequestCache) {
    if (!this.client || !this.compiler) {
      return;
    }

    const version = ++this.loadVersion;
    try {
      const url = new URL(this.getDataUrl(), window.location.href).href;
      const { data, schedules } = await this.client.request({ type: 'index', url, cache });
      if (version !== this.loadVersion || this.disposed) {
        return;
      }

      if (!schedules) {
        // data indexed by a backend: the schedule list has to be provided along with it
        console.warn('opening hours: indexed data without schedule list is not supported yet');
        return;
      }

      const compiled = await this.compiler.getCompiledWeek(schedules, weekStart(new Date()));
      if (version !== this.loadVersion || this.disposed) {
        return;
      }

      // data and status are applied together, so oh_idx always matches the status string
      const previousDataUrl = this.dataUrl;
      this.dataUrl = URL.createObjectURL(data);
      this.schedules = schedules;
      this.setSourcesData(this.dataUrl);
      this.setCompiled(compiled);

      if (previousDataUrl) {
        URL.revokeObjectURL(previousDataUrl);
      }
    } catch (error) {
      console.warn('opening hours: could not compute the AED availability', error);
    }
  }

  private setCompiled(compiled: CompiledWeek) {
    this.tracker = new StatusTracker(compiled);
    this.compilingWeek = null;
    this.tick();
  }

  private tick = () => {
    if (!this.tracker || this.disposed) {
      return;
    }

    const now = new Date();
    const currentWeekStart = weekStart(now);
    if (toIsoDate(currentWeekStart) !== this.tracker.compiled.weekStart) {
      // until the new week is compiled, the old one is a good approximation (same weekdays)
      this.recompile(currentWeekStart);
    }

    const status = this.tracker.update(now);
    if (status !== null && status !== this.status) {
      this.status = status;
      this.applyGlobalState();
      this.invalidateOpenData();
    }
  };

  private recompile(start: Date) {
    const week = toIsoDate(start);
    if (!this.compiler || !this.schedules || this.compilingWeek === week) {
      return;
    }

    this.compilingWeek = week;
    const version = this.loadVersion;
    this.compiler.getCompiledWeek(this.schedules, start).then(
      compiled => {
        if (version === this.loadVersion && !this.disposed) {
          this.setCompiled(compiled);
        }
      },
      (error: unknown) => {
        this.compilingWeek = null;
        console.warn('opening hours: could not compile the new week', error);
      }
    );
  }

  private applyGlobalState() {
    if (this.status === null) {
      return;
    }

    try {
      this.map.setGlobalStateProperty(OH_STATUS_STATE, this.status);
    } catch {
      // the style is still loading, applied again on the next styledata event
    }
  }

  // global state is part of the style, it has to be applied again after a style change
  private onStyleData = () => {
    if (this.status === null) {
      return;
    }

    try {
      if (this.map.getGlobalState()[OH_STATUS_STATE] !== this.status) {
        this.applyGlobalState();
      }
    } catch {
      // no style yet
    }
  };

  private onVisibilityChange = () => {
    // timers are throttled in background tabs
    if (document.visibilityState === 'visible') {
      this.tick();
    }
  };

  private setSourcesData(url: string) {
    this.sourceIds.forEach(sourceId => {
      this.map.getSource<GeoJSONSource>(sourceId)?.setData(url);
    });
  }

  private invalidateOpenData() {
    if (this.openDataUrl) {
      URL.revokeObjectURL(this.openDataUrl);
      this.openDataUrl = null;
    }

    this.updateOpenData();
  }

  // the open AEDs are only computed while someone shows them
  private updateOpenData() {
    if (!this.client || this.status === null || this.openDataListeners.size === 0) {
      return;
    }

    const version = ++this.openDataVersion;
    this.client.request({ type: 'filterOpen', status: this.status }).then(
      data => {
        if (version !== this.openDataVersion || this.disposed) {
          return;
        }

        if (this.openDataUrl) {
          URL.revokeObjectURL(this.openDataUrl);
        }
        const url = URL.createObjectURL(data);
        this.openDataUrl = url;
        this.openDataListeners.forEach(listener => listener(url));
      },
      (error: unknown) => console.warn('opening hours: could not filter the open AEDs', error)
    );
  }
}
