import { type RasterLayerSpecification } from 'maplibre-gl';

export const createOsmLayer = (id: string, source: string) => {
  return {
    id: id,
    type: 'raster',
    source: source,
  } as RasterLayerSpecification;
};
