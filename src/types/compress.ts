export type CompressionMode = 'lossless' | 'balanced';

export interface CompressProgress {
  percentage: number;
  statusText: string;
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
}
