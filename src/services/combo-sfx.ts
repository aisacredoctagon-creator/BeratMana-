import { COMBO_SFX } from '../config/combo';

export interface ComboNote {
  freq: number;
  /** Detik sejak awal efek (sudah termasuk COMBO_SFX.delay). */
  start: number;
  dur: number;
  vol: number;
  type: 'triangle' | 'sine';
}

const semitone = (root: number, semis: number): number => root * 2 ** (semis / 12);

/**
 * Nada-nada arpeggio combo untuk satu tingkat (1–5). Murni (tanpa Web Audio) supaya bisa diuji:
 * makin tinggi tingkat → makin banyak nada, akar makin tinggi, dan (tingkat ≥ 4) ada denting kilau.
 */
export function comboNotes(level: number): ComboNote[] {
  const L = Math.max(1, Math.min(5, Math.round(level)));
  const c = COMBO_SFX;
  const root = semitone(c.baseFreq, c.rootSemitones[L - 1] as number);
  const count = L === 1 ? 3 : Math.min(c.intervals.length, L + 2);
  const vol = c.volume * (L === 1 ? c.warmupVolume : 1);
  const out: ComboNote[] = [];
  for (let i = 0; i < count; i++) {
    const freq = semitone(root, c.intervals[i] as number);
    const start = c.delay + i * c.noteGap;
    out.push({ freq, start, dur: c.noteDur, vol, type: 'triangle' });
    out.push({ freq: freq * 2, start, dur: c.noteDur, vol: vol * c.octaveLayer, type: 'sine' });
  }
  if (L >= c.shimmerFromLevel) {
    const top = semitone(root, c.intervals[count - 1] as number) * 2;
    const at = c.delay + count * c.noteGap;
    out.push({ freq: top, start: at, dur: c.noteDur, vol: vol * c.shimmerVolume, type: 'sine' });
    out.push({ freq: top * 1.5, start: at + c.noteGap, dur: c.noteDur * 1.4, vol: vol * c.shimmerVolume, type: 'sine' });
  }
  return out;
}
