import { type Feature, type FeatureCollection } from 'geojson';
import { type Map } from 'maplibre-gl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  compileSchedule,
  compileWeek,
  featureStatus,
  type CompiledWeek,
  hashSchedules,
  collectSchedules,
  minuteOfWeek,
  OH_STATUS,
  OH_STATUS_STATE,
  OpeningHoursController,
  type OpeningHoursWorker,
  type ScheduleCompiler,
  StatusTracker,
  statusAt,
  toStatusMap,
  toIsoDate,
  WEEK_MINUTES,
  weekEnd,
  weekStart,
} from '@defikarte/shared';

// all dates are local time; Monday 2026-10-12 starts the fixture week
const at = (day: number, hours: number, minutes = 0) => new Date(2026, 9, day, hours, minutes);
const MONDAY = at(12, 0);

const statusOf = (value: string, date: Date) =>
  statusAt(compileWeek([value], weekStart(date).getTime()), date);

describe('minuteOfWeek', () => {
  it('counts the minutes since Monday 00:00', () => {
    expect(minuteOfWeek(MONDAY)).toBe(0);
    expect(minuteOfWeek(at(14, 12, 30))).toBe(2 * 1440 + 12 * 60 + 30);
    expect(minuteOfWeek(at(18, 23, 59))).toBe(WEEK_MINUTES - 1);
  });
});

describe('weekStart', () => {
  it('returns Monday 00:00 of the week', () => {
    expect(weekStart(at(14, 12, 30))).toEqual(MONDAY);
    expect(weekStart(MONDAY)).toEqual(MONDAY);
  });

  it('treats Sunday as the last day of the week', () => {
    expect(weekStart(at(18, 23, 59))).toEqual(MONDAY);
    expect(weekStart(at(19, 0, 1))).toEqual(at(19, 0));
  });

  it('stays at local midnight in DST weeks', () => {
    // clocks change on Sunday 2026-10-25 and Sunday 2026-03-29 in Europe
    expect(weekStart(at(25, 12))).toEqual(at(19, 0));
    expect(weekEnd(at(19, 0)).getHours()).toBe(0);
    expect(weekStart(new Date(2026, 2, 29, 12))).toEqual(new Date(2026, 2, 23));
    expect(toIsoDate(weekStart(new Date(2026, 2, 29, 12)))).toBe('2026-03-23');
  });
});

describe('compileSchedule', () => {
  it('converts the open intervals of the week into minutes of the week', () => {
    expect(compileSchedule('Mo 08:00-12:00', MONDAY)).toEqual([[480, 720, false]]);
  });

  it('splits an overnight interval at the week boundaries and clamps it to the week end', () => {
    const sunday22 = 6 * 1440 + 22 * 60;
    expect(compileSchedule('Su 22:00-02:00', MONDAY)).toEqual([
      [0, 120, false],
      [sunday22, WEEK_MINUTES, false],
    ]);
  });

  it('marks intervals with a comment as unknown', () => {
    expect(compileSchedule('Mo 08:00-17:00 "by appointment"', MONDAY)).toEqual([
      [480, 1020, true],
    ]);
  });

  it('returns null for empty and invalid values', () => {
    expect(compileSchedule('', MONDAY)).toBeNull();
    expect(compileSchedule('   ', MONDAY)).toBeNull();
    expect(compileSchedule('garbage', MONDAY)).toBeNull();
  });

  it('compiles a whole week with its ISO start date', () => {
    const compiled = compileWeek(['24/7', ''], MONDAY.getTime());
    expect(compiled.weekStart).toBe('2026-10-12');
    expect(compiled.schedules).toEqual([[[0, WEEK_MINUTES, false]], null]);
  });
});

describe('statusAt', () => {
  it.each([
    ['24/7', at(14, 3), '1'],
    ['Mo-Fr 08:00-18:00', at(14, 10), '1'],
    ['Mo-Fr 08:00-18:00', at(14, 18), '0'],
    ['Mo-Fr 08:00-18:00', at(17, 10), '0'],
    ['Fr 22:00-02:00', at(16, 23), '1'],
    ['Fr 22:00-02:00', at(17, 1, 59), '1'],
    ['Fr 22:00-02:00', at(17, 2), '0'],
    ['Mo-Sa 09:00-12:00,13:30-18:00; PH off', at(13, 12, 30), '0'],
    ['Mo-Sa 09:00-12:00,13:30-18:00; PH off', at(13, 14), '1'],
    // Swiss National Day, Saturday 2026-08-01
    ['Mo-Sa 09:00-12:00,13:30-18:00; PH off', new Date(2026, 7, 1, 10), '0'],
    ['Mo-Sa 09:00-12:00,13:30-18:00; PH off', new Date(2026, 7, 8, 10), '1'],
    ['Mo-Su 08:00-18:00; PH off', new Date(2026, 7, 1, 12), '0'],
    ['Mo-Fr 08:00-17:00 "by appointment"', at(12, 10), '?'],
    ['Mo-Fr 08:00-17:00 "by appointment"', at(12, 18), '0'],
    ['unknown', at(12, 10), '?'],
    ['sunrise-sunset', at(12, 12), '1'],
    ['sunrise-sunset', at(12, 2), '0'],
    ['', at(12, 10), '?'],
    ['garbage', at(12, 10), '?'],
  ])('%s at %s is %s', (value, date, expected) => {
    expect(statusOf(value, date)).toBe(expected);
  });

  it('returns one character per schedule', () => {
    const compiled = compileWeek(['24/7', 'Mo-Fr 08:00-18:00', ''], MONDAY.getTime());
    expect(statusAt(compiled, at(17, 10))).toBe('10?');
  });
});

describe('StatusTracker', () => {
  const compiled = compileWeek(['Mo-Fr 08:00-18:00', '24/7'], MONDAY.getTime());

  it('only recomputes when a boundary was crossed', () => {
    const tracker = new StatusTracker(compiled);

    expect(tracker.update(at(12, 7, 58))).toBe('01');
    expect(tracker.update(at(12, 7, 59))).toBeNull();
    expect(tracker.update(at(12, 8, 0))).toBe('11');
    expect(tracker.update(at(12, 12, 0))).toBeNull();
    expect(tracker.update(at(12, 18, 1))).toBe('01');
  });

  it('detects boundaries between two minutes', () => {
    const tracker = new StatusTracker(compiled);

    expect(tracker.hasCrossedBoundary(479, 480)).toBe(true);
    expect(tracker.hasCrossedBoundary(480, 481)).toBe(false);
    expect(tracker.hasCrossedBoundary(0, 479)).toBe(false);
    expect(tracker.hasCrossedBoundary(400, 1090)).toBe(true); // across 480 and 1080
    expect(tracker.hasCrossedBoundary(500, 100)).toBe(true); // clock went backwards
  });
});

const feature = (properties: Feature['properties']): Feature => ({
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [8, 47] },
  properties,
});

describe('collectSchedules', () => {
  it('returns the opening hours not seen before and remembers them', () => {
    const known = new Set(['24/7']);
    const features = [
      feature({ opening_hours: '24/7' }),
      feature({ opening_hours: 'Mo-Fr 08:00-18:00' }),
      feature({ opening_hours: 'Mo-Fr 08:00-18:00' }),
      feature({ opening_hours: ' Mo-Fr 08:00-18:00 ' }),
      feature({ opening_hours: '' }),
      feature({}),
      feature(null),
    ];

    // raw values, since the map looks the status up by the exact value
    expect(collectSchedules(features, known)).toEqual(['Mo-Fr 08:00-18:00', ' Mo-Fr 08:00-18:00 ']);
    expect(collectSchedules(features, known)).toEqual([]);
  });
});

describe('toStatusMap', () => {
  it('maps the opening hours to their status and leaves unknown out', () => {
    expect(toStatusMap(['24/7', 'Mo-Fr 08:00-18:00', 'unknown'], '10?')).toEqual({
      '24/7': '1',
      'Mo-Fr 08:00-18:00': '0',
    });
  });
});

describe('featureStatus', () => {
  const statusMap = { '24/7': OH_STATUS.OPEN, 'Mo-Fr 08:00-18:00': OH_STATUS.CLOSED };

  it('treats access=no as closed, whatever the opening hours', () => {
    expect(featureStatus({ access: 'no', opening_hours: '24/7' }, statusMap)).toBe(OH_STATUS.CLOSED);
    expect(featureStatus({ access: 'no', opening_hours: '24/7' }, null)).toBe(OH_STATUS.CLOSED);
  });

  it('evaluates access=private by its opening hours', () => {
    expect(featureStatus({ access: 'private', opening_hours: '24/7' }, statusMap)).toBe(
      OH_STATUS.OPEN
    );
  });

  it('looks the status up by the opening hours', () => {
    expect(featureStatus({ opening_hours: 'Mo-Fr 08:00-18:00' }, statusMap)).toBe(OH_STATUS.CLOSED);
    expect(featureStatus({ opening_hours: 'unknown' }, statusMap)).toBe(OH_STATUS.UNKNOWN);
    expect(featureStatus({}, statusMap)).toBe(OH_STATUS.UNKNOWN);
    expect(featureStatus(null, statusMap)).toBe(OH_STATUS.UNKNOWN);
  });

  it('treats 24/7 as open until the status is computed', () => {
    expect(featureStatus({ opening_hours: '24/7' }, null)).toBe(OH_STATUS.OPEN);
    expect(featureStatus({ opening_hours: 'Mo-Fr 08:00-18:00' }, null)).toBe(OH_STATUS.UNKNOWN);
  });
});

describe('hashSchedules', () => {
  it('depends on the boundaries between the schedules', () => {
    expect(hashSchedules(['ab', 'c'])).not.toBe(hashSchedules(['a', 'bc']));
    expect(hashSchedules(['ab', 'c'])).toBe(hashSchedules(['ab', 'c']));
  });
});

describe('OpeningHoursController', () => {
  const MONDAY_ONLY = 'Mo 00:00-01:00';
  const aeds: FeatureCollection = {
    type: 'FeatureCollection',
    features: [
      feature({ opening_hours: MONDAY_ONLY }),
      feature({ opening_hours: '24/7' }),
      feature({ opening_hours: '24/7', access: 'no' }),
      feature({ opening_hours: '24/7', access: 'private' }),
    ],
  };

  const flush = async () => {
    for (let i = 0; i < 10; i++) {
      await Promise.resolve();
    }
  };

  let setGlobalStateProperty: ReturnType<typeof vi.fn>;
  let sourceFilter: unknown;
  let map: Map;
  let compiler: ScheduleCompiler & { getCompiledWeek: ReturnType<typeof vi.fn> };
  let request: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();

    setGlobalStateProperty = vi.fn();
    sourceFilter = undefined;
    map = {
      on: vi.fn(),
      off: vi.fn(),
      getSource: vi.fn(() => ({
        getData: () => Promise.resolve(aeds),
        serialize: () => ({ type: 'geojson', data: 'url', filter: sourceFilter }),
      })),
      isSourceLoaded: vi.fn(() => true),
      setGlobalStateProperty,
      getGlobalState: vi.fn(() => ({})),
    } as unknown as Map;

    compiler = {
      getCompiledWeek: vi.fn(
        (list: string[], start: Date): Promise<CompiledWeek> =>
          Promise.resolve(compileWeek(list, start.getTime()))
      ),
    };
    request = vi.fn(() => Promise.resolve(aeds));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const createController = () =>
    new OpeningHoursController({
      map,
      getDataUrl: () => 'https://example.org/aed',
      sourceId: 'aed-source',
      client: { request, terminate: vi.fn() } as unknown as OpeningHoursWorker,
      compiler,
    });

  it('takes the opening hours from the map source and sets the status per value', async () => {
    vi.setSystemTime(at(14, 10));
    const controller = createController();
    controller.start();
    await flush();

    expect(compiler.getCompiledWeek).toHaveBeenCalledWith([MONDAY_ONLY, '24/7'], MONDAY);
    expect(setGlobalStateProperty).toHaveBeenCalledWith(OH_STATUS_STATE, {
      [MONDAY_ONLY]: '0',
      '24/7': '1',
    });
    // the data comes from the map, nothing is loaded a second time
    expect(request).not.toHaveBeenCalled();

    controller.dispose();
  });

  it('does not touch the map while no status changes', async () => {
    vi.setSystemTime(at(14, 10));
    const controller = createController();
    controller.start();
    await flush();

    await vi.advanceTimersByTimeAsync(10 * 60_000);
    expect(setGlobalStateProperty).toHaveBeenCalledTimes(1);

    controller.dispose();
  });

  it('compiles the next week after the week rollover', async () => {
    vi.setSystemTime(at(18, 23, 59));
    const controller = createController();
    controller.start();
    await flush();

    expect(setGlobalStateProperty).toHaveBeenLastCalledWith(OH_STATUS_STATE, {
      [MONDAY_ONLY]: '0',
      '24/7': '1',
    });
    expect(toIsoDate(compiler.getCompiledWeek.mock.calls[0][1] as Date)).toBe('2026-10-12');

    // Sunday 23:59 -> Monday 00:01
    await vi.advanceTimersByTimeAsync(2 * 60_000);
    await flush();

    expect(compiler.getCompiledWeek).toHaveBeenCalledTimes(2);
    expect(toIsoDate(compiler.getCompiledWeek.mock.calls[1][1] as Date)).toBe('2026-10-19');
    expect(setGlobalStateProperty).toHaveBeenLastCalledWith(OH_STATUS_STATE, {
      [MONDAY_ONLY]: '1',
      '24/7': '1',
    });

    controller.dispose();
  });

  it('provides the open AEDs from the data of the map', async () => {
    vi.setSystemTime(at(14, 10));
    const controller = createController();
    controller.start();
    await flush();

    const listener = vi.fn();
    controller.subscribeOpenData(listener);

    expect(listener).toHaveBeenCalledWith({
      type: 'FeatureCollection',
      // not the one with access=no
      features: [aeds.features[1], aeds.features[3]],
    });
    expect(request).not.toHaveBeenCalled();

    controller.dispose();
  });

  it('notifies the status subscribers when the status changes', async () => {
    vi.setSystemTime(at(18, 23, 59));
    const controller = createController();
    const listener = vi.fn();
    controller.subscribeStatus(listener);
    controller.start();
    await flush();

    expect(listener).toHaveBeenLastCalledWith({ [MONDAY_ONLY]: '0', '24/7': '1' });
    expect(controller.getStatusMap()).toEqual({ [MONDAY_ONLY]: '0', '24/7': '1' });

    // Sunday 23:59 -> Monday 00:01
    await vi.advanceTimersByTimeAsync(2 * 60_000);
    await flush();

    expect(listener).toHaveBeenLastCalledWith({ [MONDAY_ONLY]: '1', '24/7': '1' });

    controller.dispose();
  });

  it('loads all AEDs for the open AEDs if the map source is filtered', async () => {
    vi.setSystemTime(at(14, 10));
    sourceFilter = ['==', ['get', 'opening_hours'], '24/7'];
    const controller = createController();
    controller.start();
    await flush();

    const listener = vi.fn();
    controller.subscribeOpenData(listener);
    await flush();

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'load', url: 'https://example.org/aed' })
    );
    expect(listener).toHaveBeenLastCalledWith({
      type: 'FeatureCollection',
      // not the one with access=no
      features: [aeds.features[1], aeds.features[3]],
    });

    controller.dispose();
  });
});
