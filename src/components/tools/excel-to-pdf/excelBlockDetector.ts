import ExcelJS from 'exceljs';

export interface RichCell {
  value: any;
  text: string;
  fillColor?: string; // Hex string, e.g. '#00B050'
  textColor?: string; // Hex string, e.g. '#FFFFFF'
  bold?: boolean;
  italic?: boolean;
  align?: 'left' | 'center' | 'right';
  valign?: 'top' | 'middle' | 'bottom';
  borders?: {
    top?: boolean;
    bottom?: boolean;
    left?: boolean;
    right?: boolean;
  };
  colSpan?: number;
  rowSpan?: number;
  isMergedChild?: boolean;
  isNumeric?: boolean;
}

export interface ContentBlock {
  id: string;
  sheetName: string;
  title: string;
  subtitle?: string;
  dateStr?: string;
  monthFolder?: string;
  sectionName?: string;
  suggestedFileName: string;
  rangeAddress: string;
  range: {
    s: { r: number; c: number };
    e: { r: number; c: number };
  };
  headers: string[];
  data: string[][];
  cells: RichCell[][];
  rowCount: number;
  colCount: number;
  colWidths?: number[];
  estimatedHeightPt: number;
  selected: boolean;
  order: number;
}

export type DetectionMode = 'smart_blocks' | 'row_breaks' | 'per_sheet';

export interface ParsedWorkbook {
  fileName: string;
  sheetNames: string[];
  activeSheet: string;
  blocksBySheet: Record<string, ContentBlock[]>;
  totalBlocks: number;
}

export type PaginationMode = 'one_per_page' | 'two_if_fit' | 'flow';

export interface PageLayoutGroup {
  pageNumber: number;
  blocks: ContentBlock[];
  totalHeightPt: number;
}

// Palet warna tema standar Office / Excel
const THEME_COLORS: string[] = [
  '#FFFFFF', // 0: Background 1 (Putih)
  '#000000', // 1: Text 1 (Hitam)
  '#E7E6E6', // 2: Background 2 (Abu Terang)
  '#44546A', // 3: Text 2 (Slate Gelap)
  '#4472C4', // 4: Accent 1 (Biru)
  '#ED7D31', // 5: Accent 2 (Oranye)
  '#A5A5A5', // 6: Accent 3 (Abu-abu)
  '#FFC000', // 7: Accent 4 (Kuning/Gold)
  '#5B9BD5', // 8: Accent 5 (Biru Muda)
  '#70AD47', // 9: Accent 6 (Hijau)
];

function applyTint(hex: string, tint?: number): string {
  if (!tint || typeof tint !== 'number') return hex;
  let r = parseInt(hex.substring(1, 3), 16);
  let g = parseInt(hex.substring(3, 5), 16);
  let b = parseInt(hex.substring(5, 7), 16);

  if (tint > 0) {
    r = Math.round(r + (255 - r) * tint);
    g = Math.round(g + (255 - g) * tint);
    b = Math.round(b + (255 - b) * tint);
  } else {
    r = Math.round(r * (1 + tint));
    g = Math.round(g * (1 + tint));
    b = Math.round(b * (1 + tint));
  }
  return (
    '#' +
    [r, g, b]
      .map((x) => Math.min(255, Math.max(0, x)).toString(16).padStart(2, '0'))
      .join('')
  );
}

export function resolveExcelColor(colorObj: any): string | undefined {
  if (!colorObj) return undefined;
  if (colorObj.argb) {
    const a = String(colorObj.argb);
    return '#' + (a.length === 8 ? a.substring(2) : a);
  }
  if (colorObj.theme !== undefined) {
    const themeIdx = Number(colorObj.theme);
    const base = THEME_COLORS[themeIdx] || '#FFFFFF';
    return applyTint(base, colorObj.tint);
  }
  return undefined;
}

function formatCellValue(val: any): { text: string; isNumeric: boolean } {
  if (val === null || val === undefined || val === '') {
    return { text: '', isNumeric: false };
  }

  // Handle Excel formula results
  if (typeof val === 'object') {
    if ('result' in val) {
      return formatCellValue(val.result);
    }
    if ('text' in val) {
      return { text: String(val.text).trim(), isNumeric: false };
    }
    return { text: JSON.stringify(val), isNumeric: false };
  }

  if (typeof val === 'number') {
    if (Number.isInteger(val)) {
      return { text: val.toLocaleString('id-ID'), isNumeric: true };
    }
    return {
      text: val.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      isNumeric: true,
    };
  }

  const str = String(val).trim();
  const numCandidate = Number(str.replace(/\./g, '').replace(',', '.'));
  if (str !== '' && !isNaN(numCandidate) && !/^[0-9]{4}$/.test(str)) {
    // String angka
    return { text: str, isNumeric: true };
  }

  return { text: str, isNumeric: false };
}

function encodeCell(r: number, c: number): string {
  let colName = '';
  let tempC = c;
  while (tempC > 0) {
    const mod = (tempC - 1) % 26;
    colName = String.fromCharCode(65 + mod) + colName;
    tempC = Math.floor((tempC - mod) / 26);
  }
  return `${colName}${r}`;
}

const MONTH_NAMES = [
  'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
  'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER',
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
];

const DATE_REGEX = new RegExp(
  `(\\d{1,2}\\s+(?:${MONTH_NAMES.join('|')})\\s+\\d{4})`,
  'i'
);
const SHIFT_REGEX = /(?:SHIF[T]?\s*([0-9A-Z]+)|SHIFT\s*([0-9A-Z]+))/i;
const DAY_REGEX = /^(SENIN|SELASA|RABU|KAMIS|JUMAT|SABTU|MINGGU|MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY)/i;

/**
 * Deteksi blok-blok tabel secara cerdas dan dinamis dari Worksheet ExcelJS
 */
export function detectSheetBlocks(
  worksheet: ExcelJS.Worksheet,
  sheetName: string,
  mode: DetectionMode = 'smart_blocks'
): ContentBlock[] {
  const maxRows = worksheet.rowCount;
  const maxCols = worksheet.columnCount;
  if (maxRows === 0 || maxCols === 0) return [];

  // Hitung jumlah sel terisi per baris
  const rowDataCount: number[] = [];
  for (let r = 1; r <= maxRows; r++) {
    const row = worksheet.getRow(r);
    let count = 0;
    for (let c = 1; c <= maxCols; c++) {
      const val = row.getCell(c).value;
      if (val !== null && val !== undefined && String(val).trim() !== '') {
        count++;
      }
    }
    rowDataCount[r] = count;
  }

  // Identifikasi Segmen Baris (Row Bands)
  interface RowBand {
    startR: number;
    endR: number;
  }
  const bands: RowBand[] = [];

  if (mode === 'per_sheet') {
    // Satu lembar utuh
    bands.push({ startR: 1, endR: maxRows });
  } else {
    let curBandStart: number | null = null;
    let emptyStreak = 0;

    for (let r = 1; r <= maxRows; r++) {
      if (rowDataCount[r] > 0) {
        if (curBandStart === null) {
          curBandStart = r;
        }
        emptyStreak = 0;
      } else {
        emptyStreak++;
        // Pisahkan jika jeda baris kosong >= 2, atau >= 1 jika mode row_breaks
        const threshold = mode === 'row_breaks' ? 1 : 2;
        if (curBandStart !== null && emptyStreak >= threshold) {
          const endR = r - emptyStreak;
          if (endR >= curBandStart) {
            bands.push({ startR: curBandStart, endR });
          }
          curBandStart = null;
        }
      }
    }
    if (curBandStart !== null) {
      bands.push({ startR: curBandStart, endR: maxRows });
    }
  }

  if (bands.length === 0) return [];

  // Parse Worksheet Merges
  const mergesList: { s: { r: number; c: number }; e: { r: number; c: number } }[] = [];
  const modelMerges = (worksheet as any).model?.merges || [];
  modelMerges.forEach((mStr: string) => {
    const parts = mStr.split(':');
    if (parts.length === 2) {
      const start = parseAddress(parts[0]);
      const end = parseAddress(parts[1]);
      if (start && end) {
        mergesList.push({ s: start, e: end });
      }
    }
  });

  const blocks: ContentBlock[] = [];
  let blockCounter = 1;

  bands.forEach((band) => {
    // Jika smart_blocks, deteksi kelompok kolom yang dipisahkan oleh kolom kosong
    interface ColCluster {
      startC: number;
      endC: number;
    }
    let colClusters: ColCluster[] = [];

    if (mode === 'smart_blocks') {
      const colHasData: boolean[] = [];
      for (let c = 1; c <= maxCols; c++) {
        let has = false;
        for (let r = band.startR; r <= band.endR; r++) {
          const v = worksheet.getRow(r).getCell(c).value;
          if (v !== null && v !== undefined && String(v).trim() !== '') {
            has = true;
            break;
          }
        }
        colHasData[c] = has;
      }

      let curCol: number | null = null;
      for (let c = 1; c <= maxCols; c++) {
        if (colHasData[c]) {
          if (curCol === null) curCol = c;
        } else {
          if (curCol !== null) {
            colClusters.push({ startC: curCol, endC: c - 1 });
            curCol = null;
          }
        }
      }
      if (curCol !== null) {
        colClusters.push({ startC: curCol, endC: maxCols });
      }
    } else {
      // Mode row_breaks atau per_sheet: gunakan rentang kolom aktual band
      let minC = maxCols;
      let maxC = 1;
      for (let r = band.startR; r <= band.endR; r++) {
        const row = worksheet.getRow(r);
        for (let c = 1; c <= maxCols; c++) {
          const v = row.getCell(c).value;
          if (v !== null && v !== undefined && String(v).trim() !== '') {
            if (c < minC) minC = c;
            if (c > maxC) maxC = c;
          }
        }
      }
      if (minC <= maxC) {
        colClusters.push({ startC: minC, endC: maxC });
      }
    }

    // Bangun blok untuk setiap cluster
    colClusters.forEach((cluster) => {
      // Pangkas baris kosong di atas dan di bawah cluster ini
      let actualStartR = band.startR;
      let actualEndR = band.endR;

      while (actualStartR <= actualEndR) {
        let has = false;
        const row = worksheet.getRow(actualStartR);
        for (let c = cluster.startC; c <= cluster.endC; c++) {
          const v = row.getCell(c).value;
          if (v !== null && v !== undefined && String(v).trim() !== '') {
            has = true;
            break;
          }
        }
        if (has) break;
        actualStartR++;
      }

      while (actualEndR >= actualStartR) {
        let has = false;
        const row = worksheet.getRow(actualEndR);
        for (let c = cluster.startC; c <= cluster.endC; c++) {
          const v = row.getCell(c).value;
          if (v !== null && v !== undefined && String(v).trim() !== '') {
            has = true;
            break;
          }
        }
        if (has) break;
        actualEndR--;
      }

      if (actualStartR > actualEndR) return;

      // Bangun matriks sel dan data
      const cellsMatrix: RichCell[][] = [];
      const dataMatrix: string[][] = [];

      for (let r = actualStartR; r <= actualEndR; r++) {
        const row = worksheet.getRow(r);
        const cellRow: RichCell[] = [];
        const strRow: string[] = [];

        for (let c = cluster.startC; c <= cluster.endC; c++) {
          const cell = row.getCell(c);
          const { text, isNumeric } = formatCellValue(cell.value);

          // Cek fill background color
          let fillColor: string | undefined = undefined;
          if (cell.fill && (cell.fill as any).fgColor) {
            fillColor = resolveExcelColor((cell.fill as any).fgColor);
          }

          // Cek font styling
          let textColor: string | undefined = undefined;
          let bold = false;
          let italic = false;
          if (cell.font) {
            if (cell.font.color) {
              textColor = resolveExcelColor(cell.font.color);
            }
            bold = Boolean(cell.font.bold);
            italic = Boolean(cell.font.italic);
          }

          // Cek alignment
          let align: 'left' | 'center' | 'right' = isNumeric ? 'right' : 'left';
          let valign: 'top' | 'middle' | 'bottom' = 'middle';
          if (cell.alignment) {
            if (cell.alignment.horizontal === 'center') align = 'center';
            else if (cell.alignment.horizontal === 'right') align = 'right';
            else if (cell.alignment.horizontal === 'left') align = 'left';

            if (cell.alignment.vertical === 'top') valign = 'top';
            else if (cell.alignment.vertical === 'bottom') valign = 'bottom';
          }

          // Cek borders
          const borders: { top?: boolean; bottom?: boolean; left?: boolean; right?: boolean } = {};
          if (cell.border) {
            if (cell.border.top) borders.top = true;
            if (cell.border.bottom) borders.bottom = true;
            if (cell.border.left) borders.left = true;
            if (cell.border.right) borders.right = true;
          }

          cellRow.push({
            value: cell.value,
            text,
            fillColor,
            textColor,
            bold,
            italic,
            align,
            valign,
            borders,
            isNumeric,
          });
          strRow.push(text);
        }

        cellsMatrix.push(cellRow);
        dataMatrix.push(strRow);
      }

      // Terapkan Merged Cells yang bersinggungan dengan blok ini
      mergesList.forEach((m) => {
        if (
          m.s.r <= actualEndR &&
          m.e.r >= actualStartR &&
          m.s.c <= cluster.endC &&
          m.e.c >= cluster.startC
        ) {
          const startLocalR = Math.max(0, m.s.r - actualStartR);
          const endLocalR = Math.min(actualEndR - actualStartR, m.e.r - actualStartR);
          const startLocalC = Math.max(0, m.s.c - cluster.startC);
          const endLocalC = Math.min(cluster.endC - cluster.startC, m.e.c - cluster.startC);

          const rSpan = endLocalR - startLocalR + 1;
          const cSpan = endLocalC - startLocalC + 1;

          if (rSpan > 1 || cSpan > 1) {
            const masterCell = cellsMatrix[startLocalR]?.[startLocalC];
            if (masterCell) {
              masterCell.rowSpan = rSpan;
              masterCell.colSpan = cSpan;
            }

            for (let lr = startLocalR; lr <= endLocalR; lr++) {
              for (let lc = startLocalC; lc <= endLocalC; lc++) {
                if (lr !== startLocalR || lc !== startLocalC) {
                  if (cellsMatrix[lr]?.[lc]) {
                    cellsMatrix[lr][lc].isMergedChild = true;
                  }
                }
              }
            }
          }
        }
      });

      // Deteksi Judul, Tanggal, Subtitle, & Shift secara Cerdas
      let title = `Tabel ${blockCounter}`;
      let subtitle: string | undefined = undefined;
      let dateStr: string | undefined = undefined;
      let monthFolder: string | undefined = undefined;
      let sectionName: string | undefined = undefined;
      let suggestedFileName = `Tabel_${blockCounter}.pdf`;

      // Periksa 3 baris pertama blok untuk pola judul / tanggal / shift
      let fullHeaderText = '';
      for (let r = 0; r < Math.min(3, dataMatrix.length); r++) {
        fullHeaderText += ' ' + dataMatrix[r].filter((x) => x).join(' ');
      }

      const matchDate = fullHeaderText.match(DATE_REGEX);
      if (matchDate) {
        dateStr = matchDate[1].toUpperCase();
        const parts = dateStr.split(/\s+/);
        if (parts.length >= 3) {
          monthFolder = `${parts[1]} ${parts[2]}`.toUpperCase();
        }
      }

      const matchShift = fullHeaderText.match(SHIFT_REGEX);
      if (matchShift) {
        sectionName = `SHIF ${matchShift[1] || matchShift[2]}`.toUpperCase();
      }

      const matchDay = fullHeaderText.trim().match(DAY_REGEX);
      const dayName = matchDay ? matchDay[1].toUpperCase() : '';

      // Tentukan Nama Dokumen & File
      if (dateStr && sectionName) {
        title = 'DATA PENJUALAN BBM';
        subtitle = dayName ? `${dayName}, ${dateStr} - ${sectionName}` : `${dateStr} - ${sectionName}`;
        suggestedFileName = `Teller - ${dateStr} ${sectionName}.pdf`;
      } else if (dateStr) {
        const firstRowText = dataMatrix[0]?.find((x) => x.length > 2);
        title = firstRowText || 'LAPORAN DATA';
        subtitle = dayName ? `${dayName}, ${dateStr}` : dateStr;
        suggestedFileName = `Laporan - ${dateStr}.pdf`;
      } else {
        // Gunakan teks dari baris teratas yang memiliki konten
        const candidateTitle = dataMatrix[0]?.find((x) => x.length > 2);
        if (candidateTitle) {
          title = candidateTitle.trim();
          suggestedFileName = `${cleanFileName(title)}.pdf`;
        } else {
          title = `Tabel ${blockCounter} (${sheetName})`;
          suggestedFileName = `${cleanFileName(sheetName)}_Tabel_${blockCounter}.pdf`;
        }
      }

      const rangeAddress = `${encodeCell(actualStartR, cluster.startC)}:${encodeCell(
        actualEndR,
        cluster.endC
      )}`;

      const rowCount = actualEndR - actualStartR + 1;
      const colCount = cluster.endC - cluster.startC + 1;

      // Hitung bobot lebar kolom relatif berdasarkan panjang teks
      const colWidths: number[] = [];
      for (let c = 0; c < colCount; c++) {
        let maxLen = 4;
        for (let r = 0; r < rowCount; r++) {
          const len = (dataMatrix[r]?.[c] || '').length;
          if (len > maxLen) maxLen = len;
        }
        colWidths.push(Math.min(maxLen, 35));
      }

      // Estimasi tinggi vertikal dalam poin A4
      const estimatedHeightPt = 36 + 24 + rowCount * 17 + 20;

      blocks.push({
        id: `${sheetName}_b_${blockCounter}`,
        sheetName,
        title,
        subtitle,
        dateStr,
        monthFolder: monthFolder || 'DOKUMEN_LAINNYA',
        sectionName,
        suggestedFileName,
        rangeAddress,
        range: {
          s: { r: actualStartR, c: cluster.startC },
          e: { r: actualEndR, c: cluster.endC },
        },
        headers: dataMatrix[0] || [],
        data: dataMatrix,
        cells: cellsMatrix,
        rowCount,
        colCount,
        colWidths,
        estimatedHeightPt,
        selected: true,
        order: blockCounter,
      });

      blockCounter++;
    });
  });

  return blocks;
}

function parseAddress(addr: string): { r: number; c: number } | null {
  const match = addr.match(/([A-Z]+)([0-9]+)/);
  if (!match) return null;
  const colStr = match[1];
  const r = parseInt(match[2], 10);
  let c = 0;
  for (let i = 0; i < colStr.length; i++) {
    c = c * 26 + (colStr.charCodeAt(i) - 64);
  }
  return { r, c };
}

function cleanFileName(str: string): string {
  return str.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().substring(0, 40) || 'Dokumen';
}

/**
 * Membaca ArrayBuffer berkas Excel melalui ExcelJS
 */
export async function parseExcelWorkbook(
  arrayBuffer: ArrayBuffer,
  fileName: string,
  mode: DetectionMode = 'smart_blocks'
): Promise<ParsedWorkbook> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);

  const sheetNames = workbook.worksheets.map((w) => w.name);
  const blocksBySheet: Record<string, ContentBlock[]> = {};
  let totalBlocks = 0;

  sheetNames.forEach((name) => {
    const ws = workbook.getWorksheet(name);
    if (ws) {
      const detected = detectSheetBlocks(ws, name, mode);
      blocksBySheet[name] = detected;
      totalBlocks += detected.length;
    } else {
      blocksBySheet[name] = [];
    }
  });

  return {
    fileName,
    sheetNames,
    activeSheet: sheetNames[0] || '',
    blocksBySheet,
    totalBlocks,
  };
}

/**
 * Mengelompokkan blok terpilih ke dalam halaman PDF
 */
export function groupBlocksIntoPages(
  blocks: ContentBlock[],
  mode: PaginationMode,
  maxPageHeightPt: number = 750
): PageLayoutGroup[] {
  const selectedBlocks = blocks
    .filter((b) => b.selected)
    .sort((a, b) => a.order - b.order);

  if (selectedBlocks.length === 0) return [];

  const pages: PageLayoutGroup[] = [];

  if (mode === 'one_per_page') {
    selectedBlocks.forEach((block, idx) => {
      pages.push({
        pageNumber: idx + 1,
        blocks: [block],
        totalHeightPt: block.estimatedHeightPt,
      });
    });
    return pages;
  }

  if (mode === 'two_if_fit') {
    let currentPageBlocks: ContentBlock[] = [];
    let currentHeight = 0;
    let pageNum = 1;

    for (let i = 0; i < selectedBlocks.length; i++) {
      const block = selectedBlocks[i];
      const neededHeight = currentHeight > 0 ? block.estimatedHeightPt + 24 : block.estimatedHeightPt;

      if (currentPageBlocks.length === 1 && currentHeight + neededHeight <= maxPageHeightPt) {
        currentPageBlocks.push(block);
        currentHeight += neededHeight;
        pages.push({
          pageNumber: pageNum++,
          blocks: [...currentPageBlocks],
          totalHeightPt: currentHeight,
        });
        currentPageBlocks = [];
        currentHeight = 0;
      } else {
        if (currentPageBlocks.length > 0) {
          pages.push({
            pageNumber: pageNum++,
            blocks: [...currentPageBlocks],
            totalHeightPt: currentHeight,
          });
          currentPageBlocks = [];
          currentHeight = 0;
        }
        currentPageBlocks.push(block);
        currentHeight = block.estimatedHeightPt;
      }
    }

    if (currentPageBlocks.length > 0) {
      pages.push({
        pageNumber: pageNum,
        blocks: currentPageBlocks,
        totalHeightPt: currentHeight,
      });
    }

    return pages;
  }

  // Flow mode
  let curBlocks: ContentBlock[] = [];
  let curHeight = 0;
  let pageNum = 1;

  for (const block of selectedBlocks) {
    const additional = curHeight > 0 ? block.estimatedHeightPt + 24 : block.estimatedHeightPt;
    if (curHeight + additional > maxPageHeightPt && curBlocks.length > 0) {
      pages.push({
        pageNumber: pageNum++,
        blocks: [...curBlocks],
        totalHeightPt: curHeight,
      });
      curBlocks = [block];
      curHeight = block.estimatedHeightPt;
    } else {
      curBlocks.push(block);
      curHeight += additional;
    }
  }

  if (curBlocks.length > 0) {
    pages.push({
      pageNumber: pageNum,
      blocks: curBlocks,
      totalHeightPt: curHeight,
    });
  }

  return pages;
}
