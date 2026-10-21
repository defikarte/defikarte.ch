import { type Feature, type FeatureCollection } from 'geojson';
import {
  type GeoJSONSource,
  type GeoJSONSourceSpecification,
  type Map,
  type MapSourceDataEvent,
} from 'maplibre-gl';
import { OH_STATUS_STATE } from '../map-instance/configuration/constants';
import { CachedCompiler, type ScheduleCompiler, WorkerCompiler } from './compiler';
import { type AvailabilityFilter, matchesAvailabilityFilters } from './feature-status';
import { collectSchedules } from './schedules';
import { StatusTracker, toStatusMap } from './status';
import { toIsoDate, weekStart } from './time';
import {
  DEFAULT_HOLIDAY_REGION,
  type HolidayRegion,
  type OpeningHoursStatusMap,
} from './types';
import { type OpeningHoursWorker, OpeningHoursWorkerClient } from './worker-client';

const TICK_INTERVAL_MS = 60_000;

type DataListener = (data: FeatureCollection) => void;
type StatusListener = (statusMap: OpeningHoursStatusMap) => void;

interface OpeningHoursControllerOptions {
  map: Map;
  /** URL of the AED GeoJSON, loaded only if the map has not loaded all AEDs itself */
  getDataUrl: () => string;
  /** source of the AED layers; the opening hours are read from its data */
  sourceId: string;
  region?: HolidayRegion;
  /** defaults to the opening hours web worker */
  client?: OpeningHoursWorker;
  /** defaults to compiling in the worker, cached in IndexedDB */
  compiler?: ScheduleCompiler;
}

/**
 * Keeps the `oh_status` global state of the map up to date: the current status of every
 * `opening_hours` value, which the AED layers look up for each feature.
 *
 * The map loads and renders the AEDs as before. Once the AED source has loaded, the controller
 * takes the unique opening_hours values from its data (already on the main thread, no second
 * request) and compiles them in a web worker. Afterwards only the global state changes, when an
 * opening or closing time is crossed.
 */
export class OpeningHoursController {
  private readonly map: Map;
  private readonly getDataUrl: () => string;
  private readonly sourceId: string;
  private readonly client: OpeningHoursWorker | null;
  private readonly compiler: ScheduleCompiler | null;

  // all opening_hours values seen so far, the order matches the compiled schedules
  private schedules: string[] = [];
  private readonly knownSchedules = new Set<string>();
  // all AEDs, from the last load without filter; needed for the AEDs by status
  private features: Feature[] | null = null;
  private loadingFeatures: Promise<void> | null = null;
  // the source data last read, to skip the many sourcedata events of the same data
  private processedData: unknown = null;

  private tracker: StatusTracker | null = null;
  // the schedules the current tracker was compiled from
  private trackedSchedules: string[] = [];
  private status: string | null = null;
  private statusMap: OpeningHoursStatusMap | null = null;

  // the statuses each data listener wants the AEDs of (globalThis: `Map` is the maplibre map here)
  private readonly dataListeners = new globalThis.Map<
    DataListener,
    readonly AvailabilityFilter[]
  >();
  // the AEDs each data listener got last, so an unchanged set is not set (and clustered) again
  private readonly lastData = new globalThis.Map<DataListener, Feature[]>();
  private readonly statusListeners = new Set<StatusListener>();

  // a newer compilation supersedes older ones still running
  private compileVersion = 0;
  private compilingWeek: string | null = null;

  private tickTimeout: ReturnType<typeof setTimeout> | null = null;
  private tickInterval: ReturnType<typeof setInterval> | null = null;
  private started = false;
  private disposed = false;

  constructor(options: OpeningHoursControllerOptions) {
    this.map = options.map;
    this.getDataUrl = options.getDataUrl;
    this.sourceId = options.sourceId;

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

    if (!this.compiler) {
      console.warn('opening hours: web workers are not supported, AED availability is unknown');
    }
  }

  /** All AEDs, once the map or the controller has loaded them without filter. */
  public getAllAeds(): FeatureCollection | null {
    return this.features ? { type: 'FeatureCollection', features: this.features } : null;
  }

  /** The AEDs matching one of the filters right now, null until the status is computed. */
  public getData(statuses: readonly AvailabilityFilter[]): FeatureCollection | null {
    const statusMap = this.statusMap;
    if (!this.features || !statusMap) {
      return null;
    }

    return {
      type: 'FeatureCollection',
      features: this.features.filter(feature =>
        matchesAvailabilityFilters(feature.properties, statusMap, statuses)
      ),
    };
  }

  /**
   * Calls the listener with new data whenever the AEDs with one of the statuses change.
   * Returns a function to unsubscribe.
   */
  public subscribeData(
    statuses: readonly AvailabilityFilter[],
    listener: DataListener
  ): () => void {
    this.dataListeners.set(listener, statuses);
    this.updateData(listener);

    return () => {
      this.dataListeners.delete(listener);
      this.lastData.delete(listener);
    };
  }

  /** The current status per opening_hours value, null until it is computed. */
  public getStatusMap(): OpeningHoursStatusMap | null {
    return this.statusMap;
  }

  /**
   * Calls the listener whenever the status of any opening_hours value changes.
   * Returns a function to unsubscribe.
   */
  public subscribeStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  public start() {
    if (this.started || this.disposed || !this.compiler) {
      return;
    }
    this.started = true;

    this.map.on('sourcedata', this.onSourceData);
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

    void this.readSourceData();
  }

  /**
   * Reloads all AEDs, e.g. after an AED was added. Resolves with them, or null if they could
   * not be loaded (or web workers are not supported).
   */
  public async refresh(): Promise<FeatureCollection | null> {
    this.features = null;
    await this.loadFeatures();
    return this.getAllAeds();
  }

  public dispose() {
    this.disposed = true;
    this.map.off('sourcedata', this.onSourceData);
    this.map.off('styledata', this.onStyleData);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    if (this.tickTimeout) clearTimeout(this.tickTimeout);
    if (this.tickInterval) clearInterval(this.tickInterval);

    this.client?.terminate();
    this.dataListeners.clear();
    this.lastData.clear();
    this.statusListeners.clear();
  }

  private onSourceData = (event: MapSourceDataEvent) => {
    if (event.sourceId === this.sourceId && event.isSourceLoaded) {
      void this.readSourceData();
    }
  };

  // takes the opening hours from the data the map has loaded (and copied to the main thread)
  private async readSourceData() {
    let source: GeoJSONSource | undefined;
    try {
      source = this.map.getSource<GeoJSONSource>(this.sourceId);
      if (!source || !this.map.isSourceLoaded(this.sourceId)) {
        return;
      }
    } catch {
      return;
    }

    const data = await source.getData();
    if (data === this.processedData || this.disposed || data.type !== 'FeatureCollection') {
      return;
    }
    this.processedData = data;

    // a filtered source only holds part of the AEDs
    const isFiltered = !!(source.serialize() as GeoJSONSourceSpecification).filter;
    this.addData(data.features, !isFiltered);
  }

  private async loadFeatures(cache?: RequestCache) {
    if (!this.client) {
      return;
    }

    this.loadingFeatures ??= (async () => {
      try {
        const url = new URL(this.getDataUrl(), window.location.href).href;
        const data = await this.client!.request({ type: 'load', url, cache });
        if (!this.disposed) {
          this.addData(data.features, true);
        }
      } catch (error) {
        console.warn('opening hours: could not load the AEDs', error);
      } finally {
        this.loadingFeatures = null;
      }
    })();

    await this.loadingFeatures;
  }

  private addData(features: Feature[], isComplete: boolean) {
    if (isComplete) {
      this.features = features;
      this.updateData();
    }

    const added = collectSchedules(features, this.knownSchedules);
    if (added.length > 0) {
      this.schedules = [...this.schedules, ...added];
      console.debug('opening hours: unique schedules', {
        features: features.length,
        schedules: this.schedules.length,
      });
      this.compile(weekStart(new Date()));
    }
  }

  private compile(start: Date) {
    if (!this.compiler || this.schedules.length === 0) {
      return;
    }

    const schedules = this.schedules;
    const version = ++this.compileVersion;
    this.compilingWeek = toIsoDate(start);

    this.compiler.getCompiledWeek(schedules, start).then(
      compiled => {
        if (version !== this.compileVersion || this.disposed) {
          return;
        }

        this.compilingWeek = null;
        this.tracker = new StatusTracker(compiled);
        this.trackedSchedules = schedules;
        this.tick();
      },
      (error: unknown) => {
        if (version === this.compileVersion) {
          this.compilingWeek = null;
        }
        console.warn('opening hours: could not compile the opening hours', error);
      }
    );
  }

  private tick = () => {
    if (!this.tracker || this.disposed) {
      return;
    }

    const now = new Date();
    const currentWeekStart = weekStart(now);
    const currentWeek = toIsoDate(currentWeekStart);
    if (currentWeek !== this.tracker.compiled.weekStart && this.compilingWeek !== currentWeek) {
      // until the new week is compiled, the old one is a good approximation (same weekdays)
      this.compile(currentWeekStart);
    }

    const status = this.tracker.update(now);
    if (status !== null && status !== this.status) {
      this.status = status;
      this.statusMap = toStatusMap(this.trackedSchedules, status);
      this.applyGlobalState();
      this.updateData();
      const statusMap = this.statusMap;
      this.statusListeners.forEach(listener => listener(statusMap));
    }
  };

  private applyGlobalState() {
    if (this.statusMap === null) {
      return;
    }

    try {
      this.map.setGlobalStateProperty(OH_STATUS_STATE, this.statusMap);
    } catch {
      // the style is still loading, applied again on the next styledata event
    }
  }

  // global state is part of the style, it has to be applied again after a style change
  private onStyleData = () => {
    if (this.statusMap === null) {
      return;
    }

    try {
      if (this.map.getGlobalState()[OH_STATUS_STATE] !== this.statusMap) {
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

  // the data is only computed while someone shows it; without a listener, for all listeners
  private updateData(listener?: DataListener) {
    if (this.dataListeners.size === 0) {
      return;
    }

    if (!this.features) {
      // the map has not loaded all AEDs (another filter was active), load them once
      void this.loadFeatures('force-cache');
      return;
    }

    const listeners = listener ? [listener] : [...this.dataListeners.keys()];
    listeners.forEach(current => {
      const data = this.getData(this.dataListeners.get(current) ?? []);
      if (!data) {
        return;
      }

      // e.g. the 24h AEDs, or a status change of AEDs the listener does not show
      const last = this.lastData.get(current);
      if (
        last?.length === data.features.length &&
        last.every((feature, i) => feature === data.features[i])
      ) {
        return;
      }

      this.lastData.set(current, data.features);
      current(data);
    });
  }
}
