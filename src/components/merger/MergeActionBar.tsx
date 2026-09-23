'use client';

import React from 'react';
import {
  Sparkles,
  Loader2,
  FileCheck,
  RotateCcw,
  Edit3,
} from 'lucide-react';
import { MergeProgress } from '@/types/pdf';
import { useLanguage } from '@/context/LanguageContext';
import styles from './MergeActionBar.module.css';

interface MergeActionBarProps {
  totalFiles: number;
  totalPages: number;
  outputFileName: string;
  onOutputFileNameChange: (name: string) => void;
  onMerge: () => void;
  onReset: () => void;
  isMerging: boolean;
  progress: MergeProgress | null;
}

export default function MergeActionBar({
  totalFiles,
  totalPages,
  outputFileName,
  onOutputFileNameChange,
  onMerge,
  onReset,
  isMerging,
  progress,
}: MergeActionBarProps) {
  const { t, locale } = useLanguage();
  if (totalFiles === 0) return null;

  return (
    <div className={styles.actionBarContainer}>
      {/* Animated Progress Bar when merging */}
      {isMerging && (
        <div className={styles.progressContainer}>
          <div
            className={styles.progressBar}
            style={{ width: `${progress ? progress.percentage : 10}%` }}
          />
          <div className={styles.progressInfo}>
            <div className={styles.progressStatus}>
              <Loader2 size={14} className={styles.spinner} />
              <span>{progress ? progress.statusText : t.btnMerging}</span>
            </div>
            <span className={styles.progressPercent}>
              {progress ? `${progress.percentage}%` : '0%'}
            </span>
          </div>
        </div>
      )}

      <div className={styles.actionBarInner}>
        {/* Left: Output Filename Config */}
        <div className={styles.filenameConfig}>
          <label htmlFor="output-filename-input" className={styles.filenameLabel}>
            <Edit3 size={13} className={styles.filenameLabelIcon} />
            <span>{t.labelOutputName}</span>
          </label>
          <div className={styles.inputWrapper}>
            <input
              id="output-filename-input"
              type="text"
              value={outputFileName}
              onChange={(e) => onOutputFileNameChange(e.target.value)}
              disabled={isMerging}
              placeholder={locale === 'en' ? 'document-name' : 'nama-dokumen'}
              className={styles.filenameInput}
              aria-label={t.labelOutputName}
            />
            <span className={styles.extBadge}>.pdf</span>
          </div>
        </div>

        {/* Center: Consolidated Summary Stats Capsule */}
        <div className={styles.summaryStats}>
          <div className={styles.statCapsule}>
            <div className={styles.statGroup}>
              <FileCheck size={15} className={styles.statIcon} />
              <span className={styles.statNumber}>{totalFiles}</span>
              <span className={styles.statLabel}>{t.statFiles}</span>
            </div>
            <span className={styles.statDivider} />
            <div className={styles.statGroup}>
              <span className={styles.statNumber}>{totalPages}</span>
              <span className={styles.statLabel}>{t.statPagesSelected}</span>
            </div>
          </div>
        </div>

        {/* Right: Actions (Reset & Merge) */}
        <div className={styles.actions}>
          <button
            onClick={onReset}
            disabled={isMerging}
            className={`btn btn-secondary ${styles.resetBtn}`}
            title={t.btnReset}
          >
            <RotateCcw size={15} />
            <span>{t.btnReset}</span>
          </button>

          <button
            onClick={onMerge}
            disabled={isMerging || totalPages === 0}
            className={`btn btn-primary btn-lg ${styles.mergeBtn}`}
          >
            {isMerging ? (
              <>
                <Loader2 size={18} className={styles.spinner} />
                <span>{t.btnMerging}</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>{t.btnMergeAction}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
