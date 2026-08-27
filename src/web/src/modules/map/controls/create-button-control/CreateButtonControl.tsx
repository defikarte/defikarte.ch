import { useTranslation } from 'react-i18next';
import iconPlusWhite from '../../../../assets/icons/icon-plus-white.svg';
import { Button } from '@defikarte/shared';

interface CreateButtonControlProps {
  onCreateStart: () => void;
}

export const CreateButtonControl = ({ onCreateStart }: CreateButtonControlProps) => {
  const { t } = useTranslation();
  return (
    <div className="absolute flex flex-col z-10 bottom-5 md:bottom-6 left-4 md:left-6">
      <Button variant="primary" size="large" icon={iconPlusWhite} onClick={() => onCreateStart()}>
        {t('create')}
      </Button>
    </div>
  );
};
