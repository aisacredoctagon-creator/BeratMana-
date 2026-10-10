import { TIME_ATTACK } from '../config/difficulty';
import { pickItemPair } from '../config/items';
import type { Item } from '../config/items';
import { GameEngine } from '../game/engine';
import type { AnswerResult, RunSummary } from '../game/engine';
import type { GameSettings } from '../game/settings';
import type { Side } from '../generator';
import type { AudioManager } from '../services/audio';
import { haptics } from '../services/haptics';
import { setAnswerFeedback } from './components/button';
import { $, setText } from './dom';
import { burst, flash, floatText, shake } from './effects';
import type { GameScreen } from './screens/game-screen';
import type { PauseModal } from './screens/overlays';

/** Durasi (ms) tiap fase ronde. */
const T = {
  enter: 620,
  revealCorrect: 950,
  revealWrong: 1350,
  leave: 420,
  timeUpDelay: 700,
} as const;

export interface GameEnd {
  summary: RunSummary;
  engine: GameEngine;
}

interface Pending {
  left: number;
  fn: () => void;
}

/**
 * Mengatur satu sesi permainan di layar: ronde, timer, jeda, efek, audio.
 * Penjadwalan memakai jam internal yang berhenti saat dijeda (bukan setTimeout),
 * sehingga animasi hasil pun tidak "lanjut sendiri" saat game dijeda.
 */
export class GameView {
  private engine: GameEngine | null = null;
  private readonly srStatus = $('sr-status');

  private pending: Pending[] = [];
  private raf = 0;
  private lastFrame = 0;
  private lastTickSecond = Infinity;
  private lastItems: [string, string] | null = null;
  private running = false;
  private paused = false;

  constructor(
    private readonly audio: AudioManager,
    private readonly ui: GameScreen,
    private readonly pauseModal: PauseModal,
    private readonly onEnd: (end: GameEnd) => void,
  ) {
    ui.btnLeft.addEventListener('click', () => this.answer('left'));
    ui.btnRight.addEventListener('click', () => this.answer('right'));
    ui.hud.pauseBtn.addEventListener('click', () => this.pause());
  }

  get isRunning(): boolean {
    return this.running;
  }

  get isPaused(): boolean {
    return this.paused;
  }

  /** Memulai permainan baru dengan pengaturan tertentu. Mengembalikan engine sesi ini (skor dibaca darinya). */
  start(settings: GameSettings): GameEngine {
    this.stopLoop();
    this.pending = [];
    const engine = new GameEngine(settings);
    this.engine = engine;
    this.running = true;
    this.paused = false;
    this.lastItems = null;
    this.lastTickSecond = Infinity;
    this.ui.hud.setup(settings);
    this.ui.seesaw.reset();
    this.ui.cardLeft.clear();
    this.ui.cardRight.clear();
    this.setButtons(false);
    this.pauseModal.modal.el.hidden = true;
    this.startLoop();
    this.beginRound();
    return engine;
  }

  // ---------- jeda ----------
  pause(): void {
    if (!this.running || this.paused || !this.engine || this.engine.over) return;
    this.paused = true;
    this.engine.paused = true;
    this.audio.play('click');
    this.pauseModal.modal.open(this.pauseModal.resumeBtn);
    this.audio.setActive(false);
  }

  resume(): void {
    if (!this.paused || !this.engine) return;
    this.paused = false;
    this.engine.paused = false;
    this.pauseModal.modal.close();
    this.audio.setActive(!document.hidden);
    this.audio.play('click');
  }

  togglePause(): void {
    if (this.paused) this.resume();
    else this.pause();
  }

  /** Menghentikan sesi tanpa menampilkan game over (keluar ke menu / ulangi). */
  stop(): void {
    this.running = false;
    this.paused = false;
    this.stopLoop();
    this.pending = [];
    this.engine?.end('quit');
    this.pauseModal.modal.el.hidden = true;
    // pause() menangguhkan audio; keluar/mengulang dari jeda harus mengaktifkannya lagi
    this.audio.setActive(!document.hidden);
  }

  // ---------- alur ronde ----------
  private after(ms: number, fn: () => void): void {
    this.pending.push({ left: ms, fn });
  }

  private beginRound(): void {
    const engine = this.engine;
    if (!engine) return;
    const q = engine.nextQuestion(false);
    const items = pickItemPair(Math.random, this.lastItems);
    this.lastItems = [items[0].id, items[1].id];
    this.ui.cardLeft.set(q.left);
    this.ui.cardRight.set(q.right);
    this.ui.seesaw.setLabel(`Bandingkan ${q.left.label} dengan ${q.right.label}`);
    this.ui.seesaw.present(items as readonly [Item, Item]);
    setAnswerFeedback(this.ui.btnLeft, null);
    setAnswerFeedback(this.ui.btnRight, null);
    this.setButtons(false);
    this.after(T.enter, () => {
      this.ui.seesaw.ready();
      engine.beginAnswer();
      this.setButtons(true);
    });
  }

  answer(side: Side): void {
    const engine = this.engine;
    if (!engine || !this.running) return;
    const res = engine.answer(side);
    if (!res) return;
    this.setButtons(false);
    this.ui.seesaw.reveal(res.question.heavier);
    this.audio.play('thud');
    this.applyResult(res, engine);

    this.after(res.correct ? T.revealCorrect : T.revealWrong, () => {
      if (res.gameOver) {
        this.finish();
        return;
      }
      this.ui.seesaw.leave();
      this.after(T.leave, () => this.beginRound());
    });
  }

  private applyResult(res: AnswerResult, engine: GameEngine): void {
    const { hud, seesaw, cardLeft, cardRight } = this.ui;
    const where = seesaw.center();
    hud.setScore(engine.score);
    hud.setCombo(engine.streak, engine.multiplier);
    hud.setLives(engine.lives, engine.maxLives);
    hud.setLevel(engine.level + 1, engine.settings);
    if (engine.settings.mode === 'time') hud.setTime(engine.timeLeft);

    const q = res.question;
    cardLeft.reveal(q.left, q.heavier === 'left');
    cardRight.reveal(q.right, q.heavier === 'right');
    setAnswerFeedback(res.picked === 'left' ? this.ui.btnLeft : this.ui.btnRight, res.correct ? 'good' : 'bad');
    seesaw.showVerdict(res.correct);

    const heavy = q.heavier === 'left' ? q.left : q.right;
    const light = q.heavier === 'left' ? q.right : q.left;
    const side = q.heavier === 'left' ? 'kiri' : 'kanan';

    if (res.correct) {
      flash('good');
      burst(where.x, where.y, 10 + res.multiplier * 2);
      floatText(`+${res.points}`, where.x, where.y, 'good');
      this.audio.play('correct');
      haptics.correct();
      const milestone = res.streak > 0 && res.streak % TIME_ATTACK.streakBonusEvery === 0;
      if (milestone) {
        this.audio.play('combo', res.multiplier);
        haptics.combo();
      }
      if (res.streakBonus) {
        floatText(`+${TIME_ATTACK.streakBonusSeconds} detik`, where.x, where.y + 44, 'bonus');
        this.audio.play('bonus');
      }
      this.announce(`Benar. Sisi ${side} lebih berat: ${heavy.label} lebih besar dari ${light.label}.`);
    } else {
      flash('bad');
      shake();
      this.audio.play('wrong');
      haptics.wrong();
      if (res.timeDelta < 0) floatText(`${res.timeDelta} detik`.replace('-', '−'), where.x, where.y, 'bad');
      this.announce(`Salah. Sisi ${side} yang lebih berat: ${heavy.label} lebih besar dari ${light.label}.`);
    }
  }

  private announce(text: string): void {
    setText(this.srStatus, text);
  }

  private finish(): void {
    const engine = this.engine;
    if (!engine) return;
    this.running = false;
    this.stopLoop();
    this.setButtons(false);
    this.audio.play('gameover');
    haptics.gameOver();
    this.onEnd({ summary: engine.summary(), engine });
  }

  private setButtons(enabled: boolean): void {
    this.ui.btnLeft.disabled = !enabled;
    this.ui.btnRight.disabled = !enabled;
  }

  // ---------- jam & loop ----------
  private startLoop(): void {
    this.lastFrame = performance.now();
    const loop = (now: number): void => {
      this.raf = requestAnimationFrame(loop);
      // dt dibatasi supaya kembali dari tab tersembunyi tidak "meloncat"
      const dt = Math.min(0.1, (now - this.lastFrame) / 1000);
      this.lastFrame = now;
      this.frame(dt);
    };
    this.raf = requestAnimationFrame(loop);
  }

  private stopLoop(): void {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private frame(dt: number): void {
    const engine = this.engine;
    if (!engine) return;
    this.ui.hud.frame(dt);
    if (this.paused || !this.running) return;

    // jadwal fase ronde
    if (this.pending.length > 0) {
      const due: Pending[] = [];
      this.pending = this.pending.filter((p) => {
        p.left -= dt * 1000;
        if (p.left <= 0) {
          due.push(p);
          return false;
        }
        return true;
      });
      for (const p of due) p.fn();
    }

    if (engine.settings.mode === 'time') {
      const timeUp = engine.tick(dt);
      this.ui.hud.setTime(engine.timeLeft);
      const sec = Math.ceil(engine.timeLeft);
      if (engine.isAwaitingAnswer && sec <= TIME_ATTACK.tickFromSeconds && sec > 0 && sec < this.lastTickSecond) {
        this.audio.play('tick');
      }
      this.lastTickSecond = sec;
      if (timeUp) {
        this.setButtons(false);
        this.after(T.timeUpDelay, () => this.finish());
        this.announce('Waktu habis.');
        flash('bad');
      }
    }
  }
}
