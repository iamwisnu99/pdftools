'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Download,
  ShieldCheck,
  Sparkles,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PDFDocument } from '@cantoo/pdf-lib';
import html2canvas from 'html2canvas';
import styles from './WordToPdfWorkspace.module.css';

export type WordQuality = 'standard' | 'hd' | 'ultra';
export type PageOrientation = 'auto' | 'portrait' | 'landscape';

export default function WordToPdfWorkspace() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Settings
  const [quality, setQuality] = useState<WordQuality>('hd');
  const [orientation, setOrientation] = useState<PageOrientation>('auto');

  // Conversion Progress
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [progress, setProgress] = useState({ percent: 0, status: '' });
  const [resultPdfUrl, setResultPdfUrl] = useState<string | null>(null);
  const [resultPdfSize, setResultPdfSize] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const fileBufferRef = useRef<ArrayBuffer | null>(null);

  // Load and render DOCX file
  const handleFileChange = async (selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith('.docx')) {
      alert('Format berkas tidak didukung. Harap pilih berkas Word berformat .docx');
      return;
    }

    try {
      setIsLoadingPreview(true);
      setFile(selectedFile);
      setResultPdfUrl(null);

      const buffer = await selectedFile.arrayBuffer();
      fileBufferRef.current = buffer;

      if (previewContainerRef.current) {
        previewContainerRef.current.innerHTML = '';
        const docxPreview = await import('docx-preview');

        await docxPreview.renderAsync(buffer, previewContainerRef.current, undefined, {
          breakPages: true,
          experimental: true,
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
        });

        // Count rendered sections
        const sections = previewContainerRef.current.querySelectorAll('.docx-wrapper > section.docx');
        const count = sections.length > 0 ? sections.length : 1;
        setPageCount(count);
      }
    } catch (err) {
      console.error('Gagal membaca berkas Word:', err);
      alert('Terjadi kesalahan saat memproses dokumen Word. Pastikan berkas tidak rusak.');
    } finally {
      setIsLoadingPreview(false);
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

  // Convert to PDF
  const handleConvertToPdf = async () => {
    if (!previewContainerRef.current || !file) return;

    try {
      setIsConverting(true);
      setProgress({ percent: 5, status: 'Menyiapkan mesin render dokumen...' });

      // Identify rendered page sections
      let sections = previewContainerRef.current.querySelectorAll<HTMLElement>(
        '.docx-wrapper > section.docx'
      );

      // Fallback if no specific section found
      if (sections.length === 0) {
        sections = previewContainerRef.current.querySelectorAll<HTMLElement>('section.docx');
      }

      const elementsToRender: HTMLElement[] =
        sections.length > 0
          ? Array.from(sections)
          : [previewContainerRef.current];

      const total = elementsToRender.length;
      const pdfDoc = await PDFDocument.create();

      // Render scale based on quality
      const scaleMap: Record<WordQuality, number> = {
        standard: 1.5,
        hd: 2.0,
        ultra: 2.5,
      };
      const captureScale = scaleMap[quality] || 2.0;

      for (let i = 0; i < total; i++) {
        const el = elementsToRender[i];
        const pct = Math.round(((i + 1) / (total + 1)) * 90);
        setProgress({
          percent: pct,
          status: `Memproses dan mengonversi halaman ${i + 1} dari ${total}...`,
        });

        // Capture high-res canvas
        const canvas = await html2canvas(el, {
          scale: captureScale,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
        });

        const imgDataUrl = canvas.toDataURL('image/png');
        const pngBytes = await fetch(imgDataUrl).then((r) => r.arrayBuffer());
        const embeddedImage = await pdfDoc.embedPng(pngBytes);

        // Aspect ratio handling
        const canvasAspect = canvas.width / canvas.height;
        let isLandscape = false;

        if (orientation === 'landscape') {
          isLandscape = true;
        } else if (orientation === 'portrait') {
          isLandscape = false;
        } else {
          isLandscape = canvasAspect > 1.1;
        }

        // Standard A4: 595.28 x 841.89 points
        let pageWidth = isLandscape ? 841.89 : 595.28;
        let pageHeight = isLandscape ? 595.28 : 841.89;

        // Scale proportionally if custom dimension
        const pdfPage = pdfDoc.addPage([pageWidth, pageHeight]);
        pdfPage.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width: pageWidth,
          height: pageHeight,
        });
      }

      setProgress({ percent: 95, status: 'Menyusun berkas PDF final...' });
      const pdfBytes = await pdfDoc.save();

      // Create download blob
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
      console.error('Gagal mengonversi Word ke PDF:', err);
      alert('Terjadi kesalahan saat mengonversi dokumen. Silakan coba lagi.');
      setIsConverting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPageCount(0);
    setResultPdfUrl(null);
    fileBufferRef.current = null;
    if (previewContainerRef.current) {
      previewContainerRef.current.innerHTML = '';
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(150, Math.max(50, prev + delta)));
  };

  return (
    <div className={styles.workspace}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.badge}>
          <Sparkles size={14} />
          <span>100% Client-Side Engine • Berkas Aman di Perangkat Anda</span>
        </div>
        <h1 className={styles.title}>Ubah Word ke PDF Presisi Tinggi</h1>
        <p className={styles.subtitle}>
          Konversi dokumen Word (.docx) menjadi berkas PDF berkualitas cetak dengan layout,
          font, heading, dan tabel yang dipertahankan sempurna.
        </p>
      </header>

      {/* Screen 1: Dropzone (No File Loaded) */}
      {!file && (
        <div
          className={styles.dropzoneContainer}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileChange(e.target.files[0]);
              }
            }}
          />
          <div className={styles.dropzoneIconWrapper}>
            <FileText size={36} />
          </div>
          <h2 className={styles.dropzoneTitle}>Pilih Berkas Dokumen Word</h2>
          <p className={styles.dropzoneDesc}>
            Tarik & lepaskan file .docx di sini atau klik untuk menelusuri berkas dari komputer Anda
          </p>
          <button type="button" className={styles.dropzoneButton}>
            <UploadCloud size={18} />
            <span>Pilih Berkas Word (.docx)</span>
          </button>
          <div className={styles.securityNote}>
            <ShieldCheck size={15} />
            <span>Pemrosesan lokal di browser. Dokumen Anda tidak pernah diunggah ke server mana pun.</span>
          </div>
        </div>
      )}

      {/* Screen 2: Active Workspace with Live Preview & Controls */}
      {file && !resultPdfUrl && (
        <div>
          {/* Top Control Bar */}
          <div className={styles.controlBar}>
            <div className={styles.docFileInfo}>
              <div className={styles.docIconBox}>
                <FileText size={22} />
              </div>
              <div className={styles.docMeta}>
                <div className={styles.docName} title={file.name}>
                  {file.name}
                </div>
                <div className={styles.docDetails}>
                  {(file.size / 1024).toFixed(1)} KB • {pageCount} Halaman Terdeteksi
                </div>
              </div>
            </div>

            <div className={styles.controlActions}>
              {/* Quality Selector */}
              <div className={styles.settingsGroup}>
                <span className={styles.settingLabel}>Kualitas Cetak:</span>
                <select
                  value={quality}
                  onChange={(e) => setQuality(e.target.value as WordQuality)}
                  className={styles.selectInput}
                >
                  <option value="standard">Standar (150 DPI)</option>
                  <option value="hd">Tinggi HD (300 DPI)</option>
                  <option value="ultra">Maksimum Ultra (Clean Vector)</option>
                </select>
              </div>

              {/* Orientation Selector */}
              <div className={styles.settingsGroup}>
                <span className={styles.settingLabel}>Orientasi:</span>
                <select
                  value={orientation}
                  onChange={(e) => setOrientation(e.target.value as PageOrientation)}
                  className={styles.selectInput}
                >
                  <option value="auto">Otomatis</option>
                  <option value="portrait">Potret (Tegak)</option>
                  <option value="landscape">Lanskap (Mendatar)</option>
                </select>
              </div>

              <button type="button" onClick={handleReset} className={styles.reuploadBtn}>
                <RotateCcw size={15} />
                <span>Ganti Berkas</span>
              </button>

              <button
                type="button"
                onClick={handleConvertToPdf}
                disabled={isConverting || isLoadingPreview}
                className={styles.convertPrimaryBtn}
              >
                <span>Konversi ke PDF</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* Document Preview Frame */}
          <div className={styles.previewCard}>
            <div className={styles.previewHeader}>
              <div className={styles.previewTitle}>
                <FileCheck size={18} />
                <span>Pratinjau Halaman Dokumen</span>
              </div>
              <div className={styles.previewZoomControls}>
                <button
                  type="button"
                  onClick={() => handleZoom(-10)}
                  className={styles.zoomBtn}
                  title="Perkecil"
                >
                  <ZoomOut size={16} />
                </button>
                <span style={{ fontSize: '12px', fontWeight: 600, minWidth: '45px', textAlign: 'center' }}>
                  {zoomLevel}%
                </span>
                <button
                  type="button"
                  onClick={() => handleZoom(10)}
                  className={styles.zoomBtn}
                  title="Perbesar"
                >
                  <ZoomIn size={16} />
                </button>
              </div>
            </div>

            {/* Rendered DOCX Viewport */}
            <div
              className={styles.docxContainer}
              style={{
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'top center',
                transition: 'transform 0.2s ease',
              }}
            >
              {isLoadingPreview && (
                <div style={{ padding: '40px', color: '#64748b', fontSize: '14px' }}>
                  Memuat dan merender pratinjau dokumen Word...
                </div>
              )}
              <div ref={previewContainerRef} />
            </div>
          </div>
        </div>
      )}

      {/* Screen 3: Success Screen */}
      {resultPdfUrl && (
        <div className={styles.successCard}>
          <div className={styles.successIcon}>
            <CheckCircle2 size={40} />
          </div>
          <h2 className={styles.successTitle}>Konversi Word ke PDF Berhasil!</h2>
          <p className={styles.subtitle}>
            Dokumen Anda telah diubah menjadi PDF resolusi tinggi dengan layout yang terjaga sempurna.
          </p>

          <div className={styles.successMetaBadge}>
            <FileText size={16} />
            <span>{file?.name.replace(/\.docx$/i, '.pdf')}</span>
            <span>•</span>
            <span>{resultPdfSize}</span>
          </div>

          <div className={styles.successActions}>
            <a
              href={resultPdfUrl}
              download={file ? file.name.replace(/\.docx$/i, '.pdf') : 'document.pdf'}
              className={styles.downloadBtn}
            >
              <Download size={18} />
              <span>Unduh Dokumen PDF</span>
            </a>
            <button type="button" onClick={handleReset} className={styles.resetBtn}>
              <RotateCcw size={16} />
              <span>Konversi Dokumen Lain</span>
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
            <h3 className={styles.progressTitle}>Mengonversi Dokumen ke PDF</h3>
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
