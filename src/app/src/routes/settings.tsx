import { createFileRoute } from '@tanstack/react-router';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import iconArrowRightGreen from '../assets/icons/icon-arrow-right-green.svg';
import iconGlobeWhite from '../assets/icons/icon-globe-white.svg';
import iconLayersWhite from '../assets/icons/icon-layers-white.svg';

export const Route = createFileRoute('/settings')({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();
  return (
    <div className="h-full flex gap-2 flex-col px-4 pt-16 bg-linear-to-b from-primary-100-green-04 to-[#487745]">
      <h1 className="text-center text-2xl font-medium mb-9 text-primary-100-green-01">
        {t('settings.settings')}
      </h1>
      <SettingsButton icon={iconGlobeWhite}>{t('settings.language')}</SettingsButton>
      <SettingsButton icon={iconLayersWhite}>{t('settings.mapdesign')}</SettingsButton>
    </div>
  );
}

interface SettingsButtonProps extends React.PropsWithChildren {
  onClick?: () => void;
  icon: string;
}

const SettingsButton = ({ children, icon, onClick }: SettingsButtonProps) => {
  const cn = classNames(
    'justify-between',
    'border',
    'border-primary-20-white',
    'bg-primary-10-white',
    'text-primary-100-white',
    'font-medium',
    'p-5',
    'rounded-xl',
    'flex',
    'items-center',
    'mb-3',
    'active:bg-primary-20-green-01'
  );
  return (
    <button className={cn} onClick={onClick}>
      <div className="gap-4 flex items-center">
        <img src={icon} alt="map-icon" className="h-6" />
        {children}
      </div>
      <img src={iconArrowRightGreen} alt="map-icon" className="h-6" />
    </button>
  );
};
