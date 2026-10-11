/* DIHASILKAN oleh scripts/build-objects.mjs (jangan diedit tangan). Objek dari Microsoft Fluent Emoji (Flat, MIT).
   aspect = lebar/tinggi isi (viewBox sudah dirapatkan ke isi); scale = skala sisi terpanjang terhadap slot di papan. */
export interface ItemData {
  id: string;
  name: string;
  category: 'berat' | 'ringan' | 'menengah';
  scale: number;
  aspect: number;
}

export const ITEM_DATA: readonly ItemData[] = [
  { id: 'elephant', name: 'Gajah', category: 'berat', scale: 1, aspect: 1.2 },
  { id: 'hippopotamus', name: 'Kuda nil', category: 'berat', scale: 1, aspect: 1.49 },
  { id: 'whale', name: 'Paus', category: 'berat', scale: 1, aspect: 0.95 },
  { id: 'anchor', name: 'Jangkar', category: 'berat', scale: 0.86, aspect: 0.93 },
  { id: 'brick', name: 'Batu bata', category: 'berat', scale: 0.86, aspect: 1 },
  { id: 'rock', name: 'Batu', category: 'berat', scale: 0.86, aspect: 1 },
  { id: 'bowling', name: 'Bola bowling', category: 'berat', scale: 0.86, aspect: 1.11 },
  { id: 'automobile', name: 'Mobil', category: 'berat', scale: 1, aspect: 1.42 },
  { id: 'delivery-truck', name: 'Truk pengantar', category: 'berat', scale: 1, aspect: 1.2 },
  { id: 'bus', name: 'Bus', category: 'berat', scale: 1, aspect: 1.25 },
  { id: 'locomotive', name: 'Lokomotif', category: 'berat', scale: 1, aspect: 1.07 },
  { id: 'rocket', name: 'Roket', category: 'berat', scale: 0.86, aspect: 1.01 },
  { id: 'ship', name: 'Kapal', category: 'berat', scale: 1, aspect: 1.07 },
  { id: 'feather', name: 'Bulu', category: 'ringan', scale: 0.72, aspect: 1 },
  { id: 'balloon', name: 'Balon', category: 'ringan', scale: 0.72, aspect: 0.74 },
  { id: 'bubbles', name: 'Gelembung', category: 'ringan', scale: 0.72, aspect: 1 },
  { id: 'butterfly', name: 'Kupu-kupu', category: 'ringan', scale: 0.72, aspect: 1 },
  { id: 'leaf', name: 'Daun tertiup angin', category: 'ringan', scale: 0.72, aspect: 1 },
  { id: 'snowflake', name: 'Kepingan salju', category: 'ringan', scale: 0.72, aspect: 0.97 },
  { id: 'honeybee', name: 'Lebah', category: 'ringan', scale: 0.72, aspect: 1.07 },
  { id: 'kite', name: 'Layang-layang', category: 'ringan', scale: 0.72, aspect: 0.99 },
  { id: 'candle', name: 'Lilin', category: 'ringan', scale: 0.72, aspect: 0.52 },
  { id: 'cherries', name: 'Ceri', category: 'ringan', scale: 0.72, aspect: 1.04 },
  { id: 'mushroom', name: 'Jamur', category: 'ringan', scale: 0.72, aspect: 1 },
  { id: 'cupcake', name: 'Kue cupcake', category: 'ringan', scale: 0.72, aspect: 0.87 },
  { id: 'watermelon', name: 'Semangka', category: 'menengah', scale: 0.86, aspect: 1 },
  { id: 'coconut', name: 'Kelapa', category: 'menengah', scale: 0.86, aspect: 1 },
  { id: 'basketball', name: 'Bola basket', category: 'menengah', scale: 0.86, aspect: 1 },
  { id: 'soccer-ball', name: 'Bola sepak', category: 'menengah', scale: 0.86, aspect: 1 },
  { id: 'teddy-bear', name: 'Boneka beruang', category: 'menengah', scale: 0.86, aspect: 1 },
  { id: 'penguin', name: 'Pinguin', category: 'menengah', scale: 0.86, aspect: 1 },
  { id: 'backpack', name: 'Ransel', category: 'menengah', scale: 0.86, aspect: 0.81 },
  { id: 'luggage', name: 'Koper', category: 'menengah', scale: 0.86, aspect: 0.66 },
  { id: 'books', name: 'Buku', category: 'menengah', scale: 0.86, aspect: 1.07 },
  { id: 'cactus', name: 'Kaktus', category: 'menengah', scale: 0.86, aspect: 0.93 },
  { id: 'package', name: 'Paket', category: 'menengah', scale: 0.86, aspect: 0.86 },
];
