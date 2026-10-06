import { makeExpr, txt } from '../expression';
import { rat } from '../rational';
import { clamp, randInt } from '../random';
import type { QuestionTypeDef } from './def';

/** Penjumlahan a + b dengan a, b dalam rentang operand kesulitan. */
export const addType: QuestionTypeDef = {
  id: 'add',
  span: (cfg) => ({ min: cfg.ranges.add.min * 2, max: cfg.ranges.add.max * 2 }),
  build({ cfg, rng }, target) {
    const { min, max } = cfg.ranges.add;
    const v = Math.round(clamp(target, min * 2, max * 2));
    const a = randInt(rng, Math.max(min, v - max), Math.min(max, v - min));
    return makeExpr('add', rat(v), [txt(`${a} + ${v - a}`)]);
  },
};
