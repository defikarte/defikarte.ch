import { type LayerSpecification } from 'maplibre-gl';
import {
  COLORS,
  IMAGE_SCALE,
  MARKER_BLUE_IMAGE_ID,
  MARKER_PLUS_BLUE_IMAGE_ID,
} from '../configuration/constants';

export const createAedCreateMarkerLayers = (
  baseId: string,
  source: string
): LayerSpecification[] => {
  const result = [];

  const singlePointLayer: LayerSpecification = {
    id: `${baseId}-single-point`,
    source: source,
    type: 'symbol',
    layout: {
      'icon-allow-overlap': true,
      'icon-image': [
        'case',
        ['boolean', ['get', 'isEdit'], false],
        MARKER_BLUE_IMAGE_ID,
        MARKER_PLUS_BLUE_IMAGE_ID,
      ],
      'icon-size': IMAGE_SCALE,
      'icon-anchor': 'bottom',
    },
  };

  const singlePointCircleLayer: LayerSpecification = {
    id: `${baseId}-single-point-circle`,
    source: source,
    type: 'circle',
    paint: {
      'circle-color': COLORS.SECONDARY_BLUE_01,
      'circle-radius': 30,
      'circle-opacity': 0.6,
      'circle-translate': [0, -18], // Adjust circle position to be below the icon
      'circle-translate-anchor': 'viewport',
    },
  };

  // order is important
  result.push(singlePointCircleLayer);
  result.push(singlePointLayer);

  return result;
};
