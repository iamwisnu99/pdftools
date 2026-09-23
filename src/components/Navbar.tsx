'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Sun,
  Moon,
  Check,
  ChevronDown,
  ChevronLeft,
  ArrowRight,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { FlagID, FlagEN } from './Flags';
import styles from './Navbar.module.css';

interface NavbarProps {
  onStartMergeClick?: () => void;
  activeView?: 'landing' | 'workspace';
  onViewChange?: (view: 'landing' | 'workspace') => void;
}

export default function Navbar() {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const { locale, setLocale, t } = useLanguage();

  useEffect(() => {
    const currentTheme = document.documentElement.getAttribute('data-theme') as 'light' | 'dark' | null;
    const saved = localStorage.getItem('pdf_tools_theme') as 'light' | 'dark' | null;
    const initialTheme = currentTheme || saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
  }, []);

  // Menutup dropdown saat klik di luar
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('pdf_tools_theme', nextTheme);
  };

  const handleSelectLanguage = (newLocale: 'id' | 'en') => {
    setLocale(newLocale);
    setIsLangOpen(false);
  };

  return (
    <header className={styles.navbarWrapper}>
      <div className={`container ${styles.navbarInner}`}>
        {/* Left Side: Brand on Landing Page, Back Button on Other Pages */}
        {isLandingPage ? (
          <Link href="/" className={styles.brand}>
            <div className={styles.brandIconWrapper}>
              <Image
                src="/icon.png"
                alt="PDF Tools Logo"
                width={38}
                height={38}
                className={styles.brandImg}
                priority
              />
            </div>
            <div className={styles.brandText}>
              <span className={styles.brandName}>{t.brandName}</span>
              <span className={styles.brandSub}>{t.brandSub}</span>
            </div>
          </Link>
        ) : (
          <Link href="/" className={styles.backLink} aria-label={t.btnBack}>
            <div className={styles.backIconCircle}>
              <ChevronLeft size={20} className={styles.backChevron} />
            </div>
            <span className={styles.backText}>{t.btnBack}</span>
          </Link>
        )}

        {/* Right Side: Language, Theme, & Try Now CTA */}
        <div className={styles.navActions}>
          {/* Language Switcher Dropdown */}
          <div className={styles.langWrapper} ref={langDropdownRef}>
            <button
              onClick={() => setIsLangOpen(!isLangOpen)}
              className={styles.langTrigger}
              aria-label="Change Language"
              title={t.langSelect}
            >
              {locale === 'id' ? <FlagID size={19} /> : <FlagEN size={19} />}
              <span className={styles.langCode}>{locale === 'id' ? 'ID' : 'EN'}</span>
              <ChevronDown
                size={13}
                className={`${styles.langChevron} ${isLangOpen ? styles.langChevronOpen : ''}`}
              />
            </button>

            {isLangOpen && (
              <div className={styles.langDropdown}>
                <div className={styles.langDropdownHeader}>
                  <span>{t.langSelect}</span>
                </div>
                <button
                  onClick={() => handleSelectLanguage('id')}
                  className={`${styles.langItem} ${locale === 'id' ? styles.langItemActive : ''}`}
                >
                  <div className={styles.langItemLeft}>
                    <FlagID size={18} />
                    <span className={styles.langName}>Indonesia</span>
                  </div>
                  {locale === 'id' && <Check size={15} className={styles.checkIcon} />}
                </button>
                <button
                  onClick={() => handleSelectLanguage('en')}
                  className={`${styles.langItem} ${locale === 'en' ? styles.langItemActive : ''}`}
                >
                  <div className={styles.langItemLeft}>
                    <FlagEN size={18} />
                    <span className={styles.langName}>English</span>
                  </div>
                  {locale === 'en' && <Check size={15} className={styles.checkIcon} />}
                </button>
              </div>
            )}
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={styles.themeToggle}
            aria-label="Toggle Theme"
            title={theme === 'light' ? t.themeDark : t.themeLight}
          >
            {theme === 'light' ? <Moon size={19} /> : <Sun size={19} />}
          </button>

          {/* CTA Button: Always redirects to /tools (Tools Directory) */}
          {pathname !== '/tools' && (
            <Link href="/tools" className={`btn btn-primary ${styles.ctaBtn}`} aria-label={t.navBtnTry}>
              <span className={styles.ctaText}>{t.navBtnTry}</span>
              <ArrowRight size={15} />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
