import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslation from './locales/en/translation.json';
import mkTranslation from './locales/mk/translation.json';

// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslation
      },
      mk: {
        translation: mkTranslation
      }
    },
    lng: 'mk', // Default language changed to Macedonian
    fallbackLng: 'mk',
    interpolation: {
      escapeValue: false // React already escapes values
    }
  });

export default i18n;
