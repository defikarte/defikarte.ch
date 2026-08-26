import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { SettingsPage } from '../app/layout/settings-page/SettingsPage';

export const Route = createFileRoute('/settings/language')({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();
  return (
    <SettingsPage backTo="/settings" title={t('settings.language')}>
      <div className="text-primary-100-white"></div>
    </SettingsPage>
  );
}
