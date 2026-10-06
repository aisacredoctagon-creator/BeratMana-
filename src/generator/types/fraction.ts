import type { DifficultyConfig } from '../../config/difficulty';
import { MINUS, frac, makeExpr, txt } from '../expression';
import type { Token } from '../expression';
import { add, cmp, gcd, rat, sub, toNumber } from '../rational';
import type { Rat } from '../rational';
import { nearestIndex, pick } from '../random';
import type { QuestionTypeDef } from './def';

interface Entry {
  value: Rat;
  num: number;
  tokens: Token[];
}

const cache = new WeakMap<DifficultyConfig, Entry[]>();

/** Daftar semua pecahan (dan jumlah/selisih pecahan di Hard) yang valid, terurut menurut nilai. */
function listFor(cfg: DifficultyConfig): Entry[] {
  let list = cache.get(cfg);
  if (list) return list;
  const { denominators, maxValue, sums } = cfg.ranges.fraction;
  const singles: { value: Rat; n: number; d: number }[] = [];
  for (const d of denominators) {
    for (let n = 1; n / d <= maxValue + 1e-9; n++) {
      if (gcd(n, d) !== 1) continue; // hanya pecahan tereduksi, tampil rapi
      singles.push({ value: rat(n, d), n, d });
    }
  }
  const out: Entry[] = singles.map((s) => ({
    value: s.value,
    num: toNumber(s.value),
    tokens: [frac(s.n, s.d)],
  }));
  if (sums) {
    // ekspresi sederhana: pecahan wajar dengan penyebut berbeda, mis. 1/2 + 1/4
    const proper = singles.filter((s) => s.n < s.d);
    for (const x of proper) {
      for (const y of proper) {
        if (x.d === y.d) continue;
        const s = add(x.value, y.value);
        if (toNumber(s) <= maxValue + 1e-9) {
          out.push({ value: s, num: toNumber(s), tokens: [frac(x.n, x.d), txt(' + '), frac(y.n, y.d)] });
        }
        const diff = sub(x.value, y.value);
        if (cmp(diff, rat(0)) > 0) {
          out.push({
            value: diff,
            num: toNumber(diff),
            tokens: [frac(x.n, x.d), txt(` ${MINUS} `), frac(y.n, y.d)],
          });
        }
      }
    }
  }
  list = out.sort((p, q) => p.num - q.num);
  cache.set(cfg, list);
  return list;
}

/**
 * Pecahan. Perbandingan memakai Rat eksak (bukan float).
 * Easy: penyebut 2,3,4,5,10 dan nilai < 1. Medium: penyebut sampai 12. Hard: boleh jumlah/selisih.
 */
export const fractionType: QuestionTypeDef = {
  id: 'fraction',
  span(cfg) {
    const list = listFor(cfg);
    const first = list[0];
    const last = list[list.length - 1];
    return first && last ? { min: first.num, max: last.num } : null;
  },
  build({ cfg, rng }, target) {
    const list = listFor(cfg);
    const i = nearestIndex(list, target, (e) => e.num);
    // pilih acak di antara beberapa tetangga terdekat agar bervariasi
    const lo = Math.max(0, i - 2);
    const hi = Math.min(list.length - 1, i + 2);
    const e = pick(rng, list.slice(lo, hi + 1));
    return makeExpr('fraction', e.value, e.tokens);
  },
};
