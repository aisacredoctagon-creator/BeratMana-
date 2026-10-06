import type { DifficultyConfig } from '../../config/difficulty';
import { TIMES, makeExpr, sqrtTok, txt } from '../expression';
import type { Expr } from '../expression';
import { rat } from '../rational';
import { nearestIndex, pick, randInt } from '../random';
import type { GenCtx, QuestionTypeDef } from './def';

interface Entry {
  value: number;
  make: (ctx: GenCtx) => Expr;
}

const cache = new WeakMap<DifficultyConfig, Entry[]>();

function listFor(cfg: DifficultyConfig): Entry[] {
  let list = cache.get(cfg);
  if (list) return list;
  const out: Entry[] = [];
  const { square, cube, root, paren } = cfg.bonus;
  if (square) {
    for (let n = square.min; n <= square.max; n++) {
      out.push({ value: n * n, make: () => makeExpr('bonus', rat(n * n), [txt(`${n}²`)]) });
    }
  }
  if (cube) {
    for (let n = cube.min; n <= cube.max; n++) {
      out.push({ value: n ** 3, make: () => makeExpr('bonus', rat(n ** 3), [txt(`${n}³`)]) });
    }
  }
  if (root) {
    for (let m = root.min; m <= root.max; m++) {
      out.push({ value: m, make: () => makeExpr('bonus', rat(m), [sqrtTok(String(m * m))]) });
    }
  }
  if (paren) {
    for (let s = paren.sum.min; s <= paren.sum.max; s++) {
      for (let c = paren.factor.min; c <= paren.factor.max; c++) {
        out.push({
          value: s * c,
          make: ({ rng }) => {
            const a = randInt(rng, 1, s - 1);
            return makeExpr('bonus', rat(s * c), [txt(`(${a} + ${s - a}) ${TIMES} ${c}`)]);
          },
        });
      }
    }
  }
  list = out.sort((p, q) => p.value - q.value);
  cache.set(cfg, list);
  return list;
}

/** Ekspresi bonus (kurung, kuadrat, pangkat tiga, akar). Hanya dipakai saat mode Mix, di Medium dan Hard. */
export const bonusType: QuestionTypeDef = {
  id: 'bonus',
  span(cfg) {
    const list = listFor(cfg);
    const first = list[0];
    const last = list[list.length - 1];
    return first && last ? { min: first.value, max: last.value } : null;
  },
  build(ctx, target) {
    const list = listFor(ctx.cfg);
    const i = nearestIndex(list, target, (e) => e.value);
    const nearest = list[i] as Entry;
    const slack = Math.abs(nearest.value - target) * 1.5 + 1;
    const near = list
      .slice(Math.max(0, i - 6), Math.min(list.length, i + 7))
      .filter((e) => Math.abs(e.value - target) <= slack);
    // utamakan nilai terdekat, tetapi variasikan bentuknya (kurung / kuadrat / akar)
    return pick(ctx.rng, near.length > 0 ? near : [nearest]).make(ctx);
  },
};
