/**
 * Daftar benda di jungkat-jungkit: Microsoft Fluent Emoji gaya Flat (MIT), dinormalisasi oleh scripts/build-objects.mjs.
 * Data per objek (src/config/items.data.ts, DIHASILKAN skrip): id, label Indonesia, kategori tampilan (berat/ringan/menengah,
 * murni kosmetik), skala, dan rasio aspek isi. Berkas: public/assets/objects/<id>.svg (viewBox sudah dirapatkan ke isi +
 * kontur, jadi dasar objek menyentuh dasar gambar dan terpusat). Menambah objek: lihat README ("Menambah atau mengganti objek").
 */
import { ITEM_DATA } from './items.data';
import type { ItemData } from './items.data';

export interface Item extends ItemData {
  src: string;
  /** Bagian atas slot yang kosong (0–1 dari tinggi slot): box soal menempel di puncak objek yang sebenarnya. */
  top: number;
}

const toItem = (d: ItemData): Item => {
  // objek muat di kotak (scale × slot) dan duduk di dasar; tinggi tampil = scale (aspek < 1) atau scale / aspek (aspek ≥ 1)
  const height = d.aspect >= 1 ? d.scale / d.aspect : d.scale;
  return { ...d, src: `${import.meta.env.BASE_URL}assets/objects/${d.id}.svg`, top: Math.round((1 - height) * 1000) / 1000 };
};

export const ITEMS: readonly Item[] = ITEM_DATA.map(toItem);

/** Memuat dan men-decode satu gambar lebih dulu agar objek berganti tanpa kedip. Tidak pernah menolak. */
export function preloadItem(item: Item): Promise<void> {
  return new Promise<void>((resolve) => {
    const img = new Image();
    img.src = item.src;
    const done = (): void => resolve();
    if (typeof img.decode === 'function') img.decode().then(done, done);
    else {
      img.onload = done;
      img.onerror = done;
    }
  });
}

/** Memuat pasangan objek ronde berikutnya (hanya dua gambar, bukan seluruh daftar). */
export function preloadPair(pair: readonly [Item, Item]): Promise<void> {
  return Promise.all(pair.map(preloadItem)).then(() => undefined);
}

/**
 * Dua objek acak untuk satu ronde. Aturan: kedua sisi tidak boleh objek yang sama, dan objek tidak boleh sama dengan
 * objek di SISI yang sama pada ronde sebelumnya (`previous` = [id kiri, id kanan]). Murni acak: tidak membaca kategori
 * objek maupun hasil hitungan, jadi objek tidak pernah memengaruhi sisi yang menang.
 */
export function pickItemPair(rng: () => number, previous: readonly [string, string] | null): [Item, Item] {
  const pool = (exclude: readonly (string | undefined)[]): Item[] => ITEMS.filter((i) => !exclude.includes(i.id));
  const left = pick(pool([previous?.[0]]), rng);
  const right = pick(pool([previous?.[1], left.id]), rng);
  return [left, right];
}

const pick = (list: readonly Item[], rng: () => number): Item => list[Math.min(list.length - 1, Math.floor(rng() * list.length))] as Item;
