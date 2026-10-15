import cn from 'classnames';
import { type Feature } from 'geojson';
import { useTranslation } from 'react-i18next';
import iconCheckWhite from '../../../../assets/icons/icon-check-white.svg';
import iconInfoCircleGreenM from '../../../../assets/icons/icon-info-circle-green-m.svg';
import iconWarningCircleOrangeM from '../../../../assets/icons/icon-warning-circle-orange-m.svg';
import { Button } from '../../../../components/ui/button/Button';
import { type NearbyAed } from '../../../../services/nearby-aed.service';

interface PositionHintProps {
  nearbyAeds: NearbyAed[];
  isExpanded: boolean;
  onToggle: () => void;
  onShowNearbyAed: (feature: Feature) => void;
  onConfirm: () => void;
}

/**
 * The bar shown while the position of an AED is chosen. With AEDs close by it turns into a
 * warning that can be expanded into the list of them; expanded, it holds the only way to confirm
 * the position, so the message can't be skipped.
 */
export const PositionHint = ({
  nearbyAeds,
  isExpanded,
  onToggle,
  onShowNearbyAed,
  onConfirm,
}: PositionHintProps) => {
  const { t } = useTranslation();
  const hasNearbyAeds = nearbyAeds.length > 0;
  const showList = hasNearbyAeds && isExpanded;

  return (
    <div
      className={cn(
        'flex flex-col gap-3 mx-9 md:mx-0 px-3 md:px-5 py-2 md:py-4',
        'text-xs md:text-base leading-[150%] bg-primary-100-white text-primary-100-green-04',
        'shadow-custom shadow-green-shadow',
        // the border is always there, only its colour changes - so the bar doesn't jump when the
        // marker moves in or out of the radius
        'border-2',
        hasNearbyAeds ? 'border-secondary-orange-02' : 'border-transparent',
        // sizes to its header like the plain pill, so expanding never changes the width
        showList ? 'rounded-2xl' : 'rounded-[50px]'
      )}
    >
      <div className="flex items-center gap-2.5">
        <img src={hasNearbyAeds ? iconWarningCircleOrangeM : iconInfoCircleGreenM} alt="" />
        <span className={cn(hasNearbyAeds && 'flex-grow font-semibold')}>
          {hasNearbyAeds
            ? t('nearbyAedTitle', { count: nearbyAeds.length })
            : t('choosePositionForNewAedOnMap')}
        </span>
        {hasNearbyAeds && (
          // A text button without padding: a regular Button is taller than the icon and would
          // make the bar grow as soon as AEDs are nearby. Both labels share one grid cell, so it
          // keeps the wider one's width and toggling doesn't resize the bar.
          <button
            type="button"
            className="grid shrink-0 cursor-pointer text-primary-100-green-03 hover:text-primary-100-green-04"
            aria-expanded={isExpanded}
            onClick={onToggle}
          >
            <span className={cn('col-start-1 row-start-1', isExpanded && 'invisible')}>
              {t('nearbyAedShowList')}
            </span>
            <span className={cn('col-start-1 row-start-1', !isExpanded && 'invisible')}>
              {t('nearbyAedHideList')}
            </span>
          </button>
        )}
      </div>
      {showList && (
        // w-0 + min-w-full: the list takes the header's width and wraps in it, instead of
        // widening the bar to fit its own text
        <div className="flex flex-col gap-3 w-0 min-w-full">
          <span>{t('nearbyAedContent')}</span>
          {/* capped so a long list scrolls instead of covering the buttons at the bottom */}
          <ul className="flex flex-col gap-2 max-h-[30vh] overflow-y-auto pe-1">
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
        </div>
      )}
    </div>
  );
};
