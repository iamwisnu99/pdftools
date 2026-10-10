'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  UploadCloud,
  CheckCircle2,
  Download,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  ChevronUp,
  ChevronDown,
  Info,
  ArrowRight,
  ArrowRightCircle,
  Maximize2,
  Type,
  Replace,
  ShieldCheck,
  Layers,
  Check,
  MousePointerClick,
  Minus,
  Plus,
  Bold,
  Italic,
  FileText,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  SlidersHorizontal,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useLanguage } from '@/context/LanguageContext';
import {
  extractPdfTextForEditing,
  ParsedPdfForEdit,
  TextBlock,
} from './pdfTextExtractor';
import { applyEditsToPdf } from './pdfTextEditor';
import styles from './EditPdfWorkspace.module.css';

function getFontCssFamily(pdfFont: string): string {
  if (pdfFont === 'TimesRoman') return "'Times New Roman', 'Times', serif";
  if (pdfFont === 'Courier') return "'Courier New', 'Courier', monospace";
  return "'Helvetica Neue', Helvetica, Arial, sans-serif";
}

export default function EditPdfWorkspace() {
  const { locale } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedPdfForEdit | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // Canvas Dimensions
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  // Loading & Progress
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingProgress, setLoadingProgress] = useState({ percent: 0, status: '' });

  // Zoom
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Find & Replace
  const [findText, setFindText] = useState<string>('');
  const [replaceText, setReplaceText] = useState<string>('');
  const [matchCase, setMatchCase] = useState<boolean>(false);

  // Saving state
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [savedFileSize, setSavedFileSize] = useState<string>('');

  // Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const originalBufferRef = useRef<ArrayBuffer | null>(null);
  const pdfDocRef = useRef<any>(null);
  const renderTaskRef = useRef<any>(null);

  // Handle File Selection
  const handleFileChange = async (selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
      alert('Harap pilih berkas dokumen berformat PDF.');
      return;
    }

    try {
      setIsLoading(true);
      setFile(selectedFile);
      setDownloadUrl(null);
      setEditingBlockId(null);
      setCurrentPageIndex(0);

      const result = await extractPdfTextForEditing(
        selectedFile,
        (percent, status) => {
          setLoadingProgress({ percent, status });
        }
      );

      originalBufferRef.current = result.arrayBuffer;
      pdfDocRef.current = result.pdfDoc;
      setParsedData(result.parsed);
    } catch (err: any) {
      console.error('Gagal mengekstrak teks PDF:', err);
      alert('Gagal membaca dokumen PDF: ' + (err.message || 'Format tidak didukung'));
      setFile(null);
      setParsedData(null);
      pdfDocRef.current = null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Render Current Page onto Canvas
  const renderCurrentPage = useCallback(async () => {
    if (!pdfDocRef.current || !canvasRef.current) return;

    try {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }

      const pdf = pdfDocRef.current;
      const page = await pdf.getPage(currentPageIndex + 1);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Base scale 1.6 untuk resolusi teks tajam di layar HD
      const baseScale = 1.6 * (zoomLevel / 100);
      const viewport = page.getViewport({ scale: baseScale });

      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
      canvas.width = viewport.width * dpr;
      canvas.height = viewport.height * dpr;
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      setCanvasSize({ width: viewport.width, height: viewport.height });

      ctx.scale(dpr, dpr);

      const renderContext = {
        canvasContext: ctx,
        viewport,
        canvas,
      };

      const task = (page as any).render(renderContext);
      renderTaskRef.current = task;
      await task.promise;
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        console.error('Gagal merender halaman PDF:', err);
      }
    }
  }, [currentPageIndex, zoomLevel]);

  useEffect(() => {
    if (parsedData && pdfDocRef.current) {
      renderCurrentPage();
    }
  }, [parsedData, currentPageIndex, zoomLevel, renderCurrentPage]);

  // Update Block Properties (Teks, Font Family, Font Size, Bold, Italic)
  const handleUpdateBlockProperty = (
    blockId: string,
    updates: Partial<TextBlock>
  ) => {
    if (!parsedData) return;

    setParsedData((prev) => {
      if (!prev) return prev;
      const updatedPages = prev.pages.map((page) => {
        const updatedBlocks = page.blocks.map((block) => {
          if (block.id === blockId) {
            const nextBlock = { ...block, ...updates };
            const isTextDiff = nextBlock.currentText !== nextBlock.originalText;
            const isModified =
              isTextDiff ||
              nextBlock.isBold !== block.isBold ||
              nextBlock.isItalic !== block.isItalic ||
              nextBlock.fontSize !== block.fontSize ||
              nextBlock.fontFamily !== block.fontFamily;

            return {
              ...nextBlock,
              isModified: isModified || block.isModified,
            };
          }
          return block;
        });
        return { ...page, blocks: updatedBlocks };
      });
      return { ...prev, pages: updatedPages };
    });
  };

  // Reset Individual Block
  const handleResetBlock = (blockId: string) => {
    if (!parsedData) return;

    setParsedData((prev) => {
      if (!prev) return prev;
      const updatedPages = prev.pages.map((page) => {
        const updatedBlocks = page.blocks.map((block) => {
          if (block.id === blockId) {
            return {
              ...block,
              currentText: block.originalText,
              isModified: false,
            };
          }
          return block;
        });
        return { ...page, blocks: updatedBlocks };
      });
      return { ...prev, pages: updatedPages };
    });
  };

  // Reset All Blocks
  const handleResetAll = () => {
    if (!parsedData) return;
    if (!confirm('Apakah Anda yakin ingin membatalkan semua perubahan teks di seluruh dokumen?')) {
      return;
    }

    setParsedData((prev) => {
      if (!prev) return prev;
      const updatedPages = prev.pages.map((page) => ({
        ...page,
        blocks: page.blocks.map((b) => ({
          ...b,
          currentText: b.originalText,
          isModified: false,
        })),
      }));
      return { ...prev, pages: updatedPages };
    });
    setEditingBlockId(null);
  };

  // Find & Replace Handler
  const handleFindReplace = (scope: 'page' | 'all') => {
    if (!parsedData || !findText.trim()) return;

    let totalReplaced = 0;

    setParsedData((prev) => {
      if (!prev) return prev;

      const updatedPages = prev.pages.map((page, pIdx) => {
        if (scope === 'page' && pIdx !== currentPageIndex) return page;

        const updatedBlocks = page.blocks.map((block) => {
          let hasMatch = false;
          let newText = block.currentText;

          if (matchCase) {
            if (newText.includes(findText)) {
              newText = newText.replaceAll(findText, replaceText);
              hasMatch = true;
            }
          } else {
            const regex = new RegExp(
              findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
              'gi'
            );
            if (regex.test(newText)) {
              newText = newText.replace(regex, replaceText);
              hasMatch = true;
            }
          }

          if (hasMatch) {
            totalReplaced++;
            return {
              ...block,
              currentText: newText,
              isModified: newText !== block.originalText,
            };
          }
          return block;
        });

        return { ...page, blocks: updatedBlocks };
      });

      return { ...prev, pages: updatedPages };
    });

    if (totalReplaced > 0) {
      alert(`Berhasil mengganti ${totalReplaced} teks pada ${scope === 'page' ? 'halaman ini' : 'seluruh dokumen'}.`);
    } else {
      alert(`Teks "${findText}" tidak ditemukan.`);
    }
  };

  // Count Modified Blocks Across Document
  const modifiedCount =
    parsedData?.pages.reduce(
      (acc, page) =>
        acc +
        page.blocks.filter((b) => b.isModified || b.currentText !== b.originalText)
          .length,
      0
    ) || 0;

  // Save & Download Edited PDF
  const handleSavePdf = async () => {
    if (!parsedData || !originalBufferRef.current) return;

    try {
      setIsSaving(true);
      const editedPdfBytes = await applyEditsToPdf(
        originalBufferRef.current,
        parsedData.pages
      );

      const blob = new Blob([editedPdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);

      const sizeKb = (blob.size / 1024).toFixed(1);
      const sizeMb = (blob.size / (1024 * 1024)).toFixed(2);
      setSavedFileSize(blob.size > 1024 * 1024 ? `${sizeMb} MB` : `${sizeKb} KB`);

      // Otomatis picu download
      const downloadName = (file?.name || 'dokumen').replace(/\.pdf$/i, '') + '_edited.pdf';
      const a = document.createElement('a');
      a.href = url;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Trigger Confetti Celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      console.error('Gagal menyimpan PDF:', err);
      alert('Terjadi kesalahan saat menyimpan PDF: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const currentPageData = parsedData?.pages[currentPageIndex];
  const activeBlock = currentPageData?.blocks.find((b) => b.id === editingBlockId);

  return (
    <div className={styles.workspace}>
      {/* Upload Dropzone Screen (Jika Belum Ada Berkas) */}
      {!file && !isLoading && (
        <div className={styles.dropzoneWrapper}>
          <div className={styles.header}>
            <div className={styles.badge}>
              <ShieldCheck size={14} />
              <span>100% Client-Side • Teks Vektor & Tata Letak Presisi</span>
            </div>
            <h1 className={styles.title}>Edit Teks Dokumen PDF</h1>
            <p className={styles.subtitle}>
              Ganti teks apapun di dalam PDF Anda dengan tetap mempertahankan jenis font asli, ukuran, gaya, dan koordinat tata letak dokumen secara presisi.
            </p>
          </div>

          <div
            className={styles.dropzoneContainer}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              accept=".pdf"
              style={{ display: 'none' }}
            />
            <div className={styles.dropzoneIconWrapper}>
              <UploadCloud size={36} />
            </div>
            <div className={styles.dropzoneTitle}>Pilih Berkas PDF untuk Diedit</div>
            <div className={styles.dropzoneHint}>
              Tarik & lepas file PDF ke sini, atau klik untuk memilih dari perangkat Anda
            </div>
            <div className={styles.dropzoneMeta}>
              <span>Edit Langsung di Preview</span>
              <span>•</span>
              <span>Preservasi Tabel & Kolom</span>
              <span>•</span>
              <span>100% Privat di Browser</span>
            </div>
          </div>

          <div className={styles.showcaseGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <MousePointerClick size={20} />
              </div>
              <div>
                <div className={styles.featureTitle}>Edit Langsung pada Preview</div>
                <div className={styles.featureDesc}>
                  Cukup klik teks manapun langsung pada tampilan dokumen untuk mengganti isi teks secara instan.
                </div>
              </div>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Type size={20} />
              </div>
              <div>
                <div className={styles.featureTitle}>Preservasi Font & Ukuran</div>
                <div className={styles.featureDesc}>
                  Jenis font, ketebalan bold, kemiringan italic, dan ukuran pt otomatis dicocokkan dengan teks aslinya.
                </div>
              </div>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Layers size={20} />
              </div>
              <div>
                <div className={styles.featureTitle}>Dukungan Tabel & Kolom Rapi</div>
                <div className={styles.featureDesc}>
                  Teks di dalam sel dan kolom tabel dipisahkan secara akurat sehingga Anda bisa mengedit sel per sel.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className={styles.loadingBox}>
          <div className={styles.spinner} />
          <div className={styles.loadingStatus}>{loadingProgress.status}</div>
          <div className={styles.progressBarContainer}>
            <div
              className={styles.progressBar}
              style={{ width: `${loadingProgress.percent}%` }}
            />
          </div>
          <div className={styles.progressText}>{loadingProgress.percent}% Selesai</div>
        </div>
      )}

      {/* 3-COLUMN STUDIO LAYOUT MATCHING REFERENCE */}
      {parsedData && !isLoading && (
        <div className={styles.studioLayout}>
          {/* 1. LEFT SIDEBAR: PAGE THUMBNAILS STRIP */}
          <div
            className={`${styles.thumbnailSidebar} ${
              !isSidebarOpen ? styles.thumbnailSidebarCollapsed : ''
            }`}
          >
            {parsedData.pages.map((p) => {
              const isActive = p.pageIndex === currentPageIndex;

              return (
                <button
                  key={p.pageIndex}
                  type="button"
                  className={styles.thumbItem}
                  onClick={() => {
                    setEditingBlockId(null);
                    setCurrentPageIndex(p.pageIndex);
                  }}
                  title={`Ke Halaman ${p.pageNumber}`}
                >
                  <div
                    className={`${styles.thumbCard} ${
                      isActive ? styles.thumbActive : ''
                    }`}
                  >
                    {p.thumbnailUrl ? (
                      <img
                        src={p.thumbnailUrl}
                        alt={`Halaman ${p.pageNumber}`}
                        className={styles.thumbImg}
                      />
                    ) : (
                      <div className={styles.thumbPlaceholder}>
                        <FileText size={20} />
                      </div>
                    )}
                  </div>
                  <span className={styles.thumbPageLabel}>{p.pageNumber}</span>
                </button>
              );
            })}
          </div>

          {/* Sidebar Collapse Toggle Tab on Border (Matching Reference Arrow Tab) */}
          <button
            type="button"
            className={`${styles.sidebarToggleTab} ${
              !isSidebarOpen ? styles.sidebarToggleTabCollapsed : ''
            }`}
            onClick={() => setIsSidebarOpen((v) => !v)}
            title={isSidebarOpen ? 'Sembunyikan panel thumbnail' : 'Tampilkan panel thumbnail'}
          >
            {isSidebarOpen ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
          </button>

          {/* 2. CENTER CANVAS WORKSPACE VIEWPORT */}
          <div className={styles.canvasWorkspaceWrapper}>
            <div
              className={styles.canvasWorkspace}
              onClick={(e) => {
                // Unfocus text edit jika klik area kosong workspace
                if (e.target === e.currentTarget) {
                  setEditingBlockId(null);
                }
              }}
            >
            {/* The Document Page Sheet */}
            <div
              className={styles.pageSheetWrapper}
              style={{
                width: canvasSize.width > 0 ? `${canvasSize.width}px` : 'auto',
                height: canvasSize.height > 0 ? `${canvasSize.height}px` : 'auto',
              }}
            >
              <canvas ref={canvasRef} className={styles.pdfCanvas} />

              {/* Text Overlay Layer */}
              <div className={styles.textOverlayLayer}>
                {currentPageData?.blocks.map((block) => {
                  const isEditing = editingBlockId === block.id;
                  const isModified = block.isModified || block.currentText !== block.originalText;

                  // Estimasi font size responsif terhadap zoom
                  const displayFontSize = Math.max(
                    9,
                    block.fontSize * (zoomLevel / 100) * 1.6
                  );

                  return (
                    <div
                      key={block.id}
                      className={`${styles.textBlockItem} ${
                        isModified ? styles.textBlockModified : ''
                      } ${isEditing ? styles.textBlockActive : ''}`}
                      style={{
                        left: `${block.viewportRect.leftPercent}%`,
                        top: `${block.viewportRect.topPercent}%`,
                        minWidth: `${block.viewportRect.widthPercent}%`,
                        height: `${block.viewportRect.heightPercent}%`,
                        fontFamily: getFontCssFamily(block.fontFamily),
                        fontSize: `${displayFontSize}px`,
                        fontWeight: block.isBold ? 700 : 400,
                        fontStyle: block.isItalic ? 'italic' : 'normal',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingBlockId(block.id);
                      }}
                      title={`Klik untuk mengedit. Font: ${block.fontFamily} ${block.fontSize}pt`}
                    >
                      {/* Indicator dot jika modified */}
                      {isModified && !isEditing && <div className={styles.modifiedDot} />}

                      {/* Floating Mini Action Toolbar saat aktif mengedit langsung */}
                      {isEditing && (
                        <div
                          className={styles.floatingToolbar}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <select
                            className={styles.floatingSelect}
                            value={block.fontFamily}
                            onChange={(e) =>
                              handleUpdateBlockProperty(block.id, {
                                fontFamily: e.target.value as any,
                              })
                            }
                            title="Pilih Jenis Font"
                          >
                            <option value="Helvetica">Helvetica (Sans)</option>
                            <option value="TimesRoman">Times Roman (Serif)</option>
                            <option value="Courier">Courier (Mono)</option>
                          </select>

                          <button
                            type="button"
                            className={`${styles.formatToggleBtn} ${
                              block.isBold ? styles.formatToggleActive : ''
                            }`}
                            onClick={() =>
                              handleUpdateBlockProperty(block.id, {
                                isBold: !block.isBold,
                              })
                            }
                            title="Tebalkan Teks (Bold)"
                          >
                            B
                          </button>

                          <button
                            type="button"
                            className={`${styles.formatToggleBtn} ${
                              block.isItalic ? styles.formatToggleActive : ''
                            }`}
                            onClick={() =>
                              handleUpdateBlockProperty(block.id, {
                                isItalic: !block.isItalic,
                              })
                            }
                            title="Miringkan Teks (Italic)"
                            style={{ fontStyle: 'italic' }}
                          >
                            I
                          </button>

                          <div className={styles.sizeAdjustGroup} title="Sesuaikan Ukuran Font">
                            <button
                              type="button"
                              className={styles.sizeBtn}
                              onClick={() =>
                                handleUpdateBlockProperty(block.id, {
                                  fontSize: Math.max(6, Math.round((block.fontSize - 1) * 10) / 10),
                                })
                              }
                            >
                              -
                            </button>
                            <span className={styles.sizeLabel}>{block.fontSize}pt</span>
                            <button
                              type="button"
                              className={styles.sizeBtn}
                              onClick={() =>
                                handleUpdateBlockProperty(block.id, {
                                  fontSize: Math.round((block.fontSize + 1) * 10) / 10,
                                })
                              }
                            >
                              +
                            </button>
                          </div>

                          {isModified && (
                            <button
                              type="button"
                              className={styles.floatingResetBtn}
                              onClick={() => handleResetBlock(block.id)}
                              title="Kembalikan ke teks & font asli"
                            >
                              Reset
                            </button>
                          )}

                          <button
                            type="button"
                            className={styles.floatingDoneBtn}
                            onClick={() => setEditingBlockId(null)}
                            title="Selesai mengedit"
                          >
                            <Check size={12} />
                            <span>Selesai</span>
                          </button>
                        </div>
                      )}

                      {/* Active In-Place Input Field */}
                      {isEditing ? (
                        <input
                          type="text"
                          className={styles.inlineInput}
                          value={block.currentText}
                          autoFocus
                          onChange={(e) =>
                            handleUpdateBlockProperty(block.id, {
                              currentText: e.target.value,
                            })
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              setEditingBlockId(null);
                            }
                          }}
                          style={{
                            fontFamily: getFontCssFamily(block.fontFamily),
                            fontSize: `${displayFontSize}px`,
                            fontWeight: block.isBold ? 700 : 400,
                            fontStyle: block.isItalic ? 'italic' : 'normal',
                          }}
                        />
                      ) : isModified ? (
                        /* Teks hasil editan yang langsung menggantikan tampilan di preview */
                        <span style={{ whiteSpace: 'nowrap' }}>
                          {block.currentText}
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
            </div>

            {/* FLOATING BOTTOM CAPSULE DOCK (MATCHING REFERENCE) */}
            <div className={styles.floatingBottomDock}>
              {/* Prev Page */}
              <button
                type="button"
                className={styles.dockBtn}
                onClick={() => setCurrentPageIndex((p) => Math.max(0, p - 1))}
                disabled={currentPageIndex === 0}
                title="Halaman Sebelumnya"
              >
                <ChevronUp size={16} />
              </button>

              {/* Next Page */}
              <button
                type="button"
                className={styles.dockBtn}
                onClick={() =>
                  setCurrentPageIndex((p) =>
                    Math.min(parsedData.numPages - 1, p + 1)
                  )
                }
                disabled={currentPageIndex >= parsedData.numPages - 1}
                title="Halaman Selanjutnya"
              >
                <ChevronDown size={16} />
              </button>

              {/* Page Indicator */}
              <div className={styles.dockPageIndicator}>
                <span className={styles.dockPageBox}>{currentPageIndex + 1}</span>
                <span>/</span>
                <span>{parsedData.numPages}</span>
              </div>

              <div className={styles.dockDivider} />

              {/* Zoom Out */}
              <button
                type="button"
                className={styles.dockBtn}
                onClick={() => setZoomLevel((z) => Math.max(40, z - 15))}
                disabled={zoomLevel <= 40}
                title="Perkecil"
              >
                <Minus size={15} />
              </button>

              {/* Zoom In */}
              <button
                type="button"
                className={styles.dockBtn}
                onClick={() => setZoomLevel((z) => Math.min(200, z + 15))}
                disabled={zoomLevel >= 200}
                title="Perbesar"
              >
                <Plus size={15} />
              </button>

              {/* Zoom Percent */}
              <span className={styles.dockZoomLabel}>{zoomLevel}%</span>

              <div className={styles.dockDivider} />

              {/* Fit / Reset Zoom */}
              <button
                type="button"
                className={styles.dockBtn}
                onClick={() => setZoomLevel(100)}
                title="Pas ke Layar / Reset 100%"
              >
                <ArrowUpDown size={15} />
              </button>

              {/* Toggle Sidebar Thumbnails */}
              <button
                type="button"
                className={styles.dockBtn}
                onClick={() => setIsSidebarOpen((v) => !v)}
                title="Buka / Tutup Panel Thumbnail"
              >
                <SlidersHorizontal size={14} />
              </button>
            </div>
          </div>

          {/* 3. RIGHT SIDEBAR: ACTION & CONTROL PANEL (MATCHING REFERENCE) */}
          <div className={styles.rightPanel}>
            {/* Title */}
            <h2 className={styles.panelTitle}>Edit PDF</h2>

            {/* Reference Light-Blue Tip Box */}
            <div className={styles.panelTipBox}>
              <Info size={18} className={styles.panelTipIcon} />
              <div>
                {locale === 'en'
                  ? 'Use the toolbar to modify or add text, upload images, and annotate with ease.'
                  : 'Gunakan toolbar atau klik langsung teks untuk menyunting teks original, mengubah ukuran font, dan mengedit dokumen dengan presisi.'}
              </div>
            </div>

            {/* Body Panels */}
            <div className={styles.panelBody}>
              {/* Jika Ada Teks yang Sedang Aktif Dipilih */}
              {activeBlock ? (
                <div className={styles.cardSection}>
                  <div className={styles.sectionHeading}>
                    <span>Sunting Teks Terpilih</span>
                    <button
                      type="button"
                      className={styles.toolButton}
                      style={{ padding: '2px 8px', fontSize: '11px' }}
                      onClick={() => setEditingBlockId(null)}
                    >
                      Batal
                    </button>
                  </div>

                  <div style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>
                    Asli: &ldquo;{activeBlock.originalText}&rdquo;
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Teks Baru:</label>
                    <input
                      type="text"
                      className={styles.textInput}
                      value={activeBlock.currentText}
                      onChange={(e) =>
                        handleUpdateBlockProperty(activeBlock.id, {
                          currentText: e.target.value,
                        })
                      }
                      placeholder="Ketik teks baru..."
                    />
                  </div>

                  {/* Font Controls di Sidebar */}
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Jenis Font:</label>
                    <select
                      className={styles.textInput}
                      value={activeBlock.fontFamily}
                      onChange={(e) =>
                        handleUpdateBlockProperty(activeBlock.id, {
                          fontFamily: e.target.value as any,
                        })
                      }
                    >
                      <option value="Helvetica">Helvetica (Sans-Serif / Arial)</option>
                      <option value="TimesRoman">Times Roman (Serif)</option>
                      <option value="Courier">Courier (Monospace)</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      type="button"
                      className={`${styles.toolButton} ${
                        activeBlock.isBold ? styles.formatToggleActive : ''
                      }`}
                      style={{ flex: 1 }}
                      onClick={() =>
                        handleUpdateBlockProperty(activeBlock.id, {
                          isBold: !activeBlock.isBold,
                        })
                      }
                    >
                      <Bold size={14} />
                      <span>Tebal</span>
                    </button>

                    <button
                      type="button"
                      className={`${styles.toolButton} ${
                        activeBlock.isItalic ? styles.formatToggleActive : ''
                      }`}
                      style={{ flex: 1 }}
                      onClick={() =>
                        handleUpdateBlockProperty(activeBlock.id, {
                          isItalic: !activeBlock.isItalic,
                        })
                      }
                    >
                      <Italic size={14} />
                      <span>Miring</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: 4 }}>
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>Ukuran:</span>
                    <button
                      type="button"
                      className={styles.toolButton}
                      style={{ padding: '4px 10px' }}
                      onClick={() =>
                        handleUpdateBlockProperty(activeBlock.id, {
                          fontSize: Math.max(6, Math.round((activeBlock.fontSize - 1) * 10) / 10),
                        })
                      }
                    >
                      -
                    </button>
                    <span style={{ fontSize: '12px', fontWeight: 600, minWidth: '38px', textAlign: 'center' }}>
                      {activeBlock.fontSize}pt
                    </span>
                    <button
                      type="button"
                      className={styles.toolButton}
                      style={{ padding: '4px 10px' }}
                      onClick={() =>
                        handleUpdateBlockProperty(activeBlock.id, {
                          fontSize: Math.round((activeBlock.fontSize + 1) * 10) / 10,
                        })
                      }
                    >
                      +
                    </button>

                    {activeBlock.isModified && (
                      <button
                        type="button"
                        className={styles.toolButton}
                        style={{ marginLeft: 'auto', color: '#ef4444' }}
                        onClick={() => handleResetBlock(activeBlock.id)}
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* Jika Tidak Ada Teks yang Dipilih: Overview & Cari Ganti */
                <>
                  <div className={styles.cardSection}>
                    <div className={styles.sectionHeading}>
                      <span>Status Dokumen</span>
                      {modifiedCount > 0 && (
                        <div className={styles.badgeModified}>
                          <CheckCircle2 size={12} />
                          <span>{modifiedCount} Teks Diubah</span>
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div>Berkas: <strong>{file?.name}</strong></div>
                      <div>Halaman Aktif: <strong>{currentPageIndex + 1} dari {parsedData.numPages}</strong></div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      <button
                        type="button"
                        className={styles.toolButton}
                        style={{ flex: 1 }}
                        onClick={() => {
                          if (
                            modifiedCount === 0 ||
                            confirm('Ganti berkas? Perubahan yang belum disimpan akan dibuang.')
                          ) {
                            setFile(null);
                            setParsedData(null);
                            setDownloadUrl(null);
                            pdfDocRef.current = null;
                          }
                        }}
                      >
                        <RotateCcw size={13} />
                        <span>Ganti File</span>
                      </button>

                      {modifiedCount > 0 && (
                        <button
                          type="button"
                          className={styles.toolButton}
                          style={{ color: '#ef4444' }}
                          onClick={handleResetAll}
                        >
                          Reset Semua
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Quick Find & Replace Box */}
                  <div className={styles.cardSection}>
                    <div className={styles.sectionHeading}>
                      <span>Cari & Ganti Teks</span>
                    </div>

                    <div className={styles.inputGroup}>
                      <input
                        type="text"
                        className={styles.textInput}
                        placeholder="Cari teks di dokumen..."
                        value={findText}
                        onChange={(e) => setFindText(e.target.value)}
                      />
                    </div>

                    <div className={styles.inputGroup}>
                      <input
                        type="text"
                        className={styles.textInput}
                        placeholder="Ganti dengan..."
                        value={replaceText}
                        onChange={(e) => setReplaceText(e.target.value)}
                      />
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={matchCase}
                        onChange={(e) => setMatchCase(e.target.checked)}
                      />
                      <span>Cocokkan huruf besar/kecil (Match case)</span>
                    </label>

                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      <button
                        type="button"
                        className={styles.toolButton}
                        style={{ flex: 1 }}
                        disabled={!findText.trim()}
                        onClick={() => handleFindReplace('page')}
                      >
                        Halaman Ini
                      </button>
                      <button
                        type="button"
                        className={styles.toolButton}
                        style={{ flex: 1, fontWeight: 600 }}
                        disabled={!findText.trim()}
                        onClick={() => handleFindReplace('all')}
                      >
                        Semua Hal.
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Success Result Banner Jika Selesai Download */}
              {downloadUrl && (
                <div className={styles.resultBanner}>
                  <div className={styles.resultInfo}>
                    <CheckCircle2 size={16} color="#059669" />
                    <span>PDF Berhasil Diunduh! ({savedFileSize})</span>
                  </div>
                  <a
                    href={downloadUrl}
                    download={(file?.name || 'dokumen').replace(/\.pdf$/i, '') + '_edited.pdf'}
                    style={{ fontSize: '12px', color: '#2563eb', textDecoration: 'underline' }}
                  >
                    Unduh file lagi
                  </a>
                </div>
              )}
            </div>

            {/* REFERENCE BOTTOM SALMON/CORAL RED "SAVE CHANGES ➔" BUTTON */}
            <button
              type="button"
              className={styles.saveChangesBtn}
              onClick={handleSavePdf}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <div
                    className={styles.spinner}
                    style={{ width: 18, height: 18, borderWidth: 2, margin: 0, borderTopColor: '#ffffff' }}
                  />
                  <span>{locale === 'en' ? 'Saving PDF...' : 'Menyimpan PDF...'}</span>
                </>
              ) : (
                <>
                  <span>Save changes</span>
                  <ArrowRightCircle size={20} />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
