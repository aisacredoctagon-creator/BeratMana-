import { COMBO_NOTICE } from '../../config/combo';
import { comboNoticeText } from '../../game/combo-notice';
import type { ComboNotice } from '../../game/combo-notice';
import { h, prefersReducedMotion } from '../dom';
import { restartClass } from '../effects';
import { icon } from './icons';

export interface ComboNoticeView {
  el: HTMLElement;
  /** Menampilkan notifikasi; bila yang lama masih tampil, isinya diperbarui (tidak menumpuk). */
  show(n: ComboNotice): void;
  /** Menyembunyikan seketika (jeda, keluar, game over). */
  hide(): void;
}

/**
 * Notifikasi combo di pojok kanan atas area main. Murni dekoratif (aria-hidden, pointer-events: none);
 * pembaca layar mendapat pengumuman lewat live region game. Lihat DESIGN.md §4.12.
 * Animasi: CSS (transform/opacity); partikel: elemen kecil dengan variabel CSS `--kx/--ky` (pecahan −1…1)
 * yang dikalikan token jangkauan, jumlahnya dibatasi per tingkat (COMBO_NOTICE.particles).
 */
export function createComboNotice(): ComboNoticeView {
  const sparks = h('span', { class: 'combo-notice__sparks' });
  const iconSlot = h('span', { class: 'combo-notice__icon' });
  const text = h('span', { class: 'combo-notice__text' });
  const face = h('span', { class: 'combo-notice__face' }, iconSlot, text);
  const el = h('div', { class: 'combo-notice', 'aria-hidden': 'true', 'data-level': '1', 'data-kind': 'warmup' }, sparks, face);

  const clear = (): void => {
    el.classList.remove('is-on', 'is-enter', 'is-swap');
    sparks.replaceChildren();
  };
  // bila animasi selesai (atau dihentikan), bersihkan; animasi anak (partikel, kilau) tidak ikut dihitung
  el.addEventListener('animationend', (e) => {
    if (e.target === el) clear();
  });

  function spawnSparks(count: number): void {
    sparks.replaceChildren();
    if (count <= 0 || prefersReducedMotion()) return;
    for (let i = 0; i < count; i++) {
      const angle = Math.PI + ((i + 0.5) / count) * (Math.PI / 2); // kiri → atas: tidak keluar tepi kanan layar, tidak turun ke kartu
      const reach = 0.7 + ((i * 37) % 10) / 33; // 0,7–1,0: variasi tanpa acak (stabil dan murah)
      const s = h('span', { class: 'combo-notice__spark' });
      s.style.setProperty('--kx', (Math.cos(angle) * reach).toFixed(3));
      s.style.setProperty('--ky', (Math.sin(angle) * reach).toFixed(3));
      s.style.setProperty('--kd', (i / count).toFixed(3));
      sparks.append(s);
    }
  }

  return {
    el,
    show(n) {
      const wasOn = el.classList.contains('is-on');
      el.dataset.level = String(n.level);
      el.dataset.kind = n.kind;
      text.textContent = comboNoticeText(n);
      iconSlot.replaceChildren(icon(n.level >= 2 ? 'fire' : 'star'));
      spawnSparks(COMBO_NOTICE.particles[n.level - 1] ?? 0);
      el.classList.remove('is-enter', 'is-swap');
      el.classList.add('is-on');
      // masuk dari pinggir bila baru; bila menggantikan yang masih tampil, cukup "pop" di tempat
      restartClass(el, wasOn ? 'is-swap' : 'is-enter');
    },
    hide: clear,
  };
}
