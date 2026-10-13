import { type GeoJSON, type GeoJsonProperties, type Geometry } from 'geojson';
import { type GeoJSONSourceSpecification } from 'maplibre-gl';

export const createGeoJSONSource = (
  data: string | GeoJSON<Geometry, GeoJsonProperties>
): GeoJSONSourceSpecification => {
  return {
    type: 'geojson',
    data: data,
  } as GeoJSONSourceSpecification;
};
