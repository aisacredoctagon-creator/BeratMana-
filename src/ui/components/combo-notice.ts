import { COMBO_FONT_FAMILY, COMBO_NOTICE } from '../../config/combo';
import { comboNoticeText } from '../../game/combo-notice';
import type { ComboNotice } from '../../game/combo-notice';
import { h, prefersReducedMotion } from '../dom';
import { restartClass } from '../effects';

export interface ComboNoticeView {
  el: HTMLElement;
  /** Menampilkan notifikasi; bila yang lama masih tampil, isinya diperbarui (tidak menumpuk). */
  show(n: ComboNotice): void;
  /** Menyembunyikan seketika (jeda, keluar, game over). */
  hide(): void;
}

/**
 * Notifikasi combo arcade: teks besar tanpa wadah di bawah judul, meluncur dari tepi kanan layar. Murni dekoratif
 * (aria-hidden, pointer-events: none); pembaca layar mendapat pengumuman lewat live region game. Lihat DESIGN.md §4.12.
 * Animasi: CSS (transform/opacity); partikel: elemen kecil dengan variabel CSS `--kx/--ky` (pecahan −1…1) yang dikalikan
 * token jangkauan, jumlahnya dibatasi per tingkat (COMBO_NOTICE.particles).
 */
export function createComboNotice(): ComboNoticeView {
  // font arcade dimuat saat layar dirakit supaya notifikasi pertama tidak tampil dengan font cadangan
  void document.fonts?.load(`400 ${getComputedStyle(document.documentElement).fontSize} ${COMBO_FONT_FAMILY}`).catch(() => undefined);

  const sparks = h('span', { class: 'combo-notice__sparks' });
  const face = h('span', { class: 'combo-notice__face' });
  const slot = h('div', { class: 'combo-notice__slot' }, sparks, face);
  const el = h('div', { class: 'combo-notice', 'aria-hidden': 'true', 'data-level': '1', 'data-kind': 'warmup' }, slot);

  const clear = (): void => {
    el.classList.remove('is-on', 'is-enter', 'is-swap');
    sparks.replaceChildren();
  };
  // bila animasi selesai (atau dihentikan), bersihkan; animasi anak (denyut, partikel) tidak ikut dihitung
  el.addEventListener('animationend', (e) => {
    if (e.target === slot) clear();
  });

  /** "COMBO ×2!" → kata + angka pengali besar; "MAKS ×5 · 25" → kata + pengali + streak kecil. Teks sumber = comboNoticeText. */
  function renderText(text: string): void {
    const [word = '', num = '', ...rest] = text.split(' ');
    const part = (cls: string, s: string): HTMLElement => h('span', { class: cls, 'data-text': s }, s);
    face.replaceChildren(part('combo-notice__word', word), part('combo-notice__num', num));
    if (rest.length > 0) face.append(part('combo-notice__extra', rest.join(' ')));
  }

  function spawnSparks(count: number): void {
    sparks.replaceChildren();
    if (count <= 0 || prefersReducedMotion()) return;
    for (let i = 0; i < count; i++) {
      const angle = Math.PI * (0.75 + ((i + 0.5) / count) * 0.75); // kiri-bawah → kiri → atas: ke arah dalam layar, tidak ke tepi kanan
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
      renderText(comboNoticeText(n));
      spawnSparks(COMBO_NOTICE.particles[n.level - 1] ?? 0);
      el.classList.remove('is-enter', 'is-swap');
      el.classList.add('is-on');
      // masuk dari tepi kanan bila baru; bila menggantikan yang masih tampil, cukup "hantam" di tempat
      restartClass(el, wasOn ? 'is-swap' : 'is-enter');
    },
    hide: clear,
  };
}
