import cn from 'classnames';
import { type HTMLInputTypeAttribute, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { type TooltipData } from '../../../model/common';
import { isMobileAgent } from '../../../services/user-agent.service';
import { Tooltip } from '../tooltip/Tooltip';

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  type: HTMLInputTypeAttribute;
  tooltip?: TooltipData;
  error?: string;
  // a note that does not block the form, e.g. about redundant data
  hint?: string;
}

export const TextField = ({ label, type, tooltip, error, hint, ...props }: TextFieldProps) => {
  const { t } = useTranslation();
  const id = useId();
  const noteId = `${id}-note`;
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
        aria-invalid={!!error}
        aria-describedby={error || hint ? noteId : undefined}
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
      {error && (
        <span id={noteId} className="ps-1 text-secondary-red-02 text-xs">
          {error}
        </span>
      )}
      {hint && !error && (
        <span id={noteId} className="ps-1 text-primary-100-green-04 text-xs">
          {hint}
        </span>
      )}
    </div>
  );
};
