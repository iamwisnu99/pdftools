import { PDFDocument } from '@cantoo/pdf-lib';
import html2canvas from 'html2canvas';
import { ParsedSlide, ParsedPresentation } from './pptxParser';

export type PresentationLayout = 'one_per_page' | 'two_handout' | 'four_grid';
export type PresentationTheme = 'minimalist' | 'dark' | 'corporate' | 'editorial';

export interface PptxPdfOptions {
  layout: PresentationLayout;
  theme: PresentationTheme;
  showSlideNumbers: boolean;
  showNotesArea: boolean;
  onProgress?: (percent: number, status: string) => void;
}

const THEME_STYLES: Record<
  PresentationTheme,
  {
    bg: string;
    cardBg: string;
    text: string;
    mutedText: string;
    accent: string;
    border: string;
    fontFamily: string;
  }
> = {
  minimalist: {
    bg: '#ffffff',
    cardBg: '#f8fafc',
    text: '#0f172a',
    mutedText: '#64748b',
    accent: '#2563eb',
    border: '#e2e8f0',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  dark: {
    bg: '#0f172a',
    cardBg: '#1e293b',
    text: '#f8fafc',
    mutedText: '#94a3b8',
    accent: '#38bdf8',
    border: '#334155',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  corporate: {
    bg: '#ffffff',
    cardBg: '#f0fdf4',
    text: '#0f172a',
    mutedText: '#475569',
    accent: '#0d9488',
    border: '#cbd5e1',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  editorial: {
    bg: '#fafaf9',
    cardBg: '#f5f5f4',
    text: '#1c1917',
    mutedText: '#78716c',
    accent: '#ea580c',
    border: '#e7e5e4',
    fontFamily: "Georgia, 'Times New Roman', serif",
  },
};

/**
 * Merender elemen slide individual ke dalam DOM
 */
function createSlideElement(
  slide: ParsedSlide,
  themeConfig: typeof THEME_STYLES['minimalist'],
  compact: boolean = false
): HTMLDivElement {
  const slideBox = document.createElement('div');
  slideBox.style.backgroundColor = themeConfig.bg;
  slideBox.style.color = themeConfig.text;
  slideBox.style.fontFamily = themeConfig.fontFamily;
  slideBox.style.borderRadius = compact ? '8px' : '12px';
  slideBox.style.border = `1px solid ${themeConfig.border}`;
  slideBox.style.padding = compact ? '16px' : '28px';
  slideBox.style.boxSizing = 'border-box';
  slideBox.style.display = 'flex';
  slideBox.style.flexDirection = 'column';
  slideBox.style.height = '100%';
  slideBox.style.overflow = 'hidden';
  slideBox.style.position = 'relative';

  // Header slide: Badge & Title
  const header = document.createElement('div');
  header.style.marginBottom = compact ? '10px' : '18px';
  header.style.borderBottom = `2px solid ${themeConfig.accent}`;
  header.style.paddingBottom = compact ? '8px' : '14px';

  const badge = document.createElement('span');
  badge.innerText = `SLIDE ${slide.slideNumber}`;
  badge.style.fontSize = compact ? '9px' : '11px';
  badge.style.fontWeight = '700';
  badge.style.letterSpacing = '0.08em';
  badge.style.color = themeConfig.accent;
  badge.style.display = 'block';
  badge.style.marginBottom = '4px';

  const titleEl = document.createElement('h2');
  titleEl.innerText = slide.title;
  titleEl.style.fontSize = compact ? '15px' : '22px';
  titleEl.style.fontWeight = '700';
  titleEl.style.margin = '0';
  titleEl.style.lineHeight = '1.25';
  titleEl.style.color = themeConfig.text;

  header.appendChild(badge);
  header.appendChild(titleEl);

  if (slide.subtitle) {
    const subEl = document.createElement('p');
    subEl.innerText = slide.subtitle;
    subEl.style.fontSize = compact ? '11px' : '13px';
    subEl.style.color = themeConfig.mutedText;
    subEl.style.margin = '4px 0 0';
    header.appendChild(subEl);
  }

  slideBox.appendChild(header);

  // Content Area
  const content = document.createElement('div');
  content.style.flex = '1';
  content.style.display = 'flex';
  content.style.flexDirection = 'column';
  content.style.gap = compact ? '8px' : '12px';
  content.style.overflow = 'hidden';

  // Gambar jika ada
  if (slide.images && slide.images.length > 0) {
    const imgRow = document.createElement('div');
    imgRow.style.display = 'flex';
    imgRow.style.gap = '10px';
    imgRow.style.maxHeight = compact ? '90px' : '160px';
    imgRow.style.marginBottom = '8px';

    slide.images.slice(0, 2).forEach((imgObj) => {
      const img = document.createElement('img');
      img.src = imgObj.src;
      img.style.maxHeight = '100%';
      img.style.maxWidth = '100%';
      img.style.objectFit = 'contain';
      img.style.borderRadius = '6px';
      imgRow.appendChild(img);
    });

    content.appendChild(imgRow);
  }

  // Paragraf / Teks Bullets
  if (slide.paragraphs && slide.paragraphs.length > 0) {
    const list = document.createElement('div');
    list.style.display = 'flex';
    list.style.flexDirection = 'column';
    list.style.gap = compact ? '4px' : '8px';

    slide.paragraphs.forEach((p) => {
      const pEl = document.createElement('div');
      pEl.style.fontSize = compact ? '11px' : '13px';
      pEl.style.lineHeight = '1.45';
      pEl.style.color = themeConfig.text;

      if (p.isBold) pEl.style.fontWeight = 'bold';
      if (p.isItalic) pEl.style.fontStyle = 'italic';

      if (p.isBullet) {
        pEl.style.paddingLeft = `${(p.level || 0) * 12 + 14}px`;
        pEl.style.position = 'relative';

        const dot = document.createElement('span');
        dot.innerHTML = '• ';
        dot.style.position = 'absolute';
        dot.style.left = `${(p.level || 0) * 12}px`;
        dot.style.color = themeConfig.accent;
        pEl.appendChild(dot);
      }

      const textNode = document.createTextNode(p.text);
      pEl.appendChild(textNode);
      list.appendChild(pEl);
    });

    content.appendChild(list);
  }

  // Tabel jika ada
  if (slide.tables && slide.tables.length > 0) {
    slide.tables.forEach((tbl) => {
      const table = document.createElement('table');
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      table.style.fontSize = compact ? '10px' : '12px';
      table.style.marginTop = '6px';

      tbl.rows.forEach((row, rIdx) => {
        const tr = document.createElement('tr');
        if (rIdx === 0) {
          tr.style.backgroundColor = themeConfig.cardBg;
          tr.style.fontWeight = '600';
        }
        row.forEach((cell) => {
          const td = document.createElement(rIdx === 0 ? 'th' : 'td');
          td.innerText = cell;
          td.style.border = `1px solid ${themeConfig.border}`;
          td.style.padding = compact ? '4px 6px' : '6px 10px';
          td.style.textAlign = 'left';
          tr.appendChild(td);
        });
        table.appendChild(tr);
      });

      content.appendChild(table);
    });
  }

  slideBox.appendChild(content);
  return slideBox;
}

/**
 * Menghasilkan file PDF dari presentasi yang telah diparse
 */
export async function generatePptxPdf(
  pres: ParsedPresentation,
  selectedSlideIds: string[],
  options: PptxPdfOptions
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const themeConfig = THEME_STYLES[options.theme];

  // Filter slide yang dipilih user
  const activeSlides = pres.slides.filter((s) => selectedSlideIds.includes(s.id));
  if (activeSlides.length === 0) {
    throw new Error('Tidak ada slide yang dipilih untuk dikonversi.');
  }

  // Tentukan pengelompokan slide per halaman berdasarkan layout
  let slideGroups: ParsedSlide[][] = [];

  if (options.layout === 'one_per_page') {
    slideGroups = activeSlides.map((s) => [s]);
  } else if (options.layout === 'two_handout') {
    for (let i = 0; i < activeSlides.length; i += 2) {
      slideGroups.push(activeSlides.slice(i, i + 2));
    }
  } else {
    // four_grid
    for (let i = 0; i < activeSlides.length; i += 4) {
      slideGroups.push(activeSlides.slice(i, i + 4));
    }
  }

  const totalPages = slideGroups.length;

  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    const group = slideGroups[pageIdx];
    const pct = Math.round(((pageIdx + 1) / totalPages) * 100);
    options.onProgress?.(
      pct,
      `Merender halaman presentasi ${pageIdx + 1} dari ${totalPages}...`
    );

    // Siapkan wadah halaman DOM
    const pageContainer = document.createElement('div');
    pageContainer.className = 'pptx-page-canvas';
    pageContainer.style.position = 'fixed';
    pageContainer.style.left = '-9999px';
    pageContainer.style.top = '0';
    pageContainer.style.zIndex = '-999';
    pageContainer.style.backgroundColor = '#ffffff';
    pageContainer.style.boxSizing = 'border-box';

    let pdfPageWidth = 841.89; // Default A4 Landscape for 1-per-page
    let pdfPageHeight = 595.28;

    if (options.layout === 'one_per_page') {
      // 1 Slide Widescreen 16:9 Landscape
      pageContainer.style.width = '1123px';
      pageContainer.style.height = '632px';
      pageContainer.style.padding = '24px';
      pageContainer.style.display = 'flex';
      pageContainer.style.flexDirection = 'column';

      pdfPageWidth = 841.89;
      pdfPageHeight = (632 / 1123) * 841.89; // Proportional 16:9

      const slideEl = createSlideElement(group[0], themeConfig, false);
      slideEl.style.flex = '1';
      pageContainer.appendChild(slideEl);
    } else if (options.layout === 'two_handout') {
      // 2 Slide Handout on A4 Portrait
      pageContainer.style.width = '794px';
      pageContainer.style.height = '1123px';
      pageContainer.style.padding = '36px';
      pageContainer.style.display = 'flex';
      pageContainer.style.flexDirection = 'column';
      pageContainer.style.justifyContent = 'space-between';

      pdfPageWidth = 595.28;
      pdfPageHeight = 841.89;

      // Header Catatan
      const topMeta = document.createElement('div');
      topMeta.style.display = 'flex';
      topMeta.style.justifyContent = 'space-between';
      topMeta.style.paddingBottom = '10px';
      topMeta.style.borderBottom = '1px solid #e2e8f0';
      topMeta.style.fontSize = '11px';
      topMeta.style.color = '#64748b';
      topMeta.innerHTML = `<span>${pres.fileName}</span><span>Handout Halaman ${pageIdx + 1}</span>`;
      pageContainer.appendChild(topMeta);

      const slidesCol = document.createElement('div');
      slidesCol.style.display = 'flex';
      slidesCol.style.flexDirection = 'column';
      slidesCol.style.gap = '20px';
      slidesCol.style.flex = '1';
      slidesCol.style.margin = '16px 0';

      group.forEach((slide) => {
        const itemBox = document.createElement('div');
        itemBox.style.display = 'grid';
        itemBox.style.gridTemplateColumns = options.showNotesArea ? '1fr 220px' : '1fr';
        itemBox.style.gap = '16px';
        itemBox.style.flex = '1';

        const slideEl = createSlideElement(slide, themeConfig, true);
        itemBox.appendChild(slideEl);

        if (options.showNotesArea) {
          const notesBox = document.createElement('div');
          notesBox.style.border = '1px dashed #cbd5e1';
          notesBox.style.borderRadius = '8px';
          notesBox.style.padding = '12px';
          notesBox.style.fontSize = '11px';
          notesBox.style.color = '#94a3b8';
          notesBox.innerHTML = '<strong>Catatan / Catatan Rapat:</strong><div style="margin-top:20px;border-bottom:1px solid #e2e8f0;"></div><div style="margin-top:20px;border-bottom:1px solid #e2e8f0;"></div><div style="margin-top:20px;border-bottom:1px solid #e2e8f0;"></div>';
          itemBox.appendChild(notesBox);
        }

        slidesCol.appendChild(itemBox);
      });

      pageContainer.appendChild(slidesCol);
    } else {
      // 4 Slide Grid on A4 Portrait
      pageContainer.style.width = '794px';
      pageContainer.style.height = '1123px';
      pageContainer.style.padding = '36px';
      pageContainer.style.display = 'flex';
      pageContainer.style.flexDirection = 'column';

      pdfPageWidth = 595.28;
      pdfPageHeight = 841.89;

      const topMeta = document.createElement('div');
      topMeta.style.display = 'flex';
      topMeta.style.justifyContent = 'space-between';
      topMeta.style.paddingBottom = '10px';
      topMeta.style.borderBottom = '1px solid #e2e8f0';
      topMeta.style.fontSize = '11px';
      topMeta.style.color = '#64748b';
      topMeta.innerHTML = `<span>${pres.fileName}</span><span>Review Grid Halaman ${pageIdx + 1}</span>`;
      pageContainer.appendChild(topMeta);

      const gridBox = document.createElement('div');
      gridBox.style.display = 'grid';
      gridBox.style.gridTemplateColumns = '1fr 1fr';
      gridBox.style.gridTemplateRows = '1fr 1fr';
      gridBox.style.gap = '14px';
      gridBox.style.flex = '1';
      gridBox.style.margin = '16px 0';

      group.forEach((slide) => {
        const slideEl = createSlideElement(slide, themeConfig, true);
        gridBox.appendChild(slideEl);
      });

      pageContainer.appendChild(gridBox);
    }

    document.body.appendChild(pageContainer);

    try {
      // Render canvas via html2canvas
      const canvas = await html2canvas(pageContainer, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgDataUrl = canvas.toDataURL('image/png');
      const pngBytes = await fetch(imgDataUrl).then((r) => r.arrayBuffer());
      const embeddedImage = await pdfDoc.embedPng(pngBytes);

      const pdfPage = pdfDoc.addPage([pdfPageWidth, pdfPageHeight]);
      pdfPage.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width: pdfPageWidth,
        height: pdfPageHeight,
      });
    } finally {
      if (pageContainer.parentNode) {
        pageContainer.parentNode.removeChild(pageContainer);
      }
    }
  }

  options.onProgress?.(100, 'Menyusun berkas PDF presentasi final...');
  return await pdfDoc.save();
}
