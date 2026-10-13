import { type RasterSourceSpecification } from 'maplibre-gl';

export const createOsmSource = (): RasterSourceSpecification => {
  return {
    type: 'raster',
    tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
    tileSize: 256,
    minzoom: 0,
    maxzoom: 19,
    attribution:
      '<a href="https://www.openstreetmap.org" target="_blank">© OpenStreetMap contributors</a>',
  } as RasterSourceSpecification;
};
