import { createButton } from '../components/button';
import { createSwitch } from '../components/controls';
import { createModal } from '../components/modal';
import type { Modal } from '../components/modal';
import { h } from '../dom';

export interface PauseModal {
  modal: Modal;
  resumeBtn: HTMLButtonElement;
  restartBtn: HTMLButtonElement;
  quitBtn: HTMLButtonElement;
  /** Toggle Musik/SFX (sama dengan beranda, terpisah, tersimpan di localStorage). */
  musicSwitch: HTMLButtonElement;
  sfxSwitch: HTMLButtonElement;
}

/** Modal jeda (bottom sheet di layar sempit): toggle Musik/SFX lalu Lanjut / Ulangi / Keluar. */
export function createPauseModal(): PauseModal {
  const resumeBtn = createButton({ id: 'btn-resume', label: 'Lanjut', variant: 'primary', block: true });
  const restartBtn = createButton({ id: 'btn-restart', label: 'Ulangi', block: true });
  const quitBtn = createButton({ id: 'btn-quit', label: 'Keluar ke Menu', block: true });
  const musicSwitch = createSwitch({ id: 'tgl-music-pause', label: 'Musik', icon: 'music' });
  const sfxSwitch = createSwitch({ id: 'tgl-sfx-pause', label: 'SFX', icon: 'sound' });
  const modal = createModal({
    id: 'overlay-pause',
    title: 'Dijeda',
    body: [h('div', { class: 'toggles' }, musicSwitch, sfxSwitch)],
    actions: [h('div', { class: 'sheet__actions' }, resumeBtn, restartBtn, quitBtn)],
  });
  return { modal, resumeBtn, restartBtn, quitBtn, musicSwitch, sfxSwitch };
}

export interface HowtoModal {
  modal: Modal;
  closeBtn: HTMLButtonElement;
}

const key = (k: string) => h('kbd', {}, k);

/** Modal "Cara Main". */
export function createHowtoModal(): HowtoModal {
  const closeBtn = createButton({ id: 'btn-howto-close', label: 'Mengerti', variant: 'primary', block: true });
  const list = h(
    'ol',
    { class: 'sheet__list' },
    h('li', {}, 'Tiap sisi punya ', h('b', {}, 'hitungan'), '. ', h('b', {}, 'Berat = hasil hitungan'), ', bukan ukuran gambar. Bulu bisa lebih berat dari Batu!'),
    h('li', {}, 'Tekan tombol biru ', key('<'), ' bila sisi ', h('b', {}, 'kiri'), ' lebih berat, tombol merah ', key('>'), ' bila sisi ', h('b', {}, 'kanan'), ' lebih berat.'),
    h('li', {}, h('b', {}, 'Time Attack:'), ' 60 detik. Salah = waktu berkurang. Streak 5 = +2 detik.'),
    h('li', {}, h('b', {}, 'Normal:'), ' tanpa timer, nyawa terbatas. Habis nyawa = game over.'),
    h('li', {}, 'Combo naik tiap 5 jawaban benar berturut-turut (×2, ×3, … maks ×5). Salah = combo kembali ke ×1.'),
    h('li', {}, 'Keyboard: ', key('←'), ' ', key('→'), ' atau ', key('A'), ' ', key('D'), ' menjawab, ', key('Spasi'), ' / ', key('P'), ' jeda.'),
  );
  const modal = createModal({ id: 'overlay-howto', title: 'Cara Main', wide: true, body: [list], actions: [closeBtn] });
  return { modal, closeBtn };
}
