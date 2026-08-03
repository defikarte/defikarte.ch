import cn from 'classnames';
import { type HTMLInputTypeAttribute, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { isMobileAgent } from '../../../services/isMobileAgent';
import { type TooltipData } from '../../../model/app';
import { Tooltip } from '../tooltip/Tooltip';

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  type: HTMLInputTypeAttribute;
  tooltip?: TooltipData;
  error?: string;
}

export const TextField = ({ label, type, tooltip, error, ...props }: TextFieldProps) => {
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
      <input
        formNoValidate
        id={id}
        type={type}
        className={cn(
          {
            'text-base': isMobile,
          },
          'px-3 py-2.5 align-middle rounded-lg font-normal text-primary-100-black placeholder:text-primary-60-green-04 border border-primary-10-green-05 focus:outline focus:border-primary-10-green-05 focus:outline-primary-10-green-05 bg-primary-100-white peer'
        )}
        {...props}
      />
      {!error && (
        <span className="hidden ps-1 text-secondary-red-02 text-xs peer-[&:not(:placeholder-shown):invalid]:inline-block">
          {t('inputInvalid')}
        </span>
      )}
      {error && <span className="ps-1 text-secondary-red-02 text-xs">{error}</span>}
    </div>
  );
};
