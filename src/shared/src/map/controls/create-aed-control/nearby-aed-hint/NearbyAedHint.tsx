import cn from 'classnames';
import { type Feature } from 'geojson';
import { useTranslation } from 'react-i18next';
import iconCheckWhite from '../../../../assets/icons/icon-check-white.svg';
import iconWarningCircleOrangeM from '../../../../assets/icons/icon-warning-circle-orange-m.svg';
import { Button } from '../../../../components/ui/button/Button';
import { type NearbyAed } from '../../../../services/nearby-aed.service';

interface NearbyAedHintProps {
  nearbyAeds: NearbyAed[];
  isExpanded: boolean;
  onToggle: () => void;
  onShowNearbyAed: (feature: Feature) => void;
  onConfirm: () => void;
}

/**
 * Warns while the position of a new AED is chosen that AEDs already exist close by. Collapsed it
 * is a pill like the positioning hint above it; expanded it lists the AEDs so they can be opened,
 * and holds the only way to confirm the position while potential duplicates are close by.
 */
export const NearbyAedHint = ({
  nearbyAeds,
  isExpanded,
  onToggle,
  onShowNearbyAed,
  onConfirm,
}: NearbyAedHintProps) => {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        'flex flex-col gap-3 mx-9 md:mx-0 max-w-[480px] px-3 md:px-5 py-2 md:py-3',
        'text-xs md:text-base leading-[150%] bg-primary-100-white text-primary-100-green-04',
        'border-2 border-secondary-orange-02 shadow-custom shadow-green-shadow',
        isExpanded ? 'rounded-2xl' : 'rounded-[50px]'
      )}
    >
      <button
        type="button"
        className="flex items-center gap-2.5 text-left font-semibold cursor-pointer"
        aria-expanded={isExpanded}
        onClick={onToggle}
      >
        <img src={iconWarningCircleOrangeM} />
        <span>{t('nearbyAedTitle', { count: nearbyAeds.length })}</span>
      </button>
      {isExpanded && (
        <>
          <span>{t('nearbyAedContent')}</span>
          <ul className="flex flex-col gap-2">
            {nearbyAeds.map(({ feature, distance }) => {
              const location =
                (feature.properties?.['defibrillator:location'] as string | undefined) ||
                (feature.properties?.description as string | undefined) ||
                t('nearbyAedNoLocation');
              const level = feature.properties?.level as string | undefined;
              return (
                <li key={feature.id} className="flex items-center justify-between gap-2">
                  <span>
                    {Math.round(distance)} m – {location}
                    {level && ` (${t('level')} ${level})`}
                  </span>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => onShowNearbyAed(feature)}
                  >
                    {t('nearbyAedShow')}
                  </Button>
                </li>
              );
            })}
          </ul>
          <Button
            type="button"
            variant="primary"
            icon={iconCheckWhite}
            className="self-end"
            onClick={onConfirm}
          >
            {t('nearbyAedConfirm')}
          </Button>
        </>
      )}
    </div>
  );
};
