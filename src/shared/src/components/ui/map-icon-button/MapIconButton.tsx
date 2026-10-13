import classNames from 'classnames';
import type { ButtonHTMLAttributes } from 'react';

interface MapIconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active: boolean;
  icon: string;
  variant?: 'default' | 'gps-on' | 'gps-off';
}

export const MapIconButton = ({
  ref,
  active,
  icon,
  variant = 'default',
  className,
  ...props
}: MapIconButtonProps & { ref?: React.RefObject<HTMLButtonElement | null> }) => {
  const buttonClass = classNames('size-max');
  const imgClass = classNames(
    className,
    'p-1',
    'rounded-full',
    'box-content',
    'size-max',
    'cursor-pointer',
    {
      'hover:bg-green-custom': !active,
      'bg-primary-100-white': !active && variant === 'default',
      'bg-secondary-green-01': active,
      'border-2': variant === 'gps-off' || variant === 'gps-on',
      'md:border-4': variant === 'gps-off' || variant === 'gps-on',
      'border-transparent': variant === 'gps-off' || variant === 'gps-on',
      'bg-primary-20-green-02': variant === 'gps-on',
    }
  );

  return (
    <button {...props} className={buttonClass} ref={ref}>
      <img src={icon} alt="map-icon" className={imgClass} />
    </button>
  );
};
