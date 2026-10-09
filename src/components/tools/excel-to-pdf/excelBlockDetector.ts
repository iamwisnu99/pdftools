import * as XLSX from 'xlsx';

export interface ExcelCell {
  v: any; // Raw value
  w?: string; // Formatted text
  t?: string; // Type
}

export interface ContentBlock {
  id: string;
  sheetName: string;
  title: string;
  rangeAddress: string;
  range: {
    s: { r: number; c: number };
    e: { r: number; c: number };
  };
  headers: string[];
  data: (string | number)[][];
  rowCount: number;
  colCount: number;
  estimatedHeightPt: number;
  selected: boolean;
  order: number;
}

export interface ParsedWorkbook {
  fileName: string;
  sheetNames: string[];
  activeSheet: string;
  blocksBySheet: Record<string, ContentBlock[]>;
}

/**
 * Mendeteksi blok-blok tabel/konten terpisah dalam sebuah Worksheet Excel
 * berdasarkan jeda baris/kolom kosong dan konsistensi data.
 */
export function detectSheetBlocks(
  sheet: XLSX.WorkSheet,
  sheetName: string
): ContentBlock[] {
  if (!sheet || !sheet['!ref']) return [];

  const range = XLSX.utils.decode_range(sheet['!ref']);
  const maxRows = range.e.r;
  const maxCols = range.e.c;

  // 1. Identifikasi baris-baris mana yang memiliki nilai (non-empty)
  const rowHasData: boolean[] = [];
  for (let r = range.s.r; r <= maxRows; r++) {
    let hasData = false;
    for (let c = range.s.c; c <= maxCols; c++) {
      const cellAddress = XLSX.utils.encode_cell({ r, c });
      const cell = sheet[cellAddress];
      if (cell && cell.v !== undefined && cell.v !== null && String(cell.v).trim() !== '') {
        hasData = true;
        break;
      }
    }
    rowHasData[r] = hasData;
  }

  // 2. Kelompokkan baris berurutan menjadi segmen vertikal
  // Jika terdapat 1 atau lebih baris kosong berurutan, pisahkan menjadi blok baru.
  interface RowSegment {
    startRow: number;
    endRow: number;
  }

  const segments: RowSegment[] = [];
  let currentStart: number | null = null;

  for (let r = range.s.r; r <= maxRows; r++) {
    if (rowHasData[r]) {
      if (currentStart === null) {
        currentStart = r;
      }
    } else {
      if (currentStart !== null) {
        segments.push({ startRow: currentStart, endRow: r - 1 });
        currentStart = null;
      }
    }
  }

  if (currentStart !== null) {
    segments.push({ startRow: currentStart, endRow: maxRows });
  }

  // Jika tidak ada data sama sekali
  if (segments.length === 0) return [];

  // 3. Untuk setiap segmen baris, tentukan batas kolom aktual (min & max col)
  const blocks: ContentBlock[] = [];

  segments.forEach((seg, idx) => {
    let minCol = maxCols;
    let maxCol = range.s.c;
    let hasAnyCell = false;

    for (let r = seg.startRow; r <= seg.endRow; r++) {
      for (let c = range.s.c; c <= maxCols; c++) {
        const cellAddress = XLSX.utils.encode_cell({ r, c });
        const cell = sheet[cellAddress];
        if (cell && cell.v !== undefined && cell.v !== null && String(cell.v).trim() !== '') {
          hasAnyCell = true;
          if (c < minCol) minCol = c;
          if (c > maxCol) maxCol = c;
        }
      }
    }

    if (!hasAnyCell) return;

    // Ambil matriks data untuk segmen ini
    const dataMatrix: (string | number)[][] = [];
    for (let r = seg.startRow; r <= seg.endRow; r++) {
      const row: (string | number)[] = [];
      for (let c = minCol; c <= maxCol; c++) {
        const cellAddress = XLSX.utils.encode_cell({ r, c });
        const cell = sheet[cellAddress];
        let val = '';
        if (cell && cell.v !== undefined && cell.v !== null) {
          val = cell.w ? cell.w : String(cell.v);
        }
        row.push(val);
      }
      dataMatrix.push(row);
    }

    // Tentukan Judul Blok (Gunakan baris pertama jika berupa judul tunggal, atau teks pertama)
    let title = `Tabel ${idx + 1} (${sheetName})`;
    if (dataMatrix.length > 0) {
      const firstRow = dataMatrix[0];
      const nonEmpties = firstRow.filter((c) => String(c).trim() !== '');
      if (nonEmpties.length === 1 && String(nonEmpties[0]).length > 2) {
        title = String(nonEmpties[0]).trim();
      } else if (nonEmpties.length > 1) {
        title = `${nonEmpties[0]} - dkk`;
      }
    }

    const rangeAddress = `${XLSX.utils.encode_cell({ r: seg.startRow, c: minCol })}:${XLSX.utils.encode_cell({ r: seg.endRow, c: maxCol })}`;

    const rowCount = seg.endRow - seg.startRow + 1;
    const colCount = maxCol - minCol + 1;

    // Estimasi tinggi vertikal dalam poin A4 (72pt/inch)
    // Header/judul: ~30pt, table header: ~24pt, tiap baris data: ~18pt, margin/padding: ~20pt
    const estimatedHeightPt = 32 + 24 + rowCount * 18 + 24;

    blocks.push({
      id: `${sheetName}_block_${idx + 1}`,
      sheetName,
      title,
      rangeAddress,
      range: {
        s: { r: seg.startRow, c: minCol },
        e: { r: seg.endRow, c: maxCol },
      },
      headers: dataMatrix.length > 0 ? dataMatrix[0].map((v) => String(v)) : [],
      data: dataMatrix,
      rowCount,
      colCount,
      estimatedHeightPt,
      selected: true,
      order: idx + 1,
    });
  });

  return blocks;
}

/**
 * Membaca ArrayBuffer berkas Excel dan menghasilkan struktur parsed workbook
 */
export async function parseExcelWorkbook(
  arrayBuffer: ArrayBuffer,
  fileName: string
): Promise<ParsedWorkbook> {
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheetNames = workbook.SheetNames || [];
  const blocksBySheet: Record<string, ContentBlock[]> = {};

  let globalOrder = 1;
  sheetNames.forEach((name) => {
    const sheet = workbook.Sheets[name];
    const detected = detectSheetBlocks(sheet, name);
    // Berikan nomor urut berkesinambungan
    detected.forEach((b) => {
      b.order = globalOrder++;
    });
    blocksBySheet[name] = detected;
  });

  return {
    fileName,
    sheetNames,
    activeSheet: sheetNames[0] || '',
    blocksBySheet,
  };
}

export type PaginationMode = 'one_per_page' | 'two_if_fit' | 'flow';

export interface PageLayoutGroup {
  pageNumber: number;
  blocks: ContentBlock[];
  totalHeightPt: number;
}

/**
 * Mengelompokkan blok-blok terpilih ke dalam halaman-halaman PDF
 * berdasarkan mode paginasi (1 per halaman atau 2 per halaman jika mencukupi).
 */
export function groupBlocksIntoPages(
  blocks: ContentBlock[],
  mode: PaginationMode,
  maxPageHeightPt: number = 750 // A4 usable printable height
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
      const gap = currentPageBlocks.length > 0 ? 30 : 0; // spasi antar-tabel

      // Jika halaman saat ini sudah punya 1 blok dan blok kedua masih muat (maksimal 2 blok per halaman)
      if (currentPageBlocks.length === 1) {
        if (currentHeight + gap + block.estimatedHeightPt <= maxPageHeightPt) {
          // Muat 2 konten!
          currentPageBlocks.push(block);
          currentHeight += gap + block.estimatedHeightPt;
          pages.push({
            pageNumber: pageNum++,
            blocks: currentPageBlocks,
            totalHeightPt: currentHeight,
          });
          currentPageBlocks = [];
          currentHeight = 0;
          continue;
        } else {
          // Tidak muat 2 konten, tutup halaman pertama dengan 1 blok
          pages.push({
            pageNumber: pageNum++,
            blocks: currentPageBlocks,
            totalHeightPt: currentHeight,
          });
          // Mulai halaman baru dengan blok saat ini
          currentPageBlocks = [block];
          currentHeight = block.estimatedHeightPt;
          continue;
        }
      }

      // Jika halaman baru
      currentPageBlocks.push(block);
      currentHeight = block.estimatedHeightPt;
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

  // Flow mode (sebanyak mungkin yang muat)
  let currentPageBlocks: ContentBlock[] = [];
  let currentHeight = 0;
  let pageNum = 1;

  for (let i = 0; i < selectedBlocks.length; i++) {
    const block = selectedBlocks[i];
    const gap = currentPageBlocks.length > 0 ? 25 : 0;

    if (currentHeight + gap + block.estimatedHeightPt <= maxPageHeightPt) {
      currentPageBlocks.push(block);
      currentHeight += gap + block.estimatedHeightPt;
    } else {
      if (currentPageBlocks.length > 0) {
        pages.push({
          pageNumber: pageNum++,
          blocks: currentPageBlocks,
          totalHeightPt: currentHeight,
        });
      }
      currentPageBlocks = [block];
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
