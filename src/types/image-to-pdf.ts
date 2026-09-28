export type PageSize = 'fit' | 'a4' | 'letter';
export type PageOrientation = 'auto' | 'portrait' | 'landscape';
export type PageMargin = 'none' | 'small' | 'normal';

export interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  size: number;
  width: number;
  height: number;
}

export interface ImageToPdfOptions {
  pageSize: PageSize;
  orientation: PageOrientation;
  margin: PageMargin;
}

export interface ImageToPdfProgress {
  percentage: number;
  statusText: string;
  currentImage?: number;
  totalImages?: number;
}

export interface ImageToPdfResult {
  blob: Blob;
  url: string;
  fileName: string;
  fileSize: number;
  totalImages: number;
}
