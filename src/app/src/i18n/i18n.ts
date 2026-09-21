import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import de from './locales/de.json';
import en from './locales/en.json';
import fr from './locales/fr.json';
import it from './locales/it.json';

const resources = {
  en: { translation: en },
  de: { translation: de },
  fr: { translation: fr },
  it: { translation: it },
};

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    debug: false, // import.meta.env.DEV,
    fallbackLng: 'de',
    interpolation: {
      escapeValue: false,
    },
    resources: resources,
    defaultNS: 'translation',
  });

export default i18n;
