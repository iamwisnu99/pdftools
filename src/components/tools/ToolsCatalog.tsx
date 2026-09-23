'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Layers,
  Zap,
  FileImage,
  ArrowRight,
  ShieldCheck,
  Search,
  Sparkles,
  Scissors,
  LockKeyhole,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import styles from './ToolsCatalog.module.css';

export default function ToolsCatalog() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');

  const tools = [
    {
      id: 'merge',
      title: t.toolCardMergeTitle,
      desc: t.toolCardMergeDesc,
      badge: t.toolCardMergeBadge,
      cta: t.toolCardMergeCta,
      href: '/merge',
      icon: <Layers size={28} />,
      pills: ['Multi-file Queue', 'Visual Thumbnails', 'Page Rotation', 'Drag & Drop'],
    },
    {
      id: 'compress',
      title: t.toolCardCompressTitle,
      desc: t.toolCardCompressDesc,
      badge: t.toolCardCompressBadge,
      cta: t.toolCardCompressCta,
      href: '/compress',
      icon: <Zap size={28} />,
      pills: ['Object Streams', '100% Lossless', 'Vector Fonts Intact', 'Instant Stats'],
    },
    {
      id: 'pdf-to-image',
      title: t.toolCardPdfToImageTitle,
      desc: t.toolCardPdfToImageDesc,
      badge: t.toolCardPdfToImageBadge,
      cta: t.toolCardPdfToImageCta,
      href: '/pdf-to-image',
      icon: <FileImage size={28} />,
      pills: ['PNG / JPG / WEBP', 'Standard & 300 DPI HD', 'Single Download', 'ZIP Export'],
    },
  ];

  const filteredTools = tools.filter(
    (tool) =>
      tool.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.pills.some((p) => p.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className={styles.catalogWrapper}>
      <div className={styles.ambientMesh} aria-hidden="true">
        <div className={styles.blob1} />
        <div className={styles.blob2} />
      </div>

      <div className="container">
        {/* Header Section */}
        <div className={styles.headerSection}>
          <div className={styles.catalogBadge}>
            <Sparkles size={14} />
            <span>PDF Tools Suite</span>
          </div>

          <h1 className={styles.catalogTitle}>{t.toolsCatalogTitle}</h1>
          <p className={styles.catalogSubtitle}>{t.toolsCatalogSubtitle}</p>

          <div className={styles.privacyPill}>
            <ShieldCheck size={16} />
            <span>{t.privacyNoticePill}</span>
          </div>

          {/* Quick Filter Search Input */}
          <div className={styles.searchWrapper}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder={t.toolsCatalogSearchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        {/* Tools Cards Grid */}
        <div className={styles.toolsGrid}>
          {filteredTools.map((tool) => (
            <Link key={tool.id} href={tool.href} className={styles.toolCard}>
              <div className={styles.cardGlow} />
              <div>
                <div className={styles.cardTopRow}>
                  <div className={styles.cardIconBox}>{tool.icon}</div>
                  <span className={styles.cardBadge}>{tool.badge}</span>
                </div>
                <h2 className={styles.cardTitle}>{tool.title}</h2>
                <p className={styles.cardDesc}>{tool.desc}</p>
                <div className={styles.cardFeaturesPills}>
                  {tool.pills.map((pill, i) => (
                    <span key={i} className={styles.featurePill}>
                      {pill}
                    </span>
                  ))}
                </div>
              </div>
              <div className={`btn btn-primary ${styles.cardBtn}`}>
                <span>{tool.cta}</span>
                <ArrowRight size={16} />
              </div>
            </Link>
          ))}
        </div>

        {/* Upcoming Tools Teaser */}
        <div className={styles.upcomingSection}>
          <div className={styles.upcomingHeader}>
            <div className={styles.upcomingBadge}>{t.toolsUpcomingBadge}</div>
            <h3 className={styles.upcomingTitle}>{t.toolsUpcomingTitle}</h3>
            <p className={styles.upcomingDesc}>{t.toolsUpcomingDesc}</p>
          </div>

          <div className={styles.upcomingGrid}>
            <div className={styles.upcomingCard}>
              <div className={styles.upcomingCardIcon}>
                <Scissors size={20} />
              </div>
              <h4 className={styles.upcomingCardTitle}>{t.toolUpcomingSplit}</h4>
              <p className={styles.upcomingCardText}>{t.toolUpcomingSplitDesc}</p>
            </div>

            <div className={styles.upcomingCard}>
              <div className={styles.upcomingCardIcon}>
                <LockKeyhole size={20} />
              </div>
              <h4 className={styles.upcomingCardTitle}>{t.toolUpcomingProtect}</h4>
              <p className={styles.upcomingCardText}>{t.toolUpcomingProtectDesc}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
