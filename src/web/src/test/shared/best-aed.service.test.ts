import { type Feature, type FeatureCollection, type GeoJsonProperties } from 'geojson';
import { describe, expect, it } from 'vitest';
import {
  BEST_AED_COUNT,
  findBestAeds,
  OH_STATUS,
  type OpeningHoursStatusMap,
} from '@defikarte/shared';

const position = { lat: 47.3769, lon: 8.5417 };

// roughly `meters` north of the position (1° latitude ≈ 111 km)
const aedNorthOf = (id: number, meters: number, properties: GeoJsonProperties = {}): Feature => ({
  type: 'Feature',
  id,
  geometry: { type: 'Point', coordinates: [position.lon, position.lat + meters / 111_000] },
  properties,
});

const collection = (...features: Feature[]): FeatureCollection => ({
  type: 'FeatureCollection',
  features,
});

const open = { opening_hours: '24/7' };
const closed = { opening_hours: 'Mo-Fr 08:00-17:00' };
const statusMap: OpeningHoursStatusMap = { 'Mo-Fr 08:00-17:00': OH_STATUS.CLOSED };

const ids = (result: ReturnType<typeof findBestAeds>) => result.map(r => r.feature.id);

describe('findBestAeds', () => {
  it('returns only available AEDs, closest first', () => {
    const result = findBestAeds(
      collection(aedNorthOf(1, 1500, open), aedNorthOf(2, 400, open), aedNorthOf(3, 50)),
      position,
      statusMap
    );

    expect(ids(result)).toEqual([2, 1]);
  });

  it('leaves out closed, unknown and not publicly accessible AEDs', () => {
    const result = findBestAeds(
      collection(
        aedNorthOf(1, 10, closed),
        aedNorthOf(2, 20, { ...open, access: 'no' }),
        aedNorthOf(3, 30),
        aedNorthOf(4, 40, open)
      ),
      position,
      statusMap
    );

    expect(ids(result)).toEqual([4]);
  });

  it('returns at most `count` AEDs', () => {
    const features = Array.from({ length: 8 }, (_, i) => aedNorthOf(i, i * 10, open));

    expect(findBestAeds(collection(...features), position, null)).toHaveLength(BEST_AED_COUNT);
    expect(findBestAeds(collection(...features), position, null, 2)).toHaveLength(2);
  });

  it('returns nothing for no AEDs', () => {
    expect(findBestAeds(collection(), position, null)).toEqual([]);
  });
});
