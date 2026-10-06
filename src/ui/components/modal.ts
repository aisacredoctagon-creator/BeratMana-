import { h } from '../dom';
import type { Child } from '../dom';

export interface Modal {
  el: HTMLElement;
  readonly isOpen: boolean;
  open(focusTarget?: HTMLElement | null): void;
  close(): void;
  /** Menangani Tab (jebakan fokus). Mengembalikan true bila tombol sudah ditangani. */
  handleKey(e: KeyboardEvent): boolean;
}

/**
 * Modal di tengah (desktop) / bottom sheet (layar sempit). Lihat DESIGN.md §4.11.
 * `body` dan `actions` berisi komponen lain; judul memakai id `${id}-title` untuk aria-labelledby.
 */
export function createModal(o: {
  id: string;
  title: string;
  wide?: boolean;
  body?: Child[];
  actions?: Child[];
  onClose?: () => void;
}): Modal {
  const sheet = h(
    'div',
    { class: o.wide ? 'sheet sheet--wide' : 'sheet' },
    h('h2', { id: `${o.id}-title`, class: 'sheet__title' }, o.title),
    ...(o.body ?? []),
    ...(o.actions ?? []),
  );
  const el = h(
    'div',
    { id: o.id, class: 'overlay', hidden: true, role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': `${o.id}-title` },
    sheet,
  );
  let returnFocus: Element | null = null;

  const focusables = (): HTMLElement[] =>
    [...el.querySelectorAll<HTMLElement>('button:not(:disabled), [href], input, [tabindex]:not([tabindex="-1"])')];

  const api: Modal = {
    el,
    get isOpen() {
      return !el.hidden;
    },
    open(focusTarget) {
      returnFocus = document.activeElement;
      el.hidden = false;
      (focusTarget ?? focusables()[0])?.focus({ preventScroll: true });
    },
    close() {
      el.hidden = true;
      if (returnFocus instanceof HTMLElement && document.contains(returnFocus)) returnFocus.focus({ preventScroll: true });
      returnFocus = null;
      o.onClose?.();
    },
    handleKey(e) {
      if (el.hidden) return false;
      if (e.key !== 'Tab') return false;
      const list = focusables();
      const first = list[0];
      const last = list[list.length - 1];
      if (!first || !last) return false;
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !el.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !el.contains(active))) {
        e.preventDefault();
        first.focus();
      }
      return true;
    },
  };
  return api;
}
