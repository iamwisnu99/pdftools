export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

/**
 * Parsing input rentang halaman (misal: "1-3, 5, 8-10") menjadi array nomor halaman
 */
export function parsePageRange(input: string, maxPages: number): number[] {
  if (!input.trim()) {
    return Array.from({ length: maxPages }, (_, i) => i + 1);
  }

  const result = new Set<number>();
  const parts = input.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if (trimmed.includes('-')) {
      const [startStr, endStr] = trimmed.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      if (!isNaN(start) && !isNaN(end)) {
        const from = Math.max(1, Math.min(start, end));
        const to = Math.min(maxPages, Math.max(start, end));
        for (let i = from; i <= to; i++) {
          result.add(i);
        }
      }
    } else {
      const num = parseInt(trimmed, 10);
      if (!isNaN(num) && num >= 1 && num <= maxPages) {
        result.add(num);
      }
    }
  }

  return Array.from(result).sort((a, b) => a - b);
}

/**
 * Format array halaman menjadi string ringkas (misal: [1,2,3,5] -> "1-3, 5")
 */
export function formatPageRange(pages: number[], maxPages: number): string {
  if (pages.length === 0) return 'Tidak ada halaman terpilih';
  if (pages.length === maxPages) return `Semua halaman (${maxPages})`;

  const sorted = [...pages].sort((a, b) => a - b);
  const ranges: string[] = [];
  let rangeStart = sorted[0];
  let prev = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    if (current === prev + 1) {
      prev = current;
    } else {
      if (rangeStart === prev) {
        ranges.push(`${rangeStart}`);
      } else {
        ranges.push(`${rangeStart}-${prev}`);
      }
      rangeStart = current;
      prev = current;
    }
  }

  if (rangeStart === prev) {
    ranges.push(`${rangeStart}`);
  } else {
    ranges.push(`${rangeStart}-${prev}`);
  }

  return ranges.join(', ');
}
