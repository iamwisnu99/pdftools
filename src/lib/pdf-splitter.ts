import { PDFDocument } from '@cantoo/pdf-lib';
import JSZip from 'jszip';
import { SplitFileResult, SplitOptions, SplitProgress, SplitResult } from '@/types/split';

/**
 * Mem-parsing string rentang halaman seperti "1-3, 5, 8-10"
 * menjadi array nomor halaman 1-based yang unik dan terurut.
 */
export function parsePageRange(rangeStr: string, maxPages: number): number[] {
  if (!rangeStr.trim()) return [];

  const pagesSet = new Set<number>();
  const parts = rangeStr.split(/[,;\s]+/).filter(Boolean);

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      if (!isNaN(start) && !isNaN(end)) {
        const min = Math.max(1, Math.min(start, end));
        const max = Math.min(maxPages, Math.max(start, end));
        for (let i = min; i <= max; i++) {
          pagesSet.add(i);
        }
      }
    } else {
      const p = parseInt(part, 10);
      if (!isNaN(p) && p >= 1 && p <= maxPages) {
        pagesSet.add(p);
      }
    }
  }

  return Array.from(pagesSet).sort((a, b) => a - b);
}

export async function splitPDF(
  file: File,
  options: SplitOptions,
  onProgress?: (progress: SplitProgress) => void
): Promise<SplitResult> {
  const arrayBuffer = await file.arrayBuffer();

  onProgress?.({
    percentage: 10,
    statusText: 'Membaca dokumen PDF...',
  });

  const srcDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const totalPages = srcDoc.getPageCount();

  if (totalPages === 0) {
    throw new Error('Dokumen PDF tidak memiliki halaman valid');
  }

  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const files: SplitFileResult[] = [];

  // ==========================================================
  // MODE 1: EKSTRAK RENTANG / HALAMAN PILIHAN
  // ==========================================================
  if (options.mode === 'range') {
    let targetPages: number[] = [];

    if (options.selectedPages && options.selectedPages.length > 0) {
      targetPages = options.selectedPages.filter((p) => p >= 1 && p <= totalPages);
    } else if (options.rangeInput) {
      targetPages = parsePageRange(options.rangeInput, totalPages);
    }

    if (targetPages.length === 0) {
      throw new Error('Pilih setidaknya satu halaman atau masukkan format rentang yang valid (contoh: 1-3, 5)');
    }

    onProgress?.({
      percentage: 45,
      statusText: `Mengekstrak ${targetPages.length} halaman pilihan...`,
    });

    const newDoc = await PDFDocument.create();
    newDoc.setProducer('PDF Tools by Primadev (pdftools.primadev.id)');

    const zeroBasedIndices = targetPages.map((p) => p - 1);
    const copiedPages = await newDoc.copyPages(srcDoc, zeroBasedIndices);
    copiedPages.forEach((p) => newDoc.addPage(p));

    onProgress?.({
      percentage: 85,
      statusText: 'Mengemas dokumen PDF hasil ekstraksi...',
    });

    const pdfBytes = await newDoc.save({ useObjectStreams: true });
    const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    const rangeLabel = targetPages.length === 1 ? `hal_${targetPages[0]}` : `hal_${targetPages[0]}-${targetPages[targetPages.length - 1]}`;
    const fileName = `${baseName}_ekstrak_${rangeLabel}.pdf`;

    files.push({
      fileName,
      blob,
      url,
      pageRange: targetPages.join(', '),
      fileSize: pdfBytes.length,
    });

    onProgress?.({
      percentage: 100,
      statusText: 'Selesai!',
    });

    return {
      mode: 'range',
      files,
      totalOutputFiles: 1,
    };
  }

  // ==========================================================
  // MODE 2: PISAH SEMUA HALAMAN JADI BERKAS MANDIRI
  // ==========================================================
  const zip = new JSZip();

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const percent = Math.round(((pageNum - 1) / totalPages) * 75) + 15;

    onProgress?.({
      percentage: percent,
      statusText: `Memisahkan halaman ${pageNum} dari ${totalPages}...`,
      currentPage: pageNum,
      totalPages,
    });

    const singleDoc = await PDFDocument.create();
    singleDoc.setProducer('PDF Tools by Primadev (pdftools.primadev.id)');

    const [copiedPage] = await singleDoc.copyPages(srcDoc, [pageNum - 1]);
    singleDoc.addPage(copiedPage);

    const singleBytes = await singleDoc.save({ useObjectStreams: true });
    const singleBlob = new Blob([singleBytes as unknown as BlobPart], { type: 'application/pdf' });
    const singleUrl = URL.createObjectURL(singleBlob);

    const singleFileName = `${baseName}_hal_${String(pageNum).padStart(2, '0')}.pdf`;

    files.push({
      fileName: singleFileName,
      blob: singleBlob,
      url: singleUrl,
      pageNumber: pageNum,
      fileSize: singleBytes.length,
    });

    // Tambahkan ke zip
    zip.file(singleFileName, singleBlob);
  }

  onProgress?.({
    percentage: 90,
    statusText: 'Mengompres semua halaman ke arsip ZIP...',
    currentPage: totalPages,
    totalPages,
  });

  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
  const zipUrl = URL.createObjectURL(zipBlob);
  const zipFileName = `${baseName}_semua_halaman.zip`;

  onProgress?.({
    percentage: 100,
    statusText: 'Selesai!',
    currentPage: totalPages,
    totalPages,
  });

  return {
    mode: 'all',
    files,
    zipBlob,
    zipUrl,
    zipFileName,
    totalOutputFiles: files.length,
  };
}
