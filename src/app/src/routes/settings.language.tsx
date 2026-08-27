import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { SettingsOption } from '../app/layout/settings-page/SettingsOption';
import { SettingsPage } from '../app/layout/settings-page/SettingsPage';

export const Route = createFileRoute('/settings/language')({
  component: RouteComponent,
});

interface Language {
  code: string;
  label: string;
}

// The labels stay in their own language on purpose, so they read the same whatever
// the app is currently set to. Nothing to translate here.
const languages: Language[] = [
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
  { code: 'it', label: 'Italiano' },
  { code: 'en', label: 'English' },
];

function RouteComponent() {
  const { i18n, t } = useTranslation();

  return (
    <SettingsPage backTo="/settings" title={t('settings.language')}>
      <div role="radiogroup" aria-label={t('settings.language')} className="flex flex-col gap-3">
        {languages.map(language => (
          <SettingsOption
            key={language.code}
            selected={i18n.resolvedLanguage === language.code}
            onSelect={() => void i18n.changeLanguage(language.code)}
          >
            {language.label}
          </SettingsOption>
        ))}
      </div>
    </SettingsPage>
  );
}
