import { h } from '../dom';
import { icon } from './icons';

export type PillVariant = 'score' | 'level' | 'combo' | 'time';

export interface PillParts {
  el: HTMLElement;
  label: HTMLElement | null;
  value: HTMLElement | null;
}

interface PillOptions {
  variant: PillVariant;
  id?: string;
  lead?: Node | null;
  label?: string;
  value?: string;
}

/** Pil generik: [lead] + (label eyebrow, nilai). Dipakai HUD dan layar game over. Lihat DESIGN.md §4.5. */
export function createPill(o: PillOptions): PillParts {
  const label = o.label !== undefined ? h('span', { class: 'eyebrow pill__label' }, o.label) : null;
  const value = o.value !== undefined ? h('span', { class: 'pill__value' }, o.value) : null;
  const el = h(
    'div',
    { id: o.id, class: `pill pill--${o.variant}`, 'data-hud': o.variant },
    o.lead ?? null,
    label || value ? h('span', { class: 'pill__text' }, label, value) : null,
  );
  return { el, label, value };
}

/** Lencana bintang untuk pil skor. */
export const createStarTile = (): HTMLElement => h('span', { class: 'star-tile' }, icon('star'));

/** Ikon dalam pil (dibungkus agar warnanya mengikuti keluarga pil). */
export const pillIcon = (node: Node): HTMLElement => h('span', { class: 'pill__icon' }, node);

/** Badge kecil bergaya pil (mis. ringkasan kesulitan). */
export const createBadge = (text: string): HTMLElement => h('span', { class: 'eyebrow badge' }, text);
