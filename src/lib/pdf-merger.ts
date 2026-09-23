import { PDFDocument, degrees } from 'pdf-lib';
import { PDFFileItem, MergeProgress, MergeResult } from '@/types/pdf';

/**
 * Menggabungkan daftar file PDF secara 100% di browser (client-side).
 * Mendukung filter halaman spesifik per berkas dan rotasi orientasi.
 */
export async function mergePDFs(
  files: PDFFileItem[],
  outputFileName: string,
  onProgress?: (progress: MergeProgress) => void
): Promise<MergeResult> {
  if (files.length === 0) {
    throw new Error('Tidak ada file PDF untuk digabungkan');
  }

  const mergedPdf = await PDFDocument.create();
  let totalPages = 0;

  for (let i = 0; i < files.length; i++) {
    const item = files[i];
    
    if (onProgress) {
      onProgress({
        currentFile: i + 1,
        totalFiles: files.length,
        percentage: Math.round((i / files.length) * 90),
        statusText: `Memproses berkas ${i + 1} dari ${files.length}: ${item.name}`
      });
    }

    try {
      const buffer = await item.file.arrayBuffer();
      const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const availablePageCount = srcDoc.getPageCount();

      // Validasi indeks halaman (1-indexed -> 0-indexed)
      const validIndices = item.selectedPages
        .filter(p => p >= 1 && p <= availablePageCount)
        .map(p => p - 1);

      if (validIndices.length > 0) {
        const copiedPages = await mergedPdf.copyPages(srcDoc, validIndices);

        for (let j = 0; j < copiedPages.length; j++) {
          const page = copiedPages[j];
          const pageNumber = item.selectedPages[j];
          const customRotation = item.pageRotations[pageNumber] || 0;

          if (customRotation !== 0) {
            const currentAngle = page.getRotation().angle;
            page.setRotation(degrees((currentAngle + customRotation) % 360));
          }

          mergedPdf.addPage(page);
          totalPages++;
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error(`Gagal memproses berkas ${item.name}:`, errorMessage);
      throw new Error(`Gagal membaca atau memproses file "${item.name}". Pastikan file tidak terenkripsi kata sandi kuat.`);
    }
  }

  if (onProgress) {
    onProgress({
      currentFile: files.length,
      totalFiles: files.length,
      percentage: 95,
      statusText: 'Menyusun dan mengompres dokumen hasil...'
    });
  }

  const mergedBytes = await mergedPdf.save();
  const blob = new Blob([mergedBytes as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  const cleanName = outputFileName.trim().toLowerCase().endsWith('.pdf')
    ? outputFileName.trim()
    : `${outputFileName.trim()}.pdf`;

  if (onProgress) {
    onProgress({
      currentFile: files.length,
      totalFiles: files.length,
      percentage: 100,
      statusText: 'Penggabungan berhasil!'
    });
  }

  return {
    blob,
    url,
    fileName: cleanName,
    totalSize: blob.size,
    totalPages
  };
}

/**
 * Mendapatkan informasi dasar PDF (jumlah halaman) secara cepat
 */
export async function getPDFMetadata(file: File): Promise<{ pageCount: number }> {
  const buffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  return {
    pageCount: pdfDoc.getPageCount()
  };
}
