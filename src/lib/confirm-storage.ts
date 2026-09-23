const DONT_ASK_DELETE_KEY = 'pdf_fusion_skip_delete_confirm';

/**
 * Memeriksa apakah preferensi "Jangan tanyakan lagi" untuk hapus berkas sedang aktif.
 * Preferensi ini otomatis kedaluwarsa dan direset setiap 1 jam (3600000 ms).
 */
export function getSkipDeletePreference(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(DONT_ASK_DELETE_KEY);
    if (!raw) return false;
    const expiresAt = Number(raw);
    if (!isNaN(expiresAt) && Date.now() < expiresAt) {
      return true;
    }
    // Jika sudah lebih dari 1 jam (expired), hapus dari localStorage
    localStorage.removeItem(DONT_ASK_DELETE_KEY);
    return false;
  } catch {
    return false;
  }
}

/**
 * Menyimpan preferensi "Jangan tanyakan lagi" dengan masa aktif 1 jam.
 */
export function setSkipDeletePreference(): void {
  if (typeof window === 'undefined') return;
  try {
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 jam
    localStorage.setItem(DONT_ASK_DELETE_KEY, expiresAt.toString());
  } catch (e) {
    console.warn('Gagal menyimpan preferensi hapus', e);
  }
}

/**
 * Menghapus preferensi "Jangan tanyakan lagi".
 */
export function clearSkipDeletePreference(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(DONT_ASK_DELETE_KEY);
  } catch {
    // ignore
  }
}
