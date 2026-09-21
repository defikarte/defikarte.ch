import className from 'classnames';
import React, { type ParamHTMLAttributes } from 'react';

interface TagProps extends ParamHTMLAttributes<HTMLElement> {
  icon: string;
  variant?: 'primary' | 'tint' | 'secondary' | 'orange';
  children: React.ReactNode;
}

export const Tag: React.FC<TagProps> = React.memo(({ children, icon, variant = 'tint', ...props }) => {
  const pClass = className(
    'flex',
    'items-center',
    'justify-center',
    'text-center',
    'gap-1',
    'py-0.5',
    'ps-1.5',
    'pe-2',
    'rounded-2xl',
    'box-content',
    'size-max',
    'font-normal',
    'text-xs',
    'leading-[150%]',
    'cursor-default',
    {
      'bg-primary-100-green-02': variant === 'primary',
      'text-primary-100-white': variant === 'primary' || variant === 'orange',
      'bg-primary-20-green-02': variant === 'tint',
      'text-primary-100-green-04': variant === 'tint',
      'bg-graustufen-grau-disabled': variant === 'secondary',
      'text-graustufen-grau-d': variant === 'secondary',
      'bg-secondary-orange-03': variant === 'orange',
    }
  );

  return (
    <p className={pClass} {...props}>
      <img src={icon} alt="map-icon" className="inline-block w-4 h-4" />
      {children}
    </p>
  );
});
