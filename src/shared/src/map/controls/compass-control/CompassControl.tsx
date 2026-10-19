import classNames from 'classnames';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import iconCompass from '../../../assets/icons/icon-compass-dark-green.svg';
import { MapIconButton } from '../../../components/ui/map-icon-button/MapIconButton';
import { type MapInstance } from '../../map-instance/map-instance';

interface Props {
  map: MapInstance | null;
  /** Positioning of the button. */
  className?: string;
  /** 44px with a 24px icon, instead of the map button size. */
  large?: boolean;
}

/** Points north and resets the rotation on click. Only visible while the map is rotated. */
export const CompassControl = ({ map, className, large = false }: Props) => {
  const { t } = useTranslation();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [isRotated, setIsRotated] = useState(false);

  useEffect(() => {
    if (!map) {
      return;
    }

    return map.subscribeBearing(bearing => {
      // set on the element, a React render per rotate frame would be too slow
      if (buttonRef.current) {
        buttonRef.current.style.transform = `rotate(${-bearing}deg)`;
      }
      setIsRotated(bearing !== 0);
    });
  }, [map]);

  // the shadow sits on the wrapper, so it doesn't turn with the button
  return (
    <div
      className={classNames(className, 'w-fit rounded-full shadow-custom shadow-green-shadow', {
        flex: isRotated,
        hidden: !isRotated,
      })}
    >
      <MapIconButton
        ref={buttonRef}
        title={t('resetNorth')}
        aria-label={t('resetNorth')}
        active={false}
        icon={iconCompass}
        onClick={() => map?.resetNorth()}
        // `!` because MapIconButton sizes the icon with size-max
        className={large ? 'size-6! p-2.5' : 'not-md:p-2'}
      />
    </div>
  );
};
