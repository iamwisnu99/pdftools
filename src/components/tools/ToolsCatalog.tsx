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
  Images,
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
      pills: ['Maksimal & Rekomendasi', 'Teks Tetap Bisa Dicari', 'Anti-Inflation', 'Instant Stats'],
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
    {
      id: 'image-to-pdf',
      title: t.toolCardImageToPdfTitle,
      desc: t.toolCardImageToPdfDesc,
      badge: t.toolCardImageToPdfBadge,
      cta: t.toolCardImageToPdfCta,
      href: '/image-to-pdf',
      icon: <Images size={28} />,
      pills: ['JPG / PNG / WebP', 'A4 & Fit to Image', 'Atur Urutan Gambar', 'Margin Fleksibel'],
    },
    {
      id: 'split',
      title: t.toolCardSplitTitle,
      desc: t.toolCardSplitDesc,
      badge: t.toolCardSplitBadge,
      cta: t.toolCardSplitCta,
      href: '/split',
      icon: <Scissors size={28} />,
      pills: ['Ekstrak Rentang Halaman', 'Pisah Tiap Halaman', 'Visual Page Picker', 'Arsip ZIP'],
    },
    {
      id: 'protect',
      title: t.toolCardProtectTitle,
      desc: t.toolCardProtectDesc,
      badge: t.toolCardProtectBadge,
      cta: t.toolCardProtectCta,
      href: '/protect',
      icon: <LockKeyhole size={28} />,
      pills: ['Enkripsi Militer AES-256', 'Buka Sandi Dokumen', '100% Client-Side', 'Tanpa Server Upload'],
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
            <span>PDF Tools Suite (6 Peralatan Lengkap)</span>
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
      </div>
    </div>
  );
}
