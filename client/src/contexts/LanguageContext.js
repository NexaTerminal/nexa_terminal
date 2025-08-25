import React, { createContext, useState, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom'; // Added useNavigate

// Create a language context
const LanguageContext = createContext();

// Custom hook to use the language context
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    // It's better to throw an error if the context is essential
    throw new Error('useLanguage() must be used within a LanguageProvider');
  }
  return context; 
};

// Language provider component
export const LanguageProvider = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate(); // For updating URL
  const { i18n } = useTranslation();

  const isTerminalRoute = location.pathname.startsWith('/terminal');

  // Initialize currentLanguage state
  // For /terminal routes, it's always 'mk'.
  // Otherwise, try URL param, then localStorage, then default to 'mk'.
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    if (isTerminalRoute) {
      return 'mk';
    }
    const params = new URLSearchParams(location.search);
    const langFromUrl = params.get('lang');
    if (langFromUrl && ['en', 'mk'].includes(langFromUrl)) {
      return langFromUrl;
    }
    const storedLanguage = localStorage.getItem('language');
    if (storedLanguage && ['en', 'mk'].includes(storedLanguage)) {
      return storedLanguage;
    }
    return 'mk'; // Default language
  });

  // Effect to handle language changes and enforce Macedonian for /terminal routes
  useEffect(() => {
    if (isTerminalRoute) {
      // If on a terminal route, ensure language is 'mk'
      if (currentLanguage !== 'mk') {
        setCurrentLanguage('mk'); // Update internal state
      }
      if (i18n.language !== 'mk') {
        i18n.changeLanguage('mk'); // Update i18next
      }
      localStorage.setItem('language', 'mk'); // Update localStorage

      // Also, ensure the URL does not have a conflicting 'lang' param
      const params = new URLSearchParams(location.search);
      if (params.get('lang') && params.get('lang') !== 'mk') {
        params.delete('lang'); // Or set to 'mk', params.set('lang', 'mk');
        navigate(`${location.pathname}?${params.toString()}`, { replace: true });
      }
    } else {
      // For non-terminal routes, sync currentLanguage with i18n and localStorage
      if (i18n.language !== currentLanguage) {
        i18n.changeLanguage(currentLanguage);
      }
      localStorage.setItem('language', currentLanguage);

      // Sync URL with currentLanguage if they differ
      const params = new URLSearchParams(location.search);
      const langFromUrl = params.get('lang');
      if (langFromUrl !== currentLanguage) {
        params.set('lang', currentLanguage);
        navigate(`${location.pathname}?${params.toString()}`, { replace: true });
      }
    }
  }, [currentLanguage, i18n, location.pathname, location.search, isTerminalRoute, navigate]);

  // Effect to listen for direct URL changes (e.g., browser back/forward, manual URL edit)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const langFromUrl = params.get('lang');

    if (isTerminalRoute) {
      // If on a terminal route and URL tries to set a different lang, force 'mk'
      if (currentLanguage !== 'mk') {
         setCurrentLanguage('mk');
      }
      if (langFromUrl && langFromUrl !== 'mk') {
        // Correct the URL if it has a non-mk lang param on a terminal route
        const newParams = new URLSearchParams(location.search);
        newParams.delete('lang'); // Or set to mk
        navigate(`${location.pathname}?${newParams.toString()}`, { replace: true });
      }
    } else {
      // For non-terminal routes, if URL lang param changes, update context
      if (langFromUrl && ['en', 'mk'].includes(langFromUrl) && langFromUrl !== currentLanguage) {
        setCurrentLanguage(langFromUrl);
      }
    }
  }, [location.search, isTerminalRoute, currentLanguage, navigate]); // Listen to location.search

  const changeLanguage = (language) => {
    if (isTerminalRoute) {
      // On terminal routes, language change attempts are ignored (or forced to 'mk')
      // The useEffect above already ensures 'mk' is set.
      if (currentLanguage !== 'mk') setCurrentLanguage('mk');
      return;
    }
    if (['en', 'mk'].includes(language) && language !== currentLanguage) {
      setCurrentLanguage(language);
      // The useEffect will handle i18n, localStorage, and URL update
    }
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, changeLanguage, isTerminalRoute }}>
      {children}
    </LanguageContext.Provider>
  );
};
