import { MINUS, TIMES, formatScaled, makeExpr, txt } from '../expression';
import { rat } from '../rational';
import { clamp, pick, randInt } from '../random';
import type { QuestionTypeDef } from './def';

/** Hindari angka berakhiran 0 (mis. 2,50) supaya tampilan wajar dan tidak bernilai bulat. */
const nonZeroTail = (units: number): number => (units % 10 === 0 ? units + 1 : units);

/**
 * Desimal, dihitung dalam bilangan bulat terskala (satuan 10^-places), jadi tidak ada float.
 * Bentuk: angka polos, a + b, a − b, atau a × bilangan bulat (sesuai `ops` kesulitan).
 */
export const decimalType: QuestionTypeDef = {
  id: 'decimal',
  span: (cfg) => ({ min: cfg.ranges.decimal.min, max: cfg.ranges.decimal.max }),
  build({ cfg, rng }, target) {
    const dc = cfg.ranges.decimal;
    const places = randInt(rng, dc.places.min, dc.places.max);
    const scale = 10 ** places;
    const unitsMin = Math.ceil(dc.min * scale);
    const total = nonZeroTail(Math.round(clamp(target, dc.min, dc.max) * scale));
    const fmt = (u: number): string => formatScaled(u, places);
    const value = (u: number) => rat(u, scale);

    const op = pick(rng, dc.ops);
    // operand terkecil = 0,1 (atau satu satuan terkecil bila hanya 1 desimal)
    const opMin = Math.max(1, scale / 10);

    if (op === 'add' && total >= opMin * 4) {
      for (let tries = 0; tries < 12; tries++) {
        const a = randInt(rng, opMin * 2, total - opMin * 2);
        const b = total - a;
        if (a % 10 !== 0 && b % 10 !== 0) {
          return makeExpr('decimal', value(total), [txt(`${fmt(a)} + ${fmt(b)}`)]);
        }
      }
    } else if (op === 'sub') {
      for (let tries = 0; tries < 12; tries++) {
        const b = randInt(rng, opMin * 2, Math.max(opMin * 2, Math.floor(total / 2)));
        const a = total + b;
        if (b % 10 !== 0 && a % 10 !== 0) {
          return makeExpr('decimal', value(total), [txt(`${fmt(a)} ${MINUS} ${fmt(b)}`)]);
        }
      }
    } else if (op === 'mulInt') {
      const m = randInt(rng, 2, 9);
      const base = nonZeroTail(Math.max(unitsMin, Math.round(total / m)));
      return makeExpr('decimal', value(base * m), [txt(`${fmt(base)} ${TIMES} ${m}`)]);
    }
    return makeExpr('decimal', value(total), [txt(fmt(total))]);
  },
};
