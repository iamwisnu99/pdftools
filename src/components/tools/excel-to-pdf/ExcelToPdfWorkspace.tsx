'use client';

import React, { useState, useRef, useMemo } from 'react';
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Download,
  Layers,
  FileCheck,
  Grid,
  FileText,
  Palette,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  ParsedWorkbook,
  ContentBlock,
  parseExcelWorkbook,
  PaginationMode,
  groupBlocksIntoPages,
} from './excelBlockDetector';
import {
  generateExcelPdf,
  TableTheme,
  PageOrientation,
} from './excelPdfGenerator';
import styles from './ExcelToPdfWorkspace.module.css';

export default function ExcelToPdfWorkspace() {
  const [workbook, setWorkbook] = useState<ParsedWorkbook | null>(null);
  const [activeSheet, setActiveSheet] = useState<string>('');
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [paginationMode, setPaginationMode] = useState<PaginationMode>('two_if_fit');
  const [orientation, setOrientation] = useState<PageOrientation>('auto');
  const [theme, setTheme] = useState<TableTheme>('modern');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ percent: 0, status: '' });
  const [resultPdfUrl, setResultPdfUrl] = useState<string | null>(null);
  const [resultPdfSize, setResultPdfSize] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file drop / upload
  const handleFileChange = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const parsed = await parseExcelWorkbook(buffer, file.name);

      setWorkbook(parsed);
      setActiveSheet(parsed.activeSheet);

      // Gabungkan semua blok dari semua sheet
      const initialBlocks: ContentBlock[] = [];
      parsed.sheetNames.forEach((sheetName) => {
        initialBlocks.push(...(parsed.blocksBySheet[sheetName] || []));
      });
      setBlocks(initialBlocks);
      setResultPdfUrl(null);
    } catch (err) {
      console.error('Gagal membaca file Excel:', err);
      alert('Gagal membaca berkas Excel. Pastikan berkas berformat .xlsx, .xls, atau .csv valid.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Switch sheet view
  const handleSheetSwitch = (sheetName: string) => {
    setActiveSheet(sheetName);
  };

  // Toggle selection blok
  const handleToggleBlock = (blockId: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, selected: !b.selected } : b))
    );
  };

  // Bulk select / deselect
  const handleSelectAll = (select: boolean) => {
    setBlocks((prev) => prev.map((b) => ({ ...b, selected: select })));
  };

  // Update judul blok
  const handleUpdateTitle = (blockId: string, newTitle: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, title: newTitle } : b))
    );
  };

  // Reorder blok (naik / turun)
  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= blocks.length) return;

    const newBlocks = [...blocks];
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[targetIdx];
    newBlocks[targetIdx] = temp;

    // Perbarui properti order
    newBlocks.forEach((b, i) => {
      b.order = i + 1;
    });

    setBlocks(newBlocks);
  };

  // Reset
  const handleReset = () => {
    setWorkbook(null);
    setBlocks([]);
    setResultPdfUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Kalkulasi estimasi halaman
  const previewPages = useMemo(() => {
    return groupBlocksIntoPages(blocks, paginationMode);
  }, [blocks, paginationMode]);

  const selectedCount = useMemo(() => {
    return blocks.filter((b) => b.selected).length;
  }, [blocks]);

  // Eksekusi Konversi
  const handleGeneratePdf = async () => {
    if (!workbook || selectedCount === 0) return;

    setIsGenerating(true);
    setProgress({ percent: 10, status: 'Mempersiapkan blok tabel...' });

    try {
      const pages = groupBlocksIntoPages(blocks, paginationMode);

      const pdfBytes = await generateExcelPdf(pages, {
        fileName: workbook.fileName,
        theme,
        orientation,
        pageSize: 'A4',
        showPageNumbers: true,
        showBlockHeaders: true,
        onProgress: (percent, status) => {
          setProgress({ percent, status });
        },
      });

      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const sizeMb = (blob.size / (1024 * 1024)).toFixed(2);
      setResultPdfSize(`${sizeMb} MB`);
      setResultPdfUrl(url);

      // Trigger Confetti
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#10b981', '#059669', '#34d9a1'],
      });
    } catch (err) {
      console.error('Gagal generate PDF:', err);
      alert('Terjadi kesalahan saat membuat dokumen PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={styles.workspaceWrapper}>
      <div className={styles.ambientMesh} aria-hidden="true">
        <div className={styles.blob1} />
        <div className={styles.blob2} />
      </div>

      <div className="container">
        {/* Header Section */}
        <div className={styles.headerSection}>
          <div className={styles.toolBadge}>
            <Sparkles size={14} />
            <span>BARU • DETEKSI MULTI-KONTEN CERDAS</span>
          </div>
          <h1 className={styles.title}>Konversi Excel (XLSX) ke PDF</h1>
          <p className={styles.subtitle}>
            Ubah sheet Excel menjadi PDF rapi dengan tata letak presisi. Secara otomatis
            mendeteksi blok tabel terpisah, atur urutan halaman, dan pilih apakah ingin mencetak 1
            konten per halaman atau 2 konten jika mencukupi.
          </p>
        </div>

        {/* View 1: Dropzone Upload jika belum ada berkas */}
        {!workbook && (
          <div className={styles.dropzoneWrapper}>
            <div
              className={styles.dropzone}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />
              <div className={styles.uploadIconCircle}>
                <FileSpreadsheet size={34} />
              </div>
              <h3 className={styles.dropTitle}>Pilih atau Letakkan Berkas Excel di Sini</h3>
              <p className={styles.dropSubtitle}>
                Mendukung dokumen .xlsx, .xls, dan .csv • 100% Client-Side & Privat
              </p>
              <div className={styles.dropPills}>
                <span className={styles.dropPill}>Deteksi Tabel Otomatis</span>
                <span className={styles.dropPill}>Pilih & Urutkan Blok</span>
                <span className={styles.dropPill}>1 atau 2 Konten / Lembar</span>
              </div>
            </div>
          </div>
        )}

        {/* View 2: Studio Editor setelah berkas diunggah */}
        {workbook && (
          <div className={styles.editorCard}>
            {/* Header Editor */}
            <div className={styles.editorHeader}>
              <div className={styles.fileMeta}>
                <div className={styles.fileIconBadge}>
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <div className={styles.fileName}>{workbook.fileName}</div>
                  <div className={styles.fileSubText}>
                    {workbook.sheetNames.length} Sheet • {blocks.length} Blok Konten Terdeteksi
                  </div>
                </div>
              </div>

              <div className={headerActionsClass(styles)}>
                <button type="button" onClick={handleReset} className={styles.resetBtn}>
                  <RotateCcw size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                  Ganti Berkas
                </button>
              </div>
            </div>

            {/* Sheet Tabs jika > 1 Sheet */}
            {workbook.sheetNames.length > 1 && (
              <div className={styles.sheetTabsBar}>
                {workbook.sheetNames.map((sName) => (
                  <button
                    key={sName}
                    type="button"
                    onClick={() => handleSheetSwitch(sName)}
                    className={`${styles.sheetTab} ${
                      activeSheet === sName ? styles.sheetTabActive : ''
                    }`}
                  >
                    {sName} ({workbook.blocksBySheet[sName]?.length || 0})
                  </button>
                ))}
              </div>
            )}

            {/* Settings Panel */}
            <div className={styles.settingsPanel}>
              {/* Row 1: Mode Paginasi (Yang diminta user) */}
              <div className={styles.settingsRow}>
                <div className={styles.settingGroup}>
                  <span className={styles.settingLabel}>
                    <Layers size={15} />
                    Tata Letak Paginasi (Aturan Halaman):
                  </span>
                  <div className={styles.optionPillGroup}>
                    <button
                      type="button"
                      onClick={() => setPaginationMode('one_per_page')}
                      className={`${styles.optionPill} ${
                        paginationMode === 'one_per_page' ? styles.optionPillActive : ''
                      }`}
                    >
                      <FileText size={14} />
                      1 Konten per Halaman
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaginationMode('two_if_fit')}
                      className={`${styles.optionPill} ${
                        paginationMode === 'two_if_fit' ? styles.optionPillActive : ''
                      }`}
                    >
                      <Layers size={14} />
                      2 Konten per Halaman (Jika Muat)
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaginationMode('flow')}
                      className={`${styles.optionPill} ${
                        paginationMode === 'flow' ? styles.optionPillActive : ''
                      }`}
                    >
                      <Grid size={14} />
                      Kompak Mengalir (Flow)
                    </button>
                  </div>
                </div>

                {/* Row 2: Orientasi Kertas */}
                <div className={styles.settingGroup}>
                  <span className={styles.settingLabel}>Orientasi Lembar:</span>
                  <div className={styles.optionPillGroup}>
                    <button
                      type="button"
                      onClick={() => setOrientation('auto')}
                      className={`${styles.optionPill} ${
                        orientation === 'auto' ? styles.optionPillActive : ''
                      }`}
                    >
                      Otomatis (Sesuai Kolom)
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrientation('portrait')}
                      className={`${styles.optionPill} ${
                        orientation === 'portrait' ? styles.optionPillActive : ''
                      }`}
                    >
                      Potret
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrientation('landscape')}
                      className={`${styles.optionPill} ${
                        orientation === 'landscape' ? styles.optionPillActive : ''
                      }`}
                    >
                      Lanskap
                    </button>
                  </div>
                </div>

                {/* Row 3: Tema Tabel */}
                <div className={styles.settingGroup}>
                  <span className={styles.settingLabel}>
                    <Palette size={14} />
                    Gaya Tampilan:
                  </span>
                  <div className={styles.optionPillGroup}>
                    <button
                      type="button"
                      onClick={() => setTheme('modern')}
                      className={`${styles.optionPill} ${
                        theme === 'modern' ? styles.optionPillActive : ''
                      }`}
                    >
                      Modern Minimalist
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme('corporate')}
                      className={`${styles.optionPill} ${
                        theme === 'corporate' ? styles.optionPillActive : ''
                      }`}
                    >
                      Adobe Corporate
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme('grid')}
                      className={`${styles.optionPill} ${
                        theme === 'grid' ? styles.optionPillActive : ''
                      }`}
                    >
                      Garis Grid
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Blocks Section */}
            <div className={styles.blocksSection}>
              <div className={styles.blocksSectionHeader}>
                <div className={styles.blocksCountTitle}>
                  Blok Konten yang Terdeteksi ({blocks.length} blok)
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => handleSelectAll(true)}
                    className={styles.bulkSelectBtn}
                    style={{ marginRight: '1rem' }}
                  >
                    Pilih Semua
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectAll(false)}
                    className={styles.bulkSelectBtn}
                  >
                    Batalkan Semua
                  </button>
                </div>
              </div>

              {/* Grid Kartu Blok */}
              <div className={styles.blocksGrid}>
                {blocks.map((block, idx) => (
                  <div
                    key={block.id}
                    className={`${styles.blockCard} ${
                      block.selected ? styles.blockCardSelected : styles.blockCardUnselected
                    }`}
                  >
                    {/* Top Row: Order Badge & Checkbox */}
                    <div className={styles.blockTopRow}>
                      <span className={styles.orderBadge}>#{idx + 1}</span>
                      <label className={styles.blockCheckboxLabel}>
                        <input
                          type="checkbox"
                          checked={block.selected}
                          onChange={() => handleToggleBlock(block.id)}
                          className={styles.blockCheckbox}
                        />
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                          {block.selected ? 'Sertakan' : 'Lewati'}
                        </span>
                      </label>
                    </div>

                    {/* Judul Input */}
                    <input
                      type="text"
                      value={block.title}
                      onChange={(e) => handleUpdateTitle(block.id, e.target.value)}
                      className={styles.blockTitleInput}
                      title="Klik untuk mengubah judul"
                    />

                    {/* Meta Pills */}
                    <div className={styles.blockMetaPills}>
                      <span className={styles.rangePill}>{block.rangeAddress}</span>
                      <span className={styles.statsPill}>
                        {block.rowCount} baris × {block.colCount} kolom
                      </span>
                    </div>

                    {/* Mini Table Preview */}
                    <div className={styles.tablePreviewWrapper}>
                      <table className={styles.miniTable}>
                        <tbody>
                          {block.data.slice(0, 5).map((row, rIdx) => (
                            <tr key={rIdx}>
                              {row.slice(0, 6).map((cVal, cIdx) => (
                                <td key={cIdx}>{String(cVal ?? '')}</td>
                              ))}
                              {row.length > 6 && <td>...</td>}
                            </tr>
                          ))}
                          {block.data.length > 5 && (
                            <tr>
                              <td
                                colSpan={Math.min(block.colCount, 7)}
                                style={{ textAlign: 'center', color: '#94a3b8' }}
                              >
                                + {block.data.length - 5} baris lainnya
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Footer: Tombol Geser Urutan */}
                    <div className={styles.blockCardFooter}>
                      <button
                        type="button"
                        onClick={() => handleMoveBlock(idx, 'up')}
                        disabled={idx === 0}
                        className={styles.reorderBtn}
                        title="Geser ke atas"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveBlock(idx, 'down')}
                        disabled={idx === blocks.length - 1}
                        className={styles.reorderBtn}
                        title="Geser ke bawah"
                      >
                        <ArrowDown size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className={styles.actionBar}>
              <div className={styles.actionStats}>
                <span className={styles.actionStatsHighlight}>{selectedCount}</span> dari{' '}
                {blocks.length} Blok Dipilih • Estimasi{' '}
                <span className={styles.actionStatsHighlight}>{previewPages.length} Halaman</span>{' '}
                PDF
              </div>

              <button
                type="button"
                onClick={handleGeneratePdf}
                disabled={selectedCount === 0 || isGenerating}
                className={styles.convertBtn}
              >
                <span>Konversi ke PDF</span>
                <ArrowRight size={17} />
              </button>
            </div>
          </div>
        )}

        {/* Modal Progress Pembuatan PDF */}
        {isGenerating && (
          <div className={styles.progressModalOverlay}>
            <div className={styles.progressCard}>
              <FileSpreadsheet size={36} color="#10b981" />
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                Mengonversi Excel ke Dokumen PDF
              </div>
              <div className={styles.progressTrack}>
                <div
                  className={styles.progressBar}
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              <div className={styles.progressStatusText}>{progress.status}</div>
            </div>
          </div>
        )}

        {/* Modal Sukses Unduh Dokumen */}
        {resultPdfUrl && (
          <div className={styles.progressModalOverlay}>
            <div className={styles.successModalCard}>
              <div className={styles.successIconBadge}>
                <CheckCircle2 size={36} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.35rem' }}>
                  Dokumen PDF Berhasil Dibuat!
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                  Ukuran Berkas: <strong>{resultPdfSize}</strong> • {previewPages.length} Halaman
                </p>
              </div>

              <a
                href={resultPdfUrl}
                download={`${workbook?.fileName.replace(/\.[^/.]+$/, '') || 'excel'}_converted.pdf`}
                className={styles.downloadCtaBtn}
              >
                <Download size={18} />
                <span>Unduh Dokumen PDF</span>
              </a>

              <button
                type="button"
                onClick={() => setResultPdfUrl(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Tutup & Lanjutkan Edit
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function headerActionsClass(styles: any) {
  return styles.headerActions || '';
}
