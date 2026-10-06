import { describe, expect, it } from 'vitest';
import { LEVEL_EVERY } from '../config/difficulty';
import type { Side } from '../generator';
import { seeded } from '../generator/random';
import { GameEngine } from './engine';
import { comboMultiplier, pointsFor } from './scoring';
import type { GameSettings } from './settings';

const make = (patch: Partial<GameSettings> = {}, seed = 1): GameEngine =>
  new GameEngine({ mode: 'time', difficulty: 'medium', types: ['add', 'mul'], ...patch }, seeded(seed));

const right = (e: GameEngine) => {
  const q = e.nextQuestion();
  return e.answer(q.heavier);
};
const wrongAnswer = (e: GameEngine) => {
  const q = e.nextQuestion();
  const other: Side = q.heavier === 'left' ? 'right' : 'left';
  return e.answer(other);
};

describe('skor & combo', () => {
  it('pengali combo: ×1, ×2 di streak 5, ×3 di streak 10, maks ×5', () => {
    expect([0, 1, 4].map(comboMultiplier)).toEqual([1, 1, 1]);
    expect([5, 9].map(comboMultiplier)).toEqual([2, 2]);
    expect([10, 14].map(comboMultiplier)).toEqual([3, 3]);
    expect(comboMultiplier(20)).toBe(5);
    expect(comboMultiplier(500)).toBe(5);
  });

  it('poin = 10 × combo × pengali kesulitan, dibulatkan', () => {
    expect(pointsFor(1, 'easy')).toBe(10);
    expect(pointsFor(1, 'medium')).toBe(15);
    expect(pointsFor(1, 'hard')).toBe(20);
    expect(pointsFor(5, 'medium')).toBe(30);
    expect(pointsFor(10, 'hard')).toBe(60);
    expect(pointsFor(25, 'hard')).toBe(100);
  });

  it('skor bertambah, salah mereset combo', () => {
    const e = make({ difficulty: 'easy' });
    for (let i = 0; i < 4; i++) right(e);
    expect(e.score).toBe(40);
    expect(e.streak).toBe(4);
    const r5 = right(e);
    expect(r5?.multiplier).toBe(2);
    expect(r5?.points).toBe(20);
    expect(e.score).toBe(60);
    const w = wrongAnswer(e);
    expect(w?.correct).toBe(false);
    expect(w?.points).toBe(0);
    expect(e.streak).toBe(0);
    expect(e.maxStreak).toBe(5);
  });

  it('akurasi dan ringkasan', () => {
    const e = make({ mode: 'normal', difficulty: 'easy' });
    right(e);
    right(e);
    right(e);
    wrongAnswer(e);
    e.end('quit');
    const s = e.summary();
    expect(s).toMatchObject({ correct: 3, wrong: 1, accuracy: 75, maxStreak: 3, reason: 'quit' });
  });
});

describe('Time Attack', () => {
  it('salah mengurangi waktu sesuai kesulitan', () => {
    for (const [difficulty, penalty] of [
      ['easy', 2],
      ['medium', 3],
      ['hard', 5],
    ] as const) {
      const e = make({ difficulty });
      const r = wrongAnswer(e);
      expect(r?.timeDelta).toBe(-penalty);
      expect(e.timeLeft).toBe(60 - penalty);
    }
  });

  it('streak 5 memberi +2 detik', () => {
    const e = make();
    for (let i = 0; i < 4; i++) expect(right(e)?.streakBonus).toBe(false);
    const r = right(e);
    expect(r?.streakBonus).toBe(true);
    expect(r?.timeDelta).toBe(2);
    expect(e.timeLeft).toBe(62);
  });

  it('timer hanya berjalan saat menunggu jawaban dan tidak saat dijeda', () => {
    const e = make();
    expect(e.tick(1)).toBe(false); // belum ada soal
    expect(e.timeLeft).toBe(60);
    e.nextQuestion();
    e.tick(10);
    expect(e.timeLeft).toBe(50);
    e.paused = true;
    e.tick(10);
    expect(e.timeLeft).toBe(50);
    expect(e.answer('left')).toBeNull();
    e.paused = false;
    e.answer(e.question?.heavier ?? 'left');
    e.tick(10); // sedang animasi hasil, tidak menunggu jawaban
    expect(e.timeLeft).toBe(50);
  });

  it('waktu habis = game over', () => {
    const e = make();
    e.nextQuestion();
    expect(e.tick(59.9)).toBe(false);
    expect(e.tick(0.2)).toBe(true);
    expect(e.over).toBe(true);
    expect(e.reason).toBe('time');
  });

  it('penalti yang menghabiskan waktu = game over', () => {
    const e = make({ difficulty: 'hard' });
    e.nextQuestion();
    e.tick(57);
    e.answer(e.question?.heavier === 'left' ? 'right' : 'left');
    expect(e.timeLeft).toBe(0);
    expect(e.over).toBe(true);
    expect(e.reason).toBe('time');
  });

  it('tidak ada timer di mode Normal', () => {
    const e = make({ mode: 'normal' });
    e.nextQuestion();
    expect(e.tick(1000)).toBe(false);
    expect(e.over).toBe(false);
  });
});

describe('mode Normal', () => {
  it('nyawa sesuai kesulitan dan game over saat habis', () => {
    for (const [difficulty, lives] of [
      ['easy', 5],
      ['medium', 3],
      ['hard', 2],
    ] as const) {
      const e = make({ mode: 'normal', difficulty });
      expect(e.lives).toBe(lives);
      for (let i = 0; i < lives - 1; i++) {
        expect(wrongAnswer(e)?.gameOver).toBe(false);
      }
      const last = wrongAnswer(e);
      expect(last?.gameOver).toBe(true);
      expect(last?.reason).toBe('lives');
      expect(e.lives).toBe(0);
    }
  });

  it('benar tidak mengurangi nyawa dan tidak ada perubahan waktu', () => {
    const e = make({ mode: 'normal' });
    const r = right(e);
    expect(r?.timeDelta).toBe(0);
    expect(e.lives).toBe(3);
  });
});

describe('level intensitas', () => {
  it(`naik tiap ${LEVEL_EVERY} jawaban benar dan tidak melewati batas`, () => {
    const e = make({ mode: 'normal', difficulty: 'easy' });
    expect(e.level).toBe(0);
    for (let i = 0; i < LEVEL_EVERY; i++) right(e);
    expect(e.level).toBe(1);
    for (let i = 0; i < 200; i++) right(e);
    expect(e.level).toBe(6); // levelMax Easy
  });

  it('tidak menerima jawaban ganda untuk satu soal', () => {
    const e = make();
    const q = e.nextQuestion();
    expect(e.answer(q.heavier)).not.toBeNull();
    expect(e.answer(q.heavier)).toBeNull();
    expect(e.correct).toBe(1);
  });
});
