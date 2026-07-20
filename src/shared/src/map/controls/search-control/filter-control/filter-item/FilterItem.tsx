import { useMemo } from 'react';

interface Props {
  checked: boolean;
  label: string;
  icon: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const FilterItem = ({ checked, label, icon, onChange }: Props) => {
  const id = useMemo(() => Math.random().toString(36).substring(7), []);

  return (
    <label
      htmlFor={id}
      className="bg-primary-100-white flex items-center first:pt-4 last:pb-4 last:rounded-b-[24px] last:md:rounded-b-[32px] py-2 px-5 hover:bg-green-custom cursor-pointer"
    >
      <input
        id={id}
        type="checkbox"
        className="accent-primary-100-green-03 cursor-pointer"
        checked={checked}
        onChange={e => onChange(e)}
      />
      <img src={icon} alt={label} className="ms-4 me-2" />
      <p className="leading-6 text-sm">{label}</p>
    </label>
  );
};
