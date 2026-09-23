import JSZip from 'jszip';
import { ConvertedPage, ConvertOptions, ConvertProgress } from '@/types/image-converter';

let pdfjsLibInstance: typeof import('pdfjs-dist') | null = null;

async function getPdfJs() {
  if (typeof window === 'undefined') return null;

  if (!pdfjsLibInstance) {
    const pdfjs = await import('pdfjs-dist');
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    }
    pdfjsLibInstance = pdfjs;
  }
  return pdfjsLibInstance;
}

/**
 * Mengonversi halaman-halaman PDF menjadi gambar (PNG, JPG, WEBP)
 * dengan resolusi Standard (~150 DPI) atau High (300 DPI HD).
 * 100% diproses di browser klien menggunakan HTML5 Canvas.
 */
export async function convertPdfToImages(
  file: File,
  options: ConvertOptions,
  onProgress?: (progress: ConvertProgress) => void
): Promise<ConvertedPage[]> {
  const pdfjs = await getPdfJs();
  if (!pdfjs) throw new Error('PDF.js engine gagal dimuat');

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({
    data: arrayBuffer,
    useSystemFonts: true,
  });

  const pdf = await loadingTask.promise;
  const totalAvailablePages = pdf.numPages;

  const targetPages = options.selectedPages && options.selectedPages.length > 0
    ? options.selectedPages.filter((p) => p >= 1 && p <= totalAvailablePages)
    : Array.from({ length: totalAvailablePages }, (_, i) => i + 1);

  if (targetPages.length === 0) {
    throw new Error('Tidak ada halaman valid yang dipilih untuk dikonversi');
  }

  const results: ConvertedPage[] = [];
  const baseName = file.name.replace(/\.[^/.]+$/, '');

  // Menentukan skala render berdasarkan kualitas
  const scale = options.quality === 'high' ? 2.5 : 1.5;

  // Menentukan mime type dan ekstensi
  let mimeType = 'image/png';
  let extension = 'png';
  let encoderQuality = 1.0;

  if (options.format === 'jpg') {
    mimeType = 'image/jpeg';
    extension = 'jpg';
    encoderQuality = options.quality === 'high' ? 0.95 : 0.85;
  } else if (options.format === 'webp') {
    mimeType = 'image/webp';
    extension = 'webp';
    encoderQuality = options.quality === 'high' ? 0.95 : 0.85;
  }

  for (let idx = 0; idx < targetPages.length; idx++) {
    const pageNum = targetPages[idx];

    onProgress?.({
      currentPage: idx + 1,
      totalPages: targetPages.length,
      percentage: Math.round(((idx) / targetPages.length) * 100),
      statusText: `Mengonversi halaman ${pageNum} dari ${totalAvailablePages}...`,
    });

    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Gagal menginisialisasi Canvas 2D context');

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    // Untuk JPG, berikan latar belakang putih agar transparan tidak menjadi hitam
    if (options.format === 'jpg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await page.render({ canvasContext: ctx, viewport } as any).promise;

    // Convert to Blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error(`Gagal membuat blob gambar untuk halaman ${pageNum}`));
        },
        mimeType,
        encoderQuality
      );
    });

    const dataUrl = canvas.toDataURL(mimeType, encoderQuality);
    const fileName = `${baseName}_hal_${String(pageNum).padStart(2, '0')}.${extension}`;

    results.push({
      pageNumber: pageNum,
      dataUrl,
      blob,
      fileName,
      width: canvas.width,
      height: canvas.height,
      sizeBytes: blob.size,
    });

    // Lepaskan memori canvas
    canvas.width = 0;
    canvas.height = 0;
  }

  onProgress?.({
    currentPage: targetPages.length,
    totalPages: targetPages.length,
    percentage: 100,
    statusText: 'Konversi selesai!',
  });

  return results;
}

/**
 * Mengemas semua gambar hasil konversi ke dalam satu file ZIP secara 100% di browser.
 */
export async function createImagesZip(
  pages: ConvertedPage[],
  zipName: string,
  onZipProgress?: (percent: number) => void
): Promise<Blob> {
  const zip = new JSZip();

  for (const page of pages) {
    zip.file(page.fileName, page.blob);
  }

  const zipBlob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      onZipProgress?.(Math.round(metadata.percent));
    }
  );

  return zipBlob;
}

/**
 * Membantu trigger download di browser pengguna
 */
export function triggerFileDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
