// Dynamic loader helper untuk PDF.js di browser
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
 * Merender satu halaman PDF menjadi base64 DataURL gambar (JPEG)
 * untuk digunakan sebagai thumbnail di antarmuka pengguna.
 */
export async function renderPageThumbnail(
  file: File,
  pageNumber: number,
  targetWidth: number = 220
): Promise<string> {
  try {
    const pdfjs = await getPdfJs();
    if (!pdfjs) return '';

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({
      data: arrayBuffer,
      useSystemFonts: true,
    });

    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(pageNumber);

    const originalViewport = page.getViewport({ scale: 1 });
    const scale = targetWidth / originalViewport.width;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D context tidak tersedia');

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // Render page
    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await page.render(renderContext as any).promise;

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    // Bersihkan canvas dari memory
    canvas.width = 0;
    canvas.height = 0;

    return dataUrl;
  } catch (error) {
    console.warn(`Gagal merender thumbnail halaman ${pageNumber}:`, error);
    return ''; // Return empty string agar fallback icon ditampilkan
  }
}

/**
 * Merender thumbnail untuk semua halaman dari sebuah file PDF secara bertahap
 */
export async function renderAllThumbnails(
  file: File,
  pageCount: number,
  onThumbnailReady?: (pageNumber: number, dataUrl: string) => void
): Promise<Record<number, string>> {
  const thumbnails: Record<number, string> = {};

  try {
    const pdfjs = await getPdfJs();
    if (!pdfjs) return thumbnails;

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({
      data: arrayBuffer,
      useSystemFonts: true,
    });

    const pdf = await loadingTask.promise;

    for (let p = 1; p <= pageCount; p++) {
      try {
        const page = await pdf.getPage(p);
        const originalViewport = page.getViewport({ scale: 1 });
        const scale = 200 / originalViewport.width;
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) continue;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await page.render({ canvasContext: context, viewport } as any).promise;
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        thumbnails[p] = dataUrl;

        onThumbnailReady?.(p, dataUrl);

        canvas.width = 0;
        canvas.height = 0;
      } catch (pageErr) {
        console.warn(`Error rendering page ${p}:`, pageErr);
      }
    }
  } catch (err) {
    console.warn('Gagal memuat dokumen untuk thumbnails:', err);
  }

  return thumbnails;
}
