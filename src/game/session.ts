import type { Difficulty, Mode } from '../config/difficulty';
import type { SubmitResult } from '../services/records';

/** Mengapa sesi berakhir. "gameover" = tuntas; "quit"/"restart" = keluar lebih awal lewat menu jeda. */
export type EndReason = 'gameover' | 'quit' | 'restart';

/** Kombinasi yang dikunci saat sesi dimulai; tidak berubah walau pemain mengubah pengaturan sesudahnya. */
export interface SessionCombo {
  readonly mode: Mode;
  readonly difficulty: Difficulty;
}

export interface SessionDeps {
  getBest(mode: Mode, difficulty: Difficulty): number | null;
  submitScore(mode: Mode, difficulty: Difficulty, score: number): SubmitResult;
  /** Skor sesi ini saat ini (terikat ke engine sesi ini). */
  getScore(): number;
}

export interface SessionResult {
  reason: EndReason;
  score: number;
  /** Rekor sesudah sesi (0 bila belum ada rekor). */
  best: number;
  /** true hanya bila skor sesi ini mengalahkan rekor SAAT SESI DIMULAI dan kini menjadi rekor. */
  isNewRecord: boolean;
}

/**
 * Satu sesi permainan dari sudut pandang rekor. Tanpa DOM, mudah diuji.
 * - Kombinasi (mode × kesulitan) di-snapshot di konstruktor.
 * - end(reason) IDEMPOTEN: skor hanya direkam sekali; panggilan berikutnya mengembalikan hasil pertama.
 * - checkpoint() merekam skor saat ini TANPA menutup sesi (dipakai saat tab disembunyikan / ditutup).
 *   Karena rekor hanya naik, checkpoint berulang dan end() sesudahnya tidak pernah menggandakan.
 */
export class GameSession {
  readonly combo: SessionCombo;
  private readonly startBest: number | null;
  private result: SessionResult | null = null;

  constructor(
    combo: SessionCombo,
    private readonly deps: SessionDeps,
  ) {
    this.combo = Object.freeze({ mode: combo.mode, difficulty: combo.difficulty });
    this.startBest = deps.getBest(this.combo.mode, this.combo.difficulty);
  }

  get ended(): boolean {
    return this.result !== null;
  }

  /** Best-effort dan sinkron; aman dipanggil kapan saja (tidak melempar). */
  checkpoint(): void {
    if (this.result) return;
    try {
      this.deps.submitScore(this.combo.mode, this.combo.difficulty, this.deps.getScore());
    } catch {
      /* penyimpanan bermasalah: jangan ganggu permainan */
    }
  }

  end(reason: EndReason): SessionResult {
    if (this.result) return this.result;
    const { mode, difficulty } = this.combo;
    const score = this.deps.getScore();
    let best: number | null = null;
    try {
      best = this.deps.submitScore(mode, difficulty, score).best ?? this.deps.getBest(mode, difficulty);
    } catch {
      best = null;
    }
    const isNewRecord = score >= 1 && score > (this.startBest ?? 0) && best === score;
    this.result = { reason, score, best: best ?? 0, isNewRecord };
    return this.result;
  }
}
