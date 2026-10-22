import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { SettingsOption } from '../app/layout/settings-page/SettingsOption';
import { SettingsPage } from '../app/layout/settings-page/SettingsPage';
import { type LocationDefault, useLocationDefault } from '../hooks/useLocationDefault';

export const Route = createFileRoute('/settings/location')({
  component: RouteComponent,
});

const options: { value: LocationDefault; labelKey: string }[] = [
  { value: 'on', labelKey: 'settings.locationDefaultOn' },
  { value: 'off', labelKey: 'settings.locationDefaultOff' },
];

function RouteComponent() {
  const { t } = useTranslation();
  const [locationDefault, setLocationDefault] = useLocationDefault();

  return (
    <SettingsPage backTo="/settings" title={t('settings.location')}>
      <div role="radiogroup" aria-label={t('settings.location')} className="flex flex-col gap-3">
        {options.map(option => (
          <SettingsOption
            key={option.value}
            selected={locationDefault === option.value}
            onSelect={() => setLocationDefault(option.value)}
          >
            {t(option.labelKey)}
          </SettingsOption>
        ))}
      </div>
    </SettingsPage>
  );
}
