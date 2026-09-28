'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import {
  Scissors,
  Upload,
  Download,
  ExternalLink,
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Info,
  Check,
  Layers,
  Archive,
  X,
  FileText,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { splitPDF, parsePageRange } from '@/lib/pdf-splitter';
import { renderPageThumbnail } from '@/lib/pdf-thumbnail';
import { SplitMode, SplitProgress, SplitResult } from '@/types/split';
import { PDFDocument } from '@cantoo/pdf-lib';
import styles from './SplitWorkspace.module.css';

function formatBytes(bytes: number, decimals: number = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function formatPageRange(pages: number[]): string {
  if (pages.length === 0) return '';
  const sorted = [...pages].sort((a, b) => a - b);
  const ranges: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    if (current === prev + 1) {
      prev = current;
    } else {
      ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
      start = current;
      prev = current;
    }
  }
  ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
  return ranges.join(', ');
}

export default function SplitWorkspace() {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSplitting, setIsSplitting] = useState(false);
  const [progress, setProgress] = useState<SplitProgress>({ percentage: 0, statusText: '' });
  const [result, setResult] = useState<SplitResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Split Mode & Selection
  const [mode, setMode] = useState<SplitMode>('range');
  const [rangeInput, setRangeInput] = useState<string>('1');
  const [selectedPages, setSelectedPages] = useState<number[]>([1]);
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('Harap pilih berkas dengan format .pdf');
      return;
    }

    setErrorMsg(null);
    setSelectedFile(file);
    setResult(null);
    setThumbnails({});

    try {
      const buffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const pagesCount = pdf.getPageCount();
      setTotalPages(pagesCount);

      const initialPages = Array.from({ length: Math.min(pagesCount, 3) }, (_, i) => i + 1);
      setSelectedPages(initialPages);
      setRangeInput(formatPageRange(initialPages));
    } catch {
      setTotalPages(1);
      setSelectedPages([1]);
      setRangeInput('1');
    }
  };

  // Generate thumbnails progressively
  useEffect(() => {
    if (!selectedFile || totalPages === 0) return;

    let isMounted = true;
    const loadThumbs = async () => {
      // Prioritize first 12 pages for quick preview
      const maxToLoad = Math.min(totalPages, 24);
      for (let p = 1; p <= maxToLoad; p++) {
        if (!isMounted) break;
        try {
          const thumb = await renderPageThumbnail(selectedFile, p, 180);
          if (isMounted && thumb) {
            setThumbnails((prev) => ({ ...prev, [p]: thumb }));
          }
        } catch {
          // ignore thumb error
        }
      }
    };

    loadThumbs();
    return () => {
      isMounted = false;
    };
  }, [selectedFile, totalPages]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleRangeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setRangeInput(val);
    const parsed = parsePageRange(val, totalPages);
    setSelectedPages(parsed);
  };

  const togglePageSelection = (pageNum: number) => {
    let next: number[];
    if (selectedPages.includes(pageNum)) {
      next = selectedPages.filter((p) => p !== pageNum);
    } else {
      next = [...selectedPages, pageNum].sort((a, b) => a - b);
    }
    setSelectedPages(next);
    setRangeInput(formatPageRange(next));
  };

  const selectAllPages = () => {
    const all = Array.from({ length: totalPages }, (_, i) => i + 1);
    setSelectedPages(all);
    setRangeInput(formatPageRange(all));
  };

  const deselectAllPages = () => {
    setSelectedPages([]);
    setRangeInput('');
  };

  const handleStartSplit = async () => {
    if (!selectedFile) return;

    if (mode === 'range' && selectedPages.length === 0) {
      setErrorMsg('Pilih minimal satu halaman atau tentukan rentang halaman yang valid.');
      return;
    }

    setIsSplitting(true);
    setErrorMsg(null);
    setProgress({ percentage: 5, statusText: t.splittingStatus });

    try {
      const res = await splitPDF(
        selectedFile,
        {
          mode,
          rangeInput,
          selectedPages,
        },
        (p) => setProgress(p)
      );

      setResult(res);

      confetti({
        particleCount: 55,
        spread: 60,
        origin: { y: 0.65 },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memisahkan PDF';
      setErrorMsg(msg);
    } finally {
      setIsSplitting(false);
    }
  };

  const handleReset = () => {
    if (result) {
      result.files.forEach((f) => URL.revokeObjectURL(f.url));
      if (result.zipUrl) URL.revokeObjectURL(result.zipUrl);
    }
    setSelectedFile(null);
    setResult(null);
    setErrorMsg(null);
    setThumbnails({});
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownloadSingle = (fileUrl: string, fileName: string) => {
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadZip = () => {
    if (!result?.zipUrl || !result?.zipFileName) return;
    const a = document.createElement('a');
    a.href = result.zipUrl;
    a.download = result.zipFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className={styles.wrapper}>
      <div className="container">
        {/* Header */}
        <div className={styles.headerRow}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIconBox}>
              <Scissors size={26} className="text-primary" />
            </div>
            <div>
              <h1 className={styles.pageTitle}>{t.splitTitle}</h1>
              <p className={styles.pageSubtitle}>{t.splitSubtitle}</p>
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
            /* Dropzone */
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
              <h3 className={styles.dropzoneTitle}>{t.splitDropTitle}</h3>
              <p className={styles.dropzoneSubtitle}>{t.splitDropSubtitle}</p>
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
            /* Workspace Options */
            <div>
              <div className={styles.selectedFileCard}>
                <div className={styles.fileMetaLeft}>
                  <div className={styles.fileIconBox}>
                    <FileText size={22} />
                  </div>
                  <div>
                    <h4 className={styles.fileName}>{selectedFile.name}</h4>
                    <span className={styles.fileSpecs}>
                      {formatBytes(selectedFile.size)} • {totalPages} {t.pageSingular}
                    </span>
                  </div>
                </div>
                {!isSplitting && (
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

              {/* Mode Tabs */}
              <div className={styles.tabsRow}>
                <button
                  type="button"
                  className={`${styles.tabBtn} ${mode === 'range' ? styles.tabBtnActive : ''}`}
                  onClick={() => !isSplitting && setMode('range')}
                >
                  <Layers size={18} />
                  <span>{t.splitModeTabRange}</span>
                </button>
                <button
                  type="button"
                  className={`${styles.tabBtn} ${mode === 'all' ? styles.tabBtnActive : ''}`}
                  onClick={() => !isSplitting && setMode('all')}
                >
                  <Archive size={18} />
                  <span>{t.splitModeTabAll}</span>
                </button>
              </div>

              {/* Mode 1: Range Input & Visual Picker */}
              {mode === 'range' ? (
                <div>
                  <div className={styles.rangeInputSection}>
                    <label className={styles.rangeInputLabel}>{t.splitRangeInputLabel}</label>
                    <input
                      type="text"
                      className={styles.rangeTextInput}
                      value={rangeInput}
                      placeholder={t.splitRangeInputPlaceholder}
                      onChange={handleRangeInputChange}
                      disabled={isSplitting}
                    />
                    <span className={styles.rangeHint}>{t.splitRangeInputHint}</span>
                  </div>

                  {/* Visual Page Picker */}
                  <div>
                    <div className={styles.pickerHeader}>
                      <span className={styles.pickerTitle}>{t.splitVisualPickerTitle}</span>
                      <div className={styles.pickerActions}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={selectAllPages}
                          disabled={isSplitting}
                        >
                          <span>Pilih Semua</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={deselectAllPages}
                          disabled={isSplitting}
                        >
                          <span>Batalkan Semua</span>
                        </button>
                      </div>
                    </div>

                    <div className={styles.pickerGrid}>
                      {Array.from({ length: totalPages }, (_, idx) => {
                        const pageNum = idx + 1;
                        const isSelected = selectedPages.includes(pageNum);
                        const thumb = thumbnails[pageNum];

                        return (
                          <div
                            key={pageNum}
                            className={`${styles.pageCard} ${isSelected ? styles.pageCardActive : ''}`}
                            onClick={() => !isSplitting && togglePageSelection(pageNum)}
                          >
                            <div className={styles.pageThumbBox}>
                              {thumb ? (
                                <Image
                                  src={thumb}
                                  alt={`Halaman ${pageNum}`}
                                  width={120}
                                  height={140}
                                  unoptimized
                                  className={styles.pageThumbImg}
                                />
                              ) : (
                                <FileText size={28} className="text-muted" />
                              )}
                              <div className={styles.pageCheckbox}>
                                {isSelected && <Check size={13} />}
                              </div>
                            </div>
                            <span className={styles.pageNumLabel}>Hal {pageNum}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                /* Mode 2: Split All Pages Notice */
                <div className={styles.allPagesNotice}>
                  <Archive size={26} className={styles.noticeIcon} />
                  <p className={styles.noticeText}>
                    Dokumen ini akan dipecah menjadi <strong>{totalPages} berkas PDF individual</strong> (masing-masing 1 halaman).
                    Seluruh berkas akan otomatis dikemas ke dalam satu arsip ZIP siap unduh dengan 1 kali klik.
                  </p>
                </div>
              )}

              {/* Progress Bar */}
              {isSplitting && (
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
              {!isSplitting && (
                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                  <button
                    onClick={handleStartSplit}
                    className="btn btn-primary btn-lg"
                    style={{ minWidth: '240px' }}
                  >
                    <Scissors size={18} />
                    <span>{t.btnStartSplit}</span>
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
              <h2 className={styles.resultTitle}>{t.splitSuccessTitle}</h2>
              <p className={styles.resultSubtitle}>{t.splitSuccessSubtitle}</p>

              {/* Mode Range: 1 extracted file */}
              {result.mode === 'range' && result.files[0] && (
                <div style={{ marginBottom: '2rem' }}>
                  <div className={styles.filesList}>
                    <div className={styles.fileItem}>
                      <div>
                        <div className={styles.fileItemName}>{result.files[0].fileName}</div>
                        <div className={styles.fileItemSpecs}>
                          {formatBytes(result.files[0].fileSize)} • Halaman {result.files[0].pageRange}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownloadSingle(result.files[0].url, result.files[0].fileName)}
                        className="btn btn-primary btn-sm"
                      >
                        <Download size={15} />
                        <span>Unduh</span>
                      </button>
                    </div>
                  </div>

                  <div className={styles.resultActionGroup}>
                    <button
                      onClick={() => handleDownloadSingle(result.files[0].url, result.files[0].fileName)}
                      className="btn btn-primary btn-lg"
                    >
                      <Download size={18} />
                      <span>{t.btnDownloadExtractedPdf}</span>
                    </button>
                    <button
                      onClick={() => window.open(result.files[0].url, '_blank')}
                      className="btn btn-secondary"
                    >
                      <ExternalLink size={16} />
                      <span>{t.btnOpenNewTab}</span>
                    </button>
                    <button
                      onClick={handleReset}
                      className="btn btn-secondary"
                    >
                      <RotateCcw size={16} />
                      <span>{t.btnSplitAnother}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Mode All: ZIP and list */}
              {result.mode === 'all' && (
                <div>
                  <div style={{ marginBottom: '2rem' }}>
                    {result.zipUrl && (
                      <button
                        onClick={handleDownloadZip}
                        className="btn btn-primary btn-lg"
                        style={{ marginBottom: '1.5rem' }}
                      >
                        <Archive size={18} />
                        <span>{t.btnDownloadAllPagesZip} ({result.totalOutputFiles} Berkas)</span>
                      </button>
                    )}

                    <div className={styles.filesList}>
                      {result.files.map((f, i) => (
                        <div key={i} className={styles.fileItem}>
                          <div>
                            <div className={styles.fileItemName}>{f.fileName}</div>
                            <div className={styles.fileItemSpecs}>{formatBytes(f.fileSize)}</div>
                          </div>
                          <button
                            onClick={() => handleDownloadSingle(f.url, f.fileName)}
                            className="btn btn-secondary btn-sm"
                          >
                            <Download size={14} />
                            <span>Unduh</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={styles.resultActionGroup}>
                    <button
                      onClick={handleReset}
                      className="btn btn-secondary"
                    >
                      <RotateCcw size={16} />
                      <span>{t.btnSplitAnother}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
