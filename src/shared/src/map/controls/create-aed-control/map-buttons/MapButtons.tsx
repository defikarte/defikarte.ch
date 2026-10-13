import cn from 'classnames';
import { useTranslation } from 'react-i18next';
import iconCheckWhite from '../../../../assets/icons/icon-check-white.svg';
import iconCloseDarkGreen from '../../../../assets/icons/icon-close-dark-green.svg';
import iconCloseMiddleGreen from '../../../../assets/icons/icon-close-middle-green.svg';
import iconEditWhite from '../../../../assets/icons/icon-edit-white.svg';
import { Button } from '../../../../components/ui/button/Button';
import { CreateMode } from '../../../../model/map';

interface MapButtonProps {
  createMode: CreateMode;
  handleCancel: () => void;
  handleConfirmPosition: () => void;
  handleChangePosition: () => void;
  compact?: boolean;
}

export const MapButtons = ({
  createMode,
  handleCancel,
  handleConfirmPosition,
  handleChangePosition,
  compact,
}: MapButtonProps) => {
  const { t } = useTranslation();
  // In compact mode the phone layout is forced, so the labelled desktop buttons never show.
  const responsive = !compact;

  const buttonContainerClass = cn(
    'absolute',
    'bottom-5',
    'z-10',
    'w-full',
    'flex',
    'flex-row',
    'items-end',
    'h-0',
    'justify-center',
    responsive && 'md:bottom-6',
    {
      'lg:justify-start lg:ps-6': responsive && createMode === CreateMode.form,
    }
  );

  const iconOnlyClass = cn('p-2', { 'md:hidden': responsive });
  const labelledClass = cn('hidden', { 'md:flex': responsive });

  return (
    <>
      <div className={buttonContainerClass}>
        <div className="flex-row justify-center items-end gap-2 flex">
          {createMode === CreateMode.position && (
            <>
              <Button
                variant="primary"
                size="large"
                icon={iconCheckWhite}
                onClick={handleConfirmPosition}
                iconOnly
                className={iconOnlyClass}
              />
              <Button
                variant="primary"
                size="large"
                icon={iconCheckWhite}
                onClick={handleConfirmPosition}
                className={labelledClass}
              >
                {t('confirmPosition')}
              </Button>
            </>
          )}
          {createMode === CreateMode.form && (
            <>
              <Button
                variant="primary"
                size="large"
                icon={iconEditWhite}
                onClick={handleChangePosition}
                iconOnly
                className={iconOnlyClass}
              />
              <Button
                variant="primary"
                size="large"
                icon={iconEditWhite}
                onClick={handleChangePosition}
                className={labelledClass}
              >
                {t('changePosition')}
              </Button>
            </>
          )}
          <Button
            variant="white"
            size="large"
            icon={iconCloseMiddleGreen}
            iconHover={iconCloseDarkGreen}
            onClick={handleCancel}
            iconOnly
            className={cn('shadow-custom shadow-green-shadow', iconOnlyClass)}
          />
          <Button
            variant="white"
            size="large"
            icon={iconCloseMiddleGreen}
            iconHover={iconCloseDarkGreen}
            onClick={handleCancel}
            className={cn('shadow-custom shadow-green-shadow', labelledClass)}
          >
            {t('cancel')}
          </Button>
        </div>
      </div>
    </>
  );
};
