import { jsPDF } from 'jspdf';
import autoTable, { UserOptions } from 'jspdf-autotable';
import JSZip from 'jszip';
import { PageLayoutGroup, ContentBlock, RichCell } from './excelBlockDetector';

export type TableTheme = 'dual_optimized' | 'excel_native' | 'monochrome' | 'modern';
export type PageOrientation = 'auto' | 'portrait' | 'landscape';
export type PageSize = 'A4' | 'Letter';

export interface GeneratePdfOptions {
  fileName: string;
  theme: TableTheme;
  orientation: PageOrientation;
  pageSize: PageSize;
  showPageNumbers: boolean;
  showBlockHeaders: boolean;
  onProgress?: (percent: number, status: string) => void;
}

function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return null;
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  return [r, g, b];
}

function getLuminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * Merender 1 blok konten tabel ke dalam dokumen jsPDF
 */
function renderBlockToDoc(
  doc: jsPDF,
  block: ContentBlock,
  options: GeneratePdfOptions,
  startY: number,
  pageWidth: number,
  isHeaderRowRequired: boolean = true
): number {
  // 1. Tampilkan Judul & Subtitle Blok jika diaktifkan
  let currentY = startY;

  if (options.showBlockHeaders) {
    if (block.title) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42); // #0F172A
      doc.text(block.title, pageWidth / 2, currentY, { align: 'center' });
      currentY += 15;
    }

    if (block.subtitle) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85); // #334155
      doc.text(block.subtitle, pageWidth / 2, currentY, { align: 'center' });
      currentY += 13;
    } else {
      currentY += 2;
    }
  }

  // 2. Siapkan data baris untuk autoTable
  // Pisahkan baris pertama sebagai head jika baris tersebut memiliki warna/bold atau di posisi 0
  const bodyRows: any[][] = [];

  for (let r = 0; r < block.cells.length; r++) {
    const rowCells = block.cells[r];
    const rowValues: any[] = [];

    for (let c = 0; c < rowCells.length; c++) {
      const cellMeta = rowCells[c];
      if (cellMeta.isMergedChild) {
        // Lewati sel anak hasil span karena akan digambar oleh master cell
        continue;
      }

      const cellObj: any = {
        content: cellMeta.text || '',
        rowSpan: cellMeta.rowSpan || 1,
        colSpan: cellMeta.colSpan || 1,
        styles: {},
      };

      // Alignment
      if (cellMeta.align) {
        cellObj.styles.halign = cellMeta.align;
      }

      // Font Style
      if (cellMeta.bold) {
        cellObj.styles.fontStyle = 'bold';
      }

      // Theme Colors Mapping
      if (options.theme === 'dual_optimized') {
        // Tema Dual-Optimized: Kontras Tinggi + Ramah Cetak Hitam Putih
        if (cellMeta.fillColor) {
          const rgb = hexToRgb(cellMeta.fillColor);
          if (rgb) {
            cellObj.styles.fillColor = rgb;
            const lum = getLuminance(rgb[0], rgb[1], rgb[2]);

            // Jika latar belakang terang (Gold/Kuning/Cyan), gunakan teks gelap tebal
            // Jika latar belakang gelap (Hijau Tua/Navy), gunakan teks putih tebal
            if (lum > 140) {
              cellObj.styles.textColor = [15, 23, 42]; // #0F172A
              cellObj.styles.fontStyle = 'bold';
            } else {
              cellObj.styles.textColor = [255, 255, 255]; // Putih bersih
              cellObj.styles.fontStyle = 'bold';
            }
          }
        } else {
          // Sel tanpa background fill: teks hitam pekat/slate
          cellObj.styles.textColor = [15, 23, 42];
        }

        // Garis batas tajam dan jelas
        cellObj.styles.lineColor = [51, 65, 85]; // #334155
        cellObj.styles.lineWidth = 0.5;
      } else if (options.theme === 'excel_native') {
        // Tema Asli Excel
        if (cellMeta.fillColor) {
          const rgb = hexToRgb(cellMeta.fillColor);
          if (rgb) cellObj.styles.fillColor = rgb;
        }
        if (cellMeta.textColor) {
          const trgb = hexToRgb(cellMeta.textColor);
          if (trgb) cellObj.styles.textColor = trgb;
        } else {
          cellObj.styles.textColor = [15, 23, 42];
        }
        cellObj.styles.lineColor = [148, 163, 184];
        cellObj.styles.lineWidth = 0.5;
      } else if (options.theme === 'monochrome') {
        // Tema Monokrom Murni (Hitam Putih / Abu Ringan)
        if (cellMeta.fillColor) {
          const rgb = hexToRgb(cellMeta.fillColor);
          if (rgb) {
            const lum = getLuminance(rgb[0], rgb[1], rgb[2]);
            if (lum < 120) {
              cellObj.styles.fillColor = [226, 232, 240];
              cellObj.styles.textColor = [15, 23, 42];
              cellObj.styles.fontStyle = 'bold';
            } else {
              cellObj.styles.fillColor = [241, 245, 249];
              cellObj.styles.textColor = [15, 23, 42];
            }
          }
        } else {
          cellObj.styles.textColor = [15, 23, 42];
        }
        cellObj.styles.lineColor = [15, 23, 42];
        cellObj.styles.lineWidth = 0.5;
      } else {
        // Modern Clean
        if (r === 0) {
          cellObj.styles.fillColor = [16, 185, 129]; // Emerald
          cellObj.styles.textColor = [255, 255, 255];
          cellObj.styles.fontStyle = 'bold';
        } else if (r % 2 === 1) {
          cellObj.styles.fillColor = [248, 250, 252];
        }
        cellObj.styles.lineColor = [226, 232, 240];
        cellObj.styles.lineWidth = 0.5;
      }

      rowValues.push(cellObj);
    }

    bodyRows.push(rowValues);
  }

  // Margin horizontal yang nyaman agar tidak terpotong printer
  const marginSide = 32;

  // 3. Render tabel dengan autoTable
  autoTable(doc, {
    startY: currentY,
    body: bodyRows,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: block.colCount > 7 ? 7.5 : 8.5,
      cellPadding: { top: 3.5, bottom: 3.5, left: 4, right: 4 },
      overflow: 'linebreak',
    },
    margin: { left: marginSide, right: marginSide },
    tableWidth: pageWidth - marginSide * 2,
    didDrawPage: (data) => {
      // Callback tiap halaman jika tabel bersambung
    },
  });

  const lastTable = (doc as any).lastAutoTable;
  return lastTable ? lastTable.finalY + 18 : currentY + 100;
}

/**
 * Menghasilkan PDF gabungan dari beberapa kelompok halaman (PageLayoutGroup)
 */
export async function generateCombinedPdf(
  pages: PageLayoutGroup[],
  options: GeneratePdfOptions
): Promise<Uint8Array> {
  const isLandscape =
    options.orientation === 'landscape' ||
    (options.orientation === 'auto' &&
      pages.some((p) => p.blocks.some((b) => b.colCount > 8)));

  const orient = isLandscape ? 'landscape' : 'portrait';
  const format = options.pageSize === 'Letter' ? 'letter' : 'a4';

  const doc = new jsPDF({
    orientation: orient,
    unit: 'pt',
    format: format,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const totalPages = pages.length;

  for (let i = 0; i < pages.length; i++) {
    if (i > 0) {
      doc.addPage(format, orient);
    }

    const pageGroup = pages[i];
    if (options.onProgress) {
      const pct = Math.round(((i + 1) / totalPages) * 100);
      options.onProgress(pct, `Memproses halaman ${i + 1} dari ${totalPages}...`);
    }

    let currentY = 36;

    // Render blok-blok pada halaman ini
    for (const block of pageGroup.blocks) {
      currentY = renderBlockToDoc(doc, block, options, currentY, pageWidth);
    }

    // Footer Dokumen
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184); // #94A3B8

    // Footer Kiri
    doc.text('PDFTools ? 100% Client-Side Engine', 32, pageHeight - 20);

    // Footer Kanan
    if (options.showPageNumbers) {
      doc.text(`Halaman ${i + 1} dari ${totalPages}`, pageWidth - 32, pageHeight - 20, {
        align: 'right',
      });
    }
  }

  const arrayBuffer = doc.output('arraybuffer');
  return new Uint8Array(arrayBuffer);
}

/**
 * Menghasilkan PDF tunggal untuk satu blok tabel tertentu
 */
export async function generateSingleBlockPdf(
  block: ContentBlock,
  options: GeneratePdfOptions
): Promise<Uint8Array> {
  const isLandscape =
    options.orientation === 'landscape' ||
    (options.orientation === 'auto' && block.colCount > 8);

  const orient = isLandscape ? 'landscape' : 'portrait';
  const format = options.pageSize === 'Letter' ? 'letter' : 'a4';

  const doc = new jsPDF({
    orientation: orient,
    unit: 'pt',
    format: format,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  renderBlockToDoc(doc, block, options, 40, pageWidth);

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184);
  doc.text('PDFTools ? 100% Client-Side Engine', 32, pageHeight - 20);

  if (options.showPageNumbers) {
    doc.text('Halaman 1 dari 1', pageWidth - 32, pageHeight - 20, { align: 'right' });
  }

  const arrayBuffer = doc.output('arraybuffer');
  return new Uint8Array(arrayBuffer);
}

/**
 * Menghasilkan Arsip ZIP yang mengorganisir setiap tabel ke file PDF terpisah
 * dengan struktur folder per bulan secara otomatis
 */
export async function generateZipArchive(
  blocks: ContentBlock[],
  options: GeneratePdfOptions
): Promise<Blob> {
  const zip = new JSZip();
  const selectedBlocks = blocks
    .filter((b) => b.selected)
    .sort((a, b) => a.order - b.order);

  const total = selectedBlocks.length;
  if (total === 0) {
    throw new Error('Tidak ada blok tabel yang dipilih untuk diekspor.');
  }

  for (let i = 0; i < total; i++) {
    const block = selectedBlocks[i];
    if (options.onProgress) {
      const pct = Math.round(((i + 1) / total) * 100);
      options.onProgress(pct, `Membuat PDF ${i + 1}/${total}: ${block.suggestedFileName}...`);
    }

    const pdfBytes = await generateSingleBlockPdf(block, options);

    // Letakkan dalam folder per bulan jika terdeteksi (misal: 'JULI 2026/Teller - 01 JULI 2026 SHIF 1.pdf')
    let filePath = block.suggestedFileName;
    if (block.monthFolder) {
      filePath = `${block.monthFolder}/${block.suggestedFileName}`;
    }

    zip.file(filePath, pdfBytes);
  }

  if (options.onProgress) {
    options.onProgress(98, 'Mengompresi seluruh file ke format ZIP...');
  }

  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  return zipBlob;
}
