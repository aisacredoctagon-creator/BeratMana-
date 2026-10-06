import { DIFFICULTY_CONFIG, SCORING } from '../config/difficulty';
import type { Difficulty } from '../config/difficulty';

/** Pengali combo untuk streak tertentu: ×1 (0–4), ×2 (5–9), ×3 (10–14), ×4 (15–19), ×5 (20+). */
export function comboMultiplier(streak: number): number {
  let mult = 1;
  for (const step of SCORING.comboSteps) {
    if (streak >= step.streak) mult = step.mult;
  }
  return Math.min(mult, SCORING.maxMult);
}

/** Poin satu jawaban benar = 10 × combo × pengali kesulitan, dibulatkan. `streak` sudah termasuk jawaban ini. */
export function pointsFor(streak: number, difficulty: Difficulty): number {
  return Math.round(SCORING.basePoints * comboMultiplier(streak) * DIFFICULTY_CONFIG[difficulty].scoreMultiplier);
}
