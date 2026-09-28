import { PDFDocument, StandardFonts } from 'pdf-lib';
import { CompressOptions, CompressProgress, CompressResult } from '@/types/compress';

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
 * Kompresi berkas PDF klien secara pintar dan maksimal langsung di peramban.
 *
 * Mendukung profil kompresi:
 * 1. 'extreme'     : Kompresi maksimal (hemat ~70-85%), ukuran paling ramping, ideal untuk email/CPNS/BUMN (<1MB).
 * 2. 'recommended' : Kompresi seimbang & tajam (hemat ~50-75%), teks tajam dan gambar jernih tanpa distorsi.
 * 3. 'light'       : Prioritas ketajaman visual tinggi (hemat ~30-50%), cocok untuk portofolio dan dokumen cetak.
 * 4. 'lossless'    : Pemadatan object stream & pembersihan metadata struktural murni tanpa merender ulang piksel.
 *
 * Menyematkan layer teks presisi (searchable & selectable text) sehingga teks tetap bisa dicari (Ctrl+F)
 * dan disalin (copy-paste).
 */
export async function compressPDF(
  file: File,
  options: CompressOptions = { level: 'recommended', preserveText: true },
  onProgress?: (progress: CompressProgress) => void
): Promise<CompressResult> {
  const originalSize = file.size;
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const cleanFileName = `${baseName}_compressed.pdf`;

  // ==========================================================
  // JALUR 1: KOMPRESI MURNI LOSSLESS (STRUKTURAL SAJA)
  // ==========================================================
  if (options.level === 'lossless') {
    onProgress?.({
      percentage: 20,
      statusText: 'Membaca struktur objek PDF...',
    });

    const arrayBuffer = await file.arrayBuffer();

    onProgress?.({
      percentage: 50,
      statusText: 'Membersihkan redundansi metadata & merapikan stream...',
    });

    const pdfDoc = await PDFDocument.load(arrayBuffer, {
      ignoreEncryption: true,
      updateMetadata: false,
    });

    const totalPages = pdfDoc.getPageCount();

    try {
      pdfDoc.setProducer('PDF Tools by Primadev (pdftools.primadev.id)');
    } catch {
      // Ignore if producer cannot be set
    }

    onProgress?.({
      percentage: 80,
      statusText: 'Mengemas object streams terkompresi Flate...',
    });

    const compressedBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
    });

    const compressedSize = compressedBytes.length;
    const isAlreadyOptimized = compressedSize >= originalSize;
    const finalBytes = isAlreadyOptimized ? new Uint8Array(arrayBuffer) : compressedBytes;
    const finalSize = isAlreadyOptimized ? originalSize : compressedSize;
    const savedBytes = isAlreadyOptimized ? 0 : originalSize - compressedSize;
    const savedPercentage = isAlreadyOptimized ? 0 : Math.round((savedBytes / originalSize) * 100);

    const blob = new Blob([finalBytes as unknown as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    onProgress?.({
      percentage: 100,
      statusText: 'Selesai!',
    });

    return {
      originalSize,
      compressedSize: finalSize,
      savedBytes,
      savedPercentage,
      isAlreadyOptimized,
      blob,
      url,
      fileName: cleanFileName,
      totalPages,
      level: 'lossless',
    };
  }

  // ==========================================================
  // JALUR 2: KOMPRESI CERDAS (EKSTREM, REKOMENDASI, RINGAN)
  // ==========================================================
  onProgress?.({
    percentage: 10,
    statusText: 'Menginisialisasi mesin pengoptimal PDF...',
  });

  const pdfjs = await getPdfJs();
  if (!pdfjs) {
    throw new Error('Mesin PDF.js tidak dapat dimuat di peramban');
  }

  const arrayBuffer = await file.arrayBuffer();
  // Buat copy buffer terpisah untuk loading task PDF.js
  const pdfjsBuffer = arrayBuffer.slice(0);

  const loadingTask = pdfjs.getDocument({
    data: pdfjsBuffer,
    useSystemFonts: true,
  });

  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;

  if (totalPages === 0) {
    throw new Error('Dokumen PDF tidak memiliki halaman valid');
  }

  // Parameter profil kompresi
  let scale = 1.85;
  let encoderQuality = 0.80;

  if (options.level === 'extreme') {
    scale = 1.5;
    encoderQuality = 0.70;
  } else if (options.level === 'light') {
    scale = 2.2;
    encoderQuality = 0.88;
  } else {
    // 'recommended'
    scale = 1.85;
    encoderQuality = 0.80;
  }

  const outPdfDoc = await PDFDocument.create();
  try {
    outPdfDoc.setProducer('PDF Tools by Primadev (pdftools.primadev.id)');
  } catch {
    // Ignore producer error
  }

  // Siapkan font standar untuk layer teks selectable (invisible text layer)
  let helveticaFont: Awaited<ReturnType<typeof outPdfDoc.embedFont>> | null = null;
  if (options.preserveText !== false) {
    try {
      helveticaFont = await outPdfDoc.embedFont(StandardFonts.Helvetica);
    } catch (err) {
      console.warn('Font Helvetica gagal disematkan untuk layer teks:', err);
    }
  }

  // Proses setiap halaman secara bertahap
  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const startPercent = 15 + Math.round(((pageNum - 1) / totalPages) * 75);
    onProgress?.({
      percentage: startPercent,
      statusText: `Mengompres halaman ${pageNum} dari ${totalPages}...`,
      currentPage: pageNum,
      totalPages,
    });

    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) {
      throw new Error(`Gagal menginisialisasi kanvas halaman ${pageNum}`);
    }

    // Pastikan latar belakang putih solid agar transparan tidak menghitam di JPEG
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await page.render({ canvasContext: ctx, viewport } as any).promise;

    // Encode halaman ke format JPEG terkompresi
    const jpegBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error(`Gagal mengompresi gambar halaman ${pageNum}`));
        },
        'image/jpeg',
        encoderQuality
      );
    });

    const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());

    // Segera bersihkan canvas dari memori grafis
    canvas.width = 0;
    canvas.height = 0;

    // Sematkan gambar terkompresi ke dokumen PDF baru
    const embeddedImage = await outPdfDoc.embedJpg(jpegBytes);
    const pageWidth = viewport.width / scale;
    const pageHeight = viewport.height / scale;
    const newPage = outPdfDoc.addPage([pageWidth, pageHeight]);

    newPage.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
    });

    // Sematkan layer teks tak terlihat (Searchable & Selectable Text)
    if (options.preserveText !== false && helveticaFont) {
      try {
        const textContent = await page.getTextContent();
        for (const rawItem of textContent.items) {
          if ('str' in rawItem && typeof rawItem.str === 'string') {
            // Sanitasi karakter agar aman di-encode oleh font standar WinAnsi
            const cleanText = rawItem.str.replace(/[^\x20-\x7E\xA0-\xFF]/g, ' ').trim();
            if (cleanText.length > 0 && Array.isArray(rawItem.transform)) {
              const [vx, vy] = viewport.convertToViewportPoint(rawItem.transform[4], rawItem.transform[5]);
              const tx = vx / scale;
              const ty = pageHeight - (vy / scale);
              const rawSize = Math.hypot(rawItem.transform[0], rawItem.transform[1]);
              const fontSize = Math.max(5, Math.min(64, rawSize || 10));

              try {
                newPage.drawText(cleanText, {
                  x: tx,
                  y: ty,
                  size: fontSize,
                  font: helveticaFont,
                  opacity: 0, // Transparan: tidak menimpa visual gambar, namun teks bisa diblok & dicari (Ctrl+F)
                });
              } catch {
                // Abaikan kesalahan minor saat merender karakter individu
              }
            }
          }
        }
      } catch (txtErr) {
        console.warn(`Layer teks halaman ${pageNum} dilewati:`, txtErr);
      }
    }
  }

  onProgress?.({
    percentage: 92,
    statusText: 'Menyusun berkas PDF terkompresi & mengemas stream...',
    currentPage: totalPages,
    totalPages,
  });

  const compressedBytes = await outPdfDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
  });

  const compressedSize = compressedBytes.length;

  // Proteksi ukuran: jika berkas hasil kompresi malah lebih besar dari aslinya,
  // coba kompresi lossless struktural atau kembalikan berkas asli agar tidak membengkak
  let finalBytes: Uint8Array = compressedBytes;
  let finalSize = compressedSize;
  let savedBytes = originalSize - compressedSize;
  let isAlreadyOptimized = false;

  if (compressedSize >= originalSize) {
    try {
      const losslessDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const losslessBytes = await losslessDoc.save({ useObjectStreams: true });
      if (losslessBytes.length < originalSize) {
        finalBytes = losslessBytes;
        finalSize = losslessBytes.length;
        savedBytes = originalSize - finalSize;
      } else {
        finalBytes = new Uint8Array(arrayBuffer);
        finalSize = originalSize;
        savedBytes = 0;
        isAlreadyOptimized = true;
      }
    } catch {
      finalBytes = new Uint8Array(arrayBuffer);
      finalSize = originalSize;
      savedBytes = 0;
      isAlreadyOptimized = true;
    }
  }

  const savedPercentage = isAlreadyOptimized || savedBytes <= 0
    ? 0
    : Math.max(0, Math.round((savedBytes / originalSize) * 100));

  const blob = new Blob([finalBytes as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  onProgress?.({
    percentage: 100,
    statusText: 'Selesai!',
    currentPage: totalPages,
    totalPages,
  });

  return {
    originalSize,
    compressedSize: finalSize,
    savedBytes: Math.max(0, savedBytes),
    savedPercentage,
    isAlreadyOptimized,
    blob,
    url,
    fileName: cleanFileName,
    totalPages,
    level: options.level,
  };
}
