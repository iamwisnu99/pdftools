'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Locale, translations } from '@/lib/translations';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: typeof translations.id;
}

const LanguageContext = createContext<LanguageContextType>({
  locale: 'id',
  setLocale: () => {},
  t: translations.id,
});

// Helper untuk memperbarui meta tag SEO saat pergantian bahasa
function syncDocumentSEO(activeLocale: Locale) {
  if (typeof document === 'undefined') return;

  document.documentElement.lang = activeLocale;

  if (activeLocale === 'en') {
    document.title = 'PDF Tools | Fast, Private & Free Online PDF Suite';
    const desc = document.querySelector('meta[name="description"]');
    if (desc) {
      desc.setAttribute(
        'content',
        'Merge, compress, and convert PDF files directly in your browser with zero limits and total privacy. 100% free and client-side.'
      );
    }
  } else {
    document.title = 'PDF Tools | Solusi Dokumen PDF Lengkap, Cepat & Privat';
    const desc = document.querySelector('meta[name="description"]');
    if (desc) {
      desc.setAttribute(
        'content',
        'Gabung, kompres, dan ubah dokumen PDF Anda langsung di peramban tanpa batasan dan tanpa unggah ke server. 100% aman dan privat.'
      );
    }
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('id');

  useEffect(() => {
    // 1. Deteksi dari URL query parameter (?lang=en / ?lang=id)
    const params = new URLSearchParams(window.location.search);
    const langParam = params.get('lang') as Locale | null;

    // 2. Deteksi dari penyimpanan lokal (user preference)
    const saved = (localStorage.getItem('pdf_tools_locale') || localStorage.getItem('pdf_fusion_locale')) as Locale | null;

    let targetLocale: Locale = 'id';

    if (langParam === 'id' || langParam === 'en') {
      targetLocale = langParam;
    } else if (saved === 'id' || saved === 'en') {
      targetLocale = saved;
    } else if (typeof navigator !== 'undefined' && navigator.language) {
      // 3. Deteksi otomatis bahasa peramban (browser language)
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('en')) {
        targetLocale = 'en';
      }
    }

    setLocaleState(targetLocale);
    syncDocumentSEO(targetLocale);
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('pdf_tools_locale', newLocale);
    syncDocumentSEO(newLocale);
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t: translations[locale] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
