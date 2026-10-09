import JSZip from 'jszip';

export interface SlideParagraph {
  text: string;
  isBold?: boolean;
  isItalic?: boolean;
  fontSize?: number;
  color?: string;
  isBullet?: boolean;
  level?: number;
}

export interface SlideTable {
  rows: string[][];
}

export interface SlideImage {
  src: string; // Base64 data URL
  width?: number;
  height?: number;
}

export interface ParsedSlide {
  id: string;
  slideNumber: number;
  title: string;
  subtitle?: string;
  paragraphs: SlideParagraph[];
  tables: SlideTable[];
  images: SlideImage[];
  selected: boolean;
}

export interface ParsedPresentation {
  fileName: string;
  slideWidthPx: number; // e.g. 1280
  slideHeightPx: number; // e.g. 720
  aspectRatio: '16:9' | '4:3';
  slides: ParsedSlide[];
}

/**
 * Membaca buffer file .pptx dan mengekstrak slide, teks, tabel, dan gambar tersemat
 */
export async function parsePptx(
  buffer: ArrayBuffer,
  fileName: string
): Promise<ParsedPresentation> {
  const zip = await JSZip.loadAsync(buffer);

  // 1. Dapatkan ukuran presentasi dari ppt/presentation.xml
  let slideWidthPx = 1280;
  let slideHeightPx = 720;
  let aspectRatio: '16:9' | '4:3' = '16:9';

  const presXmlStr = await zip.file('ppt/presentation.xml')?.async('text');
  if (presXmlStr) {
    const parser = new DOMParser();
    const presDoc = parser.parseFromString(presXmlStr, 'application/xml');
    const sldSz = presDoc.querySelector('sldSz');
    if (sldSz) {
      const cx = parseInt(sldSz.getAttribute('cx') || '12192000', 10);
      const cy = parseInt(sldSz.getAttribute('cy') || '6858000', 10);
      // Konversi EMU ke piksel (1 inch = 914400 EMU, at 96 DPI 1 EMU = 96 / 914400 px)
      slideWidthPx = Math.round((cx / 914400) * 96);
      slideHeightPx = Math.round((cy / 914400) * 96);

      const ratio = slideWidthPx / slideHeightPx;
      aspectRatio = Math.abs(ratio - 16 / 9) < Math.abs(ratio - 4 / 3) ? '16:9' : '4:3';
    }
  }

  // 2. Dapatkan daftar ID urutan slide dari ppt/presentation.xml
  const slideOrder: string[] = [];
  if (presXmlStr) {
    const parser = new DOMParser();
    const presDoc = parser.parseFromString(presXmlStr, 'application/xml');
    const sldIdNodes = presDoc.querySelectorAll('sldIdLst > sldId');
    sldIdNodes.forEach((node) => {
      const rId = node.getAttribute('r:id');
      if (rId) slideOrder.push(rId);
    });
  }

  // 3. Baca ppt/_rels/presentation.xml.rels untuk memetakan rId ke nama file slide
  const slidePathMap: Record<string, string> = {};
  const presRelsStr = await zip.file('ppt/_rels/presentation.xml.rels')?.async('text');
  if (presRelsStr) {
    const parser = new DOMParser();
    const relsDoc = parser.parseFromString(presRelsStr, 'application/xml');
    const relNodes = relsDoc.querySelectorAll('Relationship');
    relNodes.forEach((r) => {
      const id = r.getAttribute('Id');
      const target = r.getAttribute('Target');
      if (id && target && target.includes('slides/slide')) {
        // Normalisasi path target: e.g. "slides/slide1.xml" -> "ppt/slides/slide1.xml"
        const cleanPath = target.startsWith('ppt/')
          ? target
          : target.startsWith('/')
          ? target.substring(1)
          : `ppt/${target}`;
        slidePathMap[id] = cleanPath;
      }
    });
  }

  // Urutkan file slide sesuai slideOrder atau fallback ke scan file jika relasi tidak lengkap
  const slideFiles: string[] = [];
  if (slideOrder.length > 0) {
    for (const rId of slideOrder) {
      if (slidePathMap[rId] && zip.file(slidePathMap[rId])) {
        slideFiles.push(slidePathMap[rId]);
      }
    }
  }

  if (slideFiles.length === 0) {
    // Fallback: temukan semua file ppt/slides/slide*.xml dan urutkan numerik
    const files = Object.keys(zip.files).filter((name) =>
      /^ppt\/slides\/slide\d+\.xml$/i.test(name)
    );
    files.sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10);
      const numB = parseInt(b.replace(/\D/g, ''), 10);
      return numA - numB;
    });
    slideFiles.push(...files);
  }

  const slides: ParsedSlide[] = [];

  // 4. Parse setiap file slide
  for (let i = 0; i < slideFiles.length; i++) {
    const slideFilePath = slideFiles[i];
    const slideXmlStr = await zip.file(slideFilePath)?.async('text');
    if (!slideXmlStr) continue;

    const parser = new DOMParser();
    const slideDoc = parser.parseFromString(slideXmlStr, 'application/xml');

    // Baca relasi slide untuk gambar: ppt/slides/_rels/slide{N}.xml.rels
    const slideFileName = slideFilePath.split('/').pop() || '';
    const relsPath = `ppt/slides/_rels/${slideFileName}.rels`;
    const imageMap: Record<string, string> = {};

    const slideRelsStr = await zip.file(relsPath)?.async('text');
    if (slideRelsStr) {
      const relsDoc = parser.parseFromString(slideRelsStr, 'application/xml');
      const rels = relsDoc.querySelectorAll('Relationship');
      rels.forEach((rel) => {
        const id = rel.getAttribute('Id');
        const target = rel.getAttribute('Target');
        const type = rel.getAttribute('Type') || '';
        if (id && target && (type.includes('image') || target.includes('media/'))) {
          // Resolve relative path: "../media/image1.png" -> "ppt/media/image1.png"
          const cleanTarget = target.replace(/^\.\.\//, 'ppt/');
          imageMap[id] = cleanTarget;
        }
      });
    }

    // Ekstrak teks paragraf, bentuk judul, tabel, dan gambar
    let title = '';
    let subtitle = '';
    const paragraphs: SlideParagraph[] = [];
    const tables: SlideTable[] = [];
    const images: SlideImage[] = [];

    // Deteksi Title Placeholder
    const titleShape =
      slideDoc.querySelector('sp:has(ph[type="title"])') ||
      slideDoc.querySelector('sp:has(ph[type="ctrTitle"])');

    if (titleShape) {
      const textNodes = titleShape.querySelectorAll('a\\:t, t');
      const textParts: string[] = [];
      textNodes.forEach((t) => textParts.push(t.textContent || ''));
      title = textParts.join('').trim();
    }

    // Ekstrak semua bentuk teks <p:sp>
    const shapes = slideDoc.querySelectorAll('sp');
    shapes.forEach((sp) => {
      // Periksa apakah ini subtitle placeholder
      const isSub = sp.querySelector('ph[type="subTitle"]');
      const pNodes = sp.querySelectorAll('a\\:p, p');

      pNodes.forEach((p) => {
        const rNodes = p.querySelectorAll('a\\:r, r');
        let fullParaText = '';
        let isBold = false;
        let isItalic = false;
        let fontSize = 16;
        let fontColor = '#0f172a';

        rNodes.forEach((r) => {
          const tNode = r.querySelector('a\\:t, t');
          if (tNode && tNode.textContent) {
            fullParaText += tNode.textContent;
          }

          const rPr = r.querySelector('a\\:rPr, rPr');
          if (rPr) {
            if (rPr.getAttribute('b') === '1') isBold = true;
            if (rPr.getAttribute('i') === '1') isItalic = true;
            const sz = rPr.getAttribute('sz');
            if (sz) fontSize = Math.round(parseInt(sz, 10) / 100);
            const clr = rPr.querySelector('srgbClr');
            if (clr && clr.getAttribute('val')) {
              fontColor = `#${clr.getAttribute('val')}`;
            }
          }
        });

        const trimmed = fullParaText.trim();
        if (trimmed) {
          if (!title && shapes.length > 0 && fontSize >= 24) {
            title = trimmed;
          } else if (isSub && !subtitle) {
            subtitle = trimmed;
          } else {
            // Cek bullet format
            const pPr = p.querySelector('a\\:pPr, pPr');
            const lvl = pPr ? parseInt(pPr.getAttribute('lvl') || '0', 10) : 0;
            const isBullet = Boolean(pPr?.querySelector('buChar') || lvl > 0);

            paragraphs.push({
              text: trimmed,
              isBold,
              isItalic,
              fontSize,
              color: fontColor,
              isBullet,
              level: lvl,
            });
          }
        }
      });
    });

    // Ekstrak Tabel <a:tbl>
    const tableNodes = slideDoc.querySelectorAll('tbl');
    tableNodes.forEach((tbl) => {
      const trNodes = tbl.querySelectorAll('tr');
      const rows: string[][] = [];

      trNodes.forEach((tr) => {
        const tcNodes = tr.querySelectorAll('tc');
        const rowCells: string[] = [];
        tcNodes.forEach((tc) => {
          const textNodes = tc.querySelectorAll('t');
          const cellText = Array.from(textNodes)
            .map((t) => t.textContent || '')
            .join(' ')
            .trim();
          rowCells.push(cellText);
        });
        if (rowCells.some((c) => c.length > 0)) {
          rows.push(rowCells);
        }
      });

      if (rows.length > 0) {
        tables.push({ rows });
      }
    });

    // Ekstrak Gambar Tersemat <p:pic>
    const picNodes = slideDoc.querySelectorAll('pic');
    for (const pic of Array.from(picNodes)) {
      const blip = pic.querySelector('blip');
      const embedId = blip?.getAttribute('r:embed');
      if (embedId && imageMap[embedId]) {
        const mediaFilePath = imageMap[embedId];
        const mediaFile = zip.file(mediaFilePath);
        if (mediaFile) {
          try {
            const base64Data = await mediaFile.async('base64');
            const ext = mediaFilePath.split('.').pop()?.toLowerCase() || 'png';
            const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;
            images.push({
              src: `data:${mime};base64,${base64Data}`,
            });
          } catch (e) {
            console.warn('Gagal membaca gambar slide:', mediaFilePath, e);
          }
        }
      }
    }

    slides.push({
      id: `slide-${i + 1}`,
      slideNumber: i + 1,
      title: title || `Slide ${i + 1}`,
      subtitle: subtitle || undefined,
      paragraphs,
      tables,
      images,
      selected: true,
    });
  }

  return {
    fileName,
    slideWidthPx,
    slideHeightPx,
    aspectRatio,
    slides,
  };
}
