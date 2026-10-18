import { type GeoJSON, type GeoJsonProperties, type Geometry } from 'geojson';
import { type FilterSpecification, type GeoJSONSourceSpecification } from 'maplibre-gl';

export const createAedSource = (
  data: string | GeoJSON<Geometry, GeoJsonProperties>,
  filter: FilterSpecification | null = null
): GeoJSONSourceSpecification => {
  return {
    type: 'geojson',
    data: data,
    cluster: true,
    clusterRadius: 75,
    clusterMaxZoom: 14,
    attribution:
      '<a href="https://www.openstreetmap.org" target="_blank">© OpenStreetMap contributors</a>',
    // maplibre rejects a source with `filter: null`, so it is only set when there is one
    ...(filter ? { filter } : {}),
  } as GeoJSONSourceSpecification;
};
