import { DIFFICULTY_CONFIG, TIME_ATTACK } from '../config/difficulty';
import type { GameSettings } from '../game/settings';
import { createIconButton } from './components/button';
import { icon } from './components/icons';
import { createPill, createStarTile } from './components/pill';
import { h, setText } from './dom';
import { restartClass } from './effects';

const fmtScore = (n: number): string => n.toLocaleString('id-ID');

export function formatTime(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * HUD atas: skor, waktu (Time Attack) atau nyawa (Normal), dan tombol jeda.
 * Tingkat, combo, dan pengali tetap dihitung engine, tetapi tidak ditampilkan di sini.
 * Hanya menyentuh teks, atribut data-*, dan variabel CSS (tidak memicu layout besar).
 */
export class Hud {
  readonly el: HTMLElement;
  readonly pauseBtn: HTMLButtonElement;

  /** Hanya angka (tanpa kata "Skor"); nama untuk pembaca layar ada di teks tersembunyi. */
  private readonly score = createPill({ variant: 'score', lead: createStarTile(), value: '0' });
  /** Waktu (Time Attack): ikon jam + angka, tanpa kotak dan tanpa tulisan. role="timer" tidak dibacakan tiap detik. */
  private readonly timeValue = h('span', { class: 'hud-time__value' }, '1:00');
  private readonly time = h(
    'div',
    { class: 'hud-time', role: 'timer', 'aria-live': 'off', 'data-hud': 'time' },
    h('span', { class: 'hud-time__icon', 'aria-hidden': 'true' }, icon('clock')),
    h('span', { class: 'sr-only' }, 'Sisa waktu'),
    this.timeValue,
  );
  /** Hanya ikon hati; keadaan dibacakan lewat aria-label ("Nyawa 2 dari 3"). */
  private readonly hearts = h('span', { class: 'hearts', role: 'img' });
  private heartEls: HTMLElement[] = [];

  private shown = 0;
  private target = 0;

  constructor() {
    this.pauseBtn = createIconButton({ icon: 'pause', label: 'Jeda (P)', id: 'btn-pause', dataHud: 'pause' });
    this.score.el.id = 'hud-score-pill';
    this.score.el.querySelector('.pill__text')?.prepend(h('span', { class: 'sr-only' }, 'Skor'));
    this.score.value?.setAttribute('id', 'hud-score');
    this.el = h(
      'header',
      { class: 'hud', id: 'hud' },
      h(
        'div',
        { class: 'hud__inner' },
        h('div', { class: 'hud__group hud__group--left' }, this.score.el),
        h('div', { class: 'hud__group hud__group--center' }, this.time, this.hearts),
        h('div', { class: 'hud__group hud__group--right' }, this.pauseBtn),
      ),
    );
  }

  setup(settings: GameSettings): void {
    const cfg = DIFFICULTY_CONFIG[settings.difficulty];
    this.el.closest<HTMLElement>('.screen')!.dataset.mode = settings.mode;
    this.shown = this.target = 0;
    setText(this.score.value!, '0');
    this.setTime(TIME_ATTACK.startSeconds);
    this.setLives(cfg.lives, cfg.lives);
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

  setTime(timeLeft: number): void {
    setText(this.timeValue, formatTime(timeLeft));
    this.time.classList.toggle('is-low', timeLeft <= TIME_ATTACK.tickFromSeconds);
  }

  /**
   * Hati penuh = isi, hati hilang = outline (beda bentuk, bukan hanya warna). Hati yang baru hilang mengecil
   * dan bergetar sebentar; keadaan awal tidak dianimasikan.
   */
  setLives(lives: number, max: number): void {
    if (this.heartEls.length !== max) {
      this.heartEls = Array.from({ length: max }, (_, i) =>
        h(
          'span',
          { class: 'heart', 'aria-hidden': 'true', 'data-state': i < lives ? 'full' : 'lost' },
          h('span', { class: 'heart__full' }, icon('heart')),
          h('span', { class: 'heart__empty' }, icon('heartLost')),
        ),
      );
      this.hearts.replaceChildren(...this.heartEls);
    }
    this.heartEls.forEach((el, i) => {
      const state = i < lives ? 'full' : 'lost';
      if (el.dataset.state === 'full' && state === 'lost') restartClass(el, 'is-hit');
      el.dataset.state = state;
    });
    this.hearts.setAttribute('aria-label', `Nyawa ${lives} dari ${max}`);
  }
}
