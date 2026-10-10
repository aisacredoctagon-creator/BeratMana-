import type { QType } from '../config/difficulty';
import type { Rat } from './rational';

/** Potongan label. UI merender 'frac' bertumpuk. */
export type Token =
  | { t: 'txt'; v: string }
  | { t: 'frac'; n: number; d: number };

export interface Expr {
  kind: QType;
  /** Nilai eksak. Inilah "berat" benda. */
  value: Rat;
  /** Label teks polos, mis. "3/4", "36÷3". Dipakai untuk aria-label dan pengujian. */
  label: string;
  tokens: Token[];
}

export const txt = (v: string): Token => ({ t: 'txt', v });
export const frac = (n: number, d: number): Token => ({ t: 'frac', n, d });

export const MINUS = '−';
export const TIMES = '×';
export const DIVIDE = '÷';

export function tokensToLabel(tokens: readonly Token[]): string {
  return tokens
    .map((k) => (k.t === 'txt' ? k.v : `${k.n}/${k.d}`))
    .join('');
}

export function makeExpr(kind: QType, value: Rat, tokens: Token[]): Expr {
  return { kind, value, tokens, label: tokensToLabel(tokens) };
}

/** Perkiraan lebar visual (satuan karakter) untuk memilih ukuran font label. */
export function visualLength(tokens: readonly Token[]): number {
  let len = 0;
  for (const k of tokens) {
    if (k.t === 'txt') len += k.v.length;
    else len += Math.max(String(k.n).length, String(k.d).length) + 0.6;
  }
  return len;
}

/** Angka desimal gaya Indonesia dari bilangan terskala: (75, 2) → "0,75". */
export function formatScaled(units: number, places: number): string {
  if (places <= 0) return String(units);
  const s = String(Math.abs(units)).padStart(places + 1, '0');
  const whole = s.slice(0, s.length - places);
  const part = s.slice(s.length - places);
  return `${units < 0 ? '−' : ''}${whole},${part}`;
}

/**
 * Teks nilai untuk ditampilkan setelah menjawab.
 * Bilangan bulat apa adanya, desimal berhingga persis (0,625), selain itu dibulatkan (≈ 0,667).
 */
export function formatValue(v: Rat): string {
  if (v.d === 1) return String(v.n);
  let rest = v.d;
  let twos = 0;
  let fives = 0;
  while (rest % 2 === 0) {
    rest /= 2;
    twos++;
  }
  while (rest % 5 === 0) {
    rest /= 5;
    fives++;
  }
  if (rest === 1) {
    const places = Math.max(twos, fives);
    return trimDecimal(formatScaled((v.n * 10 ** places) / v.d, places));
  }
  const approx = Math.round((v.n * 1000) / v.d);
  return `≈ ${formatScaled(approx, 3)}`;
}

function trimDecimal(s: string): string {
  return s.includes(',') ? s.replace(/0+$/, '').replace(/,$/, '') : s;
}

