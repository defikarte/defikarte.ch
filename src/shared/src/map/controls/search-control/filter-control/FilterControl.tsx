import { useTranslation } from 'react-i18next';
import { FilterType } from '../../../../model/map';
import iconDefiGreen from './../../../../assets/icons/icon-defi-circle-green.svg';
import iconDefiOrange from './../../../../assets/icons/icon-defi-circle-orange.svg';
import iconOpeningHours from './../../../../assets/icons/icon-opening-times-circle-green.svg';
import { FilterItem } from './filter-item/FilterItem';

interface FilterControlProps {
  activeOverlays: FilterType[];
  setActiveOverlays: React.Dispatch<React.SetStateAction<FilterType[]>>;
}

export const FilterControl = ({
  ref,
  activeOverlays,
  setActiveOverlays,
}: FilterControlProps & { ref?: React.RefObject<HTMLDivElement | null> }) => {
  const { t } = useTranslation();

  const onFilterChange = (e: React.ChangeEvent<HTMLInputElement>, value: FilterType) => {
    setActiveOverlays(a => {
      if (value === FilterType.byAvailability && e.target.checked) {
        return [FilterType.byAvailability];
      }

      if (value === FilterType.byAvailability && !e.target.checked) {
        return [FilterType.alwaysAvailable, FilterType.withOpeningHours];
      }

      let result = a;
      if (result.includes(FilterType.byAvailability)) {
        result = result.filter(x => x !== FilterType.byAvailability);
      }

      return e.target.checked ? [...result, value] : [...result.filter(x => x !== value)];
    });
  };

  return (
    <div className="mx-4 md:mx-0" ref={ref}>
      <FilterItem
        label={t('247Available')}
        checked={activeOverlays?.includes(FilterType.alwaysAvailable)}
        onChange={e => onFilterChange(e, FilterType.alwaysAvailable)}
        icon={iconDefiGreen}
      />
      <FilterItem
        label={t('withOpeningHours')}
        checked={activeOverlays?.includes(FilterType.withOpeningHours)}
        onChange={e => onFilterChange(e, FilterType.withOpeningHours)}
        icon={iconDefiOrange}
      />
      <FilterItem
        label={t('availableNow')}
        checked={activeOverlays.includes(FilterType.byAvailability)}
        onChange={e => onFilterChange(e, FilterType.byAvailability)}
        icon={iconOpeningHours}
      />
    </div>
  );
};
