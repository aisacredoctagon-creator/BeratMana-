import { h } from '../dom';
import { icon } from './icons';
import type { IconName } from './icons';

export interface SegmentedOption {
  value: string;
  label: string;
  hint?: string;
}

/** Segmented control berbasis radio asli (keyboard: panah). Lihat DESIGN.md §4.7. */
export function createSegmented(o: { name: string; legend: string; options: SegmentedOption[]; hintId?: string }): {
  el: HTMLFieldSetElement;
  inputs: HTMLInputElement[];
} {
  const inputs: HTMLInputElement[] = [];
  const opts = o.options.map((opt) => {
    const input = h('input', { type: 'radio', name: o.name, value: opt.value });
    inputs.push(input);
    return h(
      'label',
      { class: 'seg__opt' },
      input,
      h('span', { class: 'seg__face' }, h('b', {}, opt.label), opt.hint ? h('small', {}, opt.hint) : null),
    );
  });
  const el = h(
    'fieldset',
    { class: 'field' },
    h('legend', { class: 'field__legend' }, o.legend),
    h('div', { class: `seg seg--${o.options.length}` }, ...opts),
    o.hintId ? h('p', { id: o.hintId, class: 'field__hint', 'aria-live': 'polite' }) : null,
  );
  return { el, inputs };
}

/** Chip/checkbox besar dengan kotak ✓ (bukan hanya warna). Lihat DESIGN.md §4.8. */
export function createChip(o: { value: string; label: string; wide?: boolean }): {
  el: HTMLLabelElement;
  input: HTMLInputElement;
} {
  const input = h('input', { type: 'checkbox', value: o.value });
  const el = h(
    'label',
    { class: o.wide ? 'chip chip--wide' : 'chip' },
    input,
    h('span', { class: 'chip__face' }, h('span', { class: 'chip__box', 'aria-hidden': 'true' }, icon('check')), h('span', {}, o.label)),
  );
  return { el, input };
}

/** Toggle (role="switch") dengan ikon, label, dan teks status Nyala/Mati. Lihat DESIGN.md §4.6. */
export function createSwitch(o: { id: string; label: string; icon: IconName; dataHud?: string }): HTMLButtonElement {
  return h(
    'button',
    { type: 'button', id: o.id, class: 'switch', role: 'switch', 'aria-checked': 'true', 'data-hud': o.dataHud },
    icon(o.icon),
    h('span', {}, o.label),
    h('span', { class: 'switch__state', 'aria-hidden': 'true' }, 'Nyala'),
  );
}

export function setSwitch(el: HTMLElement, on: boolean): void {
  el.setAttribute('aria-checked', String(on));
  const state = el.querySelector('.switch__state');
  if (state) state.textContent = on ? 'Nyala' : 'Mati';
}

/** Keycap untuk petunjuk keyboard. Lihat DESIGN.md §4.9. */
export const createKeycap = (text: string): HTMLElement => h('kbd', { class: 'keycap' }, text);

/** Satu kelompok petunjuk: [keycap…] teks. */
export function createKeyHint(parts: (string | { key: string })[]): HTMLElement {
  return h(
    'span',
    { class: 'keyhint' },
    ...parts.map((p) => (typeof p === 'string' ? p : createKeycap(p.key))),
  );
}
