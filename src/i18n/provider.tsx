"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { locales, type Locale, defaultLocale } from "./config";
import en from "./en.json";
import hi from "./hi.json";

const translations: Record<Locale, typeof en> = { en, hi };

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("CaseFiles-locale") as Locale;
      if (stored && locales.includes(stored)) return stored;
    }
    return defaultLocale;
  });

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("CaseFiles-locale", newLocale);
  }, []);

  const t = useCallback(
    (key: string): string => {
      const keys = key.split(".");
      let value: any = translations[locale];
      for (const k of keys) {
        value = value?.[k];
      }
      return typeof value === "string" ? value : key;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

const defaultContext: I18nContextType = {
  locale: defaultLocale,
  setLocale: () => {},
  t: (key: string): string => {
    const keys = key.split(".");
    let value: any = translations[defaultLocale];
    for (const k of keys) {
      value = value?.[k];
    }
    return typeof value === "string" ? value : key;
  },
};

export function useTranslation(): I18nContextType {
  const context = useContext(I18nContext);
  return context || defaultContext;
}
