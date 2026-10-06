import { MINUS, makeExpr, txt } from '../expression';
import { rat } from '../rational';
import { clamp, randInt } from '../random';
import type { QuestionTypeDef } from './def';

/** Pengurangan a − b, hasil selalu positif. */
export const subType: QuestionTypeDef = {
  id: 'sub',
  span: (cfg) => ({ min: 1, max: cfg.ranges.sub.max - cfg.ranges.sub.min }),
  build({ cfg, rng }, target) {
    const { min, max } = cfg.ranges.sub;
    const v = Math.round(clamp(target, 1, max - min));
    const b = randInt(rng, min, max - v);
    return makeExpr('sub', rat(v), [txt(`${b + v} ${MINUS} ${b}`)]);
  },
};
