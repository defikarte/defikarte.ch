import classNames from 'classnames';
import { type Feature } from 'geojson';
import { useTranslation } from 'react-i18next';
import iconAccessCircleGreen from '../../../../assets/icons/icon-access-circle-green.svg';
import iconAccessCircleGrey from '../../../../assets/icons/icon-access-circle-grey.svg';
import iconHouseCircleGreen from '../../../../assets/icons/icon-house-circle-green.svg';
import iconHouseCircleGrey from '../../../../assets/icons/icon-house-circle-grey.svg';
import iconInfoCircleGreen from '../../../../assets/icons/icon-info-circle-green-s.svg';
import iconInfoCircleGrey from '../../../../assets/icons/icon-info-circle-grey.svg';
import iconPhoneCircleGreen from '../../../../assets/icons/icon-phone-circle-green.svg';
import iconPhoneCircleGrey from '../../../../assets/icons/icon-phone-circle-grey.svg';
import iconPinCircleGreen from '../../../../assets/icons/icon-pin-circle-green.svg';
import iconPinCircleGrey from '../../../../assets/icons/icon-pin-circle-grey.svg';
import iconProfileCircleGreen from '../../../../assets/icons/icon-profile-circle-green.svg';
import iconProfileCircleGrey from '../../../../assets/icons/icon-profile-circle-grey.svg';
import iconStairsCircleGreen from '../../../../assets/icons/icon-stairs-circle-green.svg';
import iconStairsCircleGrey from '../../../../assets/icons/icon-stairs-circle-grey.svg';
import iconTimeCircleGreen from '../../../../assets/icons/icon-time-circle-green.svg';
import iconTimeCircleGrey from '../../../../assets/icons/icon-time-circle-grey.svg';
import { ItemProperty } from './item-property/ItemProperty';

interface FeaturePropsListProps {
  feature: Feature;
  isOpen: boolean;
  className?: string;
}

export const FeaturePropsList = ({ feature, isOpen, className }: FeaturePropsListProps) => {
  const { t } = useTranslation();
  const props = feature.properties ?? {};
  const containerClass = classNames(className, 'flex', 'flex-col', 'gap-3');
  return (
    <div className={containerClass}>
      {props.opening_hours && (
        <ItemProperty
          icon={isOpen ? iconTimeCircleGreen : iconTimeCircleGrey}
          title={t('openingHours')}
          value={props.opening_hours as string}
        />
      )}
      {props.access && (
        <ItemProperty
          icon={isOpen ? iconAccessCircleGreen : iconAccessCircleGrey}
          title={t('access')}
          value={t(props.access as string)}
        />
      )}
      {props.indoor && (
        <ItemProperty
          icon={isOpen ? iconHouseCircleGreen : iconHouseCircleGrey}
          title={t('isIndoor')}
          value={t(props.indoor as string)}
        />
      )}
      {props.level && (
        <ItemProperty
          icon={isOpen ? iconStairsCircleGreen : iconStairsCircleGrey}
          title={t('level')}
          value={props.level as string}
        />
      )}
      {props.description && (
        <ItemProperty
          icon={isOpen ? iconInfoCircleGreen : iconInfoCircleGrey}
          title={t('description')}
          value={props.description as string}
        />
      )}
      {props.operator && (
        <ItemProperty
          icon={isOpen ? iconProfileCircleGreen : iconProfileCircleGrey}
          title={t('operator')}
          value={props.operator as string}
        />
      )}
      {props.phone && (
        <ItemProperty
          icon={isOpen ? iconPhoneCircleGreen : iconPhoneCircleGrey}
          title={t('operatorPhone')}
          value={props.phone as string}
        />
      )}
      <ItemProperty
        icon={isOpen ? iconPinCircleGreen : iconPinCircleGrey}
        title={t('node')}
        value={feature.id ?? ''}
      />
    </div>
  );
};
