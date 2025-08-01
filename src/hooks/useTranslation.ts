import th from '@/locales/th.json';
import en from '@/locales/en.json';
import zh from '@/locales/zh.json';
import ja from '@/locales/ja.json';
import lo from '@/locales/lo.json';
import { useCallback, useEffect, useState } from 'react';

const translations: Record<string, Record<string, string>> = {
  th,
  en,
  zh,
  ja,
  lo
};

// Add supported languages
export const supportedLanguages = [
  { code: 'th', name: 'ไทย', display: 'Thai (ประเทศไทย)' },
  { code: 'en', name: 'English', display: 'English (US)' },
  { code: 'zh', name: '中文', display: 'Chinese 中文' },
  { code: 'ja', name: '日本語', display: 'Japanese 日本語 ' },
  { code: 'lo', name: 'ລາວ', display: 'Lao (ປະເທດລາວ)' }
];

export function useTranslation(initialLang: string = 'th') {
  const [currentLang, setCurrentLang] = useState(() => 
    typeof window !== 'undefined' 
      ? localStorage.getItem('language') || initialLang
      : initialLang
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('language');
      if (savedLang && savedLang !== currentLang) {
        setCurrentLang(savedLang);
      }
    }
  }, [currentLang]);

  const t = useCallback((key: string, params?: Record<string, string | number>) => {
    let text = translations[currentLang]?.[key] 
      || translations['en']?.[key] 
      || key;

    // Replace parameters in translation string
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        text = text.replace(`{${paramKey}}`, String(value));
      });
    }

    return text;
  }, [currentLang]);

  const setLanguage = useCallback((lang: string) => {
    if (translations[lang]) {
      localStorage.setItem('language', lang);
      setCurrentLang(lang);
      document.documentElement.lang = lang;
    }
  }, []);

  return {
    t,
    setLanguage,
    currentLang,
    supportedLanguages,
    getCurrentLanguageDisplay: () => {
      const lang = supportedLanguages.find(l => l.code === currentLang);
      return lang?.display || lang?.name || currentLang;
    }
  };
}
