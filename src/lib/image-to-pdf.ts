import { PDFDocument } from '@cantoo/pdf-lib';
import { ImageItem, ImageToPdfOptions, ImageToPdfProgress, ImageToPdfResult } from '@/types/image-to-pdf';

const A4_SIZE = { width: 595.28, height: 841.89 };
const LETTER_SIZE = { width: 612.0, height: 792.0 };

const MARGIN_MAP = {
  none: 0,
  small: 20,
  normal: 36,
};

async function convertImageToStandardBlob(file: File): Promise<{ buffer: ArrayBuffer; isPng: boolean }> {
  const type = file.type.toLowerCase();

  // Jika sudah JPEG atau PNG standar, langsung baca arrayBuffer
  if (type === 'image/jpeg' || type === 'image/jpg') {
    const buffer = await file.arrayBuffer();
    return { buffer, isPng: false };
  }

  if (type === 'image/png') {
    try {
      const buffer = await file.arrayBuffer();
      return { buffer, isPng: true };
    } catch {
      // fallback jika ada error
    }
  }

  // Untuk WebP atau format gambar lainnya, render ke canvas agar menghasilkan PNG standar yang bersih
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(async (b) => {
        if (!b) {
          reject(new Error('Failed to encode image to canvas'));
          return;
        }
        const buffer = await b.arrayBuffer();
        resolve({ buffer, isPng: true });
      }, 'image/png');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Gagal memuat gambar: ${file.name}`));
    };
    img.src = url;
  });
}

export async function convertImagesToPdf(
  items: ImageItem[],
  options: ImageToPdfOptions,
  onProgress?: (progress: ImageToPdfProgress) => void
): Promise<ImageToPdfResult> {
  if (items.length === 0) {
    throw new Error('Tidak ada gambar yang dipilih untuk dikonversi');
  }

  const pdfDoc = await PDFDocument.create();
  pdfDoc.setProducer('PDF Tools by Primadev (pdftools.primadev.id)');

  const margin = MARGIN_MAP[options.margin] || 0;
  const total = items.length;

  for (let i = 0; i < total; i++) {
    const item = items[i];
    const percent = Math.round((i / total) * 90) + 5;

    onProgress?.({
      percentage: percent,
      statusText: `Memproses gambar ${i + 1} dari ${total}: ${item.name}...`,
      currentImage: i + 1,
      totalImages: total,
    });

    const { buffer, isPng } = await convertImageToStandardBlob(item.file);
    let embeddedImg;

    try {
      if (isPng) {
        embeddedImg = await pdfDoc.embedPng(buffer);
      } else {
        embeddedImg = await pdfDoc.embedJpg(buffer);
      }
    } catch {
      // Jika embed langsung gagal (misal format PNG non-standar), render lewat canvas
      const fallback = await new Promise<{ buffer: ArrayBuffer; isPng: boolean }>((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(item.file);
        img.onload = () => {
          URL.revokeObjectURL(url);
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('Canvas 2D context unavailable'));
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(async (b) => {
            if (!b) return reject(new Error('Failed to encode fallback canvas'));
            resolve({ buffer: await b.arrayBuffer(), isPng: false });
          }, 'image/jpeg', 0.95);
        };
        img.onerror = () => reject(new Error(`Failed to load ${item.name}`));
        img.src = url;
      });
      embeddedImg = await pdfDoc.embedJpg(fallback.buffer);
    }

    const imgWidth = embeddedImg.width;
    const imgHeight = embeddedImg.height;

    let targetPageWidth = imgWidth;
    let targetPageHeight = imgHeight;

    if (options.pageSize === 'fit') {
      targetPageWidth = imgWidth + margin * 2;
      targetPageHeight = imgHeight + margin * 2;
    } else {
      const base = options.pageSize === 'letter' ? LETTER_SIZE : A4_SIZE;
      let isLandscape = false;

      if (options.orientation === 'auto') {
        isLandscape = imgWidth > imgHeight;
      } else if (options.orientation === 'landscape') {
        isLandscape = true;
      } else {
        isLandscape = false;
      }

      if (isLandscape) {
        targetPageWidth = Math.max(base.width, base.height);
        targetPageHeight = Math.min(base.width, base.height);
      } else {
        targetPageWidth = Math.min(base.width, base.height);
        targetPageHeight = Math.max(base.width, base.height);
      }
    }

    const page = pdfDoc.addPage([targetPageWidth, targetPageHeight]);

    // Hitung posisi dan skala gambar di dalam halaman (dengan margin)
    const availableWidth = targetPageWidth - margin * 2;
    const availableHeight = targetPageHeight - margin * 2;

    const scale = Math.min(availableWidth / imgWidth, availableHeight / imgHeight);
    const drawWidth = imgWidth * scale;
    const drawHeight = imgHeight * scale;

    const drawX = margin + (availableWidth - drawWidth) / 2;
    const drawY = margin + (availableHeight - drawHeight) / 2;

    page.drawImage(embeddedImg, {
      x: drawX,
      y: drawY,
      width: drawWidth,
      height: drawHeight,
    });
  }

  onProgress?.({
    percentage: 95,
    statusText: 'Mengemas dokumen PDF akhir...',
    currentImage: total,
    totalImages: total,
  });

  const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  const baseName = items[0].name.replace(/\.[^/.]+$/, '');
  const fileName = items.length === 1 ? `${baseName}.pdf` : `${baseName}_koleksi_gambar.pdf`;

  onProgress?.({
    percentage: 100,
    statusText: 'Selesai!',
    currentImage: total,
    totalImages: total,
  });

  return {
    blob,
    url,
    fileName,
    fileSize: pdfBytes.length,
    totalImages: total,
  };
}
