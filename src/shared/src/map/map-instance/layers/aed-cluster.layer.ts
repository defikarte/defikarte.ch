import { type FilterSpecification, type LayerSpecification } from 'maplibre-gl';
import {
  COLORS,
  IMAGE_SCALE,
  MARKER_GRADIENT_M_IMAGE_ID,
  MARKER_GRADIENT_S_IMAGE_ID,
  MARKER_GRADIENT_XL_IMAGE_ID,
  MARKER_GRADIENT_XS_IMAGE_ID,
} from '../configuration/constants';

const clusterFilter: FilterSpecification = ['has', 'point_count'];

export const createAedClusterLayers = (baseId: string, source: string): LayerSpecification[] => {
  const result = [];

  const clusterPointLayer: LayerSpecification = {
    id: `${baseId}-cluster-point`,
    type: 'symbol',
    source: source,
    layout: {
      'icon-allow-overlap': true,
      'icon-image': [
        'step',
        ['get', 'point_count'],
        MARKER_GRADIENT_XS_IMAGE_ID,
        10,
        MARKER_GRADIENT_S_IMAGE_ID,
        100,
        MARKER_GRADIENT_M_IMAGE_ID,
        1000,
        MARKER_GRADIENT_XL_IMAGE_ID,
      ],
      'icon-size': IMAGE_SCALE,
    },
    filter: clusterFilter,
  };

  const clusterCountLayer: LayerSpecification = {
    id: `${baseId}-cluster-count`,
    type: 'symbol',
    source: source,
    layout: {
      'text-field': ['format', ['get', 'point_count'], { 'font-scale': 1 }],
      'text-font': ['Open Sans'],
      'text-size': 15,
      'text-pitch-alignment': 'map',
      'text-allow-overlap': true,
      'text-anchor': 'center',
    },
    paint: {
      'text-color': COLORS.PRIMARY_100_WHITE,
    },
    filter: clusterFilter,
  };

  result.push(clusterPointLayer);
  result.push(clusterCountLayer);

  return result;
};
