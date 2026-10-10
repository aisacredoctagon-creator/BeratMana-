/**
 * Daftar benda. Untuk mengganti gambar: timpa file di public/assets/items/ dengan nama yang sama,
 * atau ubah `src` di sini. Gambar ideal: persegi (≥ 256×256), latar transparan, benda menempel di
 * dasar gambar (SVG/PNG/WebP).
 */
export interface Item {
  id: string;
  name: string;
  src: string;
  /** Bagian atas gambar yang kosong (0–1 dari tinggi): box soal menempel di puncak objek yang sebenarnya. Default 0. */
  top?: number;
}

const base = (file: string): string => `${import.meta.env.BASE_URL}assets/items/${file}`;

export const ITEMS: readonly Item[] = [
  { id: 'bulu', name: 'Bulu', src: base('bulu.svg'), top: 0.07 },
  { id: 'landasan', name: 'Landasan besi', src: base('landasan.svg'), top: 0.35 },
  { id: 'balon', name: 'Balon', src: base('balon.svg'), top: 0.07 },
  { id: 'bola-bowling', name: 'Bola bowling', src: base('bola-bowling.svg'), top: 0.12 },
  { id: 'kapas', name: 'Kapas', src: base('kapas.svg'), top: 0.11 },
  { id: 'batu', name: 'Batu', src: base('batu.svg'), top: 0.29 },
  { id: 'bantal', name: 'Bantal', src: base('bantal.svg'), top: 0.28 },
  { id: 'dumbel', name: 'Dumbel', src: base('dumbel.svg'), top: 0.35 },
  { id: 'mobil', name: 'Mobil', src: base('mobil.svg'), top: 0.38 },
];

/** Memuat dan men-decode semua gambar di depan agar pergantian ronde mulus. */
export function preloadItems(): Promise<void[]> {
  return Promise.all(
    ITEMS.map(
      (item) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.src = item.src;
          const done = () => resolve();
          if (typeof img.decode === 'function') img.decode().then(done, done);
          else {
            img.onload = done;
            img.onerror = done;
          }
        }),
    ),
  );
}

/** Dua benda berbeda; hindari pasangan yang sama dengan sebelumnya. */
export function pickItemPair(rng: () => number, previous: readonly [string, string] | null): [Item, Item] {
  for (let i = 0; i < 20; i++) {
    const a = ITEMS[Math.floor(rng() * ITEMS.length)] as Item;
    const b = ITEMS[Math.floor(rng() * ITEMS.length)] as Item;
    if (a.id === b.id) continue;
    if (previous && ((a.id === previous[0] && b.id === previous[1]) || (a.id === previous[1] && b.id === previous[0]))) {
      continue;
    }
    return [a, b];
  }
  return [ITEMS[0] as Item, ITEMS[1] as Item];
}
