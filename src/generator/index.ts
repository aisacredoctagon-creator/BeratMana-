import { DIFFICULTY_CONFIG, QTYPES } from '../config/difficulty';
import type { Difficulty, DifficultyConfig, QType } from '../config/difficulty';
import { cmp, isInt, sub, abs, toNumber } from './rational';
import type { Expr } from './expression';
import { clamp, lerp } from './random';
import type { Rng } from './random';
import { TYPE_DEFS } from './types/registry';
import type { GenCtx, QuestionTypeDef } from './types/def';

export type Side = 'left' | 'right';

export interface Question {
  left: Expr;
  right: Expr;
  /** Sisi dengan nilai lebih besar (jawaban benar). */
  heavier: Side;
  level: number;
}

/** Riwayat posisi jawaban, untuk membatasi sisi yang sama beruntun. */
export interface Pace {
  lastHeavier: Side | null;
  run: number;
}

export const INITIAL_PACE: Pace = { lastHeavier: null, run: 0 };
/** Maksimum jawaban benar berturut-turut di sisi yang sama. */
export const MAX_SAME_SIDE_RUN = 3;

export function nextPace(pace: Pace, heavier: Side): Pace {
  return pace.lastHeavier === heavier ? { lastHeavier: heavier, run: pace.run + 1 } : { lastHeavier: heavier, run: 1 };
}

export interface GenerateInput {
  /** Tipe yang dicentang. Semua tipe tercentang = mode Mix. */
  types: readonly QType[];
  difficulty: Difficulty;
  /** Level intensitas (0 = awal). Dijepit ke levelMax kesulitan. */
  level: number;
  rng?: Rng;
  previous?: Question | null;
  pace?: Pace;
}

const MAX_ATTEMPTS = 120;
/** Toleransi batas atas selisih: nilai diskret (mis. tabel kali Easy) tidak selalu bisa pas. */
const GAP_SLACK = 1.35;
/** Rentang dua tipe dianggap tumpang tindih bila rasio batas atas/bawah irisan ≥ ini. */
const MIN_OVERLAP_RATIO = 1.6;

export const isMixTypes = (types: readonly QType[]): boolean => QTYPES.every((t) => types.includes(t));

/**
 * Syarat selisih dua nilai: tidak pernah sama; selisih relatif ≥ minDiffRatio;
 * dan bila keduanya bilangan bulat, selisih absolut ≥ minDiffAbs.
 * (Untuk pecahan/desimal, selisih absolut ≥ 1 mustahil dipenuhi, jadi hanya syarat relatif yang berlaku.)
 */
export function meetsMinDifference(a: Expr, b: Expr, cfg: DifficultyConfig): boolean {
  if (cmp(a.value, b.value) === 0) return false;
  const diff = abs(sub(a.value, b.value));
  if (isInt(a.value) && isInt(b.value) && toNumber(diff) < cfg.minDiffAbs) return false;
  const big = Math.max(toNumber(a.value), toNumber(b.value));
  return toNumber(diff) / big >= cfg.minDiffRatio - 1e-12;
}

export function relativeGap(a: Expr, b: Expr): number {
  const big = Math.max(toNumber(a.value), toNumber(b.value));
  return toNumber(abs(sub(a.value, b.value))) / big;
}

const questionKey = (q: { left: Expr; right: Expr }): string =>
  [q.left.label, q.right.label].sort().join('|');

function pickDef(types: readonly QType[], rng: Rng): QuestionTypeDef {
  const t = types[Math.floor(rng() * types.length)] as QType;
  return TYPE_DEFS[t];
}

type Span = { min: number; max: number };

function commonRange(a: Span, b: Span): Span {
  const lo = Math.max(a.min, b.min);
  const hi = Math.min(a.max, b.max);
  if (hi > lo && hi / lo >= MIN_OVERLAP_RATIO) return { min: lo, max: hi };
  // tidak tumpang tindih: pakai rentang tipe yang lebih sempit supaya tipe itu tidak "terpaksa"
  return a.max <= b.max ? a : b;
}

function overlaps(a: Span, b: Span): boolean {
  const lo = Math.max(a.min, b.min);
  const hi = Math.min(a.max, b.max);
  return hi > lo && hi / lo >= MIN_OVERLAP_RATIO;
}

/**
 * Menghasilkan satu soal: dua ekspresi, nilainya tidak pernah sama, selisih mengikuti kesulitan.
 *
 * Alur: pilih tipe per sisi → pilih nilai target T di rentang bersama (makin besar seiring level) →
 * bangun ekspresi A ≈ T → bangun ekspresi B ≈ T·(1±gap) dengan gap makin tipis seiring level →
 * validasi eksak dengan aritmetika rasional → tempatkan sisi berat acak (maks 3x beruntun).
 */
export function generateQuestion(input: GenerateInput): Question {
  const { difficulty, previous = null, pace = INITIAL_PACE } = input;
  const rng = input.rng ?? Math.random;
  const types = input.types.length > 0 ? input.types : (['add'] as readonly QType[]);
  const cfg = DIFFICULTY_CONFIG[difficulty];
  const ctx: GenCtx = { cfg, rng };

  const level = clamp(Math.floor(input.level), 0, cfg.levelMax);
  const progress = cfg.levelMax > 0 ? level / cfg.levelMax : 1;
  const maxGap = Math.max(lerp(cfg.gap.start, cfg.gap.end, progress), cfg.minDiffRatio * 1.5);
  const magnitude = lerp(cfg.magnitudeStart, 1, progress);
  const prevKey = previous ? questionKey(previous) : null;

  let best: { a: Expr; b: Expr; gap: number } | null = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const defA = pickDef(types, rng);
    let defB = pickDef(types, rng);
    const spanA = defA.span(cfg);
    if (!spanA) continue;
    let spanB = defB.span(cfg);
    for (let r = 0; r < 3 && spanB && !overlaps(spanA, spanB); r++) {
      defB = pickDef(types, rng);
      spanB = defB.span(cfg);
    }
    if (!spanB) continue;

    const range = commonRange(spanA, spanB);
    const hiEff = range.min * Math.pow(range.max / range.min, magnitude);
    const target = range.min * Math.pow(hiEff / range.min, rng());

    const a = defA.build(ctx, target);
    const gapWanted = lerp(cfg.minDiffRatio * 1.1, maxGap, rng());
    const aNum = toNumber(a.value);
    const targetB = rng() < 0.5 ? aNum * (1 + gapWanted) : aNum / (1 + gapWanted);
    const b = defB.build(ctx, targetB);

    if (!meetsMinDifference(a, b, cfg)) continue;
    if (a.label === b.label) continue;
    const key = questionKey({ left: a, right: b });
    if (key === prevKey) continue;

    const gap = relativeGap(a, b);
    if (gap <= maxGap * GAP_SLACK) return place(a, b, level, pace, rng);
    // simpan kandidat valid dengan selisih paling tipis sebagai cadangan
    if (!best || gap < best.gap) best = { a, b, gap };
  }

  if (best) return place(best.a, best.b, level, pace, rng);
  return fallbackQuestion(types, cfg, level, pace, ctx);
}

/** Cadangan terakhir: tipe pertama yang dipilih, dua target berjauhan. Praktis tidak pernah terpakai. */
function fallbackQuestion(
  types: readonly QType[],
  cfg: DifficultyConfig,
  level: number,
  pace: Pace,
  ctx: GenCtx,
): Question {
  const def = TYPE_DEFS[types[0] as QType];
  const span = def.span(cfg);
  if (!span) throw new Error('Tipe soal tidak punya rentang nilai');
  for (let i = 0; i < 500; i++) {
    const t = lerp(span.min, span.max, ctx.rng());
    const a = def.build(ctx, t);
    const b = def.build(ctx, t * (1.6 + ctx.rng()));
    if (meetsMinDifference(a, b, cfg) && a.label !== b.label) return place(a, b, level, pace, ctx.rng);
  }
  throw new Error('Gagal membuat soal yang memenuhi syarat selisih');
}

/** Menaruh ekspresi yang lebih berat di sisi acak, maksimal MAX_SAME_SIDE_RUN kali beruntun. */
function place(a: Expr, b: Expr, level: number, pace: Pace, rng: Rng): Question {
  const [light, heavy] = cmp(a.value, b.value) < 0 ? [a, b] : [b, a];
  let heavier: Side = rng() < 0.5 ? 'left' : 'right';
  if (pace.lastHeavier === heavier && pace.run >= MAX_SAME_SIDE_RUN) {
    heavier = heavier === 'left' ? 'right' : 'left';
  }
  return heavier === 'left'
    ? { left: heavy, right: light, heavier, level }
    : { left: light, right: heavy, heavier, level };
}
