import cn from 'classnames';
import { type Feature, type GeoJsonProperties, type Geometry } from 'geojson';
import iconDefiGreen from './../../../../../assets/icons/icon-defi-circle-green.svg';
import iconDefiOrange from './../../../../../assets/icons/icon-defi-circle-orange.svg';
import iconAddress from './../../../../../assets/icons/icon-marker-circle-green-m.svg';

interface Props {
  isActive: boolean;
  item: Feature<Geometry, GeoJsonProperties>;
  onClick: (item: Feature<Geometry, GeoJsonProperties>) => void;
  onMouseEnter: () => void;
  compact?: boolean;
}

export const ResultItem = (props: Props) => {
  const { item, compact = false } = props;

  const getLabel = (properties: GeoJsonProperties): string[] => {
    if (properties?.emergency === 'defibrillator') {
      const value =
        (properties?.['defibrillator:location'] as string) ??
        properties?.description ??
        properties?.operator ??
        'n/A';
      return [value];
    }
    return [properties?.addressPrimary, properties?.addressSecondary].filter(
      x => x !== null || x !== undefined || x !== ''
    ) as string[];
  };

  const values = getLabel(item.properties ?? {});
  const id = item.id?.toString();
  const icon =
    item.properties?.emergency === 'defibrillator' && item.properties.opening_hours === '24/7'
      ? iconDefiGreen
      : item.properties?.emergency === 'defibrillator'
        ? iconDefiOrange
        : iconAddress;

  return (
    <div
      key={id}
      className={cn(
        { 'bg-green-custom': props.isActive, 'bg-primary-100-white': !props.isActive },
        'flex',
        'py-1',
        'first:pt-3',
        'last:pb-4',
        'px-3',
        !compact && 'md:px-4',
        'items-center',
        'last:rounded-b-[24px]',
        !compact && 'last:md:rounded-b-[30px]',
        'cursor-pointer'
      )}
      onClick={() => props.onClick(item)}
      onMouseEnter={props.onMouseEnter}
    >
      <img src={icon} alt="search-result" className="w-6 h-6" />
      <div
        className={cn(
          'flex flex-col ml-3 text-nowrap overflow-hidden',
          !compact && 'md:flex-row md:items-center md:ml-4'
        )}
      >
        {values[0] && (
          <span
            className={cn('text-sm font-normal text-primary-100-green-04', !compact && 'md:mr-3')}
          >
            {values[0]}
          </span>
        )}
        {values[1] && (
          <span className="text-xs font-normal text-primary-60-green-04">{values[1]}</span>
        )}
      </div>
    </div>
  );
};
