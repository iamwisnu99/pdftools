'use client';

import React, { useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  FileImage,
  Upload,
  Download,
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Info,
  Layers,
  Sparkles,
  X,
  Archive,
  Image as ImageIcon,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import {
  convertPdfToImages,
  createImagesZip,
  triggerFileDownload,
} from '@/lib/pdf-to-image';
import {
  ConvertedPage,
  ConvertProgress,
  ImageFormat,
  ImageQuality,
} from '@/types/image-converter';
import { PDFDocument } from 'pdf-lib';
import styles from './PdfToImageWorkspace.module.css';

function formatBytes(bytes: number, decimals: number = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function parsePageRange(rangeStr: string, maxPages: number): number[] {
  if (!rangeStr.trim()) {
    return Array.from({ length: maxPages }, (_, i) => i + 1);
  }

  const pages = new Set<number>();
  const parts = rangeStr.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.includes('-')) {
      const [startStr, endStr] = trimmed.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        const min = Math.max(1, Math.min(start, end));
        const max = Math.min(maxPages, Math.max(start, end));
        for (let p = min; p <= max; p++) {
          pages.add(p);
        }
      }
    } else {
      const p = parseInt(trimmed, 10);
      if (!isNaN(p) && p >= 1 && p <= maxPages) {
        pages.add(p);
      }
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
}

export default function PdfToImageWorkspace() {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);

  // Settings
  const [format, setFormat] = useState<ImageFormat>('png');
  const [quality, setQuality] = useState<ImageQuality>('standard');
  const [rangeMode, setRangeMode] = useState<'all' | 'custom'>('all');
  const [customRange, setCustomRange] = useState<string>('');

  // Process & Results
  const [isConverting, setIsConverting] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [progress, setProgress] = useState<ConvertProgress>({
    currentPage: 0,
    totalPages: 0,
    percentage: 0,
    statusText: '',
  });
  const [convertedPages, setConvertedPages] = useState<ConvertedPage[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('Harap pilih berkas dengan format .pdf');
      return;
    }

    setErrorMsg(null);
    setSelectedFile(file);
    setConvertedPages([]);

    try {
      const buffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
      setTotalPages(pdf.getPageCount());
    } catch {
      setTotalPages(1);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleStartConvert = async () => {
    if (!selectedFile) return;

    setIsConverting(true);
    setErrorMsg(null);

    const pagesToConvert =
      rangeMode === 'custom' && customRange.trim()
        ? parsePageRange(customRange, totalPages)
        : undefined;

    try {
      const results = await convertPdfToImages(
        selectedFile,
        {
          format,
          quality,
          selectedPages: pagesToConvert,
        },
        (p) => setProgress(p)
      );

      setConvertedPages(results);

      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.65 },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengonversi PDF ke gambar';
      setErrorMsg(msg);
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownloadSingle = (page: ConvertedPage) => {
    triggerFileDownload(page.blob, page.fileName);
  };

  const handleDownloadAllZip = async () => {
    if (convertedPages.length === 0 || !selectedFile) return;

    setIsZipping(true);
    try {
      const baseName = selectedFile.name.replace(/\.[^/.]+$/, '');
      const zipFileName = `${baseName}_images_${format}.zip`;
      const zipBlob = await createImagesZip(convertedPages, zipFileName);
      triggerFileDownload(zipBlob, zipFileName);
    } catch (err) {
      console.error('Failed to create ZIP', err);
    } finally {
      setIsZipping(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setConvertedPages([]);
    setErrorMsg(null);
    setCustomRange('');
    setRangeMode('all');
    setProgress({ currentPage: 0, totalPages: 0, percentage: 0, statusText: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={styles.converterWrapper}>
      <div className="container">
        {/* Header */}
        <div className={styles.headerRow}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIconBox}>
              <FileImage size={26} className="text-primary" />
            </div>
            <div>
              <h1 className={styles.pageTitle}>{t.pdfToImageTitle}</h1>
              <p className={styles.pageSubtitle}>{t.pdfToImageSubtitle}</p>
            </div>
          </div>
          <div className={styles.privacyBadge}>
            <ShieldCheck size={16} />
            <span>{t.privacyNoticePill}</span>
          </div>
        </div>

        {/* Main Card */}
        <div className={styles.mainCard}>
          {errorMsg && (
            <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
              <Info size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {!selectedFile ? (
            /* Dropzone State */
            <div
              className={`${styles.dropzone} ${isDragging ? styles.dropzoneActive : ''}`}
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
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
              <h3 className={styles.dropzoneTitle}>{t.pdfToImageDropTitle}</h3>
              <p className={styles.dropzoneSubtitle}>{t.pdfToImageDropSubtitle}</p>
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
          ) : convertedPages.length === 0 ? (
            /* File Selected & Configuration State */
            <div>
              <div className={styles.selectedFileCard}>
                <div className={styles.fileMetaLeft}>
                  <div className={styles.fileIconBox}>
                    <ImageIcon size={22} />
                  </div>
                  <div>
                    <h4 className={styles.fileName}>{selectedFile.name}</h4>
                    <span className={styles.fileSpecs}>
                      {formatBytes(selectedFile.size)} • {totalPages} {t.pageSingular}
                    </span>
                  </div>
                </div>
                {!isConverting && (
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

              {/* Conversion Settings Grid */}
              <div className={styles.optionsGrid}>
                {/* 1. Format Option */}
                <div className={styles.optionSection}>
                  <label className={styles.optionLabel}>{t.labelFormat}</label>
                  <div className={styles.formatSelector}>
                    {(['png', 'jpg', 'webp'] as ImageFormat[]).map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        className={`${styles.formatBtn} ${
                          format === fmt ? styles.formatBtnActive : ''
                        }`}
                        onClick={() => setFormat(fmt)}
                      >
                        <span className={styles.formatName}>{fmt.toUpperCase()}</span>
                        <span className={styles.formatSub}>
                          {fmt === 'png' ? 'Lossless' : fmt === 'jpg' ? 'Ringan' : 'Modern'}
                        </span>
                      </button>
                    ))}
                  </div>
                  <p className={styles.formatHintText}>
                    {format === 'png'
                      ? t.formatPngHint
                      : format === 'jpg'
                      ? t.formatJpgHint
                      : t.formatWebpHint}
                  </p>
                </div>

                {/* 2. Quality Option */}
                <div className={styles.optionSection}>
                  <label className={styles.optionLabel}>{t.labelQuality}</label>
                  <div className={styles.qualitySelector}>
                    <div
                      className={`${styles.qualityCard} ${
                        quality === 'standard' ? styles.qualityCardActive : ''
                      }`}
                      onClick={() => setQuality('standard')}
                    >
                      <div className={styles.qualityTitleRow}>
                        <span className={styles.qualityTitle}>{t.qualityStandardTitle}</span>
                        {quality === 'standard' && <CheckCircle2 size={16} color="var(--primary)" />}
                      </div>
                      <p className={styles.qualityDesc}>{t.qualityStandardDesc}</p>
                    </div>

                    <div
                      className={`${styles.qualityCard} ${
                        quality === 'high' ? styles.qualityCardActive : ''
                      }`}
                      onClick={() => setQuality('high')}
                    >
                      <div className={styles.qualityTitleRow}>
                        <span className={styles.qualityTitle}>{t.qualityHighTitle}</span>
                        {quality === 'high' && <CheckCircle2 size={16} color="var(--primary)" />}
                      </div>
                      <p className={styles.qualityDesc}>{t.qualityHighDesc}</p>
                    </div>
                  </div>
                </div>

                {/* 3. Page Selection */}
                <div className={styles.optionSection}>
                  <label className={styles.optionLabel}>{t.labelPageRange}</label>
                  <div className={styles.pageSelectionRow}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="rangeMode"
                        checked={rangeMode === 'all'}
                        onChange={() => setRangeMode('all')}
                      />
                      <span>{t.rangeAllPages} ({totalPages} hal)</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="rangeMode"
                        checked={rangeMode === 'custom'}
                        onChange={() => setRangeMode('custom')}
                      />
                      <span>{t.rangeCustom}</span>
                    </label>

                    {rangeMode === 'custom' && (
                      <input
                        type="text"
                        placeholder="Contoh: 1-3, 5"
                        value={customRange}
                        onChange={(e) => setCustomRange(e.target.value)}
                        className={styles.rangeInput}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Progress Section */}
              {isConverting && (
                <div className={styles.progressSection}>
                  <div className={styles.progressStatusText}>{progress.statusText}</div>
                  <div className={styles.progressBarTrack}>
                    <div
                      className={styles.progressBarFill}
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {progress.currentPage} / {progress.totalPages} Halaman ({progress.percentage}%)
                  </span>
                </div>
              )}

              {/* Action Button */}
              {!isConverting && (
                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <button
                    onClick={handleStartConvert}
                    className="btn btn-primary btn-lg"
                    style={{ minWidth: '240px' }}
                  >
                    <Zap size={18} />
                    <span>{t.btnStartConvert}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Results Gallery State */
            <div>
              <div className={styles.resultHeaderRow}>
                <div className={styles.resultTitleSection}>
                  <h2>{t.convertSuccessTitle}</h2>
                  <p>
                    {convertedPages.length} {t.pageSingular} dikonversi ke format{' '}
                    <strong style={{ textTransform: 'uppercase' }}>{format}</strong> (
                    {quality === 'high' ? 'High 300 DPI' : 'Standard 150 DPI'})
                  </p>
                </div>

                <div className={styles.galleryActions}>
                  <button
                    onClick={handleDownloadAllZip}
                    disabled={isZipping}
                    className="btn btn-primary"
                  >
                    <Archive size={16} />
                    <span>{isZipping ? 'Mengompres ZIP...' : t.btnDownloadAllZip}</span>
                  </button>

                  <button onClick={handleReset} className="btn btn-secondary">
                    <RotateCcw size={16} />
                    <span>{t.btnConvertAnother}</span>
                  </button>
                </div>
              </div>

              {/* Gallery Grid */}
              <div className={styles.galleryGrid}>
                {convertedPages.map((page) => (
                  <div key={page.pageNumber} className={styles.imageCard}>
                    <div className={styles.imagePreviewWrapper}>
                      <span className={styles.pageTag}>
                        {t.pageLabelBadge} {page.pageNumber}
                      </span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={page.dataUrl}
                        alt={`Halaman ${page.pageNumber}`}
                        className={styles.imagePreviewImg}
                      />
                    </div>
                    <div className={styles.imageCardBody}>
                      <div className={styles.imageCardMeta}>
                        <span>{page.width} &times; {page.height} px</span>
                        <span>{formatBytes(page.sizeBytes)}</span>
                      </div>
                      <button
                        onClick={() => handleDownloadSingle(page)}
                        className={`btn btn-secondary ${styles.btnDownloadSingle}`}
                      >
                        <Download size={14} />
                        <span>{t.btnDownloadSingleImage}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
