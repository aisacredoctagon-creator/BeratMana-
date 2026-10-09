import { COMBO_NOTICE } from '../config/combo';
import { SCORING } from '../config/difficulty';

/**
 * 'warmup' = pemanasan (streak 3), 'rise' = pengali naik (streak 5, 10, 15, 20),
 * 'max' = pengali sudah maksimum, pengingat tiap kelipatan (streak 25, 30, …).
 */
export type ComboNoticeKind = 'warmup' | 'rise' | 'max';

export interface ComboNotice {
  kind: ComboNoticeKind;
  /** Tingkat visual/bunyi 1–5 (1 = pemanasan, 2–5 = pengali). */
  level: 1 | 2 | 3 | 4 | 5;
  mult: number;
  streak: number;
}

/**
 * Kapan notifikasi combo muncul. Fungsi murni (tanpa DOM, tanpa mengubah engine).
 * `streak` = streak SESUDAH jawaban ini. Jawaban salah tidak pernah memunculkan notifikasi
 * (combo yang putus sunyi).
 */
export function comboNoticeFor(correct: boolean, streak: number): ComboNotice | null {
  if (!correct || !Number.isInteger(streak) || streak < 1) return null;

  const step = SCORING.comboSteps.find((s) => s.streak === streak && s.mult > 1);
  if (step) {
    const mult = Math.min(step.mult, SCORING.maxMult);
    return { kind: 'rise', level: clampLevel(mult), mult, streak };
  }
  if (streak === COMBO_NOTICE.warmupStreak) return { kind: 'warmup', level: 1, mult: 1, streak };

  const last = SCORING.comboSteps[SCORING.comboSteps.length - 1];
  if (last && streak > last.streak && (streak - last.streak) % COMBO_NOTICE.repeatEvery === 0) {
    return { kind: 'max', level: 5, mult: SCORING.maxMult, streak };
  }
  return null;
}

const clampLevel = (n: number): 1 | 2 | 3 | 4 | 5 => Math.max(1, Math.min(5, Math.round(n))) as 1 | 2 | 3 | 4 | 5;

/** Teks notifikasi (dipakai tampilan dan pengumuman pembaca layar). */
export function comboNoticeText(n: ComboNotice): string {
  const x = String(n.mult);
  if (n.kind === 'warmup') return `COMBO ${n.streak}`;
  if (n.kind === 'rise') return `COMBO ×${x}!`;
  return `MAKS ×${x} · ${n.streak}`;
}
