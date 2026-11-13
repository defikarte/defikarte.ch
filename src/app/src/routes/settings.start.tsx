import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { SettingsOption } from '../app/layout/settings-page/SettingsOption';
import { SettingsPage } from '../app/layout/settings-page/SettingsPage';
import { type StartView, useStartView } from '../hooks/useStartView';

export const Route = createFileRoute('/settings/start')({
  component: RouteComponent,
});

const options: { value: StartView; labelKey: string }[] = [
  { value: 'map', labelKey: 'settings.startViewMap' },
  { value: 'location', labelKey: 'settings.startViewLocation' },
  { value: 'emergency', labelKey: 'settings.startViewEmergency' },
];

function RouteComponent() {
  const { t } = useTranslation();
  const [startView, setStartView] = useStartView();

  return (
    <SettingsPage backTo="/settings" title={t('settings.startView')}>
      <div role="radiogroup" aria-label={t('settings.startView')} className="flex flex-col gap-3">
        {options.map(option => (
          <SettingsOption
            key={option.value}
            selected={startView === option.value}
            onSelect={() => setStartView(option.value)}
          >
            {t(option.labelKey)}
          </SettingsOption>
        ))}
      </div>
    </SettingsPage>
  );
}
