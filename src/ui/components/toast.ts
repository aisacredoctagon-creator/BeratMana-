import { h } from '../dom';

let el: HTMLElement | null = null;
let timer = 0;

/** Toast singkat di bawah layar (`role="status"`). Lihat DESIGN.md §4.13. */
export function toast(message: string, ms = 2200): void {
  if (!el) {
    el = h('div', { class: 'toast', role: 'status', 'aria-live': 'polite', hidden: true });
    document.getElementById('app')?.append(el);
  }
  const node = el;
  node.textContent = message;
  node.hidden = false;
  // mulai ulang animasi bila toast muncul beruntun
  node.style.animation = 'none';
  void node.offsetWidth;
  node.style.animation = '';
  window.clearTimeout(timer);
  timer = window.setTimeout(() => {
    node.hidden = true;
  }, ms);
}
