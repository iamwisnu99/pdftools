'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, Check, FileText } from 'lucide-react';
import { formatBytes } from '@/lib/utils';
import styles from './ConfirmModal.module.css';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  itemInfo?: {
    name: string;
    size?: number;
    pageCount?: number;
  };
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning';
  showDontAskAgain?: boolean;
  dontAskChecked?: boolean;
  onDontAskChange?: (checked: boolean) => void;
  dontAskLabel?: string;
  dontAskSubLabel?: string;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemInfo,
  confirmText = 'Hapus',
  cancelText = 'Batal',
  variant = 'danger',
  showDontAskAgain = false,
  dontAskChecked = false,
  onDontAskChange,
  dontAskLabel = 'Jangan tanyakan lagi',
  dontAskSubLabel,
}: ConfirmModalProps) {
  const [mounted, setMounted] = useState(false);

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

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className={styles.modalOverlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className={styles.modalCard}>
        <div className={styles.modalBody}>
          {/* Alert Icon */}
          <div
            className={`${styles.iconWrapper} ${
              variant === 'warning' ? styles.iconWrapperWarning : ''
            }`}
          >
            {variant === 'warning' ? (
              <AlertTriangle size={24} strokeWidth={2.2} />
            ) : (
              <Trash2 size={24} strokeWidth={2.2} />
            )}
          </div>

          {/* Title & Description */}
          <div className={styles.textGroup}>
            <h3 id="confirm-modal-title" className={styles.title}>
              {title}
            </h3>
            <p className={styles.description}>{description}</p>
          </div>

          {/* File Preview Badge if deleting single file */}
          {itemInfo && (
            <div className={styles.filePreview}>
              <div className={styles.fileIconBox}>
                <FileText size={18} />
              </div>
              <div className={styles.fileDetails}>
                <span className={styles.fileName} title={itemInfo.name}>
                  {itemInfo.name}
                </span>
                <span className={styles.fileMeta}>
                  {itemInfo.size ? formatBytes(itemInfo.size) : ''}
                  {itemInfo.size && itemInfo.pageCount ? ' • ' : ''}
                  {itemInfo.pageCount ? `${itemInfo.pageCount} Hal` : ''}
                </span>
              </div>
            </div>
          )}

          {/* "Jangan tanyakan lagi" checkbox */}
          {showDontAskAgain && onDontAskChange && (
            <div
              className={styles.checkboxRow}
              onClick={() => onDontAskChange(!dontAskChecked)}
              role="checkbox"
              aria-checked={dontAskChecked}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  onDontAskChange(!dontAskChecked);
                }
              }}
            >
              <div
                className={`${styles.checkboxBox} ${
                  dontAskChecked ? styles.checkboxChecked : ''
                }`}
              >
                {dontAskChecked && <Check size={12} strokeWidth={3} />}
              </div>
              <div className={styles.checkboxLabels}>
                <span className={styles.checkboxLabel}>{dontAskLabel}</span>
                {dontAskSubLabel && (
                  <span className={styles.checkboxSubLabel}>{dontAskSubLabel}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className={styles.modalFooter}>
          <button
            type="button"
            onClick={onClose}
            className={`btn btn-secondary ${styles.cancelBtn}`}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={styles.confirmDangerBtn}
          >
            <Trash2 size={15} />
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
