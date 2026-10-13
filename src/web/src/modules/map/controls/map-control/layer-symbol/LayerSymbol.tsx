import classNames from 'classnames';
import { type ButtonHTMLAttributes } from 'react';

interface LayerSymbolProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active: boolean;
  img: string;
  label: string;
}

export const LayerSymbol = ({ active, img, label, ...props }: LayerSymbolProps) => {
  const buttonClasses = classNames(
    'p-2',
    'pb-1.5',
    'bg-primary-100-white',
    'rounded-xl',
    'shadow-primary-20-green-04',
    'shadow-custom',
    'flex',
    'flex-col',
    'items-center',
    'gap-0.5',
    'box-border',
    'w-[73px]',
    'h-[78px]',
    'cursor-pointer',
    {
      'border-2 border-primary-100-green-02': active,
    }
  );

  return (
    <button className={buttonClasses} {...props}>
      <img className="w-[54px] h-[41px] relative rounded-lg" src={img} alt={label} />
      <span className="text-primary-100-green-04 text-[9px] m-auto leading-tight">{label}</span>
    </button>
  );
};
