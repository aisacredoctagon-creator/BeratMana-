/**
 * Semua angka tuning permainan ada di file ini.
 * Mengubah nilai di DIFFICULTY_CONFIG tidak membutuhkan perubahan logika.
 */

export type Difficulty = 'easy' | 'medium' | 'hard';
export type Mode = 'time' | 'normal';
export type QType = 'add' | 'sub' | 'mul' | 'div' | 'fraction' | 'decimal';

export const DIFFICULTIES: readonly Difficulty[] = ['easy', 'medium', 'hard'];
export const MODES: readonly Mode[] = ['time', 'normal'];
export const QTYPES: readonly QType[] = ['add', 'sub', 'mul', 'div', 'fraction', 'decimal'];

export const QTYPE_INFO: Record<QType, { name: string; short: string }> = {
  add: { name: 'Penjumlahan', short: 'Tambah' },
  sub: { name: 'Pengurangan', short: 'Kurang' },
  mul: { name: 'Perkalian', short: 'Kali' },
  div: { name: 'Pembagian', short: 'Bagi' },
  fraction: { name: 'Pecahan', short: 'Pecahan' },
  decimal: { name: 'Desimal', short: 'Desimal' },
};

export const MODE_INFO: Record<Mode, { name: string; hint: string }> = {
  time: { name: 'Time Attack', hint: '60 detik' },
  normal: { name: 'Normal', hint: 'Pakai nyawa' },
};

export interface Range {
  min: number;
  max: number;
}

export type DecimalOp = 'plain' | 'add' | 'sub' | 'mulInt';

export interface DifficultyConfig {
  label: string;
  /** Selisih relatif minimum: |a-b| / max(a,b). */
  minDiffRatio: number;
  /** Selisih absolut minimum untuk dua sisi bernilai bilangan bulat. */
  minDiffAbs: number;
  /** Pengurangan waktu (detik) saat salah di Time Attack. */
  timePenalty: number;
  /** Jumlah nyawa di mode Normal. */
  lives: number;
  scoreMultiplier: number;
  /** Level intensitas maksimum (naik tiap LEVEL_EVERY jawaban benar). */
  levelMax: number;
  /** Batas ATAS selisih relatif: di level 0 → di levelMax. Makin kecil = makin tipis. */
  gap: { start: number; end: number };
  /** Porsi rentang nilai (skala log) yang dipakai di level 0; naik menjadi 1 di levelMax. */
  magnitudeStart: number;
  /** Peluang ekspresi bonus (kurung, kuadrat, akar) per sisi. Hanya berlaku di mode Mix. */
  bonusChance: number;
  ranges: {
    add: Range;
    sub: Range;
    mul: { a: Range; b: Range };
    div: { divisor: Range; result: Range };
    fraction: {
      denominators: readonly number[];
      /** Boleh pecahan tak wajar (pembilang > penyebut). */
      maxValue: number;
      /** Boleh ekspresi seperti 1/2 + 1/4. */
      sums: boolean;
    };
    decimal: {
      places: Range;
      min: number;
      max: number;
      ops: readonly DecimalOp[];
    };
  };
  bonus: {
    square: Range | null;
    cube: Range | null;
    root: Range | null;
    paren: { sum: Range; factor: Range } | null;
  };
}

/** Level intensitas naik tiap sekian jawaban benar. */
export const LEVEL_EVERY = 5;

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: {
    label: 'Easy',
    minDiffRatio: 0.2,
    minDiffAbs: 1,
    timePenalty: 2,
    lives: 5,
    scoreMultiplier: 1,
    levelMax: 6,
    gap: { start: 0.65, end: 0.3 },
    magnitudeStart: 0.5,
    bonusChance: 0,
    ranges: {
      add: { min: 1, max: 20 },
      sub: { min: 1, max: 20 },
      mul: { a: { min: 2, max: 10 }, b: { min: 2, max: 10 } },
      div: { divisor: { min: 2, max: 5 }, result: { min: 2, max: 10 } },
      fraction: { denominators: [2, 3, 4, 5, 10], maxValue: 1, sums: false },
      decimal: { places: { min: 1, max: 1 }, min: 0.1, max: 20, ops: ['plain'] },
    },
    bonus: { square: null, cube: null, root: null, paren: null },
  },
  medium: {
    label: 'Medium',
    minDiffRatio: 0.1,
    minDiffAbs: 1,
    timePenalty: 3,
    lives: 3,
    scoreMultiplier: 1.5,
    levelMax: 10,
    gap: { start: 0.5, end: 0.2 },
    magnitudeStart: 0.4,
    bonusChance: 0.1,
    ranges: {
      add: { min: 10, max: 100 },
      sub: { min: 10, max: 100 },
      mul: { a: { min: 10, max: 99 }, b: { min: 2, max: 9 } },
      div: { divisor: { min: 2, max: 12 }, result: { min: 2, max: 20 } },
      fraction: { denominators: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], maxValue: 2, sums: false },
      decimal: { places: { min: 2, max: 2 }, min: 0.5, max: 100, ops: ['plain', 'plain', 'add', 'sub'] },
    },
    bonus: {
      square: { min: 3, max: 12 },
      cube: null,
      root: { min: 4, max: 15 },
      paren: { sum: { min: 4, max: 20 }, factor: { min: 2, max: 9 } },
    },
  },
  hard: {
    label: 'Hard',
    minDiffRatio: 0.03,
    minDiffAbs: 1,
    timePenalty: 5,
    lives: 2,
    scoreMultiplier: 2,
    levelMax: 14,
    gap: { start: 0.35, end: 0.08 },
    magnitudeStart: 0.35,
    bonusChance: 0.15,
    ranges: {
      add: { min: 50, max: 999 },
      sub: { min: 50, max: 999 },
      mul: { a: { min: 10, max: 99 }, b: { min: 10, max: 99 } },
      div: { divisor: { min: 2, max: 20 }, result: { min: 6, max: 99 } },
      fraction: { denominators: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], maxValue: 3, sums: true },
      decimal: {
        places: { min: 2, max: 3 },
        min: 1,
        max: 999,
        ops: ['plain', 'add', 'sub', 'mulInt'],
      },
    },
    bonus: {
      square: { min: 5, max: 30 },
      cube: { min: 2, max: 9 },
      root: { min: 10, max: 40 },
      paren: { sum: { min: 10, max: 99 }, factor: { min: 2, max: 9 } },
    },
  },
};

/** Durasi Time Attack (detik) dan bonus streak. */
export const TIME_ATTACK = {
  startSeconds: 60,
  streakBonusEvery: 5,
  streakBonusSeconds: 2,
  /** Detik terakhir yang memunculkan bunyi tick. */
  tickFromSeconds: 10,
} as const;

/** Poin dasar per jawaban benar dan tangga combo. */
export const SCORING = {
  basePoints: 10,
  /** Streak minimum → pengali. Diurut naik. */
  comboSteps: [
    { streak: 0, mult: 1 },
    { streak: 5, mult: 2 },
    { streak: 10, mult: 3 },
    { streak: 15, mult: 4 },
    { streak: 20, mult: 5 },
  ],
  maxMult: 5,
} as const;
