export type ImageFormat = 'png' | 'jpg' | 'webp';
export type ImageQuality = 'standard' | 'high';

export interface ConvertedPage {
  pageNumber: number;
  dataUrl: string;
  blob: Blob;
  fileName: string;
  width: number;
  height: number;
  sizeBytes: number;
}

export interface ConvertProgress {
  currentPage: number;
  totalPages: number;
  percentage: number;
  statusText: string;
}

export interface ConvertOptions {
  format: ImageFormat;
  quality: ImageQuality;
  selectedPages?: number[]; // If empty or undefined, convert all pages
}
