export type SplitMode = 'range' | 'all';

export interface SplitOptions {
  mode: SplitMode;
  rangeInput?: string;
  selectedPages?: number[];
}

export interface SplitProgress {
  percentage: number;
  statusText: string;
  currentPage?: number;
  totalPages?: number;
}

export interface SplitFileResult {
  fileName: string;
  blob: Blob;
  url: string;
  pageNumber?: number;
  pageRange?: string;
  fileSize: number;
}

export interface SplitResult {
  mode: SplitMode;
  files: SplitFileResult[];
  zipBlob?: Blob;
  zipUrl?: string;
  zipFileName?: string;
  totalOutputFiles: number;
}
