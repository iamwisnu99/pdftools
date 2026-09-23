'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  RotateCw,
  CheckSquare,
  Square,
  Sparkles,
  Loader2,
  Check,
  FileText,
} from 'lucide-react';
import { PDFFileItem } from '@/types/pdf';
import { parsePageRange, formatPageRange } from '@/lib/utils';
import { renderPageThumbnail } from '@/lib/pdf-thumbnail';
import { useLanguage } from '@/context/LanguageContext';
import styles from './PageSelectorModal.module.css';

interface PageSelectorModalProps {
  item: PDFFileItem;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    id: string,
    selectedPages: number[],
    pageRotations: Record<number, number>,
    updatedThumbnails?: Record<number, string>
  ) => void;
}

export default function PageSelectorModal({
  item,
  isOpen,
  onClose,
  onSave,
}: PageSelectorModalProps) {
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [selectedPages, setSelectedPages] = useState<number[]>(item.selectedPages);
  const [rotations, setRotations] = useState<Record<number, number>>(item.pageRotations);
  const [thumbnails, setThumbnails] = useState<Record<number, string>>(item.thumbnails || {});
  const [isLoadingThumbnails, setIsLoadingThumbnails] = useState(false);
  const [rangeInput, setRangeInput] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Sync state saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      setSelectedPages(item.selectedPages);
      setRotations(item.pageRotations);
      setRangeInput(formatPageRange(item.selectedPages, item.pageCount));

      const missingPages = Array.from({ length: item.pageCount }, (_, i) => i + 1).filter(
        (p) => !thumbnails[p]
      );

      if (missingPages.length > 0) {
        setIsLoadingThumbnails(true);
        let isCancelled = false;

        const loadThumbnails = async () => {
          const newThumbs = { ...thumbnails };
          for (const pageNum of missingPages) {
            if (isCancelled) break;
            try {
              const url = await renderPageThumbnail(item.file, pageNum, 220);
              if (url) {
                newThumbs[pageNum] = url;
                setThumbnails((prev) => ({ ...prev, [pageNum]: url }));
              }
            } catch (err) {
              console.warn(`Error generating thumbnail for page ${pageNum}:`, err);
            }
          }
          if (!isCancelled) {
            setIsLoadingThumbnails(false);
          }
        };

        loadThumbnails();

        return () => {
          isCancelled = true;
        };
      }
    }
  }, [isOpen, item]);

  if (!isOpen || !mounted) return null;

  const togglePage = (pageNum: number) => {
    setSelectedPages((prev) => {
      let updated: number[];
      if (prev.includes(pageNum)) {
        updated = prev.filter((p) => p !== pageNum);
      } else {
        updated = [...prev, pageNum].sort((a, b) => a - b);
      }
      setRangeInput(formatPageRange(updated, item.pageCount));
      return updated;
    });
  };

  const handleSelectAll = () => {
    const all = Array.from({ length: item.pageCount }, (_, i) => i + 1);
    setSelectedPages(all);
    setRangeInput(formatPageRange(all, item.pageCount));
  };

  const handleDeselectAll = () => {
    setSelectedPages([]);
    setRangeInput('');
  };

  const handleRangeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRangeInput(value);
    const parsed = parsePageRange(value, item.pageCount);
    setSelectedPages(parsed);
  };

  const rotatePage = (pageNum: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setRotations((prev) => {
      const current = prev[pageNum] || 0;
      const next = (current + 90) % 360;
      return { ...prev, [pageNum]: next };
    });
  };

  const rotateAllPages = () => {
    setRotations((prev) => {
      const next: Record<number, number> = {};
      for (let p = 1; p <= item.pageCount; p++) {
        const current = prev[p] || 0;
        next[p] = (current + 90) % 360;
      }
      return next;
    });
  };

  const handleApply = () => {
    onSave(item.id, selectedPages, rotations, thumbnails);
    onClose();
  };

  return createPortal(
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header Modal */}
        <div className={styles.modalHeader}>
          <div className={styles.headerInfo}>
            <h3 className={styles.modalTitle}>{t.pageModalTitle}</h3>
            <p className={styles.modalSubtitle} title={item.name}>
              {item.name} • {item.pageCount} {t.totalPageCount}
            </p>
          </div>
          <button onClick={onClose} className={styles.closeBtn} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Toolbar Kontrol */}
        <div className={styles.modalToolbar}>
          <div className={styles.toolbarLeft}>
            <button onClick={handleSelectAll} className="btn btn-secondary btn-sm">
              <CheckSquare size={14} />
              <span>{t.btnSelectAll}</span>
            </button>
            <button onClick={handleDeselectAll} className="btn btn-secondary btn-sm">
              <Square size={14} />
              <span>{t.btnDeselectAll}</span>
            </button>
            <button onClick={rotateAllPages} className="btn btn-secondary btn-sm">
              <RotateCw size={14} />
              <span>{t.btnRotateAll}</span>
            </button>
          </div>

          <div className={styles.rangeInputWrapper}>
            <label htmlFor="range-input" className={styles.rangeLabel}>
              {t.rangeLabel}
            </label>
            <input
              id="range-input"
              type="text"
              value={rangeInput}
              onChange={handleRangeInputChange}
              placeholder={t.rangePlaceholder}
              className={styles.rangeInput}
            />
          </div>
        </div>

        {/* Thumbnail Loading indicator banner */}
        {isLoadingThumbnails && (
          <div className={styles.loadingBanner}>
            <Loader2 size={16} className={styles.spinner} />
            <span>{t.loadingThumbs}</span>
          </div>
        )}

        {/* Grid Thumbnail Halaman */}
        <div className={styles.thumbnailsGridContainer}>
          <div className={styles.thumbnailsGrid}>
            {Array.from({ length: item.pageCount }, (_, i) => i + 1).map((pageNum) => {
              const isSelected = selectedPages.includes(pageNum);
              const rotation = rotations[pageNum] || 0;
              const thumbUrl = thumbnails[pageNum];

              return (
                <div
                  key={pageNum}
                  className={`${styles.pageCard} ${isSelected ? styles.pageSelected : styles.pageUnselected}`}
                  onClick={() => togglePage(pageNum)}
                >
                  {/* Status Checkbox Badge */}
                  <div className={styles.cardHeaderBadge}>
                    <div className={`${styles.checkbox} ${isSelected ? styles.checked : ''}`}>
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>
                    <span className={styles.pageNumber}>{t.pagePrefix} {pageNum}</span>
                  </div>

                  {/* Thumbnail Image Viewport with Rotation */}
                  <div className={styles.thumbnailViewport}>
                    {thumbUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumbUrl}
                        alt={`Thumbnail Page ${pageNum}`}
                        className={styles.thumbnailImg}
                        style={{
                          transform: `rotate(${rotation}deg)`,
                        }}
                      />
                    ) : (
                      <div className={styles.placeholderThumbnail}>
                        <FileText size={32} className={styles.placeholderIcon} />
                        <span>{t.pagePrefix} {pageNum}</span>
                      </div>
                    )}
                  </div>

                  {/* Footer Card: Rotasi Button */}
                  <div className={styles.pageCardFooter}>
                    <span className={styles.rotationText}>
                      {rotation > 0 ? `${rotation}°` : t.rotationNormal}
                    </span>
                    <button
                      onClick={(e) => rotatePage(pageNum, e)}
                      className={styles.rotatePageBtn}
                      title={t.rotatePageBtn}
                    >
                      <RotateCw size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Modal Actions */}
        <div className={styles.modalFooter}>
          <div className={styles.footerSummary}>
            <span>
              {selectedPages.length} {t.pagesSelectedOf} {item.pageCount} {t.pagesSelectedSummary}
            </span>
          </div>
          <div className={styles.footerActions}>
            <button onClick={onClose} className="btn btn-secondary">
              {t.btnCancel}
            </button>
            <button onClick={handleApply} className="btn btn-primary">
              <Sparkles size={15} />
              <span>{t.btnApply}</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
