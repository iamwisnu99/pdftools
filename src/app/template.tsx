'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import styles from './template.module.css';

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [progressActive, setProgressActive] = useState(false);

  useEffect(() => {
    // Memicu animasi bar progres merah di bagian atas setiap kali rute berpindah
    setProgressActive(true);
    const timer = setTimeout(() => {
      setProgressActive(false);
    }, 380);

    // Tangani pemulihan dari Back-Forward Cache (bfcache) pada Android Chrome & iOS Safari
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        try {
          const savedTheme = localStorage.getItem('pdf_tools_theme');
          if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
          }
        } catch {
          // Abaikan jika localStorage tidak dapat diakses
        }
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [pathname]);

  return (
    <div key={pathname} className={styles.pageTransitionWrapper}>
      {/* Garis indikator progres navigasi merah di bagian paling atas */}
      <div
        className={`${styles.progressBar} ${progressActive ? styles.progressBarActive : ''}`}
        aria-hidden="true"
      />
      {/* Konten halaman yang meluncur halus ke atas (slide up & fade in) */}
      <div className={styles.pageContent}>
        {children}
      </div>
    </div>
  );
}
