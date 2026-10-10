import { DIFFICULTIES, DIFFICULTY_CONFIG, MODES, MODE_INFO, QTYPES, QTYPE_INFO } from '../config/difficulty';
import type { Difficulty, Mode, QType } from '../config/difficulty';
import {
  TYPES_MIN_MESSAGE,
  clearTypes,
  isMix,
  selectAllTypes,
  toggleMix,
  toggleType,
} from '../game/settings';
import type { GameSettings } from '../game/settings';
import { createChip, createSegmented } from './components/controls';
import { h } from './dom';

/**
 * Panel pengaturan: mode, kesulitan, tipe soal. Dibangun dari komponen (segmented, chip, link).
 * Aturan chip (Mix, minimal 1 tipe) ada di game/settings.ts; di sini hanya tampilan + event.
 */
export class SettingsPanel {
  readonly el: HTMLElement;
  private readonly chipInputs = new Map<QType | 'mix', HTMLInputElement>();
  private readonly modeInputs: HTMLInputElement[];
  private readonly diffInputs: HTMLInputElement[];
  private readonly hint: HTMLElement;
  private readonly msg: HTMLElement;
  private msgTimer = 0;
  /** Pilihan sebelum Mix dinyalakan, untuk dipulihkan saat Mix dimatikan. */
  private beforeMix: QType[] | null = null;

  constructor(
    private settings: GameSettings,
    private readonly onChange: (s: GameSettings) => void,
  ) {
    const mode = createSegmented({
      name: 'mode',
      legend: 'Mode',
      options: MODES.map((m) => ({ value: m, label: MODE_INFO[m].name, hint: MODE_INFO[m].hint })),
    });
    const diff = createSegmented({
      name: 'difficulty',
      legend: 'Kesulitan',
      hintId: 'difficulty-hint',
      options: DIFFICULTIES.map((d) => ({ value: d, label: DIFFICULTY_CONFIG[d].label })),
    });
    this.modeInputs = mode.inputs;
    this.diffInputs = diff.inputs;
    this.hint = diff.el.querySelector('#difficulty-hint') as HTMLElement;

    const chips = h('div', { class: 'chips', id: 'chips' });
    const mix = createChip({ value: 'mix', label: 'Mix (semua tipe)', wide: true });
    this.chipInputs.set('mix', mix.input);
    chips.append(mix.el);
    for (const t of QTYPES) {
      const c = createChip({ value: t, label: QTYPE_INFO[t].name });
      this.chipInputs.set(t, c.input);
      chips.append(c.el);
    }
    this.msg = h('p', { id: 'types-msg', class: 'field__msg', role: 'status', 'aria-live': 'polite' });
    const btnAll = h('button', { type: 'button', class: 'link', id: 'btn-all' }, 'Pilih semua');
    const btnNone = h('button', { type: 'button', class: 'link', id: 'btn-none' }, 'Hapus semua');
    const types = h(
      'fieldset',
      { class: 'field' },
      h('legend', { class: 'field__legend' }, 'Tipe soal'),
      chips,
      h('div', { class: 'field__actions' }, this.msg, btnAll, btnNone),
    );

    this.el = h('section', { id: 'settings', class: 'panel', 'aria-label': 'Pengaturan permainan' }, mode.el, diff.el, types);

    for (const input of this.modeInputs) {
      input.addEventListener('change', () => input.checked && this.apply({ mode: input.value as Mode }));
    }
    for (const input of this.diffInputs) {
      input.addEventListener('change', () => input.checked && this.apply({ difficulty: input.value as Difficulty }));
    }
    for (const [key, input] of this.chipInputs) {
      input.addEventListener('change', () => this.onChip(key));
      input.setAttribute('aria-describedby', 'types-msg');
    }
    btnAll.addEventListener('click', () => this.apply({ types: selectAllTypes() }));
    btnNone.addEventListener('click', () => {
      this.apply({ types: clearTypes(this.settings.types).types });
      this.flashMessage();
    });
    this.render();
  }

  get value(): GameSettings {
    return this.settings;
  }

  private onChip(key: QType | 'mix'): void {
    if (key === 'mix') {
      if (!isMix(this.settings.types)) this.beforeMix = [...this.settings.types];
      this.apply({ types: toggleMix(this.settings.types, this.beforeMix) });
      return;
    }
    const r = toggleType(this.settings.types, key);
    this.apply({ types: r.types });
    if (r.rejected) this.flashMessage();
  }

  private flashMessage(): void {
    this.msg.textContent = TYPES_MIN_MESSAGE;
    window.clearTimeout(this.msgTimer);
    this.msgTimer = window.setTimeout(() => {
      this.msg.textContent = '';
    }, 2600);
  }

  private apply(patch: Partial<GameSettings>): void {
    window.clearTimeout(this.msgTimer);
    this.msg.textContent = '';
    this.settings = { ...this.settings, ...patch };
    this.render();
    this.onChange(this.settings);
  }

  /** Sinkronkan seluruh kontrol dengan state. */
  render(): void {
    const s = this.settings;
    for (const input of this.modeInputs) input.checked = input.value === s.mode;
    for (const input of this.diffInputs) input.checked = input.value === s.difficulty;
    for (const [key, input] of this.chipInputs) {
      input.checked = key === 'mix' ? isMix(s.types) : s.types.includes(key);
    }
    const cfg = DIFFICULTY_CONFIG[s.difficulty];
    const detail = s.mode === 'time' ? `Salah = −${cfg.timePenalty} detik` : `${cfg.lives} nyawa`;
    this.hint.textContent = `Selisih minimal ${Math.round(cfg.minDiffRatio * 100)}% • ${detail} • skor ×${String(cfg.scoreMultiplier).replace('.', ',')}`;
  }
}
