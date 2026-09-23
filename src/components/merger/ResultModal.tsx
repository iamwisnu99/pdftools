'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CheckCircle,
  Download,
  ExternalLink,
  RotateCcw,
  X,
  FileCheck,
  HardDrive,
  Check,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MergeResult } from '@/types/pdf';
import { formatBytes } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import styles from './ResultModal.module.css';

interface ResultModalProps {
  result: MergeResult | null;
  isOpen: boolean;
  onClose: () => void;
  onMergeAnother: () => void;
}

export default function ResultModal({
  result,
  isOpen,
  onClose,
  onMergeAnother,
}: ResultModalProps) {
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset isDownloaded when a new result arrives
  useEffect(() => {
    if (result) {
      setIsDownloaded(false);
    }
  }, [result]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Self-cleaning: Clean up Object URL when component unmounts or result changes
  useEffect(() => {
    return () => {
      if (result?.url) {
        try {
          URL.revokeObjectURL(result.url);
        } catch {
          // ignore
        }
      }
    };
  }, [result]);

  // Clean-up handler on modal close
  const handleClose = () => {
    if (result?.url) {
      try {
        URL.revokeObjectURL(result.url);
      } catch {
        // ignore
      }
    }
    onClose();
  };

  // Handle ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, result]);

  // Confetti on success
  useEffect(() => {
    if (isOpen && result) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        console.warn('Confetti error:', e);
      }
    }
  }, [isOpen, result]);

  if (!isOpen || !result || !mounted) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = result.url;
    a.download = result.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setIsDownloaded(true);
  };

  const handleOpenNewTab = () => {
    window.open(result.url, '_blank');
  };

  return createPortal(
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.successIconBadge}>
              <CheckCircle size={24} className={styles.successIcon} />
            </div>
            <div>
              <h3 className={styles.modalTitle}>{t.mergeSuccessTitle}</h3>
              <p className={styles.modalSubtitle}>
                {t.mergeSuccessSubtitle}
              </p>
            </div>
          </div>
          <button onClick={handleClose} className={styles.closeBtn} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* File Stats Summary */}
        <div className={styles.statsBar}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>{t.labelFileName}</span>
            <span className={styles.statValue} title={result.fileName}>
              {result.fileName}
            </span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statLabel}>{t.labelFinalSize}</span>
            <span className={styles.statValue}>
              <HardDrive size={13} className={styles.statIcon} />
              {formatBytes(result.totalSize)}
            </span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statLabel}>{t.labelTotalPages}</span>
            <span className={styles.statValue}>
              <FileCheck size={13} className={styles.statIcon} />
              {result.totalPages} {result.totalPages === 1 ? t.pageSingular : t.pagesCount}
            </span>
          </div>

          {/* Self-cleaning info pill */}
          <div className={styles.memoryPill}>
            <Sparkles size={12} className={styles.memoryPillIcon} />
            <span>{isDownloaded ? t.btnDownloaded : t.memoryCleanedNotice}</span>
          </div>
        </div>

        {/* Embedded PDF Viewer (85% Screen Frame) */}
        <div className={styles.previewContainer}>
          <iframe
            src={`${result.url}#toolbar=1&navpanes=0`}
            className={styles.pdfFrame}
            title="PDF Preview Result"
          />
        </div>

        {/* Footer Actions */}
        <div className={styles.modalFooter}>
          <button
            onClick={() => {
              if (result?.url) {
                try {
                  URL.revokeObjectURL(result.url);
                } catch {
                  // ignore
                }
              }
              onMergeAnother();
            }}
            className="btn btn-secondary"
          >
            <RotateCcw size={15} />
            <span>{t.btnMergeAnother}</span>
          </button>

          <div className={styles.rightActions}>
            <button
              onClick={handleOpenNewTab}
              className="btn btn-secondary"
              title="Open in new browser tab"
            >
              <ExternalLink size={15} />
              <span>{t.btnOpenNewTab}</span>
            </button>

            {isDownloaded && (
              <button
                onClick={handleClose}
                className="btn btn-secondary"
                title={t.btnSelfCleaning}
              >
                <span>{t.btnSelfCleaning}</span>
              </button>
            )}

            <button
              onClick={handleDownload}
              className={`btn btn-primary btn-lg ${isDownloaded ? styles.downloadedSuccessBtn : ''}`}
            >
              {isDownloaded ? <Check size={18} /> : <Download size={18} />}
              <span>{isDownloaded ? t.btnDownloaded : t.btnDownloadPdf}</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
