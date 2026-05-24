import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import mkTranslation from './locales/mk/translation.json';
import enTranslation from './locales/en/translation.json';
import mkWebsite from './locales/website/mk.json';
import enWebsite from './locales/website/en.json';

const STORAGE_KEY = 'nexa.lang';
const PUBLIC_PATHS = ['/', '/about', '/for-professionals', '/pricing', '/contact', '/blog', '/terms-conditions', '/privacy-policy', '/ecosystem'];

const isPublicPath = (path) => {
  if (!path) return false;
  if (path.startsWith('/terminal')) return false;
  return PUBLIC_PATHS.some(p => path === p || path.startsWith(p + '/')) || path === '/';
};

const initialLang = (() => {
  if (typeof window === 'undefined') return 'mk';
  // Terminal is always MK
  if (window.location && window.location.pathname && window.location.pathname.startsWith('/terminal')) {
    return 'mk';
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'mk' || stored === 'en') return stored;
  } catch (e) { /* ignore */ }
  return 'mk';
})();

i18n
  .use(initReactI18next)
  .init({
    resources: {
      mk: {
        translation: mkTranslation,
        website: mkWebsite
      },
      en: {
        translation: enTranslation,
        website: enWebsite
      }
    },
    lng: initialLang,
    fallbackLng: 'mk',
    defaultNS: 'translation',
    ns: ['translation', 'website'],
    interpolation: {
      escapeValue: false
    }
  });

// Persist language changes for public surface
i18n.on('languageChanged', (lng) => {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, lng);
    }
  } catch (e) { /* ignore */ }
});

export const isPublicRoute = isPublicPath;
export default i18n;
