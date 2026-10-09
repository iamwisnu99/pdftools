import { PDFDocument } from '@cantoo/pdf-lib';
import html2canvas from 'html2canvas';
import { PageLayoutGroup, ContentBlock } from './excelBlockDetector';

export type TableTheme = 'modern' | 'corporate' | 'grid';
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

/**
 * Merender representasi visual HTML dari suatu PageLayoutGroup ke dalam DOM tersembunyi
 */
function createPageDomElement(
  page: PageLayoutGroup,
  totalPages: number,
  options: GeneratePdfOptions,
  isLandscape: boolean
): HTMLDivElement {
  const container = document.createElement('div');
  container.className = 'pdf-render-page';
  
  // Standard A4 dimensions in pixels at 96 DPI: Portrait 794x1123, Landscape 1123x794
  const widthPx = isLandscape ? 1123 : 794;
  const heightPx = isLandscape ? 794 : 1123;

  container.style.width = `${widthPx}px`;
  container.style.minHeight = `${heightPx}px`;
  container.style.padding = '48px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.fontFamily =
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
  container.style.boxSizing = 'border-box';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.justifyContent = 'space-between';
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.zIndex = '-1000';

  // --- Header Halaman ---
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.paddingBottom = '14px';
  header.style.marginBottom = '20px';
  header.style.borderBottom =
    options.theme === 'corporate'
      ? '2px solid #dc2626'
      : '1px solid #e2e8f0';

  const docTitle = document.createElement('span');
  docTitle.style.fontSize = '12px';
  docTitle.style.fontWeight = '700';
  docTitle.style.color = options.theme === 'corporate' ? '#dc2626' : '#334155';
  docTitle.innerText = options.fileName;

  const sheetBadge = document.createElement('span');
  sheetBadge.style.fontSize = '11px';
  sheetBadge.style.color = '#64748b';
  sheetBadge.style.fontWeight = '500';
  sheetBadge.innerText = page.blocks.map((b) => b.sheetName).filter((v, i, a) => a.indexOf(v) === i).join(' • ');

  header.appendChild(docTitle);
  header.appendChild(sheetBadge);
  container.appendChild(header);

  // --- Konten Blok (1 atau 2 blok) ---
  const body = document.createElement('div');
  body.style.flex = '1';
  body.style.display = 'flex';
  body.style.flexDirection = 'column';
  body.style.gap = '28px';

  page.blocks.forEach((block: ContentBlock) => {
    const blockWrapper = document.createElement('div');
    blockWrapper.style.width = '100%';

    if (options.showBlockHeaders && block.title) {
      const blockTitle = document.createElement('div');
      blockTitle.style.display = 'flex';
      blockTitle.style.alignItems = 'center';
      blockTitle.style.justifyContent = 'space-between';
      blockTitle.style.marginBottom = '8px';

      const titleText = document.createElement('span');
      titleText.style.fontSize = '13px';
      titleText.style.fontWeight = '700';
      titleText.style.color = '#0f172a';
      titleText.innerText = block.title;

      const rangeTag = document.createElement('span');
      rangeTag.style.fontSize = '10px';
      rangeTag.style.fontFamily = 'monospace';
      rangeTag.style.backgroundColor = '#f1f5f9';
      rangeTag.style.color = '#475569';
      rangeTag.style.padding = '2px 6px';
      rangeTag.style.borderRadius = '4px';
      rangeTag.innerText = block.rangeAddress;

      blockTitle.appendChild(titleText);
      blockTitle.appendChild(rangeTag);
      blockWrapper.appendChild(blockTitle);
    }

    // Tabel
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.fontSize = '11px';
    table.style.lineHeight = '1.4';
    table.style.tableLayout = 'auto';

    if (options.theme === 'grid') {
      table.style.border = '1px solid #cbd5e1';
    } else {
      table.style.border = '1px solid #e2e8f0';
      table.style.borderRadius = '6px';
      table.style.overflow = 'hidden';
    }

    block.data.forEach((row, rowIdx) => {
      const tr = document.createElement('tr');
      const isHeaderRow = rowIdx === 0;

      if (isHeaderRow) {
        if (options.theme === 'corporate') {
          tr.style.backgroundColor = '#1e293b';
          tr.style.color = '#ffffff';
        } else if (options.theme === 'modern') {
          tr.style.backgroundColor = '#f8fafc';
          tr.style.color = '#0f172a';
          tr.style.borderBottom = '2px solid #e2e8f0';
        } else {
          tr.style.backgroundColor = '#f1f5f9';
          tr.style.color = '#0f172a';
          tr.style.borderBottom = '1px solid #cbd5e1';
        }
      } else {
        if (options.theme === 'modern') {
          tr.style.backgroundColor = rowIdx % 2 === 0 ? '#ffffff' : '#f8fafc';
          tr.style.borderBottom = '1px solid #f1f5f9';
        } else if (options.theme === 'corporate') {
          tr.style.backgroundColor = rowIdx % 2 === 0 ? '#ffffff' : '#fef2f2';
          tr.style.borderBottom = '1px solid #fecaca';
        } else {
          tr.style.backgroundColor = '#ffffff';
          tr.style.borderBottom = '1px solid #e2e8f0';
        }
      }

      row.forEach((cellVal) => {
        const cellTag = isHeaderRow ? 'th' : 'td';
        const td = document.createElement(cellTag);
        td.style.padding = isHeaderRow ? '7px 9px' : '5px 8px';
        td.style.fontWeight = isHeaderRow ? '700' : '400';
        td.style.border = options.theme === 'grid' ? '1px solid #cbd5e1' : 'none';

        const strVal = String(cellVal ?? '');
        td.innerText = strVal;

        // Auto alignment: numeric values right aligned, text left
        const isNumeric =
          strVal.trim() !== '' &&
          !isNaN(Number(strVal.replace(/[^0-9.-]+/g, ''))) &&
          !isNaN(parseFloat(strVal));
        if (isNumeric) {
          td.style.textAlign = 'right';
          td.style.fontVariantNumeric = 'tabular-nums';
        } else {
          td.style.textAlign = 'left';
        }

        tr.appendChild(td);
      });

      table.appendChild(tr);
    });

    blockWrapper.appendChild(table);
    body.appendChild(blockWrapper);
  });

  container.appendChild(body);

  // --- Footer Halaman ---
  const footer = document.createElement('div');
  footer.style.display = 'flex';
  footer.style.justifyContent = 'space-between';
  footer.style.alignItems = 'center';
  footer.style.paddingTop = '14px';
  footer.style.marginTop = '20px';
  footer.style.borderTop = '1px solid #f1f5f9';
  footer.style.fontSize = '10px';
  footer.style.color = '#94a3b8';

  const brand = document.createElement('span');
  brand.innerText = 'PDFTools • 100% Client-Side Engine';

  const pageNum = document.createElement('span');
  pageNum.innerText = options.showPageNumbers
    ? `Halaman ${page.pageNumber} dari ${totalPages}`
    : '';

  footer.appendChild(brand);
  footer.appendChild(pageNum);
  container.appendChild(footer);

  document.body.appendChild(container);
  return container;
}

/**
 * Menghasilkan file PDF dari kelompok layout halaman Excel
 */
export async function generateExcelPdf(
  pages: PageLayoutGroup[],
  options: GeneratePdfOptions
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  // Dimensi poin A4: 595.28 x 841.89
  const a4Width = options.pageSize === 'Letter' ? 612 : 595.28;
  const a4Height = options.pageSize === 'Letter' ? 792 : 841.89;

  for (let i = 0; i < pages.length; i++) {
    const pageGroup = pages[i];
    const progressPercent = Math.round(((i + 1) / pages.length) * 100);

    options.onProgress?.(
      progressPercent,
      `Memproses halaman ${i + 1} dari ${pages.length}...`
    );

    // Tentukan orientasi
    let isLandscape = false;
    if (options.orientation === 'landscape') {
      isLandscape = true;
    } else if (options.orientation === 'auto') {
      // Jika salah satu tabel memiliki lebih dari 6 kolom, otomatis lanskap
      const maxCols = Math.max(...pageGroup.blocks.map((b) => b.colCount));
      isLandscape = maxCols > 6;
    }

    const pageWidth = isLandscape ? a4Height : a4Width;
    const pageHeight = isLandscape ? a4Width : a4Height;

    // 1. Buat elemen DOM halaman
    const pageEl = createPageDomElement(
      pageGroup,
      pages.length,
      options,
      isLandscape
    );

    try {
      // 2. Render ke Canvas dengan 2x scale (tajam beresolusi tinggi)
      const canvas = await html2canvas(pageEl, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      // 3. Konversi canvas ke PNG Data URL
      const imgDataUrl = canvas.toDataURL('image/png');
      const pngImageBytes = await fetch(imgDataUrl).then((res) =>
        res.arrayBuffer()
      );
      const embeddedImage = await pdfDoc.embedPng(pngImageBytes);

      // 4. Tambahkan halaman ke dokumen PDF
      const pdfPage = pdfDoc.addPage([pageWidth, pageHeight]);
      pdfPage.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight,
      });
    } finally {
      // Bersihkan DOM tersembunyi
      if (pageEl.parentNode) {
        pageEl.parentNode.removeChild(pageEl);
      }
    }
  }

  options.onProgress?.(100, 'Menyusun dokumen PDF final...');
  return await pdfDoc.save();
}
