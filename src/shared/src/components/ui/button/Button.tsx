import classNames from 'classnames';
import React, { useState } from 'react';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'white';
  size?: 'regular' | 'large';
  icon?: string;
  iconHover?: string;
  iconOnly?: boolean;
}

export const Button = React.memo(({
  variant = 'primary',
  size = 'regular',
  icon,
  iconHover,
  children,
  iconOnly,
  className,
  ...props
}: Props) => {
  const [isHovered, setIsHovered] = useState(false);
  iconHover = iconHover ?? icon;

  const buttonClass = classNames(
    className,
    'flex',
    'gap-2',
    'items-center',
    'cursor-pointer',
    'disabled:opacity-50',
    {
      'bg-linear-to-r from-primary-100-green-03 to-primary-100-green-02 text-primary-100-white':
        variant === 'primary',
      'hover:[&:not(:disabled)]:bg-linear-to-r hover:[&:not(:disabled)]:from-green-custom-02 hover:[&:not(:disabled)]:to-primary-100-green-02':
        variant === 'primary',
      'bg-primary-100-white text-primary-100-green-03':
        variant === 'white' || variant === 'secondary',
      'hover:[&:not(:disabled)]:text-primary-100-green-04': variant === 'white',
      'ps-2 md:ps-3 pe-3 md:pe-4 py-1.5 md:py-2': size === 'regular' && !iconOnly,
      'ps-4 pe-5 py-3': size === 'large' && !iconOnly,
      'rounded-[theme(space.10)]': !iconOnly,
      'p-1.5 rounded-4xl': iconOnly,
    }
  );

  const iconClass = classNames({
    'w-4 h-4': size === 'regular',
    'w-5 h-5': size === 'large',
    'color-primary-100-white': variant === 'primary',
    'hover:[&:not(:disabled)]:color-primary-100-green-04': variant === 'primary', // Added hover effect
    'color-primary-100-green-03': variant === 'secondary',
  });

  const textClass = classNames('leading-[150%]', 'text-center', 'w-full', {
    'font-semibold': variant === 'primary' || variant === 'white',
    'font-normal': variant === 'secondary',
    hidden: iconOnly,
  });

  return (
    <button
      className={buttonClass}
      {...props}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {icon && <img src={isHovered ? iconHover : icon} alt="icon" className={iconClass} />}
      <span className={textClass}>{children}</span>
    </button>
  );
});
