import { PDFDocument, rgb, StandardFonts, PDFFont } from '@cantoo/pdf-lib';
import { PageTextData } from './pdfTextExtractor';

/**
 * Membersihkan karakter Unicode yang tidak didukung oleh 14 Standard PDF Fonts (WinAnsiEncoding)
 * Mengonversi smart quotes, em-dash, bullets, dll. ke padanan ASCII agar tidak melempar error di pdf-lib.
 */
function sanitizePdfText(str: string): string {
  if (!str) return '';

  return str
    // Smart quotes dan apostrof
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    // Dashes & hyphens
    .replace(/[\u2013\u2014]/g, '-')
    // Ellipsis
    .replace(/\u2026/g, '...')
    // Bullets & symbols
    .replace(/[\u2022\u2023\u25E6\u2043\u2219]/g, '-')
    // Non-breaking space
    .replace(/\u00A0/g, ' ')
    // Hilangkan karakter non-ASCII yang tidak didukung oleh WinAnsi
    .replace(/[^\x00-\xFF]/g, (char) => {
      // Mapping aksen umum jika ada
      const normalized = char.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (normalized.length === 1 && normalized.charCodeAt(0) <= 255) {
        return normalized;
      }
      return '';
    });
}

/**
 * Mengonversi hex color string ('#ffffff' atau '#000000') ke pdf-lib rgb()
 */
function hexToPdfRgb(hex: string) {
  const cleanHex = (hex || '').replace('#', '');
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
    const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
    const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
    return rgb(r, g, b);
  }
  return rgb(0, 0, 0); // Default hitam murni dokumen PDF
}

/**
 * Cache embedded fonts untuk efisiensi performa dan ukuran file hasil
 */
class FontManager {
  private doc: PDFDocument;
  private cache: Map<string, PDFFont> = new Map();

  constructor(doc: PDFDocument) {
    this.doc = doc;
  }

  async getFont(family: string, isBold: boolean, isItalic: boolean): Promise<PDFFont> {
    let fontName = StandardFonts.Helvetica;

    if (family === 'TimesRoman') {
      if (isBold && isItalic) fontName = StandardFonts.TimesRomanBoldItalic;
      else if (isBold) fontName = StandardFonts.TimesRomanBold;
      else if (isItalic) fontName = StandardFonts.TimesRomanItalic;
      else fontName = StandardFonts.TimesRoman;
    } else if (family === 'Courier') {
      if (isBold && isItalic) fontName = StandardFonts.CourierBoldOblique;
      else if (isBold) fontName = StandardFonts.CourierBold;
      else if (isItalic) fontName = StandardFonts.CourierOblique;
      else fontName = StandardFonts.Courier;
    } else {
      // Default: Helvetica
      if (isBold && isItalic) fontName = StandardFonts.HelveticaBoldOblique;
      else if (isBold) fontName = StandardFonts.HelveticaBold;
      else if (isItalic) fontName = StandardFonts.HelveticaOblique;
      else fontName = StandardFonts.Helvetica;
    }

    if (!this.cache.has(fontName)) {
      const font = await this.doc.embedFont(fontName);
      this.cache.set(fontName, font);
    }

    return this.cache.get(fontName)!;
  }
}

/**
 * Menerapkan suntingan teks pada berkas PDF asli tanpa menurunkan kualitas halaman (100% Vector In-Place)
 */
export async function applyEditsToPdf(
  originalBytes: ArrayBuffer | Uint8Array,
  pages: PageTextData[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(originalBytes, {
    ignoreEncryption: true,
  });

  const fontManager = new FontManager(pdfDoc);
  const pdfPages = pdfDoc.getPages();

  for (const pageData of pages) {
    if (pageData.pageIndex >= pdfPages.length) continue;

    const modifiedBlocks = pageData.blocks.filter(
      (b) => b.isModified || b.currentText !== b.originalText
    );

    if (modifiedBlocks.length === 0) continue;

    const pdfPage = pdfPages[pageData.pageIndex];

    for (const block of modifiedBlocks) {
      const sanitizedText = sanitizePdfText(block.currentText);
      const font = await fontManager.getFont(
        block.fontFamily,
        block.isBold,
        block.isItalic
      );

      // Hitung lebar teks baru vs teks lama untuk menutup area yang tepat
      let textWidth = 0;
      if (sanitizedText.length > 0) {
        try {
          textWidth = font.widthOfTextAtSize(sanitizedText, block.fontSize);
        } catch {
          textWidth = block.width;
        }
      }

      // Lebar penutup: tutupi selebar teks lama ditambah margin aman
      const coverWidth = Math.max(block.width, textWidth) + 2.5;
      const coverHeight = Math.max(block.height, block.fontSize * 1.25);
      const coverX = Math.max(0, block.x - 1.2);
      const coverY = block.y - block.fontSize * 0.25;

      // 1. Gambar kotak penutup (whiteout/background cover) di atas teks lama
      const bgColor = block.backgroundColor
        ? hexToPdfRgb(block.backgroundColor)
        : rgb(1, 1, 1);

      pdfPage.drawRectangle({
        x: coverX,
        y: coverY,
        width: coverWidth,
        height: coverHeight,
        color: bgColor,
      });

      // 2. Jika ada teks baru (tidak dihapus kosong), gambar teks baru di koordinat yang sama
      if (sanitizedText.length > 0) {
        const textColor = block.color
          ? hexToPdfRgb(block.color)
          : rgb(0, 0, 0);

        try {
          pdfPage.drawText(sanitizedText, {
            x: block.x,
            y: block.y,
            size: block.fontSize,
            font,
            color: textColor,
          });
        } catch (err) {
          console.warn('Gagal menggambar teks dengan karakter spesifik, fallback ke ASCII bersih:', err);
          const safeAscii = sanitizedText.replace(/[^\x20-\x7E]/g, '');
          if (safeAscii.length > 0) {
            pdfPage.drawText(safeAscii, {
              x: block.x,
              y: block.y,
              size: block.fontSize,
              font,
              color: textColor,
            });
          }
        }
      }
    }
  }

  return await pdfDoc.save();
}
