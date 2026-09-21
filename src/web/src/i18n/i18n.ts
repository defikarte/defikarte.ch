import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import de from './locales/de.json';
import en from './locales/en.json';
import fr from './locales/fr.json';
import it from './locales/it.json';
import deStatic from './locales/static/de.json';
import enStatic from './locales/static/en.json';
import frStatic from './locales/static/fr.json';
import itStatic from './locales/static/it.json';

const resources = {
  en: { translation: en, static: enStatic },
  de: { translation: de, static: deStatic },
  fr: { translation: fr, static: frStatic },
  it: { translation: it, static: itStatic },
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
