import type { Item } from '../config/items';
import type { Side } from '../generator';
import { h } from './dom';

export type SeesawState = 'idle' | 'entering' | 'ready' | 'revealing' | 'leaving';

/** Jangkar nol-ukuran di atas objek; diputar balik terhadap papan supaya box soal di dalamnya selalu tegak. */
const anchor = (box?: HTMLElement) => (box ? h('div', { class: 'seesaw__anchor' }, box) : null);

/**
 * Komponen jungkat-jungkit (DESIGN.md §4.13). Hanya mengubah atribut data-state, variabel CSS --tilt,
 * dan gambar benda; semua gerak dilakukan CSS lewat transform/opacity (pegas di seesaw.css).
 */
export class Seesaw {
  readonly el: HTMLElement;
  private readonly beam: HTMLElement;
  private readonly imgs: { left: HTMLImageElement; right: HTMLImageElement };
  private readonly verdict: HTMLElement;

  constructor(opts: { rock?: boolean; id?: string; bubbles?: { left: HTMLElement; right: HTMLElement } } = {}) {
    // width/height = rasio intrinsik 1:1 (mencegah layout shift); ukuran tampil tetap diatur CSS
    const imgL = h('img', { alt: '', decoding: 'async', draggable: false, width: 200, height: 200 });
    const imgR = h('img', { alt: '', decoding: 'async', draggable: false, width: 200, height: 200 });
    this.imgs = { left: imgL, right: imgR };
    this.beam = h(
      'div',
      { class: 'seesaw__beam' },
      h('div', { class: 'seesaw__plank' }, h('span', { class: 'seesaw__shine' })),
      h('div', { class: 'seesaw__item seesaw__item--left' }, imgL, anchor(opts.bubbles?.left)),
      h('div', { class: 'seesaw__item seesaw__item--right' }, imgR, anchor(opts.bubbles?.right)),
    );
    this.verdict = h('div', { class: 'seesaw__verdict', 'aria-hidden': 'true' });
    this.el = h(
      'div',
      { id: opts.id, class: opts.rock ? 'seesaw seesaw--rock' : 'seesaw', 'data-state': 'idle', role: opts.bubbles ? 'group' : 'img' },
      this.beam,
      h('img', { class: 'seesaw__stand', src: `${import.meta.env.BASE_URL}assets/seesaw/stand.svg`, alt: '', width: 80, height: 112, draggable: false }),
      h('div', { class: 'seesaw__base' }),
      h('div', { class: 'seesaw__pin' }),
      this.verdict,
    );
  }

  get state(): SeesawState {
    return this.el.dataset.state as SeesawState;
  }

  private setState(s: SeesawState): void {
    this.el.dataset.state = s;
  }

  private setTilt(side: Side | null): void {
    const v = side === null ? '0deg' : side === 'left' ? 'calc(-1 * var(--ss-tilt))' : 'var(--ss-tilt)';
    this.beam.style.setProperty('--tilt', v);
  }

  setLabel(text: string): void {
    this.el.setAttribute('aria-label', text);
  }

  /** Mengganti gambar benda tanpa animasi (dekorasi layar judul). */
  setItems(items: readonly [Item, Item]): void {
    this.imgs.left.src = items[0].src;
    this.imgs.right.src = items[1].src;
    // puncak objek yang sebenarnya (untuk menempelkan ujung ekor box soal)
    this.beam.querySelector<HTMLElement>('.seesaw__item--left')?.style.setProperty('--item-top', String(items[0].top ?? 0));
    this.beam.querySelector<HTMLElement>('.seesaw__item--right')?.style.setProperty('--item-top', String(items[1].top ?? 0));
  }

  /** Menampilkan dekorasi diam: benda terlihat, papan bebas bergoyang lewat CSS. */
  showStatic(items: readonly [Item, Item]): void {
    this.setItems(items);
    this.setState('ready');
  }

  /** Benda baru masuk (papan datar). */
  present(items: readonly [Item, Item]): void {
    this.setTilt(null);
    this.setItems(items);
    this.clearVerdict();
    this.fade(null);
    this.setState('entering');
  }

  ready(): void {
    if (this.state === 'entering') this.setState('ready');
  }

  /** Memiringkan ke sisi yang lebih berat. */
  reveal(heavier: Side): void {
    this.setTilt(heavier);
    this.setState('revealing');
  }

  /** Sisi benar saat jawaban salah di-fade (box + objek); null = tanpa fade. Dilepas saat ronde baru/reset. */
  fade(side: Side | null): void {
    for (const s of ['left', 'right'] as const) {
      const item = this.beam.querySelector<HTMLElement>(`.seesaw__item--${s}`);
      if (s === side) item?.setAttribute('data-faded', '');
      else item?.removeAttribute('data-faded');
    }
  }

  /** Benda keluar dan papan kembali datar. */
  leave(): void {
    this.setTilt(null);
    this.setState('leaving');
  }

  reset(): void {
    this.setTilt(null);
    this.clearVerdict();
    this.fade(null);
    this.setState('idle');
  }

  /** Pil hasil "Benar!" / "Salah" (teks saja, tanpa ikon; latar hijau/merah). */
  showVerdict(ok: boolean): void {
    this.verdict.dataset.v = '';
    void this.verdict.offsetWidth; // mulai ulang animasi
    this.verdict.replaceChildren(ok ? 'Benar!' : 'Salah');
    this.verdict.dataset.v = ok ? 'ok' : 'bad';
  }

  clearVerdict(): void {
    this.verdict.dataset.v = '';
  }

  /** Titik di sekitar titik tumpu (koordinat viewport) untuk efek partikel. */
  center(): { x: number; y: number } {
    const r = this.el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height * 0.4 };
  }
}
