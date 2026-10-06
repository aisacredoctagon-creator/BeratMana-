/**
 * Aritmetika pecahan eksak berbasis integer. Semua nilai soal disimpan sebagai Rat
 * sehingga perbandingan tidak pernah terkena bug floating point
 * (mis. 0,1 + 0,2 vs 0,3, atau 1/3 + 1/6 vs 1/2).
 */
export interface Rat {
  readonly n: number;
  readonly d: number;
}

export const gcd = (a: number, b: number): number => {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) [a, b] = [b, a % b];
  return a;
};

/** Membuat pecahan tereduksi dengan penyebut positif. */
export function rat(n: number, d = 1): Rat {
  if (d === 0) throw new RangeError('Penyebut tidak boleh 0');
  if (d < 0) {
    n = -n;
    d = -d;
  }
  const g = gcd(n, d) || 1;
  return { n: n / g, d: d / g };
}

export const add = (a: Rat, b: Rat): Rat => rat(a.n * b.d + b.n * a.d, a.d * b.d);
export const sub = (a: Rat, b: Rat): Rat => rat(a.n * b.d - b.n * a.d, a.d * b.d);
export const mul = (a: Rat, b: Rat): Rat => rat(a.n * b.n, a.d * b.d);
export const div = (a: Rat, b: Rat): Rat => rat(a.n * b.d, a.d * b.n);

/** -1, 0, atau 1 lewat perkalian silang (penyebut selalu positif). */
export const cmp = (a: Rat, b: Rat): -1 | 0 | 1 => {
  const l = a.n * b.d;
  const r = b.n * a.d;
  return l < r ? -1 : l > r ? 1 : 0;
};

export const eq = (a: Rat, b: Rat): boolean => cmp(a, b) === 0;
export const abs = (a: Rat): Rat => (a.n < 0 ? { n: -a.n, d: a.d } : a);
export const isInt = (a: Rat): boolean => a.d === 1;
export const toNumber = (a: Rat): number => a.n / a.d;
export const max = (a: Rat, b: Rat): Rat => (cmp(a, b) >= 0 ? a : b);
