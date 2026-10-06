import { h } from '../dom';
import { icon } from './icons';
import type { IconName } from './icons';

export type ButtonVariant = 'primary' | 'secondary';

export interface ButtonOptions {
  label: string;
  variant?: ButtonVariant;
  id?: string;
  icon?: IconName;
  block?: boolean;
  disabled?: boolean;
  ariaExpanded?: boolean;
  ariaControls?: string;
  className?: string;
}

/** Tombol utama (koral 3D) atau sekunder (putih 3D). Lihat DESIGN.md §4.1. */
export function createButton(o: ButtonOptions): HTMLButtonElement {
  const cls = ['btn', o.variant === 'primary' ? 'btn--primary' : '', o.block ? 'btn--block' : '', o.className ?? '']
    .filter(Boolean)
    .join(' ');
  const btn = h(
    'button',
    {
      type: 'button',
      id: o.id,
      class: cls,
      disabled: o.disabled,
      'aria-expanded': o.ariaExpanded === undefined ? undefined : String(o.ariaExpanded),
      'aria-controls': o.ariaControls,
    },
    o.icon ? icon(o.icon) : null,
    h('span', {}, o.label),
  );
  return btn;
}

export interface IconButtonOptions {
  icon: IconName;
  label: string;
  id?: string;
  dataHud?: string;
}

/** Tombol ikon 40px (area sentuh 48px). Lihat DESIGN.md §4.2. */
export function createIconButton(o: IconButtonOptions): HTMLButtonElement {
  return h(
    'button',
    { type: 'button', id: o.id, class: 'icon-btn', 'aria-label': o.label, 'data-hud': o.dataHud },
    icon(o.icon),
  );
}

export type AnswerSide = 'left' | 'right';
export type AnswerFeedback = 'good' | 'bad' | null;

/** Tombol jawab "<" (biru) dan ">" (koral). Lihat DESIGN.md §4.3. */
export function createAnswerButton(side: AnswerSide, id: string, label: string): HTMLButtonElement {
  return h(
    'button',
    { type: 'button', id, class: `answer answer--${side}`, 'aria-label': label, disabled: true },
    h('span', { class: 'answer__tile' }, icon(side === 'left' ? 'chevronLeft' : 'chevronRight')),
    h('span', { class: 'answer__badge', 'aria-hidden': 'true' }, icon('check'), icon('cross')),
  );
}

export function setAnswerFeedback(btn: HTMLElement, kind: AnswerFeedback): void {
  if (kind === null) btn.removeAttribute('data-feedback');
  else btn.setAttribute('data-feedback', kind);
}
