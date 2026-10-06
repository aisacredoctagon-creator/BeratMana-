/** Helper DOM kecil: ambil elemen wajib, pembuat elemen `h`, dan utilitas teks/gerak. */
export function $<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Elemen #${id} tidak ditemukan`);
  return el as T;
}

export const prefersReducedMotion = (): boolean =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function setText(el: HTMLElement, text: string): void {
  if (el.textContent !== text) el.textContent = text;
}

type AttrValue = string | number | boolean | null | undefined;
export type Child = Node | string | null | undefined | false;

/**
 * Membuat elemen. `attrs`: nama atribut → nilai (true = atribut kosong, false/null/undefined = dilewati).
 * `children`: Node atau string (string menjadi text node, bukan HTML).
 */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, AttrValue> = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) {
    if (value === false || value === null || value === undefined) continue;
    el.setAttribute(name, value === true ? '' : String(value));
  }
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    el.append(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return el;
}

