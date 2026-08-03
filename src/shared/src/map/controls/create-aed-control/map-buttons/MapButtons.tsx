import { Button, CreateMode } from '@defikarte/shared';
import cn from 'classnames';
import { useTranslation } from 'react-i18next';
import iconCheckWhite from '../../../../../assets/icons/icon-check-white.svg';
import iconCloseDarkGreen from '../../../../../assets/icons/icon-close-dark-green.svg';
import iconCloseMiddleGreen from '../../../../../assets/icons/icon-close-middle-green.svg';
import iconEditWhite from '../../../../../assets/icons/icon-edit-white.svg';

interface MapButtonProps {
  createMode: CreateMode;
  handleCancel: () => void;
  handleConfirmPosition: () => void;
  handleChangePosition: () => void;
}

export const MapButtons = ({
  createMode,
  handleCancel,
  handleConfirmPosition,
  handleChangePosition,
}: MapButtonProps) => {
  const { t } = useTranslation();

  const buttonContainerClass = cn(
    'absolute',
    'bottom-5',
    'md:bottom-6',
    'z-10',
    'w-full',
    'flex',
    'flex-row',
    'items-end',
    'h-0',
    {
      'justify-center': createMode === CreateMode.position,
      'justify-center lg:justify-start lg:ps-6': createMode === CreateMode.form,
    }
  );

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
                className="md:hidden p-2"
              />
              <Button
                variant="primary"
                size="large"
                icon={iconCheckWhite}
                onClick={handleConfirmPosition}
                className="hidden md:flex"
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
                className="md:hidden p-2"
              />
              <Button
                variant="primary"
                size="large"
                icon={iconEditWhite}
                onClick={handleChangePosition}
                className="hidden md:flex"
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
            className="md:hidden shadow-custom shadow-green-shadow p-2"
          />
          <Button
            variant="white"
            size="large"
            icon={iconCloseMiddleGreen}
            iconHover={iconCloseDarkGreen}
            onClick={handleCancel}
            className="hidden md:flex shadow-custom shadow-green-shadow"
          >
            {t('cancel')}
          </Button>
        </div>
      </div>
    </>
  );
};
