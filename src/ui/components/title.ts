import { h } from '../dom';

/** Batas tunggu font sebelum animasi tetap jalan dengan font cadangan (font gagal/lambat). */
const FONT_WAIT_MS = 2000;

const pending = new WeakMap<HTMLElement, () => void>();

/**
 * Judul game satu baris: teks pembuka (Montserrat 700) + kata aksen (Montserrat 900, huruf kapital, merah muda).
 * Satu komponen untuk layar game dan layar judul; gaya di src/styles/components/title.css. Lihat DESIGN.md §4.14.
 */
export function createTitle(id: string, lead: string, accent: string): HTMLHeadingElement {
  // spasi di antara dua span dipertahankan di DOM (nama aksesibel "Mana yang lebih Berat?"); secara visual jaraknya dari CSS
  return h('h1', { id, class: 'title-line' }, h('span', { class: 'title-line__lead' }, lead), ' ', h('span', { class: 'title-line__accent' }, accent));
}

/**
 * Memutar animasi "BERAT?" miring sekali (DESIGN.md §4.14): dipanggil layar SETIAP masuk (router.showScreen), bukan tiap ronde.
 * Urutan: lurus (idle) → tunggu font Montserrat + tab terlihat → play (CSS: jeda → jatuh → pantulan → getar) → done (tetap miring).
 * Panggilan baru membatalkan yang lama; satu-satunya timer (batas tunggu font) dan listener dibersihkan. `onImpact` dipanggil
 * saat benturan (akhir fase jatuh, untuk SFX). Dengan prefers-reduced-motion judul langsung miring statis (CSS), tanpa onImpact.
 */
export function playTitleTilt(title: HTMLElement, onImpact?: () => void): void {
  pending.get(title)?.();
  title.dataset.tilt = 'idle';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    title.dataset.tilt = 'done';
    return;
  }
  const accent = title.querySelector('.title-line__accent');
  let cancelled = false;
  let timer = 0;
  let raf = 0;
  const cleanups: Array<() => void> = [];
  const cancel = (): void => {
    cancelled = true;
    clearTimeout(timer);
    cancelAnimationFrame(raf);
    for (const fn of cleanups) fn();
    pending.delete(title);
  };
  pending.set(title, cancel);

  const play = (): void => {
    if (cancelled) return;
    void title.offsetWidth; // pastikan keadaan lurus sudah ter-render sebelum animasi dimulai (ulang yang bersih)
    title.dataset.tilt = 'play';
    let tail = 2; // pantulan (settle) dan getaran (shake) harus sama-sama selesai sebelum keadaan akhir dipasang
    const onEnd = (e: AnimationEvent): void => {
      if (e.target !== accent) return;
      if (e.animationName === 'title-tilt-fall') onImpact?.();
      else if ((e.animationName === 'title-tilt-settle' || e.animationName === 'title-tilt-shake') && --tail === 0) {
        title.dataset.tilt = 'done'; // keadaan akhir: tetap miring, will-change dilepas
        cancel();
      }
    };
    title.addEventListener('animationend', onEnd);
    cleanups.push(() => title.removeEventListener('animationend', onEnd));
  };

  const whenVisible = (): void => {
    if (cancelled) return;
    if (!document.hidden) {
      raf = requestAnimationFrame(play);
      return;
    }
    const onVis = (): void => {
      if (document.hidden) return;
      document.removeEventListener('visibilitychange', onVis);
      whenVisible();
    };
    document.addEventListener('visibilitychange', onVis);
    cleanups.push(() => document.removeEventListener('visibilitychange', onVis));
  };

  // font siap (atau gagal) → lanjut; batas waktu menjaga animasi tetap jalan bila font tak kunjung selesai
  timer = window.setTimeout(whenVisible, FONT_WAIT_MS);
  void document.fonts.ready.then(() => {
    if (cancelled) return;
    clearTimeout(timer);
    whenVisible();
  });
}
