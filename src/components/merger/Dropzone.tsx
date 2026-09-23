'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, FileUp, FileCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import styles from './Dropzone.module.css';

interface DropzoneProps {
  onFilesSelected: (files: File[]) => void;
  isCompact?: boolean;
}

export default function Dropzone({ onFilesSelected, isCompact = false }: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedCount, setDraggedCount] = useState<number>(0);
  const dragCounterRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  const extractItemCount = (e: React.DragEvent): number => {
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      let count = 0;
      for (let i = 0; i < e.dataTransfer.items.length; i++) {
        if (e.dataTransfer.items[i].kind === 'file') {
          count++;
        }
      }
      return count > 0 ? count : e.dataTransfer.items.length;
    }
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      return e.dataTransfer.files.length;
    }
    return 1;
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    const count = extractItemCount(e);
    setDraggedCount(count);
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    if (!isDragging) {
      setIsDragging(true);
    }
    const count = extractItemCount(e);
    if (count > 0 && count !== draggedCount) {
      setDraggedCount(count);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDragging(false);
      setDraggedCount(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragging(false);
    setDraggedCount(0);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const validFiles = Array.from(e.dataTransfer.files).filter(
        (file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
      );
      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const validFiles = Array.from(e.target.files).filter(
        (file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
      );
      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
      e.target.value = '';
    }
  };

  const openPicker = () => {
    fileInputRef.current?.click();
  };

  if (isCompact) {
    return (
      <div
        className={`${styles.compactDropzone} ${isDragging ? styles.compactDropzoneActive : ''}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openPicker}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          accept="application/pdf,.pdf"
          multiple
          className={styles.hiddenInput}
        />
        {isDragging ? (
          <div className={styles.compactActiveContent}>
            <div className={styles.compactPulseIcon}>
              <FileUp size={20} className={styles.compactDragActiveIcon} />
            </div>
            <div className={styles.compactActiveDetails}>
              <span className={styles.compactCountBadge}>
                {draggedCount > 0 ? `${draggedCount} ${t.dropzoneFilesDetected}` : t.dropzoneFilesDetected}
              </span>
              <span className={styles.compactReadyText}>
                {t.dropzoneDragReady} • {t.dropzoneDragRelease}
              </span>
            </div>
          </div>
        ) : (
          <>
            <FileUp size={18} className={styles.compactIcon} />
            <span>{t.dropzoneAddMore}</span>
          </>
        )}
      </div>
    );
  }

  return (
    <div
      className={`${styles.dropzoneContainer} ${isDragging ? styles.dropzoneActive : ''}`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={openPicker}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept="application/pdf,.pdf"
        multiple
        className={styles.hiddenInput}
      />

      {isDragging ? (
        /* Modern Drag-Over Animation & Dynamic File Count Display */
        <div className={styles.dragActiveOverlay}>
          <div className={styles.dragIconWrapper}>
            <FileUp size={46} className={styles.dragIconPulse} />
          </div>

          <div className={styles.dragFileCountBadge}>
            <Sparkles size={16} className={styles.sparkleIcon} />
            <span>
              {draggedCount > 0 ? `${draggedCount} ${t.dropzoneFilesDetected}` : t.dropzoneFilesDetected}
            </span>
          </div>

          <h3 className={styles.dragActiveTitle}>{t.dropzoneDragReady}</h3>

          <p className={styles.dragActiveSubtitle}>
            {draggedCount > 1
              ? `${draggedCount} ${t.dropzoneFilesWillBeAdded} • ${t.dropzoneDragRelease}`
              : `1 ${t.dropzoneFilesWillBeAdded} • ${t.dropzoneDragRelease}`}
          </p>

          <div className={styles.dragIndicatorPill}>
            <CheckCircle2 size={15} className={styles.indicatorCheckIcon} />
            <span>{t.dropzoneDragRelease}</span>
          </div>
        </div>
      ) : (
        /* Normal State */
        <>
          <div className={styles.dropzoneIconWrapper}>
            <UploadCloud size={44} className={styles.dropzoneIcon} />
          </div>

          <h3 className={styles.dropzoneTitle}>
            {t.dropzoneDrag}
          </h3>

          <p className={styles.dropzoneSubtitle}>
            {t.dropzoneOr} <span className={styles.browseLink}>{t.dropzoneBrowse}</span>
          </p>

          <div className={styles.dropzoneFooter}>
            <div className={styles.footerPill}>
              <FileCheck size={13} />
              <span>{t.dropzonePillQuality}</span>
            </div>
            <div className={styles.footerPill}>
              <Sparkles size={13} />
              <span>{t.dropzonePillMulti}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
