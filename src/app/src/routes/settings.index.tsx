import { createFileRoute, Link } from '@tanstack/react-router';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { SettingsPage } from '../app/layout/settings-page/SettingsPage';
import iconArrowRightGreen from '../assets/icons/icon-arrow-right-green.svg';
import iconGlobeWhite from '../assets/icons/icon-globe-white.svg';
import iconLayersWhite from '../assets/icons/icon-layers-white.svg';

export const Route = createFileRoute('/settings/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();
  return (
    <SettingsPage title={t('settings.settings')}>
      <SettingsLink to="/settings/language" icon={iconGlobeWhite}>
        {t('settings.language')}
      </SettingsLink>
      <SettingsLink to="/settings/mapdesign" icon={iconLayersWhite}>
        {t('settings.mapdesign')}
      </SettingsLink>
    </SettingsPage>
  );
}

interface SettingsButtonProps extends React.PropsWithChildren {
  icon: string;
  to: string;
}

const SettingsLink = ({ children, icon, to }: SettingsButtonProps) => {
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
    <Link to={to} className={cn}>
      <div className="gap-4 flex items-center">
        <img src={icon} alt="map-icon" className="h-6" />
        {children}
      </div>
      <img src={iconArrowRightGreen} alt="map-icon" className="h-6" />
    </Link>
  );
};
