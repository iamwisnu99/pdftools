'use client';

import React, { useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  FileText,
  Upload,
  Download,
  ExternalLink,
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Info,
  Sparkles,
  X,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { compressPDF } from '@/lib/pdf-compressor';
import { CompressionLevel, CompressProgress, CompressResult } from '@/types/compress';
import { PDFDocument } from 'pdf-lib';
import styles from './CompressWorkspace.module.css';

function formatBytes(bytes: number, decimals: number = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default function CompressWorkspace() {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>('recommended');
  const [preserveText, setPreserveText] = useState(true);
  const [progress, setProgress] = useState<CompressProgress>({ percentage: 0, statusText: '' });
  const [result, setResult] = useState<CompressResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('Harap pilih berkas dengan format .pdf');
      return;
    }

    setErrorMsg(null);
    setSelectedFile(file);
    setResult(null);

    // Baca total halaman secara cepat
    try {
      const buffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
      setPageCount(pdf.getPageCount());
    } catch {
      setPageCount(1);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleStartCompress = async () => {
    if (!selectedFile) return;

    setIsCompressing(true);
    setErrorMsg(null);
    setProgress({ percentage: 5, statusText: t.compressingStatus });

    try {
      const compressResult = await compressPDF(
        selectedFile,
        {
          level: compressionLevel,
          preserveText,
        },
        (p) => {
          setProgress(p);
        }
      );

      setResult(compressResult);

      if (compressResult.savedBytes > 0) {
        confetti({
          particleCount: 65,
          spread: 70,
          origin: { y: 0.65 },
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengompresi PDF';
      setErrorMsg(msg);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleReset = () => {
    if (result?.url) {
      URL.revokeObjectURL(result.url);
    }
    setSelectedFile(null);
    setResult(null);
    setErrorMsg(null);
    setProgress({ percentage: 0, statusText: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownload = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.url;
    a.download = result.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenNewTab = () => {
    if (!result) return;
    window.open(result.url, '_blank');
  };

  const getLevelLabel = (lvl: CompressionLevel) => {
    switch (lvl) {
      case 'extreme':
        return t.compressModeExtremeTitle;
      case 'recommended':
        return t.compressModeRecommendedTitle;
      case 'light':
        return t.compressModeLightTitle;
      case 'lossless':
        return t.compressModeLosslessTitle;
    }
  };

  return (
    <div className={styles.compressWrapper}>
      <div className="container">
        {/* Header */}
        <div className={styles.headerRow}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIconBox}>
              <Zap size={26} className="text-primary" />
            </div>
            <div>
              <h1 className={styles.pageTitle}>{t.compressTitle}</h1>
              <p className={styles.pageSubtitle}>{t.compressSubtitle}</p>
            </div>
          </div>
          <div className={styles.privacyBadge}>
            <ShieldCheck size={16} />
            <span>{t.privacyNoticePill}</span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className={styles.mainCard}>
          {errorMsg && (
            <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
              <Info size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {!selectedFile ? (
            /* Dropzone state */
            <div
              className={`${styles.dropzone} ${isDragging ? styles.dropzoneActive : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className={styles.fileInputHidden}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFile(e.target.files[0]);
                  }
                }}
              />
              <div className={styles.dropzoneIconWrapper}>
                <Upload size={32} />
              </div>
              <h3 className={styles.dropzoneTitle}>{t.compressDropTitle}</h3>
              <p className={styles.dropzoneSubtitle}>{t.compressDropSubtitle}</p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                <span>{t.dropzoneBrowse}</span>
              </button>
            </div>
          ) : !result ? (
            /* Selected File & Settings State */
            <div>
              <div className={styles.selectedFileCard}>
                <div className={styles.fileMetaLeft}>
                  <div className={styles.fileIconBox}>
                    <FileText size={22} />
                  </div>
                  <div>
                    <h4 className={styles.fileName}>{selectedFile.name}</h4>
                    <span className={styles.fileSpecs}>
                      {formatBytes(selectedFile.size)} • {pageCount} {t.pageSingular}
                    </span>
                  </div>
                </div>
                {!isCompressing && (
                  <button
                    onClick={handleReset}
                    className={styles.btnRemoveFile}
                    title="Ganti berkas"
                  >
                    <X size={15} />
                    <span>Ganti File</span>
                  </button>
                )}
              </div>

              {/* Compression Mode Selection Grid */}
              <div className={styles.settingsBox}>
                <div className={styles.settingsHeader}>
                  <div className={styles.settingsTitleRow}>
                    <Zap size={18} className="text-primary" />
                    <span>{t.compressModeTitle}</span>
                  </div>
                  <p className={styles.settingsSubtitle}>{t.compressModeSubtitle}</p>
                </div>

                <div className={styles.modeGrid}>
                  {/* Mode 1: Extreme */}
                  <div
                    className={`${styles.modeCard} ${compressionLevel === 'extreme' ? styles.modeCardActive : ''}`}
                    onClick={() => !isCompressing && setCompressionLevel('extreme')}
                  >
                    <div className={styles.modeCardTop}>
                      <div className={styles.modeIconBox}>
                        <Zap size={18} />
                      </div>
                      <span className={styles.modeBadge}>{t.compressModeExtremeBadge}</span>
                    </div>
                    <h4 className={styles.modeCardTitle}>{t.compressModeExtremeTitle}</h4>
                    <p className={styles.modeCardDesc}>{t.compressModeExtremeDesc}</p>
                  </div>

                  {/* Mode 2: Recommended */}
                  <div
                    className={`${styles.modeCard} ${compressionLevel === 'recommended' ? styles.modeCardActive : ''}`}
                    onClick={() => !isCompressing && setCompressionLevel('recommended')}
                  >
                    <div className={styles.modeCardTop}>
                      <div className={styles.modeIconBox}>
                        <Sparkles size={18} />
                      </div>
                      <span className={styles.modeBadge}>{t.compressModeRecommendedBadge}</span>
                    </div>
                    <h4 className={styles.modeCardTitle}>{t.compressModeRecommendedTitle}</h4>
                    <p className={styles.modeCardDesc}>{t.compressModeRecommendedDesc}</p>
                  </div>

                  {/* Mode 3: Light */}
                  <div
                    className={`${styles.modeCard} ${compressionLevel === 'light' ? styles.modeCardActive : ''}`}
                    onClick={() => !isCompressing && setCompressionLevel('light')}
                  >
                    <div className={styles.modeCardTop}>
                      <div className={styles.modeIconBox}>
                        <CheckCircle2 size={18} />
                      </div>
                      <span className={styles.modeBadge}>{t.compressModeLightBadge}</span>
                    </div>
                    <h4 className={styles.modeCardTitle}>{t.compressModeLightTitle}</h4>
                    <p className={styles.modeCardDesc}>{t.compressModeLightDesc}</p>
                  </div>

                  {/* Mode 4: Lossless */}
                  <div
                    className={`${styles.modeCard} ${compressionLevel === 'lossless' ? styles.modeCardActive : ''}`}
                    onClick={() => !isCompressing && setCompressionLevel('lossless')}
                  >
                    <div className={styles.modeCardTop}>
                      <div className={styles.modeIconBox}>
                        <ShieldCheck size={18} />
                      </div>
                      <span className={styles.modeBadge}>{t.compressModeLosslessBadge}</span>
                    </div>
                    <h4 className={styles.modeCardTitle}>{t.compressModeLosslessTitle}</h4>
                    <p className={styles.modeCardDesc}>{t.compressModeLosslessDesc}</p>
                  </div>
                </div>

                {/* Preserve Searchable Text Toggle (when not lossless) */}
                {compressionLevel !== 'lossless' && (
                  <div
                    className={styles.textToggleCard}
                    onClick={() => !isCompressing && setPreserveText(!preserveText)}
                  >
                    <input
                      type="checkbox"
                      id="preserveTextCheckbox"
                      className={styles.textToggleCheckbox}
                      checked={preserveText}
                      disabled={isCompressing}
                      onChange={(e) => setPreserveText(e.target.checked)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div>
                      <label htmlFor="preserveTextCheckbox" className={styles.textToggleLabel}>
                        {t.compressPreserveTextTitle}
                      </label>
                      <span className={styles.textToggleHint}>
                        {t.compressPreserveTextDesc}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Progress Bar when compressing */}
              {isCompressing && (
                <div className={styles.progressSection}>
                  <div className={styles.progressStatusText}>{progress.statusText}</div>
                  <div className={styles.progressBarTrack}>
                    <div
                      className={styles.progressBarFill}
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {progress.percentage}%
                  </span>
                </div>
              )}

              {/* Action Button */}
              {!isCompressing && (
                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                  <button
                    onClick={handleStartCompress}
                    className="btn btn-primary btn-lg"
                    style={{ minWidth: '240px' }}
                  >
                    <Zap size={18} />
                    <span>{t.btnStartCompress}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Result State */
            <div className={styles.resultCard}>
              <div className={styles.resultHeader}>
                <div className={styles.resultSuccessIcon}>
                  <CheckCircle2 size={34} />
                </div>
                <h2 className={styles.resultTitle}>{t.compressSuccessTitle}</h2>
                <p className={styles.resultSubtitle}>{t.compressSuccessSubtitle}</p>
                <div style={{ marginTop: '0.75rem' }}>
                  <span className={styles.levelTag}>
                    <Sparkles size={14} />
                    <span>Profil: {getLevelLabel(result.level)}</span>
                  </span>
                </div>
              </div>

              {/* Statistics Grid */}
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>{t.compressOriginalSize}</div>
                  <div className={styles.statValue}>{formatBytes(result.originalSize)}</div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statLabel}>{t.compressNewSize}</div>
                  <div className={`${styles.statValue} ${styles.statValueHighlight}`}>
                    {formatBytes(result.compressedSize)}
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statLabel}>{t.compressSaved}</div>
                  <div className={`${styles.statValue} ${styles.statValueHighlight}`}>
                    {result.savedPercentage > 0
                      ? `-${result.savedPercentage}% (${formatBytes(result.savedBytes)})`
                      : 'Optimal'}
                  </div>
                </div>
              </div>

              {/* Info if already optimized */}
              {result.isAlreadyOptimized && (
                <div className={styles.noticeAlreadyOptimized}>
                  <Info size={20} className={styles.noticeIcon} />
                  <div>
                    <h5 className={styles.noticeHeading}>{t.compressOptimizedNoticeTitle}</h5>
                    <p className={styles.noticeText}>{t.compressOptimizedNoticeDesc}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className={styles.resultActionGroup}>
                <button
                  onClick={handleDownload}
                  className={`btn btn-primary btn-lg ${styles.btnDownloadPrimary}`}
                >
                  <Download size={18} />
                  <span>{t.btnDownloadCompressed}</span>
                </button>

                <button
                  onClick={handleOpenNewTab}
                  className={`btn btn-secondary ${styles.btnSecondaryAction}`}
                >
                  <ExternalLink size={16} />
                  <span>{t.btnOpenNewTab}</span>
                </button>

                <button
                  onClick={handleReset}
                  className={`btn btn-secondary ${styles.btnSecondaryAction}`}
                >
                  <RotateCcw size={16} />
                  <span>{t.btnCompressAnother}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
