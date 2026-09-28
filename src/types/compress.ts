export type CompressionLevel = 'extreme' | 'recommended' | 'light' | 'lossless';

export interface CompressOptions {
  level: CompressionLevel;
  preserveText?: boolean;
}

export interface CompressProgress {
  percentage: number;
  statusText: string;
  currentPage?: number;
  totalPages?: number;
}

export interface CompressResult {
  originalSize: number;
  compressedSize: number;
  savedBytes: number;
  savedPercentage: number;
  isAlreadyOptimized: boolean;
  blob: Blob;
  url: string;
  fileName: string;
  totalPages: number;
  level: CompressionLevel;
}
