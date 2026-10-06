/**
 * Daftar benda. Untuk mengganti gambar: timpa file di public/assets/items/ dengan nama yang sama,
 * atau ubah `src` di sini. Gambar ideal: persegi (≥ 256×256), latar transparan, benda menempel di
 * dasar gambar (SVG/PNG/WebP).
 */
export interface Item {
  id: string;
  name: string;
  src: string;
}

const base = (file: string): string => `${import.meta.env.BASE_URL}assets/items/${file}`;

export const ITEMS: readonly Item[] = [
  { id: 'bulu', name: 'Bulu', src: base('bulu.svg') },
  { id: 'landasan', name: 'Landasan besi', src: base('landasan.svg') },
  { id: 'balon', name: 'Balon', src: base('balon.svg') },
  { id: 'bola-bowling', name: 'Bola bowling', src: base('bola-bowling.svg') },
  { id: 'gajah', name: 'Gajah', src: base('gajah.svg') },
  { id: 'kapas', name: 'Kapas', src: base('kapas.svg') },
  { id: 'batu', name: 'Batu', src: base('batu.svg') },
  { id: 'bantal', name: 'Bantal', src: base('bantal.svg') },
  { id: 'dumbel', name: 'Dumbel', src: base('dumbel.svg') },
  { id: 'mobil', name: 'Mobil', src: base('mobil.svg') },
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
