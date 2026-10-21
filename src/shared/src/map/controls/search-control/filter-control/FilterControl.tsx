import cn from 'classnames';
import { useTranslation } from 'react-i18next';
import { FilterType } from '../../../../model/map';
import iconDefiGreen from './../../../../assets/icons/icon-defi-circle-green.svg';
import iconDefiOrange from './../../../../assets/icons/icon-defi-circle-orange.svg';
import iconDefiRed from './../../../../assets/icons/icon-defi-circle-red.svg';
import { FilterItem } from './filter-item/FilterItem';

interface FilterControlProps {
  activeOverlays: FilterType[];
  setActiveOverlays: React.Dispatch<React.SetStateAction<FilterType[]>>;
  compact?: boolean;
}

// the 24h AEDs are a part of the available ones, so only one of the two is selected
const exclusiveFilters: Partial<Record<FilterType, FilterType>> = {
  [FilterType.available]: FilterType.alwaysAvailable,
  [FilterType.alwaysAvailable]: FilterType.available,
};

export const FilterControl = ({
  ref,
  activeOverlays,
  setActiveOverlays,
  compact = false,
}: FilterControlProps & { ref?: React.RefObject<HTMLDivElement | null> }) => {
  const { t } = useTranslation();

  // in the colours of the markers on the map, so the filters double as its legend
  const filters = [
    { value: FilterType.available, label: t('availableNow'), icon: iconDefiGreen },
    { value: FilterType.alwaysAvailable, label: t('available24h'), icon: iconDefiGreen },
    { value: FilterType.notAvailable, label: t('notAvailable'), icon: iconDefiRed },
    { value: FilterType.unknown, label: t('availabilityUnknown'), icon: iconDefiOrange },
  ];

  const onFilterChange = (e: React.ChangeEvent<HTMLInputElement>, value: FilterType) => {
    setActiveOverlays(active => {
      if (e.target.checked) {
        const others = active.filter(x => x !== exclusiveFilters[value]);
        return others.includes(value) ? others : [...others, value];
      }

      // at least one status stays selected, so the map never shows no AEDs at all
      const result = active.filter(x => x !== value);
      return result.length > 0 ? result : active;
    });
  };

  return (
    <div className={cn(!compact && 'mx-4 md:mx-0')} ref={ref}>
      {filters.map(filter => (
        <FilterItem
          key={filter.value}
          label={filter.label}
          checked={activeOverlays.includes(filter.value)}
          onChange={e => onFilterChange(e, filter.value)}
          icon={filter.icon}
          compact={compact}
        />
      ))}
    </div>
  );
};
