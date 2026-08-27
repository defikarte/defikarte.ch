import classNames from 'classnames';
import iconCheckGreen from '../../../assets/icons/icon-check-green.svg';

interface SettingsOptionProps extends React.PropsWithChildren {
  selected: boolean;
  onSelect: () => void;
  /** Optional leading visual, e.g. the map preview thumbnail on the map design screen. */
  leading?: React.ReactNode;
}

export const SettingsOption = ({ children, leading, onSelect, selected }: SettingsOptionProps) => {
  const cn = classNames(
    'w-full',
    'flex',
    'items-center',
    'gap-5',
    'border',
    'bg-primary-10-white',
    'text-primary-100-white',
    'text-base',
    'font-medium',
    'text-start',
    'p-5',
    'rounded-xl',
    'active:bg-primary-20-green-01',
    selected ? 'border-primary-100-green-01' : 'border-primary-20-white'
  );
  return (
    <button type="button" role="radio" aria-checked={selected} onClick={onSelect} className={cn}>
      <span className="flex flex-1 items-center gap-4">
        {leading}
        <span className="flex-1">{children}</span>
      </span>
      {selected && <img src={iconCheckGreen} alt="" className="size-6 shrink-0" />}
    </button>
  );
};
