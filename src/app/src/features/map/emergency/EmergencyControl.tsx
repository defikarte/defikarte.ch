import {
  Button,
  featureStatus,
  getActiveAedOverlay,
  IconButton,
  type MapEvent,
  type MapInstance,
  type NearbyAed,
  OH_STATUS,
  Tag,
  useBestAeds,
} from '@defikarte/shared';
import classNames from 'classnames';
import { type LngLatBoundsLike, type MapGeoJSONFeature } from 'maplibre-gl';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import iconCloseDarkGreen from '../../../assets/icons/icon-close-dark-green.svg';
import iconDefiCircleOrange from '../../../assets/icons/icon-defi-circle-orange.svg';
import iconNavigationDarkGreen from '../../../assets/icons/icon-navigation-dark-green.svg';
import iconTimeWhite from '../../../assets/icons/icon-time-white.svg';
import { getWalkingDirectionsUrl } from '../../../services/navigation.service';

interface EmergencyControlProps {
  map: MapInstance | null;
  isActive: boolean;
  onToggle: () => void;
  userLocation: GeolocationPosition | null;
  locationError: string | null;
  onRetryLocation: () => void;
  onFeatureSelect: (event: MapEvent) => void;
  // false while the detail view of an AED covers the bottom of the map - hides the FAB and list
  showList: boolean;
}

/**
 * The emergency view: a map button that highlights the best AEDs around the user, and a list of
 * them at the bottom with a walking route to each in the platform's maps app.
 */
export const EmergencyControl = ({
  map,
  isActive,
  onToggle,
  userLocation,
  locationError,
  onRetryLocation,
  onFeatureSelect,
  showList,
}: EmergencyControlProps) => {
  const { t } = useTranslation();
  const listRef = useRef<HTMLDivElement | null>(null);
  const { bestAeds } = useBestAeds({ map, isActive, userLocation });

  // Fits the user and the AEDs once per new set of AEDs, and again when the list comes back after
  // the detail view of one of them (which zoomed in on it) was closed. Not on every GPS tick, so
  // the map doesn't jump while the user walks or pans.
  const bestAedIds = bestAeds.map(({ feature }) => feature.id).join(',');
  const lat = userLocation?.coords.latitude;
  const lon = userLocation?.coords.longitude;
  useEffect(() => {
    if (!map || !showList || !bestAedIds || lat === undefined || lon === undefined) return;

    const points = [[lon, lat], ...bestAeds.map(({ feature }) => feature.geometry.coordinates)];
    const bounds: LngLatBoundsLike = [
      [Math.min(...points.map(p => p[0])), Math.min(...points.map(p => p[1]))],
      [Math.max(...points.map(p => p[0])), Math.max(...points.map(p => p[1]))],
    ];
    // keeps the AEDs clear of the search bar at the top and the list at the bottom
    const bottom = (listRef.current?.offsetHeight ?? 0) + 40;
    map.fitBounds(bounds, { top: 120, bottom, left: 40, right: 40 });
    // only the set of AEDs and the list showing up trigger a new fit, not the position
  }, [map, bestAedIds, showList]);

  const onSelect = ({ feature }: NearbyAed) => {
    const mapGeoJSONFeature = {
      geometry: feature.geometry,
      properties: feature.properties,
      id: feature.id,
      type: feature.type,
      source: getActiveAedOverlay(map),
    } as MapGeoJSONFeature;

    onFeatureSelect({
      source: mapGeoJSONFeature.source,
      data: mapGeoJSONFeature,
      type: 'item-select',
    });
  };

  const formatDistance = (distance: number) =>
    distance < 1000
      ? t('distanceAway', { distance: distance.toFixed(0), unit: 'm' })
      : t('distanceAway', { distance: (distance / 1000).toFixed(1), unit: 'km' });

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

    if (!userLocation) {
      return <span>{t('emergency.locating')}</span>;
    }

    if (bestAeds.length === 0) {
      return <span>{t('emergency.none')}</span>;
    }

    const statusMap = map?.getOpeningHoursStatusMap() ?? null;
    return (
      // capped so the list never covers most of a small screen, the rest scrolls
      <ol className="flex flex-col max-h-[35vh] overflow-y-auto">
        {bestAeds.map((aed, index) => {
          const props = aed.feature.properties ?? {};
          const [aedLon, aedLat] = aed.feature.geometry.coordinates;
          const isOpen = featureStatus(props, statusMap) === OH_STATUS.OPEN;
          const name =
            (props['defibrillator:location'] as string | undefined) ??
            (props.description as string | undefined) ??
            (props.operator as string | undefined) ??
            'n/A';

          return (
            <li
              key={aed.feature.id}
              className="flex items-center gap-3 py-2 border-b border-primary-05-green-05 last:border-b-0"
            >
              <button
                type="button"
                className="flex flex-1 min-w-0 items-center gap-3 text-start cursor-pointer"
                onClick={() => onSelect(aed)}
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-20-green-02 text-xs font-semibold">
                  {index + 1}
                </span>
                <span className="flex flex-col min-w-0 gap-1">
                  <span className="truncate">{name}</span>
                  <span className="flex items-center gap-2 text-xs">
                    <Tag variant={isOpen ? 'green' : 'orange'} icon={iconTimeWhite}>
                      {isOpen ? t('open') : t('unknown')}
                    </Tag>
                    {formatDistance(aed.distance)}
                  </span>
                </span>
              </button>
              <a
                href={getWalkingDirectionsUrl(aedLon, aedLat)}
                target="_blank"
                aria-label={t('emergency.navigate')}
                title={t('emergency.navigate')}
              >
                <IconButton icon={iconNavigationDarkGreen} variant="tint" size="large" tabIndex={-1} />
              </a>
            </li>
          );
        })}
      </ol>
    );
  };

  // the detail view takes the bottom of the map, the FAB and the list make room for it
  if (!showList) {
    return null;
  }

  // While the view is on, the list takes the FAB's place - it has its own close button.
  if (!isActive) {
    return (
      // Extended FAB: bottom right, in thumb reach. The label is recognised at a glance, the large
      // orange AED icon (as on the map buttons) makes it stand out from the green controls. Not a
      // Button: that puts a small icon before the text, here the icon sits large at the thumb side.
      <button
        type="button"
        title={t('emergency.toggle')}
        onClick={onToggle}
        className={classNames(
          'absolute bottom-4 right-4 z-10 flex items-center gap-3 ps-5 pe-1.5 py-1.5 cursor-pointer',
          'rounded-full bg-primary-100-white shadow-custom-lg shadow-green-shadow-64',
          'font-semibold leading-[150%] text-primary-100-green-03 hover:text-primary-100-green-04'
        )}
      >
        {t('emergency.fab')}
        <img src={iconDefiCircleOrange} alt="" className="size-12" />
      </button>
    );
  }

  return (
    <div
      ref={listRef}
      className={classNames(
        'absolute bottom-4 left-1/2 -translate-x-1/2 z-10 w-[calc(100%-2rem)] max-w-[768px]',
        'flex flex-col gap-2 px-4 py-3 text-sm leading-[150%]',
        'bg-primary-100-white text-primary-100-green-04 rounded-2xl shadow-custom shadow-green-shadow'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold">{t('emergency.title')}</span>
        <IconButton icon={iconCloseDarkGreen} variant="white" title={t('close')} onClick={onToggle} />
      </div>
      {renderContent()}
    </div>
  );
};
