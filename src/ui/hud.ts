import { DIFFICULTY_CONFIG, MODE_INFO, TIME_ATTACK } from '../config/difficulty';
import type { GameSettings } from '../game/settings';
import { createIconButton } from './components/button';
import { icon } from './components/icons';
import { createDot, createPill, createStarTile, pillIcon } from './components/pill';
import { h, setText } from './dom';
import { popElement } from './effects';

const fmtScore = (n: number): string => n.toLocaleString('id-ID');
const fmtMult = (n: number): string => String(n).replace('.', ',');

export function formatTime(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * HUD atas: skor, tingkat, mode (+ pengali), combo, waktu/nyawa, tombol suara dan jeda.
 * Hanya menyentuh teks, atribut data-*, dan variabel CSS (tidak memicu layout besar).
 */
export class Hud {
  readonly el: HTMLElement;
  readonly soundBtn: HTMLButtonElement;
  readonly pauseBtn: HTMLButtonElement;

  private readonly score = createPill({ variant: 'score', lead: createStarTile(), label: 'Skor', value: '0' });
  private readonly level = createPill({ variant: 'level', lead: createDot(), value: '' });
  private readonly mode = createPill({ variant: 'mode', lead: pillIcon(icon('bolt')), value: '', badge: 'EXP' });
  private readonly combo = createPill({ variant: 'combo', lead: pillIcon(icon('fire')), label: 'Combo', value: '×1' });
  private readonly time = createPill({ variant: 'time', lead: pillIcon(icon('timer')), label: 'Waktu', value: '1:00' });
  private readonly hearts = h('span', { class: 'hearts', 'aria-hidden': 'true' });
  private readonly lives = createPill({ variant: 'lives', lead: pillIcon(this.hearts), label: 'Nyawa' });

  private shown = 0;
  private target = 0;
  private lastMult = 1;

  constructor() {
    this.soundBtn = createIconButton({ icon: 'sound', label: 'Suara (M)', id: 'btn-sound', dataHud: 'sound' });
    this.pauseBtn = createIconButton({ icon: 'pause', label: 'Jeda (P)', id: 'btn-pause', dataHud: 'pause' });
    this.score.el.id = 'hud-score-pill';
    this.score.value?.setAttribute('id', 'hud-score');
    this.el = h(
      'header',
      { class: 'hud', id: 'hud' },
      h(
        'div',
        { class: 'hud__inner' },
        h('div', { class: 'hud__group hud__group--left' }, this.score.el, this.level.el),
        h('div', { class: 'hud__group hud__group--mode' }, this.mode.el),
        h('div', { class: 'hud__group hud__group--right' }, this.combo.el, this.time.el, this.lives.el, this.soundBtn, this.pauseBtn),
      ),
    );
    this.combo.el.dataset.level = '1';
  }

  setup(settings: GameSettings): void {
    const cfg = DIFFICULTY_CONFIG[settings.difficulty];
    this.el.closest<HTMLElement>('.screen')!.dataset.mode = settings.mode;
    setText(this.mode.value!, MODE_INFO[settings.mode].name);
    setText(this.mode.el.querySelector('.pill__badge')!, `X${fmtMult(cfg.scoreMultiplier)} EXP`);
    this.shown = this.target = 0;
    this.lastMult = 1;
    setText(this.score.value!, '0');
    this.setLevel(1, settings);
    this.setCombo(0, 1, false);
    this.setTime(TIME_ATTACK.startSeconds);
    this.setLives(cfg.lives, cfg.lives);
  }

  setLevel(level: number, settings: GameSettings): void {
    setText(this.level.value!, `Tingkat ${level} • ${DIFFICULTY_CONFIG[settings.difficulty].label}`);
  }

  setScore(score: number, animate = true): void {
    this.target = score;
    if (!animate) {
      this.shown = score;
      setText(this.score.value!, fmtScore(score));
    }
  }

  /** Dipanggil tiap frame: angka skor naik halus. */
  frame(dt: number): void {
    if (this.shown === this.target) return;
    const diff = this.target - this.shown;
    const step = Math.max(1, Math.ceil(Math.abs(diff) * Math.min(1, dt * 9)));
    this.shown = diff > 0 ? Math.min(this.target, this.shown + step) : Math.max(this.target, this.shown - step);
    setText(this.score.value!, fmtScore(this.shown));
  }

  setCombo(streak: number, mult: number, pop = true): void {
    setText(this.combo.value!, `×${mult}`);
    setText(this.combo.label!, streak >= 2 ? `Combo ${streak}` : 'Combo');
    this.combo.el.dataset.level = String(mult);
    if (pop && mult > this.lastMult) popElement(this.combo.el);
    this.lastMult = mult;
  }

  setTime(timeLeft: number): void {
    setText(this.time.value!, formatTime(timeLeft));
    const progress = Math.min(1, Math.max(0, timeLeft / TIME_ATTACK.startSeconds));
    this.time.el.style.setProperty('--timer-progress', String(progress));
    this.time.el.classList.toggle('is-low', timeLeft <= TIME_ATTACK.tickFromSeconds);
  }

  setLives(lives: number, max: number): void {
    this.hearts.replaceChildren(...Array.from({ length: max }, (_, i) => icon(i < lives ? 'heart' : 'heartLost')));
    this.lives.el.setAttribute('role', 'img');
    this.lives.el.setAttribute('aria-label', `Nyawa ${lives} dari ${max}`);
  }

  /** Ikon tombol suara mengikuti status audio. */
  setSound(on: boolean): void {
    this.soundBtn.replaceChildren(icon(on ? 'sound' : 'soundOff'));
    this.soundBtn.setAttribute('aria-pressed', String(!on));
    this.soundBtn.setAttribute('aria-label', on ? 'Matikan suara (M)' : 'Nyalakan suara (M)');
  }
}
