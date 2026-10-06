import { DIVIDE, makeExpr, txt } from '../expression';
import { rat } from '../rational';
import { clamp, randInt } from '../random';
import type { QuestionTypeDef } from './def';

/** Pembagian. Soal dibangun dari hasil × pembagi, sehingga hasil selalu bilangan bulat. */
export const divType: QuestionTypeDef = {
  id: 'div',
  span: (cfg) => ({ min: cfg.ranges.div.result.min, max: cfg.ranges.div.result.max }),
  build({ cfg, rng }, target) {
    const { divisor, result } = cfg.ranges.div;
    const r = Math.round(clamp(target, result.min, result.max));
    const d = randInt(rng, divisor.min, divisor.max);
    return makeExpr('div', rat(r), [txt(`${r * d} ${DIVIDE} ${d}`)]);
  },
};
