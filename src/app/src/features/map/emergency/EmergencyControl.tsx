import {
  Button,
  DetailView,
  featureStatus,
  getActiveAedOverlay,
  IconButton,
  type MapInstance,
  type MapInteractionEvent,
  type NearbyAed,
  OH_STATUS,
} from '@defikarte/shared';
import classNames from 'classnames';
import { type MapGeoJSONFeature } from 'maplibre-gl';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import iconCloseDarkGreen from '../../../assets/icons/icon-close-dark-green.svg';
import iconDefiWhite from '../../../assets/icons/icon-defi-white.svg';
import iconNavigationWhite from '../../../assets/icons/icon-navigation-white.svg';
import iconTimeWhite from '../../../assets/icons/icon-time-white.svg';
import { getWalkingDirectionsUrl } from '../../../services/navigation.service';
import { getAedUrl, shareLink } from '../../../services/share.service';

interface EmergencyControlProps {
  map: MapInstance | null;
  isActive: boolean;
  onToggle: () => void;
  userLocation: GeolocationPosition | null;
  locationError: string | null;
  onRetryLocation: () => void;
  bestAeds: NearbyAed[];
  // the AED the view shows large, the others are the alternatives
  selectedAed: NearbyAed | null;
  onSelect: (id: string | number | undefined) => void;
  onEdit: (event: MapInteractionEvent) => void;
  // false while the detail view of another AED covers the bottom of the map - hides FAB and card
  isVisible: boolean;
  // the FAB shows only its icon, no label
  isCollapsed: boolean;
  onCollapse: () => void;
}

const nameOf = (aed: NearbyAed) => {
  const props = aed.feature.properties ?? {};
  return (
    (props['defibrillator:location'] as string | undefined) ??
    (props.description as string | undefined) ??
    (props.operator as string | undefined) ??
    'n/A'
  );
};

const formatDistance = (distance: number) =>
  distance < 1000 ? `${distance.toFixed(0)} m` : `${(distance / 1000).toFixed(1)} km`;

/** The AED as a map feature of the AED source shown, as the detail view and editing expect it. */
const toMapEvent = (map: MapInstance | null, { feature }: NearbyAed): MapInteractionEvent => {
  const data = {
    geometry: feature.geometry,
    properties: feature.properties,
    id: feature.id,
    type: feature.type,
    source: getActiveAedOverlay(map),
  } as MapGeoJSONFeature;

  return { source: data.source, data, type: 'item-select' };
};

/**
 * The emergency view: a FAB that shows the best AEDs around the user, and a card with the selected
 * one - where it is and a walking route to it - and the alternatives. Choosing an alternative here
 * or on the map always does the same: it becomes the selected one and the map shows the way to it.
 */
export const EmergencyControl = ({
  map,
  isActive,
  onToggle,
  userLocation,
  locationError,
  onRetryLocation,
  bestAeds,
  selectedAed,
  onSelect,
  onEdit,
  isVisible,
  isCollapsed,
  onCollapse,
}: EmergencyControlProps) => {
  const { t } = useTranslation();
  const cardRef = useRef<HTMLDivElement | null>(null);
  // the full detail view of the selected AED, over the card
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const showCard = isActive && isVisible && !isDetailOpen;

  // The first touch anywhere - map, search, any button - collapses the FAB to its icon. Captured
  // on the document, so it also sees touches the map or a control stops from bubbling.
  useEffect(() => {
    if (isCollapsed) return;

    document.addEventListener('pointerdown', onCollapse, { capture: true, once: true });
    return () => document.removeEventListener('pointerdown', onCollapse, { capture: true });
  }, [isCollapsed, onCollapse]);

  // Zooms to the selected AED alone, centred - never together with the user. Once per newly
  // selected AED, and again when the card comes back. Not on every GPS tick, so the map doesn't
  // jump while the user walks or pans.
  useEffect(() => {
    if (!map || !showCard || !selectedAed || !userLocation) return;

    const aed = selectedAed.feature.geometry.coordinates as [number, number];
    // Clear of the search bar (~70px) at the top and the card at the bottom, with a margin on every
    // side. The top has room for the AED marker, which is drawn above its point. Kept tight: on a
    // small phone the card takes half of the map already.
    const bottom = (cardRef.current?.offsetHeight ?? 0) + 32;
    map.fitBounds([aed, aed], { top: 120, bottom, left: 48, right: 48 });
    // only a newly selected AED and the card showing up trigger a new fit, not the position
  }, [map, selectedAed?.feature.id, showCard, !!userLocation]);

  if (!isVisible) {
    return null;
  }

  // While the view is on, the card takes the FAB's place - it has its own close button.
  if (!isActive) {
    return (
      // Extended FAB: bottom right, in thumb reach, with the large AED icon of the map buttons. Not
      // a Button: that only has a small icon. The label introduces the button and is dropped after
      // the first interaction, then only the icon is left.
      <button
        type="button"
        title={t('emergency.toggle')}
        aria-label={isCollapsed ? t('emergency.toggle') : undefined}
        onClick={() => {
          setIsDetailOpen(false);
          onToggle();
        }}
        className={classNames(
          'absolute bottom-4 right-4 z-10 flex items-center p-1.5 cursor-pointer',
          // the primary Button's fill, so it stands out from the white map controls
          'rounded-full shadow-custom-lg shadow-green-shadow-64 text-primary-100-white',
          'bg-linear-to-r from-primary-100-green-03 to-primary-100-green-02',
          'hover:from-green-custom-02 hover:to-primary-100-green-02',
          'font-semibold leading-[150%]',
          // collapsing shrinks the pill to the round icon button
          'transition-[padding] duration-300 ease-out motion-reduce:transition-none',
          isCollapsed ? 'pe-1.5' : 'pe-5'
        )}
      >
        <img src={iconDefiWhite} alt="" className="size-12 shrink-0 p-2" />
        {/* stays in the DOM, so it can slide shut instead of disappearing at once */}
        <span
          aria-hidden={isCollapsed}
          className={classNames(
            'overflow-hidden whitespace-nowrap',
            'transition-[max-width,opacity,margin] duration-300 ease-out motion-reduce:transition-none',
            isCollapsed ? 'max-w-0 opacity-0 ms-0' : 'max-w-48 opacity-100 ms-3'
          )}
        >
          {t('emergency.fab')}
        </span>
      </button>
    );
  }

  // the existing detail view for everything else (opening hours, operator, photo, editing)
  if (isDetailOpen && selectedAed) {
    const [lon, lat] = selectedAed.feature.geometry.coordinates;
    return (
      <DetailView
        map={map}
        feature={selectedAed.feature}
        userLocation={userLocation}
        onCenterFeature={() => map?.easeTo([lon, lat], 18)}
        onClose={() => setIsDetailOpen(false)}
        onEdit={() => onEdit(toMapEvent(map, selectedAed))}
        getDirectionsUrl={getWalkingDirectionsUrl}
        shareLink={shareLink}
        getAedUrl={getAedUrl}
        // the card already shows the tags, "Details" is for everything else
        defaultExpanded
        compact
      />
    );
  }

  const statusMap = map?.getOpeningHoursStatusMap() ?? null;
  const rankOf = (aed: NearbyAed) => bestAeds.indexOf(aed) + 1;
  const isOpen = (aed: NearbyAed) =>
    featureStatus(aed.feature.properties, statusMap) === OH_STATUS.OPEN;
  // The icon of the status Tag in a circle of its colour, without the text: a pill looks like a
  // button, and the only thing to tap in an open row is "Navigieren".
  const statusDot = (aed: NearbyAed) => (
    <span
      role="img"
      aria-label={isOpen(aed) ? t('availableNow') : t('availabilityUnknown')}
      className={classNames(
        'flex size-5 shrink-0 items-center justify-center rounded-full',
        isOpen(aed) ? 'bg-secondary-green-02' : 'bg-secondary-orange-02'
      )}
    >
      <img src={iconTimeWhite} alt="" className="size-3.5" />
    </span>
  );
  const rankBadge = (aed: NearbyAed, isSelected: boolean) => (
    <span
      className={classNames(
        'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
        isSelected
          ? 'bg-primary-100-green-03 text-primary-100-white'
          : 'bg-primary-20-green-02 text-primary-100-green-04'
      )}
    >
      {rankOf(aed)}
    </span>
  );

  // The actions of the selected AED, both clearly buttons: the way there - the one green, filled
  // element of the card - and the details (access, indoor, level, ...). In the base font size like
  // in the detail view - the card's text-sm would shrink them.
  const renderActions = (aed: NearbyAed) => {
    const [lon, lat] = aed.feature.geometry.coordinates;

    return (
      <div className="flex items-center gap-2 pt-2 pb-3 text-base">
        <a href={getWalkingDirectionsUrl(lon, lat)} target="_blank" className="flex-1">
          <Button variant="primary" icon={iconNavigationWhite} className="w-full justify-center">
            {t('navigate')}
          </Button>
        </a>
        {/* the muted button of the detail view */}
        <Button variant="secondary" className="pe-0" onClick={() => setIsDetailOpen(true)}>
          {t('details')}
        </Button>
      </div>
    );
  };

  const renderContent = () => {
    if (locationError) {
      return (
        <div className="flex items-center justify-between gap-2">
          <span>{t('emergency.locationUnavailable')}</span>
          <Button variant="secondary" onClick={onRetryLocation}>
            {t('emergency.retry')}
          </Button>
        </div>
      );
    }

    if (!userLocation || !selectedAed) {
      return <span>{userLocation ? t('emergency.none') : t('emergency.locating')}</span>;
    }

    // An accordion: the AEDs keep their place in the order of the ranking, the selected one is
    // expanded in place - choosing another one never moves a row.
    return (
      // separator lines, no frame: the open one is marked by its badge and name
      <ol className="flex flex-col divide-y divide-primary-05-green-05 border-t border-primary-05-green-05">
        {bestAeds.map(aed => {
          const isSelected = aed === selectedAed;
          return (
            <li key={aed.feature.id}>
              <button
                type="button"
                aria-expanded={isSelected}
                className={classNames(
                  'flex w-full min-h-11 gap-3 py-1.5 text-start cursor-pointer',
                  // open, the name and the status take more lines - number and distance stay on top
                  isSelected ? 'items-start' : 'items-center'
                )}
                onClick={() => onSelect(aed.feature.id)}
              >
                {rankBadge(aed, isSelected)}
                {/* open: the whole name */}
                <span
                  className={classNames(
                    'flex-1 min-w-0',
                    // a 24px line like the badge, so a one-line name sits centred next to it
                    isSelected ? 'font-semibold break-words leading-6' : 'truncate'
                  )}
                >
                  {nameOf(aed)}
                </span>
                {/* status and distance in fixed columns, the same in open and closed rows */}
                <span className="flex shrink-0 items-center gap-3">
                  {statusDot(aed)}
                  <span className="w-16 text-end text-base font-semibold">
                    {formatDistance(aed.distance)}
                  </span>
                </span>
              </button>
              {isSelected && renderActions(aed)}
            </li>
          );
        })}
      </ol>
    );
  };

  return (
    <div
      ref={cardRef}
      className={classNames(
        'absolute bottom-4 left-1/2 -translate-x-1/2 z-10 w-[calc(100%-2rem)] max-w-[768px]',
        'flex flex-col gap-3 px-4 py-3 text-sm leading-[150%]',
        'bg-primary-100-white text-primary-100-green-04 rounded-2xl shadow-custom shadow-green-shadow'
      )}
    >
      {/* the close button stays in one place, whichever AED is open */}
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold">{t('emergency.title')}</span>
        <IconButton icon={iconCloseDarkGreen} variant="white" title={t('close')} onClick={onToggle} />
      </div>
      {renderContent()}
    </div>
  );
};
