import { describe, expect, it } from 'vitest';
import { COMBO_NOTICE } from '../config/combo';
import { SCORING } from '../config/difficulty';
import type { Side } from '../generator';
import { seeded } from '../generator/random';
import { comboNoticeFor, comboNoticeText } from './combo-notice';
import { GameEngine } from './engine';
import { comboMultiplier } from './scoring';

describe('notifikasi combo: kapan muncul', () => {
  it('muncul tepat di streak 3 (pemanasan), 5, 10, 15, 20, lalu tiap +5 (25, 30, …)', () => {
    const hits: number[] = [];
    for (let s = 1; s <= 60; s++) if (comboNoticeFor(true, s)) hits.push(s);
    expect(hits).toEqual([3, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60]);
  });

  it('jenis dan tingkat: pemanasan = 1, pengali naik = tingkat pengali, setelah maksimum = 5', () => {
    expect(comboNoticeFor(true, 3)).toMatchObject({ kind: 'warmup', level: 1, mult: 1 });
    expect(comboNoticeFor(true, 5)).toMatchObject({ kind: 'rise', level: 2, mult: 2 });
    expect(comboNoticeFor(true, 10)).toMatchObject({ kind: 'rise', level: 3, mult: 3 });
    expect(comboNoticeFor(true, 15)).toMatchObject({ kind: 'rise', level: 4, mult: 4 });
    expect(comboNoticeFor(true, 20)).toMatchObject({ kind: 'rise', level: 5, mult: 5 });
    expect(comboNoticeFor(true, 25)).toMatchObject({ kind: 'max', level: 5, mult: 5 });
  });

  it('tingkat notifikasi pengali naik selalu sama dengan pengali combo engine', () => {
    for (let s = 1; s <= 200; s++) {
      const n = comboNoticeFor(true, s);
      if (n?.kind === 'rise') expect(n.mult).toBe(comboMultiplier(s));
      if (n?.kind === 'max') expect(n.mult).toBe(SCORING.maxMult);
    }
  });

  it('jawaban salah tidak pernah memunculkan notifikasi (combo putus sunyi)', () => {
    for (let s = 0; s <= 60; s++) expect(comboNoticeFor(false, s)).toBeNull();
  });

  it('streak 0, negatif, atau bukan bilangan bulat → tidak ada notifikasi', () => {
    for (const s of [0, -1, 2.5, Number.NaN, 4, 6, 24, 26]) expect(comboNoticeFor(true, s)).toBeNull();
  });

  it('teks notifikasi', () => {
    expect(comboNoticeText(comboNoticeFor(true, 3)!)).toBe('COMBO 3');
    expect(comboNoticeText(comboNoticeFor(true, 5)!)).toBe('COMBO ×2!');
    expect(comboNoticeText(comboNoticeFor(true, 20)!)).toBe('COMBO ×5!');
    expect(comboNoticeText(comboNoticeFor(true, 30)!)).toBe('MAKS ×5 · 30');
  });

  it('konfigurasi: pemanasan sebelum pengali pertama, particles terbatas untuk 5 tingkat', () => {
    expect(COMBO_NOTICE.warmupStreak).toBeLessThan(SCORING.comboSteps[1]!.streak);
    expect(COMBO_NOTICE.particles).toHaveLength(5);
    expect(Math.max(...COMBO_NOTICE.particles)).toBeLessThanOrEqual(16);
    expect([...COMBO_NOTICE.particles]).toEqual([...COMBO_NOTICE.particles].sort((a, b) => a - b));
  });
});

describe('notifikasi combo: hanya presentasi (tidak memengaruhi engine)', () => {
  const play = (withNotice: boolean, seed: number) => {
    const rng = seeded(seed);
    const e = new GameEngine({ mode: 'time', difficulty: 'medium', types: ['add', 'mul'] }, seeded(seed));
    const log: { streak: number; score: number; timeLeft: number; notice: boolean }[] = [];
    const noticeStreaks: number[] = [];
    const expectedStreaks: number[] = [];
    for (let i = 0; i < 400 && !e.over; i++) {
      const q = e.nextQuestion();
      const wrong = rng() < 0.12;
      const side: Side = wrong ? (q.heavier === 'left' ? 'right' : 'left') : q.heavier;
      const res = e.answer(side);
      if (!res) continue;
      const n = withNotice ? comboNoticeFor(res.correct, res.streak) : null;
      if (n) noticeStreaks.push(res.streak);
      // aturan ditulis ulang secara independen: pemanasan di 3, lalu tiap kelipatan 5 (naik pengali atau pengingat maks)
      if (res.correct && (res.streak === 3 || (res.streak >= 5 && res.streak % 5 === 0))) expectedStreaks.push(res.streak);
      // notifikasi hanya pada jawaban benar dan tidak pernah di streak yang baru putus
      if (!res.correct) expect(n).toBeNull();
      log.push({ streak: e.streak, score: e.score, timeLeft: e.timeLeft, notice: !!n });
    }
    return { log: log.map(({ streak, score, timeLeft }) => ({ streak, score, timeLeft })), noticeStreaks, expectedStreaks };
  };

  it('skor, streak, dan timer identik dengan atau tanpa memanggil comboNoticeFor', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      expect(play(true, seed).log).toEqual(play(false, seed).log);
    }
  });

  it('di sesi acak (benar/salah campur), notifikasi muncul tepat di streak yang diharapkan, tak lebih tak kurang', () => {
    let total = 0;
    for (const seed of [11, 12, 13, 14, 15, 16, 17, 18, 19, 20]) {
      const { noticeStreaks, expectedStreaks } = play(true, seed);
      expect(noticeStreaks).toEqual(expectedStreaks);
      total += noticeStreaks.length;
    }
    expect(total).toBeGreaterThan(10); // sesi acak benar-benar memicu notifikasi
  });
});
