/** Sumber acak yang bisa disuntik (seed) supaya generator mudah diuji. */
export type Rng = () => number;

/** PRNG kecil deterministik (mulberry32). */
export function seeded(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Bilangan bulat acak, inklusif kedua ujung. */
export const randInt = (rng: Rng, min: number, max: number): number =>
  min + Math.floor(rng() * (max - min + 1));

export const pick = <T>(rng: Rng, items: readonly T[]): T => {
  const item = items[Math.floor(rng() * items.length)];
  if (item === undefined) throw new RangeError('pick() dari daftar kosong');
  return item;
};

export const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/**
 * Indeks elemen terdekat dengan `target` pada array terurut naik.
 * `valueOf` mengambil angka pembanding dari tiap elemen.
 */
export function nearestIndex<T>(sorted: readonly T[], target: number, valueOf: (item: T) => number): number {
  let lo = 0;
  let hi = sorted.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (valueOf(sorted[mid] as T) < target) lo = mid + 1;
    else hi = mid;
  }
  if (lo > 0) {
    const before = Math.abs(valueOf(sorted[lo - 1] as T) - target);
    const here = Math.abs(valueOf(sorted[lo] as T) - target);
    if (before <= here) return lo - 1;
  }
  return lo;
}
