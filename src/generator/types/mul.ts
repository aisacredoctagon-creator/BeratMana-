import type { DifficultyConfig } from '../../config/difficulty';
import { TIMES, makeExpr, txt } from '../expression';
import { rat } from '../rational';
import { nearestIndex, pick } from '../random';
import type { QuestionTypeDef } from './def';

interface Table {
  keys: number[];
  pairs: Map<number, [number, number][]>;
}

// Tabel semua hasil kali yang mungkin, dihitung sekali per konfigurasi.
const cache = new WeakMap<DifficultyConfig, Table>();

function tableFor(cfg: DifficultyConfig): Table {
  let t = cache.get(cfg);
  if (!t) {
    const { a, b } = cfg.ranges.mul;
    const pairs = new Map<number, [number, number][]>();
    for (let x = a.min; x <= a.max; x++) {
      for (let y = b.min; y <= b.max; y++) {
        const list = pairs.get(x * y) ?? [];
        list.push([x, y]);
        pairs.set(x * y, list);
      }
    }
    t = { keys: [...pairs.keys()].sort((p, q) => p - q), pairs };
    cache.set(cfg, t);
  }
  return t;
}

/** Perkalian. Easy: tabel 1–10, Medium: 2 digit × 1 digit, Hard: 2 digit × 2 digit. */
export const mulType: QuestionTypeDef = {
  id: 'mul',
  span(cfg) {
    const { a, b } = cfg.ranges.mul;
    return { min: a.min * b.min, max: a.max * b.max };
  },
  build({ cfg, rng }, target) {
    const { keys, pairs } = tableFor(cfg);
    const i = nearestIndex(keys, target, (k) => k);
    // variasi kecil di sekitar hasil terdekat
    const j = Math.min(keys.length - 1, Math.max(0, i + Math.floor(rng() * 3) - 1));
    const key = keys[j] ?? (keys[i] as number);
    const [x, y] = pick(rng, pairs.get(key) ?? []);
    const [p, q] = rng() < 0.5 ? [x, y] : [y, x];
    return makeExpr('mul', rat(key), [txt(`${p} ${TIMES} ${q}`)]);
  },
};
