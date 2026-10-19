import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { SettingsOption } from '../app/layout/settings-page/SettingsOption';
import { SettingsPage } from '../app/layout/settings-page/SettingsPage';
import { type EmergencyDefault, useEmergencyDefault } from '../hooks/useEmergencyDefault';

export const Route = createFileRoute('/settings/emergency')({
  component: RouteComponent,
});

const options: { value: EmergencyDefault; labelKey: string }[] = [
  { value: 'on', labelKey: 'settings.emergencyDefaultOn' },
  { value: 'off', labelKey: 'settings.emergencyDefaultOff' },
];

function RouteComponent() {
  const { t } = useTranslation();
  const [emergencyDefault, setEmergencyDefault] = useEmergencyDefault();

  return (
    <SettingsPage backTo="/settings" title={t('settings.emergency')}>
      <div role="radiogroup" aria-label={t('settings.emergency')} className="flex flex-col gap-3">
        {options.map(option => (
          <SettingsOption
            key={option.value}
            selected={emergencyDefault === option.value}
            onSelect={() => setEmergencyDefault(option.value)}
          >
            {t(option.labelKey)}
          </SettingsOption>
        ))}
      </div>
    </SettingsPage>
  );
}
