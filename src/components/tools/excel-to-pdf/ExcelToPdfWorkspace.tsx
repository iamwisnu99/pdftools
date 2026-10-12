'use client';

import React, { useState, useRef, useMemo } from 'react';
import {
  FileSpreadsheet,
  RotateCcw,
  Download,
  Layers,
  Grid,
  FileText,
  Palette,
  Sparkles,
  Search,
  Eye,
  Archive,
  X,
  Printer,
  Calendar,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  ParsedWorkbook,
  ContentBlock,
  parseExcelWorkbook,
  PaginationMode,
  DetectionMode,
  groupBlocksIntoPages,
} from './excelBlockDetector';
import {
  generateCombinedPdf,
  generateSingleBlockPdf,
  generateZipArchive,
  TableTheme,
  PageOrientation,
} from './excelPdfGenerator';
import styles from './ExcelToPdfWorkspace.module.css';

export default function ExcelToPdfWorkspace() {
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [workbook, setWorkbook] = useState<ParsedWorkbook | null>(null);
  const [activeSheet, setActiveSheet] = useState<string>('');
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [detectionMode, setDetectionMode] = useState<DetectionMode>('smart_blocks');
  const [paginationMode, setPaginationMode] = useState<PaginationMode>('one_per_page');
  const [orientation, setOrientation] = useState<PageOrientation>('auto');
  const [theme, setTheme] = useState<TableTheme>('dual_optimized');

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Preview Modal
  const [previewingBlock, setPreviewingBlock] = useState<ContentBlock | null>(null);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ percent: 0, status: '' });
  const [resultDownloadUrl, setResultDownloadUrl] = useState<string | null>(null);
  const [resultFileName, setResultFileName] = useState<string>('');
  const [resultSize, setResultSize] = useState<string>('');
  const [resultType, setResultType] = useState<'pdf' | 'zip'>('pdf');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Membaca file Excel
  const handleFileChange = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      setFileBuffer(buffer);
      setFileName(file.name);

      const parsed = await parseExcelWorkbook(buffer, file.name, detectionMode);
      setWorkbook(parsed);
      setActiveSheet(parsed.activeSheet);

      // Gabungkan semua blok dari semua sheet
      const initialBlocks: ContentBlock[] = [];
      parsed.sheetNames.forEach((sheetName) => {
        initialBlocks.push(...(parsed.blocksBySheet[sheetName] || []));
      });
      setBlocks(initialBlocks);
      setResultDownloadUrl(null);
    } catch (err) {
      console.error('Gagal membaca file Excel:', err);
      alert('Gagal membaca berkas Excel. Pastikan berkas berformat .xlsx, .xls, atau .csv valid.');
    }
  };

  // Re-parse jika user mengubah mode deteksi
  const handleDetectionModeChange = async (newMode: DetectionMode) => {
    setDetectionMode(newMode);
    if (fileBuffer && fileName) {
      try {
        const parsed = await parseExcelWorkbook(fileBuffer, fileName, newMode);
        setWorkbook(parsed);
        const initialBlocks: ContentBlock[] = [];
        parsed.sheetNames.forEach((sheetName) => {
          initialBlocks.push(...(parsed.blocksBySheet[sheetName] || []));
        });
        setBlocks(initialBlocks);
      } catch (err) {
        console.error('Gagal memproses ulang mode deteksi:', err);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSheetSwitch = (sheetName: string) => {
    setActiveSheet(sheetName);
  };

  const handleToggleBlock = (blockId: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, selected: !b.selected } : b))
    );
  };

  const handleSelectAll = (select: boolean) => {
    setBlocks((prev) => prev.map((b) => ({ ...b, selected: select })));
  };

  const handleUpdateTitle = (blockId: string, newTitle: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, title: newTitle } : b))
    );
  };

  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= blocks.length) return;

    const newBlocks = [...blocks];
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[targetIdx];
    newBlocks[targetIdx] = temp;

    newBlocks.forEach((b, i) => {
      b.order = i + 1;
    });

    setBlocks(newBlocks);
  };

  const handleReset = () => {
    setFileBuffer(null);
    setFileName('');
    setWorkbook(null);
    setBlocks([]);
    setResultDownloadUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Filter blok berdasarkan sheet aktif dan query pencarian
  const visibleBlocks = useMemo(() => {
    return blocks.filter((b) => {
      const matchSheet = !activeSheet || b.sheetName === activeSheet;
      if (!matchSheet) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        b.title.toLowerCase().includes(q) ||
        (b.subtitle && b.subtitle.toLowerCase().includes(q)) ||
        (b.dateStr && b.dateStr.toLowerCase().includes(q)) ||
        (b.sectionName && b.sectionName.toLowerCase().includes(q)) ||
        b.rangeAddress.toLowerCase().includes(q)
      );
    });
  }, [blocks, activeSheet, searchQuery]);

  const selectedCount = useMemo(() => {
    return blocks.filter((b) => b.selected).length;
  }, [blocks]);

  // Eksekusi Konversi: PDF Gabungan
  const handleGenerateCombinedPdf = async () => {
    if (!workbook || selectedCount === 0) return;

    setIsGenerating(true);
    setProgress({ percent: 5, status: 'Menyiapkan layout tabel...' });

    try {
      const pages = groupBlocksIntoPages(blocks, paginationMode);

      const pdfBytes = await generateCombinedPdf(pages, {
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

      const outName = `${workbook.fileName.replace(/\.[^/.]+$/, '')}_Lengkap.pdf`;
      setResultFileName(outName);
      setResultSize(`${sizeMb} MB`);
      setResultType('pdf');
      setResultDownloadUrl(url);

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#10b981', '#059669', '#34d9a1'],
      });
    } catch (err) {
      console.error('Gagal generate PDF gabungan:', err);
      alert('Terjadi kesalahan saat membuat dokumen PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Eksekusi Konversi: ZIP Arsip Folder
  const handleGenerateZip = async () => {
    if (!workbook || selectedCount === 0) return;

    setIsGenerating(true);
    setProgress({ percent: 5, status: 'Menyiapkan paket arsip ZIP...' });

    try {
      const zipBlob = await generateZipArchive(blocks, {
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

      const url = URL.createObjectURL(zipBlob);
      const sizeMb = (zipBlob.size / (1024 * 1024)).toFixed(2);

      const outName = `${workbook.fileName.replace(/\.[^/.]+$/, '')}_PerTabel_ZIP.zip`;
      setResultFileName(outName);
      setResultSize(`${sizeMb} MB`);
      setResultType('zip');
      setResultDownloadUrl(url);

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#2563eb', '#10b981'],
      });
    } catch (err) {
      console.error('Gagal generate arsip ZIP:', err);
      alert('Terjadi kesalahan saat memproses arsip ZIP.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Download PDF Tunggal langsung dari modal pratinjau
  const handleDownloadSinglePdf = async (block: ContentBlock) => {
    try {
      const pdfBytes = await generateSingleBlockPdf(block, {
        fileName: block.suggestedFileName,
        theme,
        orientation,
        pageSize: 'A4',
        showPageNumbers: true,
        showBlockHeaders: true,
      });

      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = block.suggestedFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Gagal unduh single PDF:', err);
      alert('Gagal mengunduh berkas PDF tunggal.');
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
            <span>DETEKSI 2D MULTI-TABEL • DUAL PRINT CONTRAST</span>
          </div>
          <h1 className={styles.title}>Konversi Excel (XLSX) ke PDF Cerdas</h1>
          <p className={styles.subtitle}>
            Ekstrak data dari format tabel Excel apa pun secara dinamis. Mendeteksi tabel berdampingan
            (Shift 1-3) &amp; bertumpuk, menjaga warna dan border asli, serta dioptimalkan untuk cetak
            warna maupun hitam putih berdaya baca tinggi.
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
                <FileSpreadsheet size={36} />
              </div>
              <h3 className={styles.dropTitle}>Pilih atau Letakkan Berkas Excel di Sini</h3>
              <p className={styles.dropSubtitle}>
                Mendukung .xlsx, .xls, .csv • 100% Client-Side &amp; Privasi Terjaga
              </p>
              <div className={styles.dropPills}>
                <span className={styles.dropPill}>Deteksi 2D Tabel Berdampingan</span>
                <span className={styles.dropPill}>Preservasi Warna &amp; Merge Cell</span>
                <span className={styles.dropPill}>Ekspor PDF Gabungan &amp; ZIP Folder</span>
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
                  <FileSpreadsheet size={22} />
                </div>
                <div>
                  <div className={styles.fileName}>{workbook.fileName}</div>
                  <div className={styles.fileSubText}>
                    <span>{workbook.sheetNames.length} Sheet</span>
                    <span>•</span>
                    <span>{blocks.length} Tabel Terdeteksi</span>
                  </div>
                </div>
              </div>

              <div className={styles.headerActions}>
                <button type="button" onClick={handleReset} className={styles.resetBtn}>
                  <RotateCcw size={14} />
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
              {/* Row 1: Mode Deteksi Blok & Tema */}
              <div className={styles.settingsRow}>
                {/* Mode Deteksi Blok */}
                <div className={styles.settingGroup}>
                  <span className={styles.settingLabel}>
                    <Grid size={15} />
                    Logika Deteksi Blok:
                  </span>
                  <div className={styles.optionPillGroup}>
                    <button
                      type="button"
                      onClick={() => handleDetectionModeChange('smart_blocks')}
                      className={`${styles.optionPill} ${
                        detectionMode === 'smart_blocks' ? styles.optionPillActive : ''
                      }`}
                      title="Mendeteksi pulau tabel terpisah secara horizontal (side-by-side) dan vertikal"
                    >
                      <Sparkles size={14} />
                      Otomatis 2D (Side-by-Side &amp; Stack)
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDetectionModeChange('row_breaks')}
                      className={`${styles.optionPill} ${
                        detectionMode === 'row_breaks' ? styles.optionPillActive : ''
                      }`}
                    >
                      <Layers size={14} />
                      Bagi Baris Kosong
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDetectionModeChange('per_sheet')}
                      className={`${styles.optionPill} ${
                        detectionMode === 'per_sheet' ? styles.optionPillActive : ''
                      }`}
                    >
                      <FileText size={14} />
                      1 Sheet Utuh
                    </button>
                  </div>
                </div>

                {/* Gaya Tampilan & Cetak */}
                <div className={styles.settingGroup}>
                  <span className={styles.settingLabel}>
                    <Palette size={14} />
                    Gaya &amp; Kontras Cetak:
                  </span>
                  <div className={styles.optionPillGroup}>
                    <button
                      type="button"
                      onClick={() => setTheme('dual_optimized')}
                      className={`${styles.optionPill} ${
                        theme === 'dual_optimized' ? styles.optionPillActive : ''
                      }`}
                      title="Warna tajam pada layar + kontras tinggi terbaca saat dicetak hitam putih"
                    >
                      <Printer size={14} />
                      Dual (Warna &amp; Print B/W)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme('excel_native')}
                      className={`${styles.optionPill} ${
                        theme === 'excel_native' ? styles.optionPillActive : ''
                      }`}
                    >
                      Warna Asli Excel
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme('monochrome')}
                      className={`${styles.optionPill} ${
                        theme === 'monochrome' ? styles.optionPillActive : ''
                      }`}
                    >
                      Hitam Putih Murni
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme('modern')}
                      className={`${styles.optionPill} ${
                        theme === 'modern' ? styles.optionPillActive : ''
                      }`}
                    >
                      Modern Emerald
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 2: Tata Letak Paginasi & Orientasi */}
              <div className={styles.settingsRow}>
                {/* Mode Paginasi */}
                <div className={styles.settingGroup}>
                  <span className={styles.settingLabel}>
                    <Layers size={15} />
                    Paginasi Lembar:
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
                      1 Tabel per Halaman
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaginationMode('two_if_fit')}
                      className={`${styles.optionPill} ${
                        paginationMode === 'two_if_fit' ? styles.optionPillActive : ''
                      }`}
                    >
                      <Layers size={14} />
                      2 Tabel (Jika Muat)
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaginationMode('flow')}
                      className={`${styles.optionPill} ${
                        paginationMode === 'flow' ? styles.optionPillActive : ''
                      }`}
                    >
                      <Grid size={14} />
                      Mengalir Terus
                    </button>
                  </div>
                </div>

                {/* Orientasi Kertas */}
                <div className={styles.settingGroup}>
                  <span className={styles.settingLabel}>Orientasi Kertas:</span>
                  <div className={styles.optionPillGroup}>
                    <button
                      type="button"
                      onClick={() => setOrientation('auto')}
                      className={`${styles.optionPill} ${
                        orientation === 'auto' ? styles.optionPillActive : ''
                      }`}
                    >
                      Otomatis
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
              </div>
            </div>

            {/* Blocks Section */}
            <div className={styles.blocksSection}>
              <div className={styles.blocksSectionHeader}>
                <div className={styles.blocksHeaderLeft}>
                  <div className={styles.blocksCountTitle}>
                    Daftar Tabel ({visibleBlocks.length}{' '}
                    {visibleBlocks.length !== blocks.length ? `dari ${blocks.length}` : ''})
                  </div>

                  {/* Input Pencarian */}
                  <div className={styles.searchBarWrapper}>
                    <Search size={14} className={styles.searchIcon} />
                    <input
                      type="text"
                      placeholder="Cari tanggal, shift, judul..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={styles.searchInput}
                    />
                  </div>
                </div>

                <div className={styles.blocksControlsRight}>
                  <button
                    type="button"
                    onClick={() => handleSelectAll(true)}
                    className={styles.bulkSelectBtn}
                  >
                    Pilih Semua
                  </button>
                  <span style={{ color: 'var(--border-color)' }}>|</span>
                  <button
                    type="button"
                    onClick={() => handleSelectAll(false)}
                    className={styles.bulkSelectBtn}
                  >
                    Kosongkan
                  </button>
                </div>
              </div>

              {/* Grid Kartu Tabel */}
              <div className={styles.blocksGrid}>
                {visibleBlocks.map((block) => {
                  const globalIdx = blocks.findIndex((b) => b.id === block.id);
                  return (
                    <div
                      key={block.id}
                      className={`${styles.blockCard} ${
                        block.selected ? styles.blockCardSelected : styles.blockCardUnselected
                      }`}
                    >
                      {/* Baris Atas: Order & Checkbox */}
                      <div className={styles.blockTopRow}>
                        <span className={styles.orderBadge}>#{block.order}</span>
                        <label className={styles.blockCheckboxLabel}>
                          <input
                            type="checkbox"
                            checked={block.selected}
                            onChange={() => handleToggleBlock(block.id)}
                            className={styles.blockCheckbox}
                          />
                          <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Cetak</span>
                        </label>
                      </div>

                      {/* Judul & Subtitle */}
                      <div>
                        <input
                          type="text"
                          value={block.title}
                          onChange={(e) => handleUpdateTitle(block.id, e.target.value)}
                          className={styles.blockTitleInput}
                        />
                        {block.subtitle && (
                          <div className={styles.blockSubtitle}>
                            <Calendar size={12} />
                            <span>{block.subtitle}</span>
                          </div>
                        )}
                      </div>

                      {/* Pills Metadata */}
                      <div className={styles.blockMetaPills}>
                        <span className={styles.rangePill}>{block.rangeAddress}</span>
                        {block.monthFolder && (
                          <span className={styles.folderPill}>
                            📁 {block.monthFolder}
                          </span>
                        )}
                        <span className={styles.statsPill}>
                          {block.rowCount} bgs × {block.colCount} kol
                        </span>
                      </div>

                      {/* Mini Table Preview */}
                      <div className={styles.tablePreviewWrapper}>
                        <table className={styles.miniTable}>
                          <tbody>
                            {block.cells.slice(0, 5).map((row, rIdx) => (
                              <tr key={rIdx}>
                                {row.map((cell, cIdx) => {
                                  if (cell.isMergedChild) return null;
                                  return (
                                    <td
                                      key={cIdx}
                                      colSpan={cell.colSpan || 1}
                                      rowSpan={cell.rowSpan || 1}
                                      style={{
                                        backgroundColor: cell.fillColor || undefined,
                                        color:
                                          cell.fillColor && theme === 'dual_optimized'
                                            ? '#0F172A'
                                            : cell.textColor || undefined,
                                        fontWeight: cell.bold || rIdx === 0 ? 700 : 400,
                                        textAlign: cell.align || 'left',
                                      }}
                                    >
                                      {cell.text}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Footer Kartu: Pratinjau & Urutan */}
                      <div className={styles.blockCardFooter}>
                        <button
                          type="button"
                          onClick={() => setPreviewingBlock(block)}
                          className={styles.previewBtn}
                        >
                          <Eye size={13} />
                          Pratinjau
                        </button>

                        <div className={styles.reorderGroup}>
                          <button
                            type="button"
                            disabled={globalIdx === 0}
                            onClick={() => handleMoveBlock(globalIdx, 'up')}
                            className={styles.reorderBtn}
                            title="Geser ke Atas"
                          >
                            <ArrowUp size={13} />
                          </button>
                          <button
                            type="button"
                            disabled={globalIdx === blocks.length - 1}
                            onClick={() => handleMoveBlock(globalIdx, 'down')}
                            className={styles.reorderBtn}
                            title="Geser ke Bawah"
                          >
                            <ArrowDown size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Action Bar */}
            <div className={styles.actionBar}>
              <div className={styles.actionStats}>
                <span>Terpilih: </span>
                <span className={styles.actionStatsHighlight}>
                  {selectedCount} dari {blocks.length} Tabel
                </span>
              </div>

              <div className={styles.actionButtonsGroup}>
                {/* Unduh PDF Gabungan */}
                <button
                  type="button"
                  disabled={selectedCount === 0 || isGenerating}
                  onClick={handleGenerateCombinedPdf}
                  className={styles.convertCombinedBtn}
                >
                  <FileText size={17} />
                  Unduh PDF Gabungan
                </button>

                {/* Unduh ZIP Folder */}
                <button
                  type="button"
                  disabled={selectedCount === 0 || isGenerating}
                  onClick={handleGenerateZip}
                  className={styles.convertZipBtn}
                  title="Mengekstrak setiap tabel menjadi file PDF terpisah dalam folder per bulan"
                >
                  <Archive size={17} />
                  Unduh Paket ZIP (Folder Bulan)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Pratinjau Detail Tabel */}
        {previewingBlock && (
          <div className={styles.progressModalOverlay} onClick={() => setPreviewingBlock(null)}>
            <div
              className={styles.detailModalCard}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.detailModalHeader}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                    {previewingBlock.title}
                  </h3>
                  {previewingBlock.subtitle && (
                    <span style={{ fontSize: '0.85rem', color: '#059669', fontWeight: 600 }}>
                      {previewingBlock.subtitle}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewingBlock(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <div className={styles.detailModalBody}>
                <table className={styles.detailTable}>
                  <tbody>
                    {previewingBlock.cells.map((row, rIdx) => (
                      <tr key={rIdx}>
                        {row.map((cell, cIdx) => {
                          if (cell.isMergedChild) return null;
                          return (
                            <td
                              key={cIdx}
                              colSpan={cell.colSpan || 1}
                              rowSpan={cell.rowSpan || 1}
                              style={{
                                backgroundColor: cell.fillColor || undefined,
                                color:
                                  cell.fillColor && theme === 'dual_optimized'
                                    ? '#0F172A'
                                    : cell.textColor || undefined,
                                fontWeight: cell.bold ? 700 : 400,
                                textAlign: cell.align || 'left',
                              }}
                            >
                              {cell.text}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className={styles.detailModalFooter}>
                <button
                  type="button"
                  onClick={() => handleDownloadSinglePdf(previewingBlock)}
                  className={styles.convertCombinedBtn}
                >
                  <Download size={15} />
                  Unduh PDF Halaman Ini
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewingBlock(null)}
                  className={styles.closeModalBtn}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Progress Pembuatan PDF */}
        {isGenerating && (
          <div className={styles.progressModalOverlay}>
            <div className={styles.progressCard}>
              <div className={styles.uploadIconCircle} style={{ margin: 0 }}>
                <Sparkles size={32} />
              </div>
              <div className={styles.progressPercentText}>{progress.percent}%</div>
              <div className={styles.progressTrack}>
                <div className={styles.progressBar} style={{ width: `${progress.percent}%` }} />
              </div>
              <div className={styles.progressStatusText}>{progress.status}</div>
            </div>
          </div>
        )}

        {/* Modal Sukses Download */}
        {resultDownloadUrl && !isGenerating && (
          <div className={styles.progressModalOverlay} onClick={() => setResultDownloadUrl(null)}>
            <div
              className={styles.successModalCard}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.successIconBadge}>
                {resultType === 'zip' ? <Archive size={34} /> : <CheckCircle2 size={34} />}
              </div>
              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.35rem' }}>
                  {resultType === 'zip' ? 'Arsip ZIP Siap Diunduh!' : 'Dokumen PDF Selesai Dibuat!'}
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
                  {resultFileName} ({resultSize})
                </p>
              </div>

              <a
                href={resultDownloadUrl}
                download={resultFileName}
                className={styles.downloadCtaBtn}
              >
                <Download size={18} />
                Unduh Berkas Sekarang
              </a>

              <button
                type="button"
                onClick={() => setResultDownloadUrl(null)}
                className={styles.closeModalBtn}
              >
                Kembali ke Editor
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
