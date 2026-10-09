import { $, h, prefersReducedMotion } from './dom';

/** Easing pegas (osilasi teredam) sebagai CSS linear(); dipasang bila browser mendukung. */
export function installSpringEasing(): void {
  if (typeof CSS === 'undefined' || !CSS.supports('transition-timing-function', 'linear(0, 1)')) return;
  const n = 40;
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const v = i === n ? 1 : 1 - Math.exp(-6.2 * t) * Math.cos(10.5 * t);
    pts.push(v.toFixed(3));
  }
  document.documentElement.style.setProperty('--spring', `linear(${pts.join(', ')})`);
}

/** Warna partikel dibaca dari token CSS (tidak ada warna di TS). */
const PARTICLE_TOKENS = ['--color-amber-400', '--color-emerald-500', '--color-sky-400', '--color-rose-400', '--color-indigo-400'];
let particleColors: string[] | null = null;

function colors(): string[] {
  if (!particleColors) {
    const css = getComputedStyle(document.documentElement);
    particleColors = PARTICLE_TOKENS.map((t) => css.getPropertyValue(t).trim());
  }
  return particleColors;
}

const fxLayer = (): HTMLElement => $('fx-layer');

/** Letupan partikel kecil (transform + opacity lewat Web Animations API). Koordinat = viewport. */
export function burst(x: number, y: number, count = 14): void {
  if (prefersReducedMotion()) return;
  const host = fxLayer();
  const box = host.getBoundingClientRect();
  const palette = colors();
  for (let i = 0; i < count; i++) {
    const el = h('span', { class: 'fx-particle' });
    el.style.background = palette[i % palette.length] ?? '';
    host.append(el);
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const dist = 50 + Math.random() * 90;
    const grow = 0.6 + Math.random() * 0.8;
    const sx = x - box.left;
    const sy = y - box.top;
    const anim = el.animate(
      [
        { transform: `translate(${sx}px, ${sy}px) scale(${grow})`, opacity: 1 },
        {
          transform: `translate(${sx + Math.cos(angle) * dist}px, ${sy + Math.sin(angle) * dist + 10}px) scale(0.15)`,
          opacity: 0,
        },
      ],
      { duration: 650 + Math.random() * 250, easing: 'cubic-bezier(.2,.7,.4,1)', fill: 'forwards' },
    );
    anim.onfinish = () => el.remove();
  }
}

export type FloatKind = 'good' | 'bad' | 'bonus';

/** Teks melayang, mis. "+30" atau "−3 detik". */
export function floatText(text: string, x: number, y: number, kind: FloatKind = 'good'): void {
  const host = fxLayer();
  const box = host.getBoundingClientRect();
  const el = h('span', { class: `fx-float fx-float--${kind}` }, text);
  host.append(el);
  const sx = x - box.left;
  const sy = y - box.top;
  const at = (dy: number, s: number) => `translate(${sx}px, ${sy + dy}px) translate(-50%, -50%) scale(${s})`;
  const frames = prefersReducedMotion()
    ? [{ transform: at(0, 1), opacity: 1 }, { transform: at(0, 1), opacity: 0 }]
    : [
        { transform: at(0, 0.7), opacity: 0 },
        { transform: at(-20, 1.1), opacity: 1, offset: 0.2 },
        { transform: at(-70, 1), opacity: 0 },
      ];
  const anim = el.animate(frames, { duration: 900, easing: 'ease-out', fill: 'forwards' });
  anim.onfinish = () => el.remove();
}

/** Kilatan layar penuh (warna dari token lewat atribut data-kind). */
export function flash(kind: 'good' | 'bad'): void {
  const el = $('flash');
  el.dataset.kind = kind;
  el.getAnimations().forEach((a) => a.cancel());
  el.animate([{ opacity: kind === 'good' ? 0.32 : 0.38 }, { opacity: 0 }], {
    duration: prefersReducedMotion() ? 200 : 420,
    easing: 'ease-out',
  });
}

/** Papan permainan bergoyang (dimatikan bila prefers-reduced-motion). */
export function shake(): void {
  if (prefersReducedMotion()) return;
  const el = document.querySelector<HTMLElement>('.game');
  if (!el) return;
  el.classList.remove('shake');
  void el.offsetWidth;
  el.classList.add('shake');
  el.addEventListener('animationend', () => el.classList.remove('shake'), { once: true });
}

/** Memutar ulang animasi CSS yang dipicu sebuah kelas. */
export function restartClass(el: HTMLElement, cls: string): void {
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}

