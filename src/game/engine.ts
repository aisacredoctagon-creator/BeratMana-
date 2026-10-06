import { DIFFICULTY_CONFIG, LEVEL_EVERY, TIME_ATTACK } from '../config/difficulty';
import { INITIAL_PACE, generateQuestion, nextPace } from '../generator';
import type { Pace, Question, Side } from '../generator';
import type { Rng } from '../generator/random';
import { comboMultiplier, pointsFor } from './scoring';
import type { GameSettings } from './settings';

export type EndReason = 'time' | 'lives' | 'quit';

export interface AnswerResult {
  question: Question;
  picked: Side;
  correct: boolean;
  points: number;
  streak: number;
  /** Pengali combo yang berlaku untuk jawaban ini (1 bila salah). */
  multiplier: number;
  /** Perubahan waktu (detik): negatif = penalti, positif = bonus streak. 0 di mode Normal. */
  timeDelta: number;
  streakBonus: boolean;
  livesLeft: number;
  gameOver: boolean;
  reason: EndReason | null;
}

export interface RunSummary {
  score: number;
  correct: number;
  wrong: number;
  /** 0–100, dibulatkan. */
  accuracy: number;
  maxStreak: number;
  reason: EndReason;
}

/**
 * Logika satu permainan, tanpa DOM: skor, combo, level, timer, nyawa.
 * UI memanggil nextQuestion() → answer() / tick() dan menganimasikan hasilnya.
 */
export class GameEngine {
  score = 0;
  streak = 0;
  maxStreak = 0;
  correct = 0;
  wrong = 0;
  lives: number;
  timeLeft: number;
  question: Question | null = null;
  over = false;
  paused = false;
  reason: EndReason | null = null;

  private awaiting = false;
  private pace: Pace = INITIAL_PACE;

  constructor(
    readonly settings: GameSettings,
    private readonly rng: Rng = Math.random,
  ) {
    const cfg = DIFFICULTY_CONFIG[settings.difficulty];
    this.lives = cfg.lives;
    this.timeLeft = TIME_ATTACK.startSeconds;
  }

  get level(): number {
    return Math.min(Math.floor(this.correct / LEVEL_EVERY), DIFFICULTY_CONFIG[this.settings.difficulty].levelMax);
  }

  get multiplier(): number {
    return comboMultiplier(this.streak);
  }

  get isAwaitingAnswer(): boolean {
    return this.awaiting && !this.over && !this.paused;
  }

  get maxLives(): number {
    return DIFFICULTY_CONFIG[this.settings.difficulty].lives;
  }

  /**
   * Membuat soal berikutnya. Dengan `openNow = false`, jawaban (dan timer) baru dibuka lewat
   * beginAnswer() setelah animasi masuk selesai, supaya pemain tidak kehilangan waktu.
   */
  nextQuestion(openNow = true): Question {
    const q = generateQuestion({
      types: this.settings.types,
      difficulty: this.settings.difficulty,
      level: this.level,
      rng: this.rng,
      previous: this.question,
      pace: this.pace,
    });
    this.pace = nextPace(this.pace, q.heavier);
    this.question = q;
    this.awaiting = openNow;
    return q;
  }

  /** Mulai menerima jawaban untuk soal yang sudah dibuat. */
  beginAnswer(): void {
    if (this.question && !this.over) this.awaiting = true;
  }

  /** Mengevaluasi jawaban. Mengembalikan null bila tidak sedang menunggu jawaban (mis. dijeda). */
  answer(side: Side): AnswerResult | null {
    if (!this.isAwaitingAnswer || !this.question) return null;
    this.awaiting = false;
    const cfg = DIFFICULTY_CONFIG[this.settings.difficulty];
    const q = this.question;
    const correct = side === q.heavier;
    let points = 0;
    let timeDelta = 0;
    let streakBonus = false;
    let multiplier = 1;

    if (correct) {
      this.correct++;
      this.streak++;
      this.maxStreak = Math.max(this.maxStreak, this.streak);
      multiplier = comboMultiplier(this.streak);
      points = pointsFor(this.streak, this.settings.difficulty);
      this.score += points;
      if (this.settings.mode === 'time' && this.streak % TIME_ATTACK.streakBonusEvery === 0) {
        timeDelta = TIME_ATTACK.streakBonusSeconds;
        this.timeLeft += timeDelta;
        streakBonus = true;
      }
    } else {
      this.wrong++;
      this.streak = 0;
      if (this.settings.mode === 'time') {
        timeDelta = -Math.min(cfg.timePenalty, this.timeLeft);
        this.timeLeft = Math.max(0, this.timeLeft - cfg.timePenalty);
        if (this.timeLeft <= 0) this.end('time');
      } else {
        this.lives = Math.max(0, this.lives - 1);
        if (this.lives <= 0) this.end('lives');
      }
    }

    return {
      question: q,
      picked: side,
      correct,
      points,
      streak: this.streak,
      multiplier,
      timeDelta,
      streakBonus,
      livesLeft: this.lives,
      gameOver: this.over,
      reason: this.reason,
    };
  }

  /**
   * Memajukan timer Time Attack. Hanya berjalan saat menunggu jawaban (tidak saat animasi hasil)
   * dan tidak saat dijeda. Mengembalikan true bila waktu baru saja habis.
   */
  tick(dtSeconds: number): boolean {
    if (this.settings.mode !== 'time' || !this.isAwaitingAnswer) return false;
    this.timeLeft = Math.max(0, this.timeLeft - dtSeconds);
    if (this.timeLeft <= 0) {
      this.awaiting = false;
      this.end('time');
      return true;
    }
    return false;
  }

  /** Mengakhiri permainan secara paksa (mis. keluar ke menu). */
  end(reason: EndReason): void {
    if (this.over) return;
    this.over = true;
    this.awaiting = false;
    this.reason = reason;
  }

  summary(): RunSummary {
    const total = this.correct + this.wrong;
    return {
      score: this.score,
      correct: this.correct,
      wrong: this.wrong,
      accuracy: total === 0 ? 0 : Math.round((this.correct / total) * 100),
      maxStreak: this.maxStreak,
      reason: this.reason ?? 'quit',
    };
  }
}
