import { type FC } from 'react';

interface ItemPropertyProps {
  icon: string;
  title: string;
  value: string | number;
}

export const ItemProperty: FC<ItemPropertyProps> = ({ icon, title, value }) => {
  return (
    <div className="flex items-start gap-2">
      <img src={icon} />
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-semibold text-primary-100-green-04 leading-[150%]">{title}</h4>
        <p className="text-xs font-normal text-primary-100-green-04 leading-[150%] break-words">
          {value}
        </p>
      </div>
    </div>
  );
};
