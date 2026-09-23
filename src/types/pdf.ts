export interface PDFFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  pageCount: number;
  selectedPages: number[]; // 1-indexed (misal: [1, 2, 4])
  pageRotations: Record<number, number>; // pageNumber (1-indexed) -> derajat (0, 90, 180, 270)
  thumbnails: Record<number, string>; // pageNumber -> dataURL
  loadingThumbnails: boolean;
}

export interface MergeProgress {
  currentFile: number;
  totalFiles: number;
  statusText: string;
  percentage: number;
}

export interface MergeResult {
  blob: Blob;
  url: string;
  fileName: string;
  totalSize: number;
  totalPages: number;
}
