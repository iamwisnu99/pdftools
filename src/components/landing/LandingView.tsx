'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Zap,
  ArrowRight,
  RotateCw,
  CheckCircle2,
  Layers,
  HelpCircle,
  ShieldCheck,
  Cpu,
  GraduationCap,
  Briefcase,
  Scale,
  Users,
  Check,
  X,
  ChevronDown,
  Sparkles,
  Lock,
  Eye,
  FileCheck,
  FileImage,
  Archive,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import styles from './LandingView.module.css';

interface LandingViewProps {
  onStartMerge?: () => void;
}

export default function LandingView({ onStartMerge }: LandingViewProps) {
  const { t } = useLanguage();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showcaseTab, setShowcaseTab] = useState<'merge' | 'compress' | 'image'>('merge');

  const toggleFaq = (index: number) => {
    setOpenFaq((prev) => (prev === index ? null : index));
  };

  const faqItems = [
    { q: t.faqQ1, a: t.faqA1 },
    { q: t.faqQ2, a: t.faqA2 },
    { q: t.faqQ3, a: t.faqA3 },
    { q: t.faqQ4, a: t.faqA4 },
    { q: t.faqQ5, a: t.faqA5 },
    { q: t.faqQ6, a: t.faqA6 },
  ];

  return (
    <div className={styles.landingContainer}>
      {/* Subtle Engineered Backdrop (Clean Studio Light, No Neon Blobs) */}
      <div className={styles.heroBackdrop} aria-hidden="true">
        <div className={styles.heroSubtleGlow} />
        <div className={styles.heroSubtleGrid} />
      </div>

      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className="container">
          <div className={styles.heroGrid}>
            {/* Left Column: Hero Content & Trust Indicators */}
            <div className={styles.heroLeft}>
              <h1 className={styles.heroTitle}>
                {t.heroTitlePart1}
                <span className={styles.heroTitleAccent}>{t.heroTitleGradient}</span>
              </h1>

              <p className={styles.heroSubtitle}>{t.heroSubtitle}</p>

              <div className={styles.heroCtaGroup}>
                <Link href="/tools" className={`btn btn-primary btn-lg ${styles.mainCtaBtn}`}>
                  <span>{t.heroCtaStart}</span>
                  <ArrowRight size={18} />
                </Link>
                <a href="#peralatan" className={`btn btn-secondary btn-lg ${styles.secondaryCtaBtn}`}>
                  {t.heroCtaCatalog}
                </a>
              </div>

              {/* Minimalist Professional Trust Bar (Single Elegant Horizontal Strip) */}
              <div className={styles.trustRow}>
                <div className={styles.trustItem}>
                  <Lock size={15} strokeWidth={2.2} className={styles.trustIcon} />
                  <span>{t.heroTrustPrivate}</span>
                </div>
                <span className={styles.trustDividerDot} aria-hidden="true">•</span>
                <div className={styles.trustItem}>
                  <Zap size={15} strokeWidth={2.2} className={styles.trustIcon} />
                  <span>{t.heroTrustFast}</span>
                </div>
                <span className={styles.trustDividerDot} aria-hidden="true">•</span>
                <div className={styles.trustItem}>
                  <ShieldCheck size={15} strokeWidth={2.2} className={styles.trustIcon} />
                  <span>{t.heroTrustFree}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Adobe Acrobat Studio Showcase Canvas */}
            <div className={styles.heroShowcaseWrapper}>
              <div className={styles.studioWindow}>
                {/* Minimalist Studio Application Bar */}
                <div className={styles.studioAppBar}>
                  <div className={styles.studioDocMeta}>
                    <div className={styles.adobeDocIcon}>
                      <FileText size={15} />
                    </div>
                    <span className={styles.studioFileName}>{t.studioDocName}</span>
                  </div>

                  {/* Segmented Mode Selector Tabs */}
                  <div className={styles.studioModeSwitcher} role="tablist">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={showcaseTab === 'merge'}
                      onClick={() => setShowcaseTab('merge')}
                      className={`${styles.studioModeTab} ${
                        showcaseTab === 'merge' ? styles.studioModeTabActive : ''
                      }`}
                    >
                      <Layers size={13} />
                      <span>{t.showcaseTabMerge}</span>
                    </button>

                    <button
                      type="button"
                      role="tab"
                      aria-selected={showcaseTab === 'compress'}
                      onClick={() => setShowcaseTab('compress')}
                      className={`${styles.studioModeTab} ${
                        showcaseTab === 'compress' ? styles.studioModeTabActive : ''
                      }`}
                    >
                      <Zap size={13} />
                      <span>{t.showcaseTabCompress}</span>
                    </button>

                    <button
                      type="button"
                      role="tab"
                      aria-selected={showcaseTab === 'image'}
                      onClick={() => setShowcaseTab('image')}
                      className={`${styles.studioModeTab} ${
                        showcaseTab === 'image' ? styles.studioModeTabActive : ''
                      }`}
                    >
                      <FileImage size={13} />
                      <span>{t.showcaseTabImage}</span>
                    </button>
                  </div>
                </div>

                {/* Acrobat Document Stage */}
                <div className={styles.studioCanvas}>
                  {/* TAB 1: MERGE & ORGANIZE */}
                  {showcaseTab === 'merge' && (
                    <div className={styles.canvasMergeView}>
                      <div className={styles.canvasPageGrid}>
                        {/* Page 1 Miniature */}
                        <div className={styles.sheetThumbnail}>
                          <div className={styles.sheetHeader}>
                            <span className={styles.sheetDocTag}>Proposal</span>
                            <span className={styles.sheetPageNum}>1–4</span>
                          </div>
                          <div className={styles.sheetPaper}>
                            <div className={styles.mockTitleBar} />
                            <div className={styles.mockTextLineLong} />
                            <div className={styles.mockTextLineMed} />
                            <div className={styles.mockTextLineShort} />
                          </div>
                          <span className={styles.sheetFileName}>Proposal_Proyek.pdf</span>
                        </div>

                        {/* Page 2 Miniature */}
                        <div className={styles.sheetThumbnail}>
                          <div className={styles.sheetHeader}>
                            <span className={styles.sheetDocTag}>Keuangan</span>
                            <span className={styles.sheetPageNum}>5–8</span>
                          </div>
                          <div className={styles.sheetPaper}>
                            <div className={styles.mockTitleBar} />
                            <div className={styles.mockTextLineLong} />
                            <div className={styles.mockTextLineMed} />
                            <div className={styles.mockTextLineShort} />
                          </div>
                          <span className={styles.sheetFileName}>Analisis_Keuangan.pdf</span>
                        </div>

                        {/* Page 3 Miniature */}
                        <div className={styles.sheetThumbnail}>
                          <div className={styles.sheetHeader}>
                            <span className={styles.sheetDocTag}>Lampiran</span>
                            <span className={styles.sheetPageNum}>9–12</span>
                          </div>
                          <div className={styles.sheetPaper}>
                            <div className={styles.mockTitleBar} />
                            <div className={styles.mockTextLineLong} />
                            <div className={styles.mockTextLineMed} />
                            <div className={styles.mockTextLineShort} />
                          </div>
                          <span className={styles.sheetFileName}>Lampiran_Legalitas.pdf</span>
                        </div>

                        {/* Add Document Slot */}
                        <Link href="/merge" className={styles.sheetAddSlot}>
                          <span className={styles.sheetAddPlus}>+</span>
                          <span className={styles.sheetAddLabel}>{t.studioAddDoc}</span>
                        </Link>
                      </div>

                      {/* Stage Action Bar */}
                      <div className={styles.stageActionBar}>
                        <div className={styles.stageSummary}>
                          <CheckCircle2 size={15} className={styles.stageCheckIcon} />
                          <span>{t.studioMergeSummary}</span>
                        </div>
                        <Link href="/merge" className={`btn btn-primary btn-sm ${styles.stagePrimaryBtn}`}>
                          <span>{t.studioMergeBtn}</span>
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: SMART COMPRESS */}
                  {showcaseTab === 'compress' && (
                    <div className={styles.canvasCompressView}>
                      <div className={styles.compressCardsRow}>
                        {/* Original File */}
                        <div className={styles.compressFileCard}>
                          <span className={styles.compressDocBadge}>{t.studioOriginalBadge}</span>
                          <div className={styles.compressDocIcon}>
                            <FileText size={24} />
                          </div>
                          <div className={styles.compressDocTitle}>Portofolio_HD.pdf</div>
                          <div className={styles.compressDocSize}>24.8 MB</div>
                        </div>

                        {/* Minimalist Compression Indicator */}
                        <div className={styles.compressMidSection}>
                          <span className={styles.presetBadge}>{t.studioCompressSavings}</span>
                          <div className={styles.compressArrowIndicator}>
                            <ArrowRight size={18} />
                          </div>
                          <span className={styles.compressPreservedText}>{t.studioCompressPreset}</span>
                        </div>

                        {/* Output Compressed */}
                        <div className={`${styles.compressFileCard} ${styles.compressResultCard}`}>
                          <span className={styles.compressSuccessBadge}>{t.studioOptimalBadge}</span>
                          <div className={styles.compressSuccessIcon}>
                            <FileCheck size={24} />
                          </div>
                          <div className={styles.compressDocTitle}>Portofolio_compressed.pdf</div>
                          <div className={styles.compressNewSize}>4.2 MB</div>
                        </div>
                      </div>

                      {/* Compress Stage Action Bar */}
                      <div className={styles.stageActionBar}>
                        <div className={styles.stageSummary}>
                          <Sparkles size={15} className={styles.stageSparkleIcon} />
                          <span>{t.studioCompressSummary}</span>
                        </div>
                        <Link href="/compress" className={`btn btn-primary btn-sm ${styles.stagePrimaryBtn}`}>
                          <span>{t.studioCompressBtn}</span>
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: PDF TO IMAGE */}
                  {showcaseTab === 'image' && (
                    <div className={styles.canvasExportView}>
                      <div className={styles.exportShowcaseRow}>
                        {/* High-res Document Page Preview */}
                        <div className={styles.exportPreviewCard}>
                          <div className={styles.exportSheetPreview}>
                            <div className={styles.exportSheetCover}>
                              <div className={styles.exportCoverBadge}>300 DPI</div>
                              <div className={styles.exportCoverTitle}>{t.studioCoverTitle}</div>
                              <div className={styles.exportCoverSubtitle}>{t.studioCoverSub}</div>
                            </div>
                          </div>
                          <span className={styles.exportPreviewLabel}>{t.studioExportPreviewLabel}</span>
                        </div>

                        {/* Export Settings Panel */}
                        <div className={styles.exportSettingsCol}>
                          <div className={styles.exportFormatSelector}>
                            <span className={styles.exportFormatLabel}>{t.studioExportFormatLabel}</span>
                            <div className={styles.exportPills}>
                              <span className={`${styles.formatPill} ${styles.formatPillActive}`}>PNG HD</span>
                              <span className={styles.formatPill}>JPG</span>
                              <span className={styles.formatPill}>WebP</span>
                            </div>
                          </div>

                          <div className={styles.exportDetailCard}>
                            <div className={styles.exportDetailRow}>
                              <span>{t.studioExportResLabel}</span>
                              <strong>300 DPI Ultra Sharp</strong>
                            </div>
                            <div className={styles.exportDetailRow}>
                              <span>{t.studioExportPagesLabel}</span>
                              <strong>{t.studioExportPagesVal}</strong>
                            </div>
                            <div className={styles.exportDetailRow}>
                              <span>{t.studioExportZipLabel}</span>
                              <strong>{t.studioExportZipVal}</strong>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Export Stage Action Bar */}
                      <div className={styles.stageActionBar}>
                        <div className={styles.stageSummary}>
                          <Archive size={15} className={styles.stageArchiveIcon} />
                          <span>{t.studioExportSummary}</span>
                        </div>
                        <Link href="/pdf-to-image" className={`btn btn-primary btn-sm ${styles.stagePrimaryBtn}`}>
                          <span>{t.studioExportBtn}</span>
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Tools Grid Section */}
      <section className={styles.toolsSection} id="peralatan">
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{t.toolsSectionTitle}</h2>
            <p className={styles.sectionSubtitle}>{t.toolsSectionSubtitle}</p>
          </div>

          <div className={styles.toolsGrid}>
            {/* Tool 1: Merge */}
            <Link href="/merge" className={styles.toolCardItem}>
              <div>
                <div className={styles.toolCardTop}>
                  <div className={styles.toolCardIconBox}>
                    <Layers size={26} />
                  </div>
                  <span className={styles.toolCardBadge}>{t.toolCardMergeBadge}</span>
                </div>
                <h3 className={styles.toolCardTitle}>{t.toolCardMergeTitle}</h3>
                <p className={styles.toolCardDesc}>{t.toolCardMergeDesc}</p>
              </div>
              <div className={styles.toolCardCta}>
                <span>{t.toolCardMergeCta}</span>
                <ArrowRight size={16} />
              </div>
            </Link>

            {/* Tool 2: Compress */}
            <Link href="/compress" className={styles.toolCardItem}>
              <div>
                <div className={styles.toolCardTop}>
                  <div className={styles.toolCardIconBox}>
                    <Zap size={26} />
                  </div>
                  <span className={styles.toolCardBadge}>{t.toolCardCompressBadge}</span>
                </div>
                <h3 className={styles.toolCardTitle}>{t.toolCardCompressTitle}</h3>
                <p className={styles.toolCardDesc}>{t.toolCardCompressDesc}</p>
              </div>
              <div className={styles.toolCardCta}>
                <span>{t.toolCardCompressCta}</span>
                <ArrowRight size={16} />
              </div>
            </Link>

            {/* Tool 3: PDF to Image */}
            <Link href="/pdf-to-image" className={styles.toolCardItem}>
              <div>
                <div className={styles.toolCardTop}>
                  <div className={styles.toolCardIconBox}>
                    <FileImage size={26} />
                  </div>
                  <span className={styles.toolCardBadge}>{t.toolCardPdfToImageBadge}</span>
                </div>
                <h3 className={styles.toolCardTitle}>{t.toolCardPdfToImageTitle}</h3>
                <p className={styles.toolCardDesc}>{t.toolCardPdfToImageDesc}</p>
              </div>
              <div className={styles.toolCardCta}>
                <span>{t.toolCardPdfToImageCta}</span>
                <ArrowRight size={16} />
              </div>
            </Link>
          </div>

          {/* Minimalist Explore All Tools Banner */}
          <div className={styles.toolsViewAllBanner}>
            <div className={styles.toolsViewAllText}>
              <div className={styles.toolsViewAllTitle}>
                <Sparkles size={18} style={{ color: 'var(--accent-primary)' }} />
                <span>{t.toolsViewAllBtn}</span>
              </div>
              <p className={styles.toolsViewAllSubtitle}>
                {t.toolsViewAllDesc}
              </p>
            </div>
            <Link href="/tools" className={styles.toolsViewAllBtn}>
              <span>{t.toolsViewAllBtn}</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Metrics Banner */}
      <section className={styles.metricsSection}>
        <div className="container">
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <div className={styles.metricValue}>{t.metric1Value}</div>
              <div className={styles.metricLabel}>{t.metric1Label}</div>
              <div className={styles.metricSub}>{t.metric1Sub}</div>
            </div>

            <div className={styles.metricCard}>
              <div className={styles.metricValue}>{t.metric2Value}</div>
              <div className={styles.metricLabel}>{t.metric2Label}</div>
              <div className={styles.metricSub}>{t.metric2Sub}</div>
            </div>

            <div className={styles.metricCard}>
              <div className={styles.metricValue}>{t.metric3Value}</div>
              <div className={styles.metricLabel}>{t.metric3Label}</div>
              <div className={styles.metricSub}>{t.metric3Sub}</div>
            </div>

            <div className={styles.metricCard}>
              <div className={styles.metricValue}>{t.metric4Value}</div>
              <div className={styles.metricLabel}>{t.metric4Label}</div>
              <div className={styles.metricSub}>{t.metric4Sub}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid (6 Cards Covering Merge, Compress, Image, Rotation, Sandbox, Memory) */}
      <section className={styles.featuresSection} id="fitur">
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{t.featuresHeading}</h2>
            <p className={styles.sectionSubtitle}>{t.featuresSubheading}</p>
          </div>

          <div className={styles.featuresGrid}>
            <div className={`card ${styles.featureCard}`}>
              <div className={styles.featureIconWrapper}>
                <Layers size={24} />
              </div>
              <h3 className={styles.featureTitle}>{t.featReorderTitle}</h3>
              <p className={styles.featureDescription}>{t.featReorderDesc}</p>
            </div>

            <div className={`card ${styles.featureCard}`}>
              <div className={styles.featureIconWrapper}>
                <Zap size={24} />
              </div>
              <h3 className={styles.featureTitle}>{t.featThumbTitle}</h3>
              <p className={styles.featureDescription}>{t.featThumbDesc}</p>
            </div>

            <div className={`card ${styles.featureCard}`}>
              <div className={styles.featureIconWrapper}>
                <FileImage size={24} />
              </div>
              <h3 className={styles.featureTitle}>{t.featSelectTitle}</h3>
              <p className={styles.featureDescription}>{t.featSelectDesc}</p>
            </div>

            <div className={`card ${styles.featureCard}`}>
              <div className={styles.featureIconWrapper}>
                <RotateCw size={24} />
              </div>
              <h3 className={styles.featureTitle}>{t.featFastTitle}</h3>
              <p className={styles.featureDescription}>{t.featFastDesc}</p>
            </div>

            <div className={`card ${styles.featureCard}`}>
              <div className={styles.featureIconWrapper}>
                <ShieldCheck size={24} />
              </div>
              <h3 className={styles.featureTitle}>{t.featClientTitle}</h3>
              <p className={styles.featureDescription}>{t.featClientDesc}</p>
            </div>

            <div className={`card ${styles.featureCard}`}>
              <div className={styles.featureIconWrapper}>
                <Cpu size={24} />
              </div>
              <h3 className={styles.featureTitle}>{t.featCleanTitle}</h3>
              <p className={styles.featureDescription}>{t.featCleanDesc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className={styles.useCasesSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{t.useCasesHeading}</h2>
            <p className={styles.sectionSubtitle}>{t.useCasesSubheading}</p>
          </div>

          <div className={styles.useCasesGrid}>
            <div className={styles.useCaseCard}>
              <div className={styles.useCaseIconBox}>
                <GraduationCap size={28} />
              </div>
              <h3 className={styles.useCaseTitle}>{t.uc1Title}</h3>
              <p className={styles.useCaseDesc}>{t.uc1Desc}</p>
            </div>

            <div className={styles.useCaseCard}>
              <div className={styles.useCaseIconBox}>
                <Briefcase size={28} />
              </div>
              <h3 className={styles.useCaseTitle}>{t.uc2Title}</h3>
              <p className={styles.useCaseDesc}>{t.uc2Desc}</p>
            </div>

            <div className={styles.useCaseCard}>
              <div className={styles.useCaseIconBox}>
                <Scale size={28} />
              </div>
              <h3 className={styles.useCaseTitle}>{t.uc3Title}</h3>
              <p className={styles.useCaseDesc}>{t.uc3Desc}</p>
            </div>

            <div className={styles.useCaseCard}>
              <div className={styles.useCaseIconBox}>
                <Users size={28} />
              </div>
              <h3 className={styles.useCaseTitle}>{t.uc4Title}</h3>
              <p className={styles.useCaseDesc}>{t.uc4Desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section: PDF Tools vs Others */}
      <section className={styles.comparisonSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{t.compHeading}</h2>
            <p className={styles.sectionSubtitle}>{t.compSubheading}</p>
          </div>

          <div className={styles.comparisonTableWrapper}>
            <table className={styles.comparisonTable}>
              <thead>
                <tr>
                  <th className={styles.colFeature}>{t.compColFeature}</th>
                  <th className={styles.colFusion}>{t.compColFusion}</th>
                  <th className={styles.colOthers}>{t.compColOthers}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={styles.cellFeature}>{t.compRow1Feature}</td>
                  <td className={styles.cellFusion}>
                    <div className={styles.fusionPositive}>
                      <Check size={16} />
                      <span>{t.compRow1Fusion}</span>
                    </div>
                  </td>
                  <td className={styles.cellOthers}>
                    <div className={styles.othersNegative}>
                      <X size={16} />
                      <span>{t.compRow1Others}</span>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td className={styles.cellFeature}>{t.compRow2Feature}</td>
                  <td className={styles.cellFusion}>
                    <div className={styles.fusionPositive}>
                      <Check size={16} />
                      <span>{t.compRow2Fusion}</span>
                    </div>
                  </td>
                  <td className={styles.cellOthers}>
                    <div className={styles.othersNegative}>
                      <X size={16} />
                      <span>{t.compRow2Others}</span>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td className={styles.cellFeature}>{t.compRow3Feature}</td>
                  <td className={styles.cellFusion}>
                    <div className={styles.fusionPositive}>
                      <Check size={16} />
                      <span>{t.compRow3Fusion}</span>
                    </div>
                  </td>
                  <td className={styles.cellOthers}>
                    <div className={styles.othersNegative}>
                      <X size={16} />
                      <span>{t.compRow3Others}</span>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td className={styles.cellFeature}>{t.compRow4Feature}</td>
                  <td className={styles.cellFusion}>
                    <div className={styles.fusionPositive}>
                      <Check size={16} />
                      <span>{t.compRow4Fusion}</span>
                    </div>
                  </td>
                  <td className={styles.cellOthers}>
                    <div className={styles.othersNegative}>
                      <X size={16} />
                      <span>{t.compRow4Others}</span>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td className={styles.cellFeature}>{t.compRow5Feature}</td>
                  <td className={styles.cellFusion}>
                    <div className={styles.fusionPositive}>
                      <Check size={16} />
                      <span>{t.compRow5Fusion}</span>
                    </div>
                  </td>
                  <td className={styles.cellOthers}>
                    <div className={styles.othersNegative}>
                      <X size={16} />
                      <span>{t.compRow5Others}</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* How It Works (3 Steps) */}
      <section className={styles.howItWorksSection} id="cara-kerja">
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{t.howHeading}</h2>
            <p className={styles.sectionSubtitle}>{t.howSubheading}</p>
          </div>

          <div className={styles.stepsGrid}>
            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>{t.step1Num}</div>
              <h3 className={styles.stepTitle}>{t.step1Title}</h3>
              <p className={styles.stepDescription}>{t.step1Desc}</p>
            </div>

            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>{t.step2Num}</div>
              <h3 className={styles.stepTitle}>{t.step2Title}</h3>
              <p className={styles.stepDescription}>{t.step2Desc}</p>
            </div>

            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>{t.step3Num}</div>
              <h3 className={styles.stepTitle}>{t.step3Title}</h3>
              <p className={styles.stepDescription}>{t.step3Desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive FAQ Section */}
      <section className={styles.faqSection} id="faq">
        <div className="container container-narrow">
          <div className={styles.sectionHeader}>
            <div className={styles.faqIconBadge}>
              <HelpCircle size={22} />
            </div>
            <h2 className={styles.sectionTitle}>{t.faqHeading}</h2>
          </div>

          <div className={styles.faqList}>
            {faqItems.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className={`${styles.faqItem} ${isOpen ? styles.faqItemOpen : ''}`}
                >
                  <button
                    className={styles.faqTrigger}
                    onClick={() => toggleFaq(index)}
                    aria-expanded={isOpen}
                  >
                    <span className={styles.faqQuestion}>{item.q}</span>
                    <ChevronDown
                      size={18}
                      className={`${styles.faqChevron} ${isOpen ? styles.faqChevronOpen : ''}`}
                    />
                  </button>
                  {isOpen && (
                    <div className={styles.faqContent}>
                      <p className={styles.faqAnswer}>{item.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner linking to /tools directory */}
      <section className={styles.bottomCtaSection}>
        <div className="container">
          <div className={styles.bottomCtaCard}>
            <div className={styles.bottomCtaGlow} />
            <h2 className={styles.bottomCtaTitle}>{t.bottomCtaTitle}</h2>
            <p className={styles.bottomCtaSubtitle}>{t.bottomCtaSubtitle}</p>
            <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1.5rem' }}>
              <Link href="/tools" className="btn btn-primary btn-lg">
                <Sparkles size={18} />
                <span>{t.bottomCtaBtn}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
