'use client';

import React from 'react';
import {
  FileText,
  Trash2,
  ChevronUp,
  ChevronDown,
  GripVertical,
  SlidersHorizontal,
  RotateCw,
} from 'lucide-react';
import { PDFFileItem } from '@/types/pdf';
import { formatBytes, formatPageRange } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import styles from './FileCard.module.css';

interface FileCardProps {
  item: PDFFileItem;
  index: number;
  totalItems: number;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onRemove: (id: string) => void;
  onConfigurePages: (item: PDFFileItem) => void;
  // Drag and drop handlers
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragEnter: (e: React.DragEvent, index: number) => void;
  onDragLeave: (e: React.DragEvent, index: number) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onDragEnd: (e: React.DragEvent) => void;
  isDragging?: boolean;
  isDragOver?: boolean;
  isJustDropped?: boolean;
}

export default function FileCard({
  item,
  index,
  totalItems,
  onMoveUp,
  onMoveDown,
  onRemove,
  onConfigurePages,
  onDragStart,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  onDragEnd,
  isDragging = false,
  isDragOver = false,
  isJustDropped = false,
}: FileCardProps) {
  const { t } = useLanguage();
  const isAllPagesSelected = item.selectedPages.length === item.pageCount;
  const hasRotations = Object.values(item.pageRotations).some((r) => r !== 0);

  return (
    <div
      className={`${styles.cardWrapper} ${isDragging ? styles.isDragging : ''} ${
        isDragOver ? styles.isDragOver : ''
      } ${isJustDropped ? styles.justDropped : ''}`}
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnter={(e) => onDragEnter(e, index)}
      onDragLeave={(e) => onDragLeave(e, index)}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
    >
      {/* Drag Grip Handle */}
      <div className={styles.dragHandle} title={t.dragToReorder}>
        <GripVertical size={18} />
      </div>

      {/* Index Number */}
      <div className={styles.orderBadge}>
        <span>{index + 1}</span>
      </div>

      {/* File Icon */}
      <div className={styles.fileIconBox}>
        <FileText size={22} className={styles.pdfIcon} />
      </div>

      {/* File Info */}
      <div className={styles.fileDetails}>
        <div className={styles.fileNameRow}>
          <span className={styles.fileName} title={item.name}>
            {item.name}
          </span>
        </div>

        <div className={styles.metaRow}>
          <span className={styles.fileSize}>{formatBytes(item.size)}</span>
          <span className={styles.metaDivider}>•</span>
          <span className={styles.pageCountInfo}>
            {isAllPagesSelected
              ? `${item.pageCount} ${item.pageCount === 1 ? t.pageSingular : t.pagesCount}`
              : `${item.selectedPages.length} ${t.pagesSelectedOf} ${item.pageCount} ${t.pagesSelected}`}
          </span>
          {!isAllPagesSelected && (
            <span className={styles.filterBadge}>
              {formatPageRange(item.selectedPages, item.pageCount)}
            </span>
          )}
          {hasRotations && (
            <span className={styles.rotationBadge} title="Rotated">
              <RotateCw size={11} />
              <span>{t.badgeRotated}</span>
            </span>
          )}
        </div>
      </div>

      {/* Card Actions */}
      <div
        className={styles.actionsGroup}
        draggable={false}
        onDragStart={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        {/* Page selector & thumbnail modal trigger */}
        <button
          onClick={() => onConfigurePages(item)}
          className={`btn btn-secondary btn-sm ${styles.actionBtn}`}
          title={t.btnConfigurePages}
        >
          <SlidersHorizontal size={14} />
          <span className={styles.actionBtnLabel}>{t.btnConfigurePages}</span>
        </button>

        {/* Up / Down Controls */}
        <div className={styles.reorderArrows}>
          <button
            onClick={() => onMoveUp(index)}
            disabled={index === 0}
            className={styles.arrowBtn}
            title={t.moveUp}
            aria-label={t.moveUp}
          >
            <ChevronUp size={16} />
          </button>
          <button
            onClick={() => onMoveDown(index)}
            disabled={index === totalItems - 1}
            className={styles.arrowBtn}
            title={t.moveDown}
            aria-label={t.moveDown}
          >
            <ChevronDown size={16} />
          </button>
        </div>

        {/* Delete File */}
        <button
          onClick={() => onRemove(item.id)}
          className={`btn btn-danger btn-sm ${styles.deleteBtn}`}
          title={t.removeFile}
          aria-label={t.removeFile}
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}
