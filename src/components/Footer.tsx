'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShieldCheck,
  Lock,
  FileText,
  Layers,
  Zap,
  FileImage,
  RotateCw,
  Eye,
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import styles from './Footer.module.css';

interface FooterProps {
  onStartMerge?: () => void;
}

export default function Footer({ onStartMerge }: FooterProps) {
  const { t } = useLanguage();

  return (
    <footer className={styles.footerWrapper}>
      <div className={`container ${styles.footerInner}`}>
        {/* Main 4-Column Grid */}
        <div className={styles.footerGrid}>
          {/* Column 1: Brand & Security Mission */}
          <div className={styles.brandCol}>
            <div className={styles.brandRow}>
              <div className={styles.brandIconBox}>
                <Image
                  src="/icon.png"
                  alt="PDF Tools Logo"
                  width={32}
                  height={32}
                  className={styles.brandImg}
                />
              </div>
              <span className={styles.brandName}>{t.brandName}</span>
            </div>

            <p className={styles.brandDesc}>{t.footerBrandDesc}</p>

            <div className={styles.trustPill}>
              <ShieldCheck size={14} className={styles.trustPillIcon} />
              <span>{t.footerTrustBadge}</span>
            </div>
          </div>

          {/* Column 2: Product & Tools */}
          <div className={styles.navCol}>
            <h4 className={styles.colTitle}>{t.footerColProduct}</h4>
            <ul className={styles.linkList}>
              <li>
                <Link href="/tools" className={styles.navLink}>
                  <Sparkles size={14} />
                  <span>{t.footerLinkTools}</span>
                </Link>
              </li>
              <li>
                <Link href="/merge" className={styles.navLink}>
                  <Layers size={14} />
                  <span>{t.footerLinkMerge}</span>
                </Link>
              </li>
              <li>
                <Link href="/compress" className={styles.navLink}>
                  <Zap size={14} />
                  <span>{t.footerLinkCompress}</span>
                </Link>
              </li>
              <li>
                <Link href="/pdf-to-image" className={styles.navLink}>
                  <FileImage size={14} />
                  <span>{t.footerLinkPdfToImage}</span>
                </Link>
              </li>
              <li>
                <a href="/#fitur" className={styles.navLink}>
                  <Eye size={14} />
                  <span>{t.footerLinkPreview}</span>
                </a>
              </li>
              <li>
                <a href="/#cara-kerja" className={styles.navLink}>
                  <HelpCircle size={14} />
                  <span>{t.footerLinkHow}</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Security & Architecture */}
          <div className={styles.navCol}>
            <h4 className={styles.colTitle}>{t.footerColSecurity}</h4>
            <ul className={styles.linkList}>
              <li>
                <Link href="/legal?doc=compliance" className={styles.navLink}>
                  <ShieldCheck size={14} />
                  <span>{t.footerLinkClientSide}</span>
                </Link>
              </li>
              <li>
                <Link href="/legal?doc=privacy" className={styles.navLink}>
                  <Lock size={14} />
                  <span>{t.footerLinkZeroLog}</span>
                </Link>
              </li>
              <li>
                <Link href="/legal?doc=compliance" className={styles.navLink}>
                  <CheckCircle2 size={14} />
                  <span>{t.footerLinkSandbox}</span>
                </Link>
              </li>
              <li>
                <Link href="/legal?doc=privacy" className={styles.navLink}>
                  <FileText size={14} />
                  <span>{t.footerLinkSelfClean}</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: LEGAL (Documentation Mode Links) */}
          <div className={styles.navCol}>
            <div className={styles.legalTitleWrapper}>
              <h4 className={styles.colTitle}>{t.footerColLegal}</h4>
              <span className={styles.officialBadge}>Docs</span>
            </div>
            <ul className={styles.linkList}>
              <li>
                <Link
                  href="/legal?doc=privacy"
                  className={`${styles.navLink} ${styles.legalLink}`}
                >
                  <ShieldCheck size={14} className={styles.legalLinkIcon} />
                  <span>{t.footerLinkPrivacy}</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/legal?doc=terms"
                  className={`${styles.navLink} ${styles.legalLink}`}
                >
                  <FileText size={14} className={styles.legalLinkIcon} />
                  <span>{t.footerLinkTerms}</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/legal?doc=disclaimer"
                  className={`${styles.navLink} ${styles.legalLink}`}
                >
                  <AlertTriangle size={14} className={styles.legalLinkIcon} />
                  <span>{t.footerLinkDisclaimer}</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/legal?doc=compliance"
                  className={`${styles.navLink} ${styles.legalLink}`}
                >
                  <Lock size={14} className={styles.legalLinkIcon} />
                  <span>{t.footerLinkCompliance}</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright Row */}
        <div className={styles.bottomRow}>
          <div className={styles.copyrightText}>
            <span>&copy; {new Date().getFullYear()} {t.footerCopyright}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
