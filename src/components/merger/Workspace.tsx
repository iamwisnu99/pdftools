'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import {
  Layers,
  ArrowUpDown,
  RotateCcw,
  Sparkles,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { PDFFileItem, MergeProgress, MergeResult } from '@/types/pdf';
import { generateId } from '@/lib/utils';
import { getPDFMetadata, mergePDFs } from '@/lib/pdf-merger';
import Dropzone from './Dropzone';
import FileCard from './FileCard';
import PageSelectorModal from './PageSelectorModal';
import MergeActionBar from './MergeActionBar';
import ResultModal from './ResultModal';
import ConfirmModal from './ConfirmModal';
import { getSkipDeletePreference, setSkipDeletePreference } from '@/lib/confirm-storage';
import { useLanguage } from '@/context/LanguageContext';
import styles from './Workspace.module.css';

export default function Workspace() {
  const { t, locale } = useLanguage();
  const [files, setFiles] = useState<PDFFileItem[]>([]);
  const [activeConfigItem, setActiveConfigItem] = useState<PDFFileItem | null>(null);
  const [outputFileName, setOutputFileName] = useState(locale === 'en' ? 'merged_document' : 'dokumen_gabungan');
  const [isMerging, setIsMerging] = useState(false);
  const [mergeProgress, setMergeProgress] = useState<MergeProgress | null>(null);
  const [mergeResult, setMergeResult] = useState<MergeResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal Konfirmasi Modern
  const [isClearAllOpen, setIsClearAllOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<PDFFileItem | null>(null);
  const [dontAskAgainDelete, setDontAskAgainDelete] = useState(false);

  // Drag-and-drop state untuk reorder file
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [justDroppedId, setJustDroppedId] = useState<string | null>(null);

  // Tambah file PDF baru
  const handleFilesSelected = async (newFiles: File[]) => {
    setErrorMessage(null);
    const newItems: PDFFileItem[] = [];

    for (const file of newFiles) {
      try {
        const metadata = await getPDFMetadata(file);
        const pageCount = metadata.pageCount || 1;
        const allPages = Array.from({ length: pageCount }, (_, i) => i + 1);

        newItems.push({
          id: generateId(),
          file,
          name: file.name,
          size: file.size,
          pageCount,
          selectedPages: allPages,
          pageRotations: {},
          thumbnails: {},
          loadingThumbnails: false,
        });
      } catch (err) {
        console.error('Gagal membaca PDF:', err);
        setErrorMessage(
          `Gagal memproses file "${file.name}". Pastikan file adalah PDF valid dan tidak terkunci sandi.`
        );
      }
    }

    if (newItems.length > 0) {
      setFiles((prev) => [...prev, ...newItems]);
    }
  };

  // Reorder: Geser Naik
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const targetItem = files[index];
    setFiles((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[index - 1];
      updated[index - 1] = temp;
      return updated;
    });
    if (targetItem) {
      setJustDroppedId(targetItem.id);
      setTimeout(() => setJustDroppedId(null), 500);
    }
  };

  // Reorder: Geser Turun
  const handleMoveDown = (index: number) => {
    if (index === files.length - 1) return;
    const targetItem = files[index];
    setFiles((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[index + 1];
      updated[index + 1] = temp;
      return updated;
    });
    if (targetItem) {
      setJustDroppedId(targetItem.id);
      setTimeout(() => setJustDroppedId(null), 500);
    }
  };

  // Drag & Drop Reordering Handlers dengan Animasi
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragOverIndex !== index && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (e: React.DragEvent, index: number) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    if (dragOverIndex === index) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndex =
      draggedIndex !== null ? draggedIndex : Number(e.dataTransfer.getData('text/plain'));

    if (
      sourceIndex !== null &&
      !isNaN(sourceIndex) &&
      sourceIndex >= 0 &&
      sourceIndex < files.length &&
      sourceIndex !== targetIndex
    ) {
      const movedItem = files[sourceIndex];
      setFiles((prev) => {
        const updated = [...prev];
        const [removed] = updated.splice(sourceIndex, 1);
        updated.splice(targetIndex, 0, removed);
        return updated;
      });

      if (movedItem) {
        setJustDroppedId(movedItem.id);
        setTimeout(() => setJustDroppedId(null), 500);
      }
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Hapus berkas dari daftar dengan pengecekan modal konfirmasi
  const handleRequestRemove = (id: string) => {
    const target = files.find((f) => f.id === id);
    if (!target) return;

    if (getSkipDeletePreference()) {
      handleExecuteRemove(id);
      return;
    }

    setFileToDelete(target);
    setDontAskAgainDelete(false);
  };

  const handleExecuteRemove = (id: string) => {
    setFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const handleConfirmDeleteFile = () => {
    if (!fileToDelete) return;
    if (dontAskAgainDelete) {
      setSkipDeletePreference();
    }
    handleExecuteRemove(fileToDelete.id);
    setFileToDelete(null);
  };

  // Balikkan urutan (Reverse)
  const handleReverseOrder = () => {
    setFiles((prev) => [...prev].reverse());
  };

  // Urutkan berdasarkan nama file A-Z
  const handleSortAZ = () => {
    setFiles((prev) =>
      [...prev].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
    );
  };

  // Buka modal konfirmasi kosongkan semua
  const handleRequestClearAll = () => {
    if (files.length === 0) return;
    setIsClearAllOpen(true);
  };

  const handleConfirmClearAll = () => {
    setFiles([]);
    setMergeResult(null);
    setErrorMessage(null);
    setIsClearAllOpen(false);
  };

  // Simpan konfigurasi halaman dari modal
  const handleSavePageConfig = (
    id: string,
    selectedPages: number[],
    pageRotations: Record<number, number>,
    updatedThumbnails?: Record<number, string>
  ) => {
    setFiles((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            selectedPages,
            pageRotations,
            thumbnails: updatedThumbnails ? { ...item.thumbnails, ...updatedThumbnails } : item.thumbnails,
          };
        }
        return item;
      })
    );
  };

  // Eksekusi penggabungan PDF
  const handleExecuteMerge = async () => {
    if (files.length === 0) return;
    setErrorMessage(null);
    setIsMerging(true);

    try {
      const result = await mergePDFs(files, outputFileName, (progress) => {
        setMergeProgress(progress);
      });
      setMergeResult(result);
      // Pembersihan otomatis: Hapus daftar berkas yang diunggah & cache thumbnail dari memori state Chrome
      setFiles([]);
      setActiveConfigItem(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat menggabungkan berkas.';
      setErrorMessage(msg);
    } finally {
      setIsMerging(false);
      setMergeProgress(null);
    }
  };

  // Tutup modal hasil & bersihkan URL blob dari memori
  const handleCloseResultModal = () => {
    if (mergeResult?.url) {
      try {
        URL.revokeObjectURL(mergeResult.url);
      } catch {
        // ignore
      }
    }
    setMergeResult(null);
  };

  // Hitung total halaman yang dipilih dari semua file
  const totalSelectedPages = files.reduce((acc, curr) => acc + curr.selectedPages.length, 0);

  return (
    <div className={styles.workspaceWrapper} id="workspace">
      <div className="container">
        {/* Workspace Title & Intro */}
        <div className={styles.workspaceHeader}>
          <div className={styles.headerTitleRow}>
            <div className={styles.workspaceIconBox}>
              <Image
                src="/icon.png"
                alt="PDF Tools Icon"
                width={48}
                height={48}
                className={styles.workspaceHeaderImg}
              />
            </div>
            <div>
              <h2 className={styles.workspaceTitle}>{t.workspaceTitle}</h2>
              <p className={styles.workspaceSubtitle}>
                {t.workspaceSubtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Error Alert if any */}
        {errorMessage && (
          <div className={styles.errorAlert}>
            <AlertCircle size={18} className={styles.errorIcon} />
            <div className={styles.errorText}>{errorMessage}</div>
          </div>
        )}

        {/* Jika belum ada file yang diunggah */}
        {files.length === 0 ? (
          <div className={styles.emptyStateContainer}>
            <Dropzone onFilesSelected={handleFilesSelected} />
          </div>
        ) : (
          /* Jika sudah ada file */
          <div className={styles.activeWorkspace}>
            {/* Quick Toolbar */}
            <div className={styles.workspaceToolbar}>
              <div className={styles.toolbarLeft}>
                <span className={styles.filesCountBadge}>
                  <FileCheck size={14} />
                  <span>
                    <strong>{files.length}</strong> {t.filesLoaded}
                  </span>
                </span>
              </div>

              <div className={styles.toolbarRight}>
                <button
                  onClick={handleSortAZ}
                  className="btn btn-secondary btn-sm"
                  title={t.btnSortAZ}
                >
                  <ArrowUpDown size={14} />
                  <span>{t.btnSortAZ}</span>
                </button>

                <button
                  onClick={handleReverseOrder}
                  className="btn btn-secondary btn-sm"
                  title={t.btnReverse}
                >
                  <RotateCcw size={14} />
                  <span>{t.btnReverse}</span>
                </button>

                <button
                  onClick={handleRequestClearAll}
                  className="btn btn-ghost btn-sm"
                  title={t.btnClearAll}
                >
                  <span>{t.btnClearAll}</span>
                </button>
              </div>
            </div>

            {/* List of Files */}
            <div className={styles.fileListGrid}>
              {files.map((item, idx) => (
                <FileCard
                  key={item.id}
                  item={item}
                  index={idx}
                  totalItems={files.length}
                  onMoveUp={handleMoveUp}
                  onMoveDown={handleMoveDown}
                  onRemove={() => handleRequestRemove(item.id)}
                  onConfigurePages={(it) => setActiveConfigItem(it)}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  isDragging={draggedIndex === idx}
                  isDragOver={dragOverIndex === idx && draggedIndex !== idx}
                  isJustDropped={justDroppedId === item.id}
                />
              ))}
            </div>

            {/* Compact Add-More Dropzone at bottom */}
            <div className={styles.addMoreSection}>
              <Dropzone onFilesSelected={handleFilesSelected} isCompact />
            </div>

            {/* Floating Action Bar */}
            <MergeActionBar
              totalFiles={files.length}
              totalPages={totalSelectedPages}
              outputFileName={outputFileName}
              onOutputFileNameChange={setOutputFileName}
              onMerge={handleExecuteMerge}
              onReset={handleRequestClearAll}
              isMerging={isMerging}
              progress={mergeProgress}
            />
          </div>
        )}
      </div>

      {/* Page Configuration & Thumbnail Modal */}
      {activeConfigItem && (
        <PageSelectorModal
          item={activeConfigItem}
          isOpen={true}
          onClose={() => setActiveConfigItem(null)}
          onSave={handleSavePageConfig}
        />
      )}

      {/* Result & Download Modal */}
      <ResultModal
        result={mergeResult}
        isOpen={Boolean(mergeResult)}
        onClose={handleCloseResultModal}
        onMergeAnother={handleCloseResultModal}
      />

      {/* Modern Confirm Clear All Modal */}
      <ConfirmModal
        isOpen={isClearAllOpen}
        onClose={() => setIsClearAllOpen(false)}
        onConfirm={handleConfirmClearAll}
        title={t.confirmClearAllTitle}
        description={t.confirmClearAllDesc}
        confirmText={t.confirmClearAllBtn}
        cancelText={t.btnCancel}
        variant="warning"
      />

      {/* Modern Confirm Delete Single File Modal */}
      <ConfirmModal
        isOpen={Boolean(fileToDelete)}
        onClose={() => setFileToDelete(null)}
        onConfirm={handleConfirmDeleteFile}
        title={t.confirmDeleteFileTitle}
        description={t.confirmDeleteFileDesc}
        itemInfo={
          fileToDelete
            ? {
                name: fileToDelete.name,
                size: fileToDelete.size,
                pageCount: fileToDelete.pageCount,
              }
            : undefined
        }
        confirmText={t.confirmDeleteFileBtn}
        cancelText={t.btnCancel}
        variant="danger"
        showDontAskAgain={true}
        dontAskChecked={dontAskAgainDelete}
        onDontAskChange={setDontAskAgainDelete}
        dontAskLabel={t.dontAskAgain}
        dontAskSubLabel={t.dontAskAgainSub}
      />
    </div>
  );
}
