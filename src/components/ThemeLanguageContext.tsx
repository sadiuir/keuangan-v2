'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations } from '@/lib/translations';

type Theme = 'light' | 'dark';

interface ThemeLanguageContextType {
  theme: Theme;
  lang: Language;
  toggleTheme: () => void;
  setLang: (lang: Language) => void;
  t: (key: keyof typeof translations['id']) => string;
}

const ThemeLanguageContext = createContext<ThemeLanguageContextType | undefined>(undefined);

export function ThemeLanguageProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [lang, setLangState] = useState<Language>('id');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Jalankan pasca mounting untuk menghindari server-client hydration mismatch
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    const storedLang = localStorage.getItem('lang') as Language | null;

    const initialTheme = storedTheme || 'dark';
    const initialLang = storedLang || 'id';

    setTheme(initialTheme);
    setLangState(initialLang);
    setMounted(true);

    // Terapkan class & atribut awal
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    document.documentElement.setAttribute('lang', initialLang);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const setLang = (nextLang: Language) => {
    setLangState(nextLang);
    localStorage.setItem('lang', nextLang);
    document.documentElement.setAttribute('lang', nextLang);
  };

  const t = (key: keyof typeof translations['id']): string => {
    const dict = translations[lang] || translations['id'];
    return dict[key] || translations['id'][key] || String(key);
  };

  return (
    <ThemeLanguageContext.Provider value={{ theme, lang, toggleTheme, setLang, t }}>
      {children}
    </ThemeLanguageContext.Provider>
  );
}

export function useThemeLanguage() {
  const context = useContext(ThemeLanguageContext);
  if (!context) {
    throw new Error('useThemeLanguage must be used within a ThemeLanguageProvider');
  }
  return context;
}
