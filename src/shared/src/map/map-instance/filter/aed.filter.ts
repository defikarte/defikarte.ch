import { type FilterSpecification } from 'maplibre-gl';

export const alwaysAvailableFilterOverride: FilterSpecification = [
  'match',
  ['get', 'opening_hours'],
  '24/7',
  true,
  false,
];
export const restrictedFilterOverride: FilterSpecification = [
  'match',
  ['get', 'opening_hours'],
  '24/7',
  false,
  true,
];
