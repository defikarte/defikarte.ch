import cn from 'classnames';
import { type Feature, type Point } from 'geojson';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from 'react-responsive';
import iconAccessDarkGreen from '../../../assets/icons/icon-access-dark-green.svg';
import iconAccessGrey from '../../../assets/icons/icon-access-grey.svg';
import iconCloseDarkGreen from '../../../assets/icons/icon-close-dark-green.svg';
import iconEditDarkGreen from '../../../assets/icons/icon-edit-dark-green.svg';
import iconHouseDarkGreen from '../../../assets/icons/icon-house-dark-green.svg';
import iconHouseGrey from '../../../assets/icons/icon-house-grey.svg';
import iconNavigationDarkGreen from '../../../assets/icons/icon-navigation-dark-green.svg';
import iconNavigationGrey from '../../../assets/icons/icon-navigation-grey.svg';
import iconNavigationWhite from '../../../assets/icons/icon-navigation-white.svg';
import iconTimeWhite from '../../../assets/icons/icon-time-white.svg';
import { Button } from '../../../components/ui/button/Button';
import { IconButton } from '../../../components/ui/icon-button/IconButton';
import { Tag } from '../../../components/ui/tag/Tag';
import { distanceBetweenPoints } from '../../../services/coordinate-calculation.service';
import { isOpenNow } from '../../../services/opening-hours.service';
import { FeaturePropsList } from './property-list/FeaturePropsList';

const GOOGLE_MAPS_DIRECTIONS_URL = 'https://www.google.com/maps/dir/?api=1';

const generateGoogleMapsWalkingLink = (lon: number, lat: number): string => {
  const endCoordinates = encodeURIComponent(`${lat},${lon}`);
  const directionUrl = `${GOOGLE_MAPS_DIRECTIONS_URL}&travelmode=walking&destination=${endCoordinates}`;
  return directionUrl;
};

interface DetailViewProps {
  feature: Feature | null;
  userLocation: GeolocationPosition | null;
  onCenterFeature: () => void;
  onClose: () => void;
  onEdit: () => void;
}

export const DetailView = ({
  feature,
  userLocation,
  onCenterFeature,
  onClose,
  onEdit,
}: DetailViewProps) => {
  const { t } = useTranslation();
  const isMobile = useMediaQuery({ maxWidth: 768 });
  const [propsVisible, setPropsVisible] = useState(false);

  const props = feature?.properties ?? {};
  const coords = (feature?.geometry as Point)?.coordinates;

  // Memoize expensive opening hours check
  const isOpen = useMemo(() => isOpenNow(props.opening_hours as string), [props.opening_hours]);

  // Memoize distance calculation
  const distance = useMemo(
    () =>
      userLocation && coords
        ? distanceBetweenPoints(
            {
              lat: userLocation.coords.latitude,
              lon: userLocation.coords.longitude,
            },
            {
              lon: coords[0],
              lat: coords[1],
            }
          )
        : null,
    [userLocation, coords]
  );

  if (!feature?.properties) {
    return null;
  }

  const isOutdoor = props.indoor === 'no';
  const isAccess = props.access === 'yes';

  const isSmallerThan1000 = distance && distance < 1000;
  const distanceText =
    distance &&
    t('distanceAway', {
      distance: isSmallerThan1000 ? distance.toFixed(0) : (distance / 1000).toFixed(1),
      unit: isSmallerThan1000 ? 'm' : 'km',
    });
  const name =
    (props['defibrillator:location'] as string) ?? props.description ?? props.operator ?? 'n/A';

  const hasTags =
    (isOpen || (props.opening_hours !== undefined && !isOpen)) ??
    distance ??
    props.access ??
    props.indoor;
  const directionsUrl = generateGoogleMapsWalkingLink(coords[0], coords[1]);
  const containerClass = cn(
    'z-10',
    'absolute',
    'flex',
    'flex-col',
    'items-start',
    'bottom-4',
    'top-auto',
    'md:bottom-16',
    'md:right-6',
    'mx-4',
    'md:mx-0',
    'inset-x-0',
    'inset-y-0',
    'md:inset-auto',
    'md:w-[304px]',
    'md:h-[500px]',
    'xl:h-[576px]',
    'max-h-[calc(100vh-143px)]',
    'md:max-h-[calc(100vh-215px)]',
    'lg:max-h-[calc(100vh-227px)]',
    'bg-primary-100-white',
    'rounded-2xl',
    'shadow-lg',
    'shadow-green-shadow-64'
  );
  return (
    <div className={containerClass}>
      <div
        className="px-4 py-3 flex justify-between w-full items-start border-b border-primary-05-green-05 cursor-pointer"
        onClick={() => onCenterFeature()}
      >
        <p className="text-wrap text-sm font-normal leading-[150%] text-primary-100-green-04 w-full md:w-60 break-words self-center">
          {name}
        </p>
        <IconButton
          icon={iconCloseDarkGreen}
          variant="white"
          title={t('close')}
          onClick={e => {
            setPropsVisible(false);
            onClose();
            e.stopPropagation();
          }}
        />
      </div>
      <div
        className={cn('px-4 py-4 overflow-auto gap-6 flex flex-col w-full grow-1', {
          'border-b border-primary-05-green-05': (propsVisible && isMobile) || !isMobile,
        })}
      >
        {hasTags && (
          <div className="flex flex-wrap items-start justify-start gap-1.5">
            {isOpen && (
              <Tag variant="primary" icon={iconTimeWhite}>
                {t('open')}
              </Tag>
            )}
            {props.opening_hours !== undefined && !isOpen && (
              <Tag variant="orange" icon={iconTimeWhite}>
                {t('closed')}
              </Tag>
            )}
            {distance && (
              <Tag
                variant={isOpen ? 'tint' : 'secondary'}
                icon={isOpen ? iconNavigationDarkGreen : iconNavigationGrey}
              >
                {distanceText}
              </Tag>
            )}
            {props.access && (
              <Tag
                variant={isOpen ? 'tint' : 'secondary'}
                icon={isOpen ? iconAccessDarkGreen : iconAccessGrey}
              >
                {isAccess ? t('public') : t('private')}
              </Tag>
            )}
            {props.indoor && (
              <Tag
                variant={isOpen ? 'tint' : 'secondary'}
                icon={isOpen ? iconHouseDarkGreen : iconHouseGrey}
              >
                {isOutdoor ? t('outdoor') : t('indoor')}
              </Tag>
            )}
          </div>
        )}
        <FeaturePropsList
          feature={feature}
          isOpen={isOpen}
          className={cn({ hidden: !propsVisible, 'md:flex': !propsVisible })}
        />
        <IconButton
          title={t('edit')}
          icon={iconEditDarkGreen}
          variant={isOpen ? 'tint' : 'secondary'}
          onClick={onEdit}
          className={cn('md:hidden', 'w-full', 'flex', 'justify-end', 'items-end', 'pt-1', {
            hidden: !propsVisible,
            'md:flex': !propsVisible,
          })}
        />
      </div>
      <div className="py-3 2xl:py-4 px-4 flex-shrink flex w-full items-end">
        <div className="flex justify-between items-center w-full flex-row-reverse h-10">
          <IconButton
            title={t('edit')}
            icon={iconEditDarkGreen}
            variant={isOpen ? 'tint' : 'secondary'}
            className="hidden md:visible md:flex"
            onClick={onEdit}
          />
          <Button
            className="md:hidden not-md:pe-0"
            variant="secondary"
            onClick={() => setPropsVisible(s => !s)}
          >
            {propsVisible ? t('hide') : t('details')}
          </Button>
          {isOpen && (
            <a href={directionsUrl} target="_blank">
              <Button variant="primary" icon={iconNavigationWhite}>
                {t('navigate')}
              </Button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
