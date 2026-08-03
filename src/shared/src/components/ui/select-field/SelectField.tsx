import cn from 'classnames';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { isMobileAgent } from '../../../services/isMobileAgent';
import { type TooltipData } from '../../../model/app';
import { Tooltip } from '../tooltip/Tooltip';

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: string[];
  tooltip?: TooltipData;
  error?: string;
}

export const SelectField = ({ label, tooltip, error, ...props }: SelectFieldProps) => {
  const { t } = useTranslation();
  const id = useId();
  const isMobile = isMobileAgent();

  return (
    <div className="flex flex-col gap-1.5 text-xs leading-[150%]">
      <div className="flex flex-row gap-0.5 align-middle">
        <label htmlFor={id} className="font-semibold text-primary-100-green-04">
          {label} {props.required ? <span className="text-secondary-red-02">*</span> : ''}
        </label>
        <Tooltip tooltip={tooltip} />
      </div>
      <select
        id={id}
        className={cn(
          {
            'text-base': isMobile,
          },
          'block appearance-none ps-3 pe-4 py-2.5 font-normal *:font-normal *:text-primary-60-green-04 text-primary-100-black rounded-lg border border-primary-10-green-05 bg-primary-100-white focus:outline focus:border-primary-10-green-05 focus:outline-primary-10-green-05'
        )}
        {...props}
      >
        <option value=""></option>
        {props.options.map(option => (
          <option key={option} value={option}>
            {t(option)}
          </option>
        ))}
      </select>
      {error && <span className="ps-1 text-secondary-red-02 text-xs">{error}</span>}
    </div>
  );
};
