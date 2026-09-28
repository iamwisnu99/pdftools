'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import {
  FileImage,
  Upload,
  Download,
  ExternalLink,
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Info,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Plus,
  Sliders,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { convertImagesToPdf } from '@/lib/image-to-pdf';
import {
  ImageItem,
  ImageToPdfOptions,
  ImageToPdfProgress,
  ImageToPdfResult,
  PageMargin,
  PageOrientation,
  PageSize,
} from '@/types/image-to-pdf';
import styles from './ImageToPdfWorkspace.module.css';

function formatBytes(bytes: number, decimals: number = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default function ImageToPdfWorkspace() {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMoreInputRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<ImageItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState<ImageToPdfProgress>({ percentage: 0, statusText: '' });
  const [result, setResult] = useState<ImageToPdfResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Settings
  const [pageSize, setPageSize] = useState<PageSize>('a4');
  const [orientation, setOrientation] = useState<PageOrientation>('auto');
  const [margin, setMargin] = useState<PageMargin>('small');

  const processFiles = (files: FileList | File[]) => {
    setErrorMsg(null);
    const validImages: File[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp)$/i.test(file.name)) {
        validImages.push(file);
      }
    }

    if (validImages.length === 0) {
      setErrorMsg('Harap pilih berkas gambar yang valid (JPG, PNG, WebP).');
      return;
    }

    const newItems: ImageItem[] = validImages.map((file, idx) => {
      const previewUrl = URL.createObjectURL(file);
      return {
        id: `${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 9)}`,
        file,
        previewUrl,
        name: file.name,
        size: file.size,
        width: 0,
        height: 0,
      };
    });

    setImages((prev) => [...prev, ...newItems]);
    setResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleMove = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    setImages((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const handleRemove = (id: string) => {
    setImages((prev) => {
      const item = prev.find((x) => x.id === id);
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((x) => x.id !== id);
    });
  };

  const handleClearAll = () => {
    images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    setResult(null);
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (addMoreInputRef.current) addMoreInputRef.current.value = '';
  };

  const handleStartConvert = async () => {
    if (images.length === 0) return;

    setIsConverting(true);
    setErrorMsg(null);
    setProgress({ percentage: 5, statusText: t.imageToPdfProcessing });

    const options: ImageToPdfOptions = {
      pageSize,
      orientation,
      margin,
    };

    try {
      const res = await convertImagesToPdf(images, options, (p) => {
        setProgress(p);
      });

      setResult(res);

      confetti({
        particleCount: 60,
        spread: 65,
        origin: { y: 0.65 },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengonversi gambar ke PDF';
      setErrorMsg(msg);
    } finally {
      setIsConverting(false);
    }
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

  return (
    <div className={styles.wrapper}>
      <div className="container">
        {/* Header */}
        <div className={styles.headerRow}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIconBox}>
              <FileImage size={26} className="text-primary" />
            </div>
            <div>
              <h1 className={styles.pageTitle}>{t.imageToPdfTitle}</h1>
              <p className={styles.pageSubtitle}>{t.imageToPdfSubtitle}</p>
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

          {images.length === 0 && !result ? (
            /* Dropzone */
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
                multiple
                accept="image/jpeg,image/png,image/webp,image/*"
                className={styles.fileInputHidden}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    processFiles(e.target.files);
                  }
                }}
              />
              <div className={styles.dropzoneIconWrapper}>
                <Upload size={32} />
              </div>
              <h3 className={styles.dropzoneTitle}>{t.imageToPdfDropTitle}</h3>
              <p className={styles.dropzoneSubtitle}>{t.imageToPdfDropSubtitle}</p>
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
            /* Queue & Settings View */
            <div>
              <div className={styles.queueActionBar}>
                <div className={styles.queueCountBadge}>
                  <FileImage size={18} className="text-primary" />
                  <span>{images.length} {t.imagesCountBadge}</span>
                </div>
                <div className={styles.queueBtns}>
                  <input
                    ref={addMoreInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/*"
                    className={styles.fileInputHidden}
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        processFiles(e.target.files);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => addMoreInputRef.current?.click()}
                    className="btn btn-secondary btn-sm"
                    disabled={isConverting}
                  >
                    <Plus size={15} />
                    <span>Tambah Gambar</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="btn btn-secondary btn-sm"
                    disabled={isConverting}
                  >
                    <RotateCcw size={14} />
                    <span>Reset</span>
                  </button>
                </div>
              </div>

              {/* Grid of uploaded images */}
              <div className={styles.imagesGrid}>
                {images.map((item, index) => (
                  <div key={item.id} className={styles.imageCard}>
                    <div className={styles.thumbWrapper}>
                      <span className={styles.imageBadgeIndex}>{index + 1}</span>
                      <Image
                        src={item.previewUrl}
                        alt={item.name}
                        width={180}
                        height={140}
                        unoptimized
                        className={styles.thumbImg}
                      />
                    </div>
                    <div className={styles.imageInfo}>
                      <h5 className={styles.imageName} title={item.name}>
                        {item.name}
                      </h5>
                      <span className={styles.imageSpecs}>{formatBytes(item.size)}</span>
                    </div>
                    <div className={styles.imageCardControls}>
                      <div style={{ display: 'flex', gap: '0.2rem' }}>
                        <button
                          type="button"
                          className={styles.controlBtn}
                          disabled={index === 0 || isConverting}
                          onClick={() => handleMove(index, 'left')}
                          title="Geser ke kiri / urutan sebelumnya"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <button
                          type="button"
                          className={styles.controlBtn}
                          disabled={index === images.length - 1 || isConverting}
                          onClick={() => handleMove(index, 'right')}
                          title="Geser ke kanan / urutan berikutnya"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                      <button
                        type="button"
                        className={`${styles.controlBtn} ${styles.btnDeleteImg}`}
                        disabled={isConverting}
                        onClick={() => handleRemove(item.id)}
                        title="Hapus gambar"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Settings Box */}
              <div className={styles.settingsBox}>
                <div className={styles.settingsSectionTitle}>
                  <Sliders size={18} className="text-primary" />
                  <span>Pengaturan Tata Letak Dokumen PDF</span>
                </div>

                <div className={styles.optionsRow}>
                  {/* Page Size */}
                  <div className={styles.optionGroup}>
                    <label className={styles.optionLabel}>{t.imageToPdfLabelPageSize}</label>
                    <div className={styles.segmentedControl}>
                      <button
                        type="button"
                        className={`${styles.segmentBtn} ${pageSize === 'a4' ? styles.segmentBtnActive : ''}`}
                        onClick={() => setPageSize('a4')}
                      >
                        A4 (Standar)
                      </button>
                      <button
                        type="button"
                        className={`${styles.segmentBtn} ${pageSize === 'fit' ? styles.segmentBtnActive : ''}`}
                        onClick={() => setPageSize('fit')}
                      >
                        Sesuai Gambar
                      </button>
                      <button
                        type="button"
                        className={`${styles.segmentBtn} ${pageSize === 'letter' ? styles.segmentBtnActive : ''}`}
                        onClick={() => setPageSize('letter')}
                      >
                        Letter
                      </button>
                    </div>
                  </div>

                  {/* Orientation */}
                  {pageSize !== 'fit' && (
                    <div className={styles.optionGroup}>
                      <label className={styles.optionLabel}>{t.imageToPdfLabelOrientation}</label>
                      <div className={styles.segmentedControl}>
                        <button
                          type="button"
                          className={`${styles.segmentBtn} ${orientation === 'auto' ? styles.segmentBtnActive : ''}`}
                          onClick={() => setOrientation('auto')}
                        >
                          Otomatis
                        </button>
                        <button
                          type="button"
                          className={`${styles.segmentBtn} ${orientation === 'portrait' ? styles.segmentBtnActive : ''}`}
                          onClick={() => setOrientation('portrait')}
                        >
                          Portrait
                        </button>
                        <button
                          type="button"
                          className={`${styles.segmentBtn} ${orientation === 'landscape' ? styles.segmentBtnActive : ''}`}
                          onClick={() => setOrientation('landscape')}
                        >
                          Landscape
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Margin */}
                  <div className={styles.optionGroup}>
                    <label className={styles.optionLabel}>{t.imageToPdfLabelMargin}</label>
                    <div className={styles.segmentedControl}>
                      <button
                        type="button"
                        className={`${styles.segmentBtn} ${margin === 'none' ? styles.segmentBtnActive : ''}`}
                        onClick={() => setMargin('none')}
                      >
                        Tanpa Margin
                      </button>
                      <button
                        type="button"
                        className={`${styles.segmentBtn} ${margin === 'small' ? styles.segmentBtnActive : ''}`}
                        onClick={() => setMargin('small')}
                      >
                        Kecil
                      </button>
                      <button
                        type="button"
                        className={`${styles.segmentBtn} ${margin === 'normal' ? styles.segmentBtnActive : ''}`}
                        onClick={() => setMargin('normal')}
                      >
                        Normal
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress */}
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
                    {progress.percentage}%
                  </span>
                </div>
              )}

              {/* Convert Button */}
              {!isConverting && (
                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                  <button
                    onClick={handleStartConvert}
                    className="btn btn-primary btn-lg"
                    style={{ minWidth: '260px' }}
                  >
                    <Zap size={18} />
                    <span>{t.btnStartImageToPdf}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Result State */
            <div className={styles.resultCard}>
              <div className={styles.resultSuccessIcon}>
                <CheckCircle2 size={34} />
              </div>
              <h2 className={styles.resultTitle}>{t.imageToPdfSuccessTitle}</h2>
              <p className={styles.resultSubtitle}>{t.imageToPdfSuccessSubtitle}</p>

              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>{t.imagesCountBadge}</div>
                  <div className={styles.statValue}>{result.totalImages}</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>{t.totalPdfSizeBadge}</div>
                  <div className={styles.statValue}>{formatBytes(result.fileSize)}</div>
                </div>
              </div>

              <div className={styles.resultActionGroup}>
                <button
                  onClick={handleDownload}
                  className="btn btn-primary btn-lg"
                >
                  <Download size={18} />
                  <span>{t.btnDownloadPdf}</span>
                </button>
                <button
                  onClick={handleOpenNewTab}
                  className="btn btn-secondary"
                >
                  <ExternalLink size={16} />
                  <span>{t.btnOpenNewTab}</span>
                </button>
                <button
                  onClick={handleClearAll}
                  className="btn btn-secondary"
                >
                  <RotateCcw size={16} />
                  <span>{t.btnConvertMoreImages}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
