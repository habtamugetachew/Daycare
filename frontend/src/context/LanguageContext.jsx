import React, { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';

export const LanguageContext = createContext(null);

export const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'am', label: 'አማርኛ' },
  { code: 'om', label: 'Oromiffa' },
  { code: 'ti', label: 'ትግርኛ' },
];

// ─── Module-level locale cache ────────────────────────────────────────────────
// The user's saved locale is pre-fetched when this module first loads so
// the very first render always has a populated dictionary (no empty-dict flash).
const localeCache = {};

function fetchLocale(code) {
  if (localeCache[code]?.promise) return localeCache[code].promise;

  const entry = { dict: null, promise: null };
  localeCache[code] = entry;

  entry.promise = import(`../locales/${code}.js`)
    .then((mod) => {
      entry.dict = mod.default;
      return mod.default;
    })
    .catch((err) => {
      console.warn(`[i18n] Failed to load locale "${code}"`, err);
      if (code !== 'en') {
        return fetchLocale('en').then((d) => { entry.dict = d; return d; });
      }
      entry.dict = {};
      return {};
    });

  return entry.promise;
}

// Eagerly kick off load of the user's current locale before any component renders
const _savedLocale =
  (typeof window !== 'undefined' && window.localStorage.getItem('locale')) || 'am';
fetchLocale(_savedLocale);

// ─── Provider ─────────────────────────────────────────────────────────────────
export const LanguageProvider = ({ children }) => {
  const [locale, setLocaleState] = useState(_savedLocale);

  // Initialize from cache so dict is NEVER empty on first render
  const [dict, setDict] = useState(() => localeCache[_savedLocale]?.dict || {});

  useEffect(() => {
    let cancelled = false;

    const cached = localeCache[locale]?.dict;
    if (cached) {
      setDict(cached);
      return;
    }

    // Load on-demand for locales not yet fetched
    fetchLocale(locale).then((loaded) => {
      if (!cancelled) setDict(loaded);
    });

    return () => { cancelled = true; };
  }, [locale]);

  const setLocale = useCallback((code) => {
    window.localStorage.setItem('locale', code);
    setLocaleState(code);
    fetchLocale(code); // pre-warm so it's ready before useEffect fires
  }, []);

  const t = useMemo(() => (key, fallbackText) => {
    if (!key) return '';
    return dict[key] ?? fallbackText ?? key;
  }, [dict]);

  const contextValue = useMemo(
    () => ({ locale, setLocale, t, LANGUAGE_OPTIONS }),
    [locale, setLocale, t]
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
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
