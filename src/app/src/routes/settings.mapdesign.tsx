import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { SettingsPage } from '../app/layout/settings-page/SettingsPage';

export const Route = createFileRoute('/settings/mapdesign')({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();
  return (
    <SettingsPage backTo="/settings" title={t('settings.mapdesign')}>
      <div className="text-primary-100-white"></div>
    </SettingsPage>
  );
}
