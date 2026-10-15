import { type Feature, type FeatureCollection } from 'geojson';
import { describe, expect, it } from 'vitest';
import { distanceBetweenPoints, findNearbyAeds, NEARBY_AED_RADIUS_METERS } from '@defikarte/shared';

const position = { lat: 47.3769, lon: 8.5417 };

// roughly `meters` north of the position (1° latitude ≈ 111 km)
const aedNorthOf = (id: number, meters: number): Feature => ({
  type: 'Feature',
  id,
  geometry: { type: 'Point', coordinates: [position.lon, position.lat + meters / 111_000] },
  properties: {},
});

const collection = (...features: Feature[]): FeatureCollection => ({
  type: 'FeatureCollection',
  features,
});

describe('findNearbyAeds', () => {
  it('returns only AEDs within the radius, closest first', () => {
    const result = findNearbyAeds(
      collection(aedNorthOf(1, 20), aedNorthOf(2, 5), aedNorthOf(3, 100)),
      position
    );

    expect(result.map(r => r.feature.id)).toEqual([2, 1]);
    expect(result[0].distance).toBeLessThan(result[1].distance);
  });

  it('includes an AED exactly on the radius', () => {
    const aed = aedNorthOf(1, NEARBY_AED_RADIUS_METERS);
    const [lon, lat] = (aed.geometry as { coordinates: number[] }).coordinates;
    const distance = distanceBetweenPoints(position, { lat, lon });

    expect(findNearbyAeds(collection(aed), position, distance)).toHaveLength(1);
  });

  it('ignores features that are not points', () => {
    const line: Feature = {
      type: 'Feature',
      id: 1,
      geometry: { type: 'LineString', coordinates: [[position.lon, position.lat]] },
      properties: {},
    };

    expect(findNearbyAeds(collection(line), position)).toEqual([]);
  });

  it('handles the empty object a failed AED request resolves to', () => {
    expect(findNearbyAeds({} as FeatureCollection, position)).toEqual([]);
  });
});
