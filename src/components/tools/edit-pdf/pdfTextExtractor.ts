import { PDFDocument, PDFName, PDFDict } from '@cantoo/pdf-lib';

export interface TextBlock {
  id: string;
  pageIndex: number;
  originalText: string;
  currentText: string;
  isModified: boolean;

  // Koordinat PDF user space (poin)
  x: number;
  y: number; // Baseline dari bawah halaman
  width: number;
  height: number;

  // Karakteristik Tipografi
  fontSize: number;
  fontFamily: 'Helvetica' | 'TimesRoman' | 'Courier' | string;
  isBold: boolean;
  isItalic: boolean;
  color: string; // Hex format e.g. '#000000'
  backgroundColor: string; // Hex format e.g. '#ffffff'

  // Koordinat Persentase untuk Overlay DOM Responsif
  viewportRect: {
    leftPercent: number;
    topPercent: number;
    widthPercent: number;
    heightPercent: number;
  };
}

export interface PageTextData {
  pageIndex: number;
  pageNumber: number;
  widthPt: number;
  heightPt: number;
  blocks: TextBlock[];
  thumbnailUrl?: string;
}

export interface ParsedPdfForEdit {
  fileName: string;
  fileSize: number;
  numPages: number;
  pages: PageTextData[];
}

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
 * Mendeteksi jenis font standar dan gaya (Bold/Italic) dengan pencocokan nama font asli PDF
 */
function inferFontProperties(
  fontNames: string[]
): {
  fontFamily: 'Helvetica' | 'TimesRoman' | 'Courier';
  isBold: boolean;
  isItalic: boolean;
} {
  const combined = fontNames.filter(Boolean).join(' ').toLowerCase();

  const isBold =
    combined.includes('bold') ||
    combined.includes('black') ||
    combined.includes('heavy') ||
    combined.includes('bld') ||
    combined.includes('semibold') ||
    combined.includes('semi-bold') ||
    combined.includes('demi') ||
    combined.includes('w7') ||
    combined.includes('w8') ||
    combined.includes('w9') ||
    combined.includes('700') ||
    combined.includes('800') ||
    combined.includes('900');

  const isItalic =
    combined.includes('italic') ||
    combined.includes('oblique') ||
    combined.includes('slanted') ||
    combined.includes('itl');

  let fontFamily: 'Helvetica' | 'TimesRoman' | 'Courier' = 'Helvetica';

  if (
    combined.includes('times') ||
    combined.includes('serif') ||
    combined.includes('roman') ||
    combined.includes('georgia') ||
    combined.includes('cambria') ||
    combined.includes('garamond') ||
    combined.includes('palatino') ||
    combined.includes('minion')
  ) {
    fontFamily = 'TimesRoman';
  } else if (
    combined.includes('courier') ||
    combined.includes('mono') ||
    combined.includes('consolas') ||
    combined.includes('menlo') ||
    combined.includes('code') ||
    combined.includes('monaco')
  ) {
    fontFamily = 'Courier';
  }

  return { fontFamily, isBold, isItalic };
}

interface RawTextItem {
  str: string;
  tx: number;
  ty: number;
  width: number;
  height: number;
  fontSize: number;
  fontName: string;
  realFontName: string;
  isBoldHint: boolean;
  isItalicHint: boolean;
}

/**
 * Mengekstrak seluruh teks dari PDF dengan preservasi akurat jenis font, ukuran pt, ketebalan, dan tabel
 */
export async function extractPdfTextForEditing(
  file: File,
  onProgress?: (percent: number, status: string) => void
): Promise<{
  parsed: ParsedPdfForEdit;
  arrayBuffer: ArrayBuffer;
  pdfDoc: any;
}> {
  const pdfjs = await getPdfJs();
  if (!pdfjs) throw new Error('PDF.js engine gagal dimuat');

  onProgress?.(10, 'Membaca berkas dokumen PDF...');
  const rawBuffer = await file.arrayBuffer();

  // Salin buffer agar tidak detached saat dikirimkan ke worker PDF.js
  const bufferForPdfLib = rawBuffer.slice(0);
  const bufferForWorker = rawBuffer.slice(0);

  // Baca struktur font asli PDF menggunakan pdf-lib untuk akurasi font name
  const pdfLibDoc = await PDFDocument.load(bufferForPdfLib, { ignoreEncryption: true }).catch(() => null);
  const pdfLibPages = pdfLibDoc?.getPages() || [];

  const loadingTask = pdfjs.getDocument({
    data: bufferForWorker,
    useSystemFonts: true,
  });

  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  const pages: PageTextData[] = [];

  for (let p = 1; p <= numPages; p++) {
    const pct = Math.round(10 + (p / numPages) * 80);
    onProgress?.(pct, `Menganalisis teks pada halaman ${p} dari ${numPages}...`);

    const page = await pdf.getPage(p);
    const viewport = page.getViewport({ scale: 1.0 });
    const pageWidthPt = viewport.width;
    const pageHeightPt = viewport.height;

    // Muat operator list untuk mengisi metadata font di page.commonObjs
    try {
      await page.getOperatorList();
    } catch {
      // ignore
    }

    // Ambil daftar BaseFont asli dari PDF Resources
    const pageBaseFonts: string[] = [];
    try {
      const pageNode = pdfLibPages[p - 1]?.node;
      const fontDict = pageNode?.Resources()?.lookup(PDFName.of('Font'), PDFDict);
      if (fontDict) {
        for (const [, fontRef] of fontDict.entries()) {
          const f = pageNode?.context?.lookup(fontRef, PDFDict);
          const baseFont = f?.lookup(PDFName.of('BaseFont'))?.toString()?.replace('/', '');
          if (baseFont) {
            pageBaseFonts.push(baseFont);
          }
        }
      }
    } catch {
      // ignore
    }

    const textContent = await page.getTextContent();
    const rawItems: RawTextItem[] = [];

    for (const item of textContent.items) {
      if ('str' in item && item.str.trim().length > 0) {
        const transform = item.transform;
        const tx = transform[4];
        const ty = transform[5];

        // Hitung ukuran font asli dari skala vertikal matriks transformasi
        const vScale = Math.hypot(transform[2], transform[3]);
        const hScale = Math.hypot(transform[0], transform[1]);
        const calcSize = vScale > 0 ? vScale : (hScale > 0 ? hScale : (item.height || 12));
        // Pertahankan desimal presisi (misal: 10.5pt, 11pt, 12pt)
        const fontSize = Math.max(6, Math.round(calcSize * 10) / 10);

        // Ambil nama font dan flag ketebalan dari PDF.js commonObjs
        let realFontName = '';
        let isBoldHint = false;
        let isItalicHint = false;

        try {
          if (page.commonObjs?.has?.(item.fontName)) {
            const fontObj = page.commonObjs.get(item.fontName);
            if (fontObj) {
              realFontName = fontObj.name || fontObj.fallbackName || '';
              if (
                fontObj.bold ||
                fontObj.black ||
                (fontObj.weight && (fontObj.weight >= 600 || fontObj.weight === 'bold'))
              ) {
                isBoldHint = true;
              }
              if (fontObj.italic) {
                isItalicHint = true;
              }
            }
          }
        } catch {
          // ignore
        }

        rawItems.push({
          str: item.str,
          tx,
          ty,
          width: item.width || fontSize * 0.55 * item.str.length,
          height: item.height || fontSize,
          fontSize,
          fontName: item.fontName || 'Helvetica',
          realFontName,
          isBoldHint,
          isItalicHint,
        });
      }
    }

    // Urutkan item dari atas ke bawah, lalu dari kiri ke kanan
    rawItems.sort((a, b) => {
      const yDiff = Math.abs(a.ty - b.ty);
      if (yDiff > Math.max(a.fontSize, b.fontSize) * 0.25) {
        return b.ty - a.ty; // ty lebih besar = posisi lebih atas di PDF
      }
      return a.tx - b.tx;
    });

    // Gabungkan HANYA kata yang benar-benar satu frasa, pisahkan kolom tabel secara tegas!
    const mergedBlocks: TextBlock[] = [];
    let currentLine: RawTextItem[] = [];

    const flushLine = () => {
      if (currentLine.length === 0) return;

      const first = currentLine[0];
      const last = currentLine[currentLine.length - 1];

      let fullText = '';
      for (let i = 0; i < currentLine.length; i++) {
        const item = currentLine[i];
        if (i > 0) {
          const prev = currentLine[i - 1];
          const gap = item.tx - (prev.tx + prev.width);
          // Beri spasi jika ada celah antara kata
          if (gap > prev.fontSize * 0.1 && !fullText.endsWith(' ') && !item.str.startsWith(' ')) {
            fullText += ' ';
          }
        }
        fullText += item.str;
      }

      fullText = fullText.trim();
      if (fullText.length === 0) {
        currentLine = [];
        return;
      }

      const totalWidth = Math.max(last.tx + last.width - first.tx, first.fontSize * 0.8);

      // Inferensi properti font yang akurat
      const fontCandidateNames = [
        first.realFontName,
        first.fontName,
        textContent.styles[first.fontName]?.fontFamily || '',
        ...pageBaseFonts,
      ];
      const fontProps = inferFontProperties(fontCandidateNames);

      const isFinalBold = first.isBoldHint || fontProps.isBold;
      const isFinalItalic = first.isItalicHint || fontProps.isItalic;

      // Konversi koordinat PDF (origin bottom-left) ke koordinat persentase (origin top-left)
      const leftPt = first.tx;
      const topPt = pageHeightPt - (first.ty + first.fontSize * 0.88);
      const heightPt = first.fontSize * 1.25;

      const leftPercent = Math.max(0, Math.min(100, (leftPt / pageWidthPt) * 100));
      const topPercent = Math.max(0, Math.min(100, (topPt / pageHeightPt) * 100));
      const widthPercent = Math.max(0.5, Math.min(100 - leftPercent, (totalWidth / pageWidthPt) * 100));
      const heightPercent = Math.max(0.8, Math.min(100 - topPercent, (heightPt / pageHeightPt) * 100));

      mergedBlocks.push({
        id: `p${p}_b${mergedBlocks.length + 1}`,
        pageIndex: p - 1,
        originalText: fullText,
        currentText: fullText,
        isModified: false,
        x: first.tx,
        y: first.ty,
        width: totalWidth,
        height: heightPt,
        fontSize: first.fontSize,
        fontFamily: fontProps.fontFamily,
        isBold: isFinalBold,
        isItalic: isFinalItalic,
        color: '#000000', // Standar hitam pekat asli dokumen PDF
        backgroundColor: '#ffffff',
        viewportRect: {
          leftPercent,
          topPercent,
          widthPercent,
          heightPercent,
        },
      });

      currentLine = [];
    };

    for (const item of rawItems) {
      if (currentLine.length === 0) {
        currentLine.push(item);
      } else {
        const prev = currentLine[currentLine.length - 1];

        // 1. Cek keselarasan baseline vertikal
        const isSameBaseline =
          Math.abs(item.ty - prev.ty) <= Math.max(item.fontSize, prev.fontSize) * 0.22;

        // 2. Cek konsistensi jenis & ukuran font
        const sameFont =
          item.fontName === prev.fontName &&
          Math.abs(item.fontSize - prev.fontSize) <= 1.2;

        // 3. Jarak horizontal (gap) antar item
        const gap = item.tx - (prev.tx + prev.width);

        // Ambang batas ketat agar sel tabel dan kolom terpisah tidak menyatu
        const maxSentenceGap = Math.min(
          Math.max(item.fontSize, prev.fontSize) * 0.38,
          5.0
        );
        const isContinuousWord = gap >= -1.5 && gap <= maxSentenceGap;

        if (isSameBaseline && sameFont && isContinuousWord) {
          currentLine.push(item);
        } else {
          flushLine();
          currentLine.push(item);
        }
      }
    }
    flushLine();

    // Generate miniature thumbnail for left page strip
    let thumbnailUrl = '';
    try {
      const thumbViewport = page.getViewport({ scale: 0.18 });
      const thumbCanvas = document.createElement('canvas');
      thumbCanvas.width = thumbViewport.width;
      thumbCanvas.height = thumbViewport.height;
      const thumbCtx = thumbCanvas.getContext('2d');
      if (thumbCtx) {
        await (page as any).render({
          canvasContext: thumbCtx,
          viewport: thumbViewport,
          canvas: thumbCanvas,
        }).promise;
        thumbnailUrl = thumbCanvas.toDataURL('image/jpeg', 0.7);
      }
    } catch {
      // ignore
    }

    pages.push({
      pageIndex: p - 1,
      pageNumber: p,
      widthPt: pageWidthPt,
      heightPt: pageHeightPt,
      blocks: mergedBlocks,
      thumbnailUrl,
    });
  }

  onProgress?.(100, 'Analisis dokumen selesai!');

  return {
    parsed: {
      fileName: file.name,
      fileSize: file.size,
      numPages,
      pages,
    },
    arrayBuffer: bufferForPdfLib,
    pdfDoc: pdf,
  };
}
