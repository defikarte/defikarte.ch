import classNames from 'classnames';
import { type ButtonHTMLAttributes } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string;
  variant?: 'tint' | 'secondary' | 'white' | 'white-transparent';
  size?: 'regular' | 'large';
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  variant = 'tint',
  size = 'regular',
  className,
  ...props
}) => {
  const imgClass = classNames('rounded-full', 'box-content', 'size-max', 'cursor-pointer', {
    'p-1': size === 'regular',
    'p-2': size === 'large',
    'bg-primary-20-green-02': variant === 'tint',
    'hover:bg-primary-40-green-02': variant === 'tint',
    'bg-green-custom': variant === 'secondary',
    'hover:bg-graustufen-grau-a': variant === 'secondary',
    'bg-primary-100-white': variant === 'white' || variant === 'white-transparent',
    'hover:bg-green-custom': variant === 'white',
    'hover:bg-primary-75-white': variant === 'white-transparent',
  });

  return (
    <button className={className} {...props}>
      <img src={icon} alt="map-icon" className={imgClass} />
    </button>
  );
};
