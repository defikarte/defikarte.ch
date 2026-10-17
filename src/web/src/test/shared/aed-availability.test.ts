import { type Feature, type FeatureCollection } from 'geojson';
import { describe, expect, it } from 'vitest';
import {
  addAedAvailability,
  filterAedDataByCurrentAvailability,
  getAedAvailability,
} from '@defikarte/shared';

// Wednesday, 10:00 local time
const wednesdayMorning = new Date(2026, 9, 14, 10, 0);
// Wednesday, 20:00 local time
const wednesdayEvening = new Date(2026, 9, 14, 20, 0);
// Saturday, 1 August (Swiss National Day), 10:00 local time
const swissNationalDay = new Date(2026, 7, 1, 10, 0);

const officeHours = 'Mo-Fr 08:00-18:00';

describe('getAedAvailability', () => {
  it('is open for 24/7', () => {
    expect(getAedAvailability({ opening_hours: '24/7' }, wednesdayEvening)).toBe('open');
  });

  it('is open within the opening hours', () => {
    expect(getAedAvailability({ opening_hours: officeHours }, wednesdayMorning)).toBe('open');
  });

  it('is closed outside the opening hours', () => {
    expect(getAedAvailability({ opening_hours: officeHours }, wednesdayEvening)).toBe('closed');
  });

  it('is closed for access=no, regardless of the opening hours', () => {
    expect(getAedAvailability({ opening_hours: '24/7', access: 'no' }, wednesdayMorning)).toBe(
      'closed'
    );
    expect(getAedAvailability({ access: 'no' }, wednesdayMorning)).toBe('closed');
  });

  it('only treats access=no as closed, not access=private', () => {
    expect(getAedAvailability({ opening_hours: '24/7', access: 'private' }, wednesdayMorning)).toBe(
      'open'
    );
  });

  it('is unknown without opening hours', () => {
    expect(getAedAvailability({}, wednesdayMorning)).toBe('unknown');
    expect(getAedAvailability({ opening_hours: '' }, wednesdayMorning)).toBe('unknown');
    expect(getAedAvailability(null, wednesdayMorning)).toBe('unknown');
  });

  it('is unknown for invalid opening hours', () => {
    expect(getAedAvailability({ opening_hours: 'nach Absprache' }, wednesdayMorning)).toBe(
      'unknown'
    );
  });

  it('is unknown when the opening hours explicitly say so', () => {
    expect(
      getAedAvailability({ opening_hours: 'Mo-Su 08:00-18:00 unknown' }, wednesdayMorning)
    ).toBe('unknown');
  });

  it('evaluates public holidays with the Swiss calendar', () => {
    expect(
      getAedAvailability({ opening_hours: 'Mo-Su 08:00-18:00; PH off' }, swissNationalDay)
    ).toBe('closed');
  });
});

const feature = (id: number, properties: Record<string, string>): Feature => ({
  type: 'Feature',
  id,
  geometry: { type: 'Point', coordinates: [8.5417, 47.3769] },
  properties,
});

const collection: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    feature(1, { opening_hours: '24/7' }),
    feature(2, { opening_hours: officeHours }),
    feature(3, {}),
    feature(4, { opening_hours: '24/7', access: 'no' }),
  ],
};

describe('addAedAvailability', () => {
  it('adds the availability to every feature', () => {
    const result = addAedAvailability(collection, wednesdayEvening);

    expect(result.features.map(f => f.properties?.availability as string)).toEqual([
      'open',
      'closed',
      'unknown',
      'closed',
    ]);
  });

  it('keeps the original properties', () => {
    const result = addAedAvailability(collection, wednesdayEvening);

    expect(result.features[1].properties?.opening_hours).toBe(officeHours);
    expect(collection.features[1].properties?.availability).toBeUndefined();
  });

  it('handles an empty response', () => {
    expect(addAedAvailability({} as FeatureCollection).features).toEqual([]);
  });
});

describe('filterAedDataByCurrentAvailability', () => {
  it('only keeps AEDs that are open now', () => {
    expect(
      filterAedDataByCurrentAvailability(collection, wednesdayMorning).features.map(f => f.id)
    ).toEqual([1, 2]);
    expect(
      filterAedDataByCurrentAvailability(collection, wednesdayEvening).features.map(f => f.id)
    ).toEqual([1]);
  });
});
