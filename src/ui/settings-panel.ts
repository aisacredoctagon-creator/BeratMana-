import { DIFFICULTIES, DIFFICULTY_CONFIG, MODES, MODE_INFO, QTYPES, QTYPE_INFO } from '../config/difficulty';
import type { Difficulty, Mode, QType } from '../config/difficulty';
import { TYPES_MIN_MESSAGE, toggleType } from '../game/settings';
import type { GameSettings } from '../game/settings';
import { createChip, createSegmented } from './components/controls';
import type { IconName } from './components/icons';
import { toast } from './components/toast';
import { h } from './dom';

const QTYPE_ICON: Record<QType, IconName> = {
  add: 'plus',
  sub: 'minus',
  mul: 'times',
  div: 'divide',
  fraction: 'fraction',
  decimal: 'decimal',
};

/**
 * Panel pengaturan: mode, kesulitan, tipe soal. Dibangun dari komponen (segmented, chip, link).
 * Aturan chip (minimal 1 tipe) ada di game/settings.ts; di sini hanya tampilan + event.
 */
export class SettingsPanel {
  readonly el: HTMLElement;
  private readonly chipInputs = new Map<QType, HTMLInputElement>();
  private readonly modeInputs: HTMLInputElement[];
  private readonly diffInputs: HTMLInputElement[];

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
      options: DIFFICULTIES.map((d) => ({ value: d, label: DIFFICULTY_CONFIG[d].label })),
    });
    this.modeInputs = mode.inputs;
    this.diffInputs = diff.inputs;

    const chips = h('div', { class: 'chips', id: 'chips' });
    for (const t of QTYPES) {
      const c = createChip({ value: t, label: QTYPE_INFO[t].name, icon: QTYPE_ICON[t] });
      this.chipInputs.set(t, c.input);
      chips.append(c.el);
    }
    const types = h('fieldset', { class: 'field' }, h('legend', { class: 'field__legend' }, 'Tipe soal'), chips);

    this.el = h('section', { id: 'settings', class: 'panel', 'aria-label': 'Pengaturan permainan' }, mode.el, diff.el, types);

    for (const input of this.modeInputs) {
      input.addEventListener('change', () => input.checked && this.apply({ mode: input.value as Mode }));
    }
    for (const input of this.diffInputs) {
      input.addEventListener('change', () => input.checked && this.apply({ difficulty: input.value as Difficulty }));
    }
    for (const [key, input] of this.chipInputs) {
      input.addEventListener('change', () => this.onChip(key));
    }
    this.render();
  }

  get value(): GameSettings {
    return this.settings;
  }

  private onChip(key: QType): void {
    const r = toggleType(this.settings.types, key);
    this.apply({ types: r.types });
    if (r.rejected) toast(TYPES_MIN_MESSAGE); // tipe terakhir tidak bisa dimatikan
  }

  private apply(patch: Partial<GameSettings>): void {
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
      input.checked = s.types.includes(key);
    }
  }
}
