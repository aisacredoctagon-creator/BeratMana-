import type { DifficultyConfig } from '../../config/difficulty';
import type { Expr, ExprKind } from '../expression';
import type { Rng } from '../random';

export interface GenCtx {
  cfg: DifficultyConfig;
  rng: Rng;
}

/**
 * Kontrak sebuah tipe soal. Menambah tipe baru = membuat satu file yang mengekspor
 * QuestionTypeDef lalu mendaftarkannya di registry.ts (lihat README).
 */
export interface QuestionTypeDef {
  readonly id: ExprKind;
  /** Rentang nilai alami tipe ini pada kesulitan tertentu (null bila tidak tersedia). */
  span(cfg: DifficultyConfig): { min: number; max: number } | null;
  /**
   * Membangun ekspresi yang nilainya SEDEKAT MUNGKIN dengan `target`.
   * Target di luar jangkauan dijepit ke nilai terdekat yang bisa dibangun.
   */
  build(ctx: GenCtx, target: number): Expr;
}
