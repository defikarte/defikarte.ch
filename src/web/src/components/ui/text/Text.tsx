import cn from 'classnames';

interface TextProps extends React.ParamHTMLAttributes<HTMLParagraphElement | HTMLHeadingElement> {
  size?: 'small' | 'regular' | 'medium' | 'large' | 'x-large';
  weight?: 'light' | 'regular' | 'bold';
  variant?: 'primary' | 'tint' | 'white';
  center?: boolean;
}

interface TProps extends React.ParamHTMLAttributes<HTMLParagraphElement | HTMLHeadElement> {
  size?: 'small' | 'regular' | 'medium' | 'large' | 'x-large';
}

const T = ({ size, ...props }: TProps) => {
  switch (size) {
    case 'x-large':
      return <h1 {...props}></h1>;
    case 'large':
      return <h2 {...props}></h2>;
    case 'medium':
      return <h3 {...props}></h3>;
    case 'regular':
    case 'small':
    default:
      return <p {...props}></p>;
  }
};

export const Text = ({
  children,
  className,
  size = 'small',
  weight = 'regular',
  variant = 'primary',
  center = false,
  ...props
}: TextProps) => {
  const classNames = cn(
    'max-w-full lg:max-w-[700px]',
    {
      'text-sm md:text-base': size === 'small',
      'text-base md:text-xl': size === 'regular',
      'text-[22px] md:text-[26px]': size === 'medium',
      'text-[28px] md:text-[34px]': size === 'large',
      'text-[32px] text-[44px]': size === 'x-large',
      'font-light': weight === 'light',
      'font-normal': weight === 'regular',
      'font-medium': weight === 'bold',
      'leading-[150%]': size === 'small' || size === 'regular',
      'leading-[130%]': size === 'medium' || size === 'large' || size === 'x-large',
      'text-primary-100-green-04': variant === 'primary',
      'text-primary-100-green-01': variant === 'tint',
      'text-primary-100-white': variant === 'white',
      'text-center': center,
    },
    className
  );

  return (
    <T className={classNames} {...props}>
      {children}
    </T>
  );
};
