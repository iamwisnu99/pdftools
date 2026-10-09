'use client';

import React, { useState, useRef } from 'react';
import {
  Presentation,
  UploadCloud,
  CheckCircle2,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Download,
  ShieldCheck,
  Sparkles,
  Layers,
  Palette,
  FileCheck,
  Grid,
  FileText,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  ParsedPresentation,
  ParsedSlide,
  parsePptx,
} from './pptxParser';
import {
  generatePptxPdf,
  PresentationLayout,
  PresentationTheme,
} from './pptxPdfGenerator';
import styles from './PowerPointToPdfWorkspace.module.css';

export default function PowerPointToPdfWorkspace() {
  const [pres, setPres] = useState<ParsedPresentation | null>(null);
  const [slides, setSlides] = useState<ParsedSlide[]>([]);
  const [layout, setLayout] = useState<PresentationLayout>('one_per_page');
  const [theme, setTheme] = useState<PresentationTheme>('minimalist');
  const [showNotesArea, setShowNotesArea] = useState<boolean>(true);

  // Conversion state
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [progress, setProgress] = useState({ percent: 0, status: '' });
  const [resultPdfUrl, setResultPdfUrl] = useState<string | null>(null);
  const [resultPdfSize, setResultPdfSize] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pptx')) {
      alert('Format berkas tidak didukung. Harap pilih berkas PowerPoint (.pptx)');
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const parsed = await parsePptx(buffer, file.name);

      setPres(parsed);
      setSlides(parsed.slides);
      setResultPdfUrl(null);
    } catch (err) {
      console.error('Gagal membaca presentasi PowerPoint:', err);
      alert('Terjadi kesalahan saat membaca file presentasi. Pastikan file .pptx valid dan tidak terenkripsi.');
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

  // Toggle selection
  const handleToggleSlide = (id: string) => {
    setSlides((prev) =>
      prev.map((s) => (s.id === id ? { ...s, selected: !s.selected } : s))
    );
  };

  const handleSelectAll = (select: boolean) => {
    setSlides((prev) => prev.map((s) => ({ ...s, selected: select })));
  };

  // Move slide up / down
  const handleMoveSlide = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === slides.length - 1)
    ) {
      return;
    }

    const newSlides = [...slides];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = newSlides[index];
    newSlides[index] = newSlides[targetIndex];
    newSlides[targetIndex] = temp;
    setSlides(newSlides);
  };

  // Convert to PDF
  const handleConvertToPdf = async () => {
    if (!pres) return;

    const selectedIds = slides.filter((s) => s.selected).map((s) => s.id);
    if (selectedIds.length === 0) {
      alert('Harap pilih minimal 1 slide untuk dikonversi.');
      return;
    }

    try {
      setIsConverting(true);
      setProgress({ percent: 5, status: 'Menyiapkan layout slide...' });

      const pdfBytes = await generatePptxPdf(
        { ...pres, slides },
        selectedIds,
        {
          layout,
          theme,
          showSlideNumbers: true,
          showNotesArea: layout === 'two_handout' && showNotesArea,
          onProgress: (percent, status) => {
            setProgress({ percent, status });
          },
        }
      );

      const blob = new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setResultPdfUrl(url);

      const sizeKb = (blob.size / 1024).toFixed(1);
      const sizeMb = (blob.size / (1024 * 1024)).toFixed(2);
      setResultPdfSize(blob.size > 1024 * 1024 ? `${sizeMb} MB` : `${sizeKb} KB`);

      setProgress({ percent: 100, status: 'Selesai!' });

      setTimeout(() => {
        setIsConverting(false);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }, 400);
    } catch (err) {
      console.error('Gagal mengonversi presentasi ke PDF:', err);
      alert('Terjadi kesalahan saat memproses presentasi.');
      setIsConverting(false);
    }
  };

  const handleReset = () => {
    setPres(null);
    setSlides([]);
    setResultPdfUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const selectedCount = slides.filter((s) => s.selected).length;

  return (
    <div className={styles.workspace}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.badge}>
          <Sparkles size={14} />
          <span>100% Client-Side Engine • Berkas Aman di Perangkat Anda</span>
        </div>
        <h1 className={styles.title}>Ubah PowerPoint ke PDF Online</h1>
        <p className={styles.subtitle}>
          Konversi berkas presentasi PPTX menjadi dokumen PDF berkualitas tajam.
          Pilih slide yang diinginkan, atur urutan, dan sesuaikan layout format presentasi atau handout rapat.
        </p>
      </header>

      {/* Screen 1: Dropzone */}
      {!pres && (
        <div
          className={styles.dropzoneContainer}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileChange(e.target.files[0]);
              }
            }}
          />
          <div className={styles.dropzoneIconWrapper}>
            <Presentation size={36} />
          </div>
          <h2 className={styles.dropzoneTitle}>Pilih Berkas Presentasi PowerPoint</h2>
          <p className={styles.dropzoneDesc}>
            Tarik & lepaskan file .pptx di sini atau klik untuk memilih berkas dari perangkat Anda
          </p>
          <button type="button" className={styles.dropzoneButton}>
            <UploadCloud size={18} />
            <span>Pilih Berkas (.pptx)</span>
          </button>
          <div className={styles.securityNote}>
            <ShieldCheck size={15} />
            <span>100% privasi terlindungi. Berkas tidak pernah diunggah ke server pihak ketiga.</span>
          </div>
        </div>
      )}

      {/* Screen 2: Active Presentation Workspace */}
      {pres && !resultPdfUrl && (
        <div>
          {/* Top Control Bar */}
          <div className={styles.controlBar}>
            <div className={styles.fileInfo}>
              <div className={styles.iconBox}>
                <Presentation size={22} />
              </div>
              <div className={styles.fileMeta}>
                <div className={styles.fileName} title={pres.fileName}>
                  {pres.fileName}
                </div>
                <div className={styles.fileDetails}>
                  {slides.length} Slide Terdeteksi • Rasio {pres.aspectRatio}
                </div>
              </div>
            </div>

            <div className={styles.controlActions}>
              {/* Layout Mode Selector */}
              <div className={styles.settingsGroup}>
                <span className={styles.settingLabel}>Layout:</span>
                <div className={styles.segmentedControl}>
                  <button
                    type="button"
                    onClick={() => setLayout('one_per_page')}
                    className={`${styles.segmentBtn} ${
                      layout === 'one_per_page' ? styles.segmentBtnActive : ''
                    }`}
                  >
                    <Layers size={13} />
                    <span>1 Slide/Hal</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLayout('two_handout')}
                    className={`${styles.segmentBtn} ${
                      layout === 'two_handout' ? styles.segmentBtnActive : ''
                    }`}
                  >
                    <FileText size={13} />
                    <span>2 Slide Handout</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLayout('four_grid')}
                    className={`${styles.segmentBtn} ${
                      layout === 'four_grid' ? styles.segmentBtnActive : ''
                    }`}
                  >
                    <Grid size={13} />
                    <span>4 Slide Grid</span>
                  </button>
                </div>
              </div>

              {/* Theme Selector */}
              <div className={styles.settingsGroup}>
                <span className={styles.settingLabel}>Tema:</span>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as PresentationTheme)}
                  className={styles.selectInput}
                >
                  <option value="minimalist">Minimalist Light</option>
                  <option value="dark">Obsidian Dark</option>
                  <option value="corporate">Executive Corporate</option>
                  <option value="editorial">Warm Editorial</option>
                </select>
              </div>

              {layout === 'two_handout' && (
                <label className={styles.checkboxLabel} style={{ fontSize: '13px' }}>
                  <input
                    type="checkbox"
                    checked={showNotesArea}
                    onChange={(e) => setShowNotesArea(e.target.checked)}
                    className={styles.checkboxInput}
                  />
                  <span>Area Catatan</span>
                </label>
              )}

              <button type="button" onClick={handleReset} className={styles.reuploadBtn}>
                <RotateCcw size={15} />
                <span>Ganti File</span>
              </button>

              <button
                type="button"
                onClick={handleConvertToPdf}
                disabled={isConverting || selectedCount === 0}
                className={styles.convertPrimaryBtn}
              >
                <span>Konversi {selectedCount} Slide ke PDF</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* Slide Selection Controls */}
          <div className={styles.selectionBar}>
            <div className={styles.selectionText}>
              Terpilih <strong>{selectedCount}</strong> dari {slides.length} slide
            </div>
            <div className={styles.selectionActions}>
              <button
                type="button"
                onClick={() => handleSelectAll(true)}
                className={styles.textActionBtn}
              >
                Pilih Semua
              </button>
              <button
                type="button"
                onClick={() => handleSelectAll(false)}
                className={styles.textActionBtn}
              >
                Hapus Centang Semua
              </button>
            </div>
          </div>

          {/* Slides Grid */}
          <div className={styles.slideGrid}>
            {slides.map((slide, idx) => (
              <div
                key={slide.id}
                className={`${styles.slideCard} ${
                  !slide.selected ? styles.slideCardUnselected : ''
                }`}
              >
                <div className={styles.slideCardTop}>
                  <span className={styles.slideNumBadge}>SLIDE {idx + 1}</span>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={slide.selected}
                      onChange={() => handleToggleSlide(slide.id)}
                      className={styles.checkboxInput}
                    />
                    <span>Sertakan</span>
                  </label>
                </div>

                <div className={styles.slidePreviewBox}>
                  <div className={styles.slidePreviewTitle}>
                    {slide.title || `Slide ${idx + 1}`}
                  </div>
                  {slide.paragraphs.length > 0 && (
                    <div className={styles.slidePreviewSnippet}>
                      {slide.paragraphs.map((p) => p.text).join(' • ')}
                    </div>
                  )}

                  <div className={styles.slidePreviewBadges}>
                    {slide.images.length > 0 && (
                      <span className={styles.miniTag}>
                        {slide.images.length} Gambar
                      </span>
                    )}
                    {slide.tables.length > 0 && (
                      <span className={styles.miniTag}>
                        {slide.tables.length} Tabel
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.slideCardFooter}>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    Urutan #{idx + 1}
                  </span>
                  <div className={styles.orderButtons}>
                    <button
                      type="button"
                      onClick={() => handleMoveSlide(idx, 'up')}
                      disabled={idx === 0}
                      className={styles.orderBtn}
                      title="Geser ke Atas"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveSlide(idx, 'down')}
                      disabled={idx === slides.length - 1}
                      className={styles.orderBtn}
                      title="Geser ke Bawah"
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Screen 3: Success Screen */}
      {resultPdfUrl && (
        <div className={styles.successCard}>
          <div className={styles.successIcon}>
            <CheckCircle2 size={40} />
          </div>
          <h2 className={styles.successTitle}>Konversi PowerPoint ke PDF Berhasil!</h2>
          <p className={styles.subtitle}>
            Slide presentasi Anda telah berhasil dikonversi menjadi dokumen PDF siap cetak atau dibagikan.
          </p>

          <div className={styles.successMetaBadge}>
            <FileText size={16} />
            <span>{pres?.fileName.replace(/\.pptx$/i, '.pdf')}</span>
            <span>•</span>
            <span>{resultPdfSize}</span>
          </div>

          <div className={styles.successActions}>
            <a
              href={resultPdfUrl}
              download={pres ? pres.fileName.replace(/\.pptx$/i, '.pdf') : 'presentation.pdf'}
              className={styles.downloadBtn}
            >
              <Download size={18} />
              <span>Unduh Dokumen PDF</span>
            </a>
            <button type="button" onClick={handleReset} className={styles.resetBtn}>
              <RotateCcw size={16} />
              <span>Konversi Presentasi Lain</span>
            </button>
          </div>
        </div>
      )}

      {/* Conversion Progress Modal */}
      {isConverting && (
        <div className={styles.modalOverlay}>
          <div className={styles.progressModal}>
            <div className={styles.progressIconBox}>
              <Sparkles size={28} />
            </div>
            <h3 className={styles.progressTitle}>Mengonversi Presentasi ke PDF</h3>
            <p className={styles.progressStatus}>{progress.status}</p>

            <div className={styles.progressBarTrack}>
              <div
                className={styles.progressBarFill}
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            <span className={styles.progressPercent}>{progress.percent}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
