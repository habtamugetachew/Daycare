import React, { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';

export const LanguageContext = createContext(null);

export const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'am', label: 'አማርኛ' },
  { code: 'om', label: 'Oromiffa' },
  { code: 'ti', label: 'ትግርኛ' },
];

/**
 * Dynamically import only the requested locale chunk.
 * Vite will split each locale into its own JS file (~37-50 KB each).
 * Only the active locale is ever downloaded.
 */
const localeCache = {}; // module-level memo so we never re-fetch the same locale

async function loadLocale(code) {
  if (localeCache[code]) return localeCache[code];
  try {
    const mod = await import(`../locales/${code}.js`);
    localeCache[code] = mod.default;
    return mod.default;
  } catch (err) {
    console.warn(`[i18n] Failed to load locale "${code}", falling back to English.`, err);
    // Try English as a safe fallback
    if (code !== 'en') return loadLocale('en');
    return {};
  }
}

export const LanguageProvider = ({ children }) => {
  const [locale, setLocaleState] = useState(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('locale') : null;
    return stored || 'am';
  });

  // dict holds the currently loaded translation map
  const [dict, setDict] = useState({});
  const [localeLoading, setLocaleLoading] = useState(true);

  // Load locale whenever it changes
  useEffect(() => {
    let cancelled = false;
    setLocaleLoading(true);
    loadLocale(locale).then((loaded) => {
      if (!cancelled) {
        setDict(loaded);
        setLocaleLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [locale]);

  const setLocale = useCallback((code) => {
    window.localStorage.setItem('locale', code);
    setLocaleState(code);
    // Pre-warm: start fetching new locale immediately
    loadLocale(code);
  }, []);

  const t = useMemo(() => (key, fallbackText) => {
    if (!key) return '';
    return dict[key] ?? fallbackText ?? key;
  }, [dict]);

  const contextValue = useMemo(
    () => ({ locale, setLocale, t, LANGUAGE_OPTIONS, localeLoading }),
    [locale, setLocale, t, localeLoading]
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

// Convenience hook
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
