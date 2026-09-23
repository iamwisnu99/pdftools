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
      {/* Smooth Background Ambient Glow */}
      <div className={styles.ambientMeshContainer} aria-hidden="true">
        <div className={styles.ambientBlob1} />
        <div className={styles.ambientBlob2} />
        <div className={styles.ambientBlob3} />
        <div className={styles.ambientGrid} />
      </div>

      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className="container">
          <h1 className={styles.heroTitle}>
            {t.heroTitlePart1}
            <span className="text-gradient">{t.heroTitleGradient}</span>
          </h1>

          <p className={styles.heroSubtitle}>{t.heroSubtitle}</p>

          <div className={styles.heroCtaGroup}>
            <Link href="/tools" className={`btn btn-primary btn-lg ${styles.mainCtaBtn}`}>
              <span>{t.heroCtaStart}</span>
              <ArrowRight size={18} />
            </Link>
            <a href="#peralatan" className="btn btn-secondary btn-lg">
              {t.heroCtaCatalog}
            </a>
          </div>

          {/* Micro Trust Indicators */}
          <div className={styles.trustPills}>
            <div className={styles.trustItem}>
              <FileText size={16} className={styles.trustIconAccent} />
              <span>{t.trustQuality}</span>
            </div>
            <div className={styles.trustDot} />
            <div className={styles.trustItem}>
              <Zap size={16} className={styles.trustIconAccent} />
              <span>{t.trustInstant}</span>
            </div>
            <div className={styles.trustDot} />
            <div className={styles.trustItem}>
              <Layers size={16} className={styles.trustIconAccent} />
              <span>{t.trustRotate}</span>
            </div>
            <div className={styles.trustDot} />
            <div className={styles.trustItem}>
              <CheckCircle2 size={16} className={styles.trustIconSuccess} />
              <span>{t.trustNoLimits}</span>
            </div>
          </div>

          {/* Visual Showcase Card with Interactive Multi-Tool Tabs */}
          <div className={styles.heroShowcaseWrapper}>
            <div className={styles.showcaseCard}>
              <div className={styles.showcaseHeader}>
                <div className={styles.showcaseDots}>
                  <span className={styles.dotRed} />
                  <span className={styles.dotYellow} />
                  <span className={styles.dotGreen} />
                </div>
                <div className={styles.showcaseTitleBar}>
                  <Lock size={12} />
                  <span>PDF Tools Local Sandbox • High Speed Engine</span>
                </div>
                <div className={styles.showcaseBadgePulse}>
                  <span className={styles.pulseDot} />
                  <span>Ready</span>
                </div>
              </div>

              {/* Showcase Tab Selector */}
              <div className={styles.showcaseTabs}>
                <button
                  type="button"
                  onClick={() => setShowcaseTab('merge')}
                  className={`${styles.showcaseTabBtn} ${
                    showcaseTab === 'merge' ? styles.showcaseTabBtnActive : ''
                  }`}
                >
                  <Layers size={14} />
                  <span>{t.showcaseTabMerge}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowcaseTab('compress')}
                  className={`${styles.showcaseTabBtn} ${
                    showcaseTab === 'compress' ? styles.showcaseTabBtnActive : ''
                  }`}
                >
                  <Zap size={14} />
                  <span>{t.showcaseTabCompress}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowcaseTab('image')}
                  className={`${styles.showcaseTabBtn} ${
                    showcaseTab === 'image' ? styles.showcaseTabBtnActive : ''
                  }`}
                >
                  <FileImage size={14} />
                  <span>{t.showcaseTabImage}</span>
                </button>
              </div>

              {/* Dynamic Showcase Body depending on active tab */}
              {showcaseTab === 'merge' && (
                <div className={styles.showcaseBody}>
                  {/* Left: Input File Stack */}
                  <div className={styles.inputStack}>
                    <div className={`${styles.docCard} ${styles.docCard1}`}>
                      <div className={styles.docIconBox}>
                        <FileText size={18} />
                      </div>
                      <div className={styles.docInfo}>
                        <span className={styles.docName}>{t.heroMockupDoc1}</span>
                        <span className={styles.docMeta}>4 Halaman • 850 KB</span>
                      </div>
                      <span className={styles.docOrderTag}>#1</span>
                    </div>

                    <div className={`${styles.docCard} ${styles.docCard2}`}>
                      <div className={styles.docIconBox}>
                        <FileText size={18} />
                      </div>
                      <div className={styles.docInfo}>
                        <span className={styles.docName}>{t.heroMockupDoc2}</span>
                        <span className={styles.docMeta}>7 Halaman • 1.2 MB</span>
                      </div>
                      <span className={styles.docOrderTag}>#2</span>
                    </div>

                    <div className={`${styles.docCard} ${styles.docCard3}`}>
                      <div className={styles.docIconBox}>
                        <FileText size={18} />
                      </div>
                      <div className={styles.docInfo}>
                        <span className={styles.docName}>{t.heroMockupDoc3}</span>
                        <span className={styles.docMeta}>7 Halaman • 420 KB</span>
                      </div>
                      <span className={styles.docOrderTag}>#3</span>
                    </div>
                  </div>

                  {/* Center: Connector */}
                  <div className={styles.fusionConnector}>
                    <div className={styles.connectorLine} />
                    <div className={styles.fusionNode}>
                      <Layers size={22} className={styles.fusionNodeIcon} />
                    </div>
                    <div className={styles.connectorLine} />
                  </div>

                  {/* Right: Merged Output Document */}
                  <div className={styles.outputStack}>
                    <div className={styles.outputDocCard}>
                      <div className={styles.outputGlow} />
                      <div className={styles.outputTop}>
                        <div className={styles.outputBadge}>
                          <CheckCircle2 size={15} />
                          <span>{t.heroMockupBadge}</span>
                        </div>
                      </div>
                      <div className={styles.outputIconWrapper}>
                        <FileCheck size={36} />
                      </div>
                      <h4 className={styles.outputTitle}>{t.heroMockupMerged}</h4>
                      <p className={styles.outputSubtitle}>
                        {t.heroMockupPages} • 2.47 MB • Quality 100%
                      </p>
                      <Link
                        href="/merge"
                        className={`btn btn-primary btn-sm ${styles.outputActionBtn}`}
                      >
                        <span>{t.toolCardMergeCta}</span>
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {showcaseTab === 'compress' && (
                <div className={styles.showcaseBody}>
                  {/* Left: Uncompressed file */}
                  <div className={styles.outputDocCard} style={{ maxWidth: '280px', width: '100%' }}>
                    <div className={styles.outputTop}>
                      <span className={styles.docOrderTag}>Sebelum</span>
                    </div>
                    <div className={styles.docIconBox} style={{ width: '48px', height: '48px', margin: '0.5rem auto' }}>
                      <FileText size={26} />
                    </div>
                    <h4 className={styles.outputTitle}>Laporan_Keuangan_Tahunan.pdf</h4>
                    <p className={styles.outputSubtitle} style={{ color: 'var(--text-muted)' }}>
                      {t.showcaseCompressBefore}
                    </p>
                  </div>

                  {/* Center: Compressor engine */}
                  <div className={styles.fusionConnector}>
                    <div className={styles.connectorLine} />
                    <div className={styles.fusionNode} style={{ background: 'rgba(220, 38, 38, 0.15)', color: 'var(--primary)' }}>
                      <Zap size={22} />
                    </div>
                    <div className={styles.connectorLine} />
                  </div>

                  {/* Right: Compressed Result */}
                  <div className={styles.outputDocCard} style={{ maxWidth: '300px', width: '100%' }}>
                    <div className={styles.outputGlow} />
                    <div className={styles.outputTop}>
                      <div className={styles.outputBadge}>
                        <Sparkles size={14} />
                        <span>Lossless -66%</span>
                      </div>
                    </div>
                    <div className={styles.outputIconWrapper}>
                      <FileCheck size={36} />
                    </div>
                    <h4 className={styles.outputTitle}>Laporan_Keuangan_compressed.pdf</h4>
                    <p className={styles.outputSubtitle} style={{ color: '#10b981', fontWeight: 700 }}>
                      {t.showcaseCompressAfter}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                      {t.showcaseCompressQuality}
                    </p>
                    <Link
                      href="/compress"
                      className={`btn btn-primary btn-sm ${styles.outputActionBtn}`}
                    >
                      <span>{t.toolCardCompressCta}</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              )}

              {showcaseTab === 'image' && (
                <div className={styles.showcaseBody}>
                  {/* Left: Input PDF */}
                  <div className={styles.outputDocCard} style={{ maxWidth: '280px', width: '100%' }}>
                    <div className={styles.outputTop}>
                      <span className={styles.docOrderTag}>Input PDF</span>
                    </div>
                    <div className={styles.docIconBox} style={{ width: '48px', height: '48px', margin: '0.5rem auto' }}>
                      <FileText size={26} />
                    </div>
                    <h4 className={styles.outputTitle}>Proposal_Desain_Arsitektur.pdf</h4>
                    <p className={styles.outputSubtitle}>12 Halaman Vektor</p>
                  </div>

                  {/* Center: Image Converter Engine */}
                  <div className={styles.fusionConnector}>
                    <div className={styles.connectorLine} />
                    <div className={styles.fusionNode} style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
                      <FileImage size={22} />
                    </div>
                    <div className={styles.connectorLine} />
                  </div>

                  {/* Right: Converted Images */}
                  <div className={styles.outputDocCard} style={{ maxWidth: '300px', width: '100%' }}>
                    <div className={styles.outputGlow} />
                    <div className={styles.outputTop}>
                      <div className={styles.outputBadge}>
                        <CheckCircle2 size={14} />
                        <span>300 DPI HD</span>
                      </div>
                    </div>
                    <div className={styles.outputIconWrapper}>
                      <Archive size={36} />
                    </div>
                    <h4 className={styles.outputTitle}>Proposal_images_png.zip</h4>
                    <p className={styles.outputSubtitle} style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                      12 Gambar HD Siap Unduh
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                      {t.showcaseImageZip}
                    </p>
                    <Link
                      href="/pdf-to-image"
                      className={`btn btn-primary btn-sm ${styles.outputActionBtn}`}
                    >
                      <span>{t.toolCardPdfToImageCta}</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              )}
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
