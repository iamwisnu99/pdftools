import { PDFDocument } from '@cantoo/pdf-lib';
import { ProtectOptions, ProtectResult, UnlockOptions } from '@/types/protect';

/**
 * Mengecek apakah berkas PDF terenkripsi / dilindungi kata sandi.
 */
export async function isPdfEncrypted(file: File): Promise<boolean> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    // Jika bisa di-load tanpa opsi password atau ignoreEncryption, berarti TIDAK terenkripsi
    await PDFDocument.load(arrayBuffer);
    return false;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message.toLowerCase() : '';
    if (msg.includes('encrypt') || msg.includes('password')) {
      return true;
    }
    return false;
  }
}

/**
 * Mengunci PDF dengan enkripsi kata sandi kuat (AES-256).
 */
export async function protectPDF(
  file: File,
  options: ProtectOptions
): Promise<ProtectResult> {
  if (!options.userPassword || options.userPassword.trim().length === 0) {
    throw new Error('Kata sandi tidak boleh kosong');
  }

  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pageCount = pdfDoc.getPageCount();

  pdfDoc.setProducer('PDF Tools by Primadev (pdftools.primadev.id)');

  // Enkripsi dengan AES-256
  pdfDoc.encrypt({
    userPassword: options.userPassword,
    ownerPassword: options.ownerPassword || options.userPassword,
  });

  const encryptedBytes = await pdfDoc.save();
  const blob = new Blob([encryptedBytes as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const fileName = `${baseName}_terkunci.pdf`;

  return {
    action: 'encrypt',
    blob,
    url,
    fileName,
    fileSize: encryptedBytes.length,
    pageCount,
  };
}

/**
 * Membuka proteksi kata sandi dokumen PDF dan menghasilkan salinan bebas sandi.
 */
export async function unlockPDF(
  file: File,
  options: UnlockOptions
): Promise<ProtectResult> {
  const arrayBuffer = await file.arrayBuffer();

  let unlockedDoc: PDFDocument;
  try {
    unlockedDoc = await PDFDocument.load(arrayBuffer, { password: options.password });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.toLowerCase().includes('password') || msg.toLowerCase().includes('encrypt')) {
      throw new Error('Kata sandi yang dimasukkan salah. Silakan coba lagi.');
    }
    throw new Error('Gagal membuka dokumen PDF terproteksi');
  }

  const pageCount = unlockedDoc.getPageCount();

  // Salin seluruh halaman ke dokumen baru yang bersih tanpa enkripsi
  const cleanDoc = await PDFDocument.create();
  cleanDoc.setProducer('PDF Tools by Primadev (pdftools.primadev.id)');

  const indices = unlockedDoc.getPageIndices();
  const copiedPages = await cleanDoc.copyPages(unlockedDoc, indices);
  copiedPages.forEach((page) => cleanDoc.addPage(page));

  const cleanBytes = await cleanDoc.save({ useObjectStreams: true });
  const blob = new Blob([cleanBytes as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const fileName = `${baseName}_terbuka.pdf`;

  return {
    action: 'decrypt',
    blob,
    url,
    fileName,
    fileSize: cleanBytes.length,
    pageCount,
  };
}
