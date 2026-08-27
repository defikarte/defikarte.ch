import { type LayerSpecification } from 'maplibre-gl';
import { COLORS } from '../configuration/constants';

export const createUserLocationLayers = (baseId: string, source: string): LayerSpecification[] => {
  const result = [];

  const singlePointCircleLayer: LayerSpecification = {
    id: `${baseId}-single-point-circle`,
    source: source,
    type: 'circle',
    paint: {
      'circle-color': COLORS.USER_LOCATION,
      'circle-opacity': 1,
      'circle-radius': 7,
      'circle-blur': 0,
      'circle-stroke-width': 3,
      'circle-stroke-color': COLORS.PRIMARY_100_WHITE,
    },
    filter: ['==', ['geometry-type'], 'Point'],
  };

  const singlePointStrokeLayer: LayerSpecification = {
    id: `${baseId}-single-point-stroke`,
    source: source,
    type: 'fill',
    paint: {
      'fill-color': COLORS.USER_LOCATION,
      'fill-opacity': 0.3,
    },
  };

  // order is important
  result.push(singlePointStrokeLayer);
  result.push(singlePointCircleLayer);

  return result;
};
