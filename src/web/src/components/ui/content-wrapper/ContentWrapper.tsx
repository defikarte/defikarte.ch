import cn from 'classnames';

interface ContentWrapperProps extends React.BaseHTMLAttributes<HTMLDivElement> {
  variant?: 'white' | 'beige' | 'green-gradient' | 'green';
  paddingY?: 'small' | 'regular' | 'large';
}

export const ContentWrapper = ({ ref, children, className, variant = 'white', paddingY = 'regular', ...props }: ContentWrapperProps & { ref?: React.RefObject<HTMLDivElement | null> }) => {
    const containerClasses = cn('w-[100%]', 'flex', 'justify-center', 'items-center', {
      'bg-primary-100-white': variant === 'white',
      'bg-beige': variant === 'beige',
      'bg-gradient-to-b from-[#154430] to-[#659552]': variant === 'green-gradient',
      'bg-primary-100-green-04': variant === 'green',
    });

    const contentClasses = cn(
      'flex',
      'justify-center',
      'items-center',
      'px-4',
      'md:px-0',
      'w-full',
      'md:w-[700px]',
      'lg:w-[800px]',
      'xl:w-[1000px]',
      {
        'py-12 md:py-20': paddingY === 'small',
        'py-16 md:py-28': paddingY === 'regular',
        'py-16 md:py-32': paddingY === 'large',
      },
      className
    );

    return (
      <div className={containerClasses} {...props} ref={ref}>
        <div className={contentClasses}>{children}</div>
      </div>
    );
  };
