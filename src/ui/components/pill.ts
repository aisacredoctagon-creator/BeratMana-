import { h } from '../dom';
import { icon } from './icons';

export type PillVariant = 'score' | 'level' | 'mode' | 'combo' | 'time' | 'lives';

export interface PillParts {
  el: HTMLElement;
  label: HTMLElement | null;
  value: HTMLElement | null;
}

interface PillOptions {
  variant: PillVariant;
  id?: string;
  /** Penanda posisi pada HUD (dipakai CSS layar sempit). */
  hud?: string;
  lead?: Node | null;
  label?: string;
  value?: string;
  badge?: string;
}

/** Pil HUD generik: [lead] + (label eyebrow, nilai) + badge. Lihat DESIGN.md §4.5. */
export function createPill(o: PillOptions): PillParts {
  const label = o.label !== undefined ? h('span', { class: 'eyebrow pill__label' }, o.label) : null;
  const value = o.value !== undefined ? h('span', { class: 'pill__value' }, o.value) : null;
  const el = h(
    'div',
    { id: o.id, class: `pill pill--${o.variant}`, 'data-hud': o.hud ?? o.variant },
    o.lead ?? null,
    label || value ? h('span', { class: 'pill__text' }, label, value) : null,
    o.badge ? h('span', { class: 'eyebrow pill__badge pill__badge--exp' }, o.badge) : null,
  );
  return { el, label, value };
}

/** Lencana bintang untuk pil skor. */
export const createStarTile = (): HTMLElement => h('span', { class: 'star-tile' }, icon('star'));

/** Titik hijau untuk pil tingkat. */
export const createDot = (): HTMLElement => h('span', { class: 'pill__dot', 'aria-hidden': 'true' });

/** Ikon dalam pil (dibungkus agar warnanya mengikuti keluarga pil). */
export const pillIcon = (node: Node): HTMLElement => h('span', { class: 'pill__icon' }, node);

/** Badge kecil bergaya pil (mis. ringkasan kesulitan). */
export const createBadge = (text: string): HTMLElement => h('span', { class: 'eyebrow badge' }, text);
