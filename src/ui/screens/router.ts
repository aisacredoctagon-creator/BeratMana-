import { playTitleTilt } from '../components/title';
import { $ } from '../dom';

export type ScreenId = 'title' | 'game' | 'over';

const IDS: Record<ScreenId, string> = { title: 'screen-title', game: 'screen-game', over: 'screen-over' };

let titleImpact: (() => void) | undefined;

/** Dipasang sekali oleh main.ts: SFX saat "BERAT?" membentur sudut miring (mengikuti toggle SFX lewat AudioManager). */
export function setTitleImpact(fn: () => void): void {
  titleImpact = fn;
}

export function showScreen(id: ScreenId): void {
  for (const key of Object.keys(IDS) as ScreenId[]) {
    $(IDS[key]).hidden = key !== id;
  }
  // layar yang memuat judul memutar animasi "BERAT?" setiap kali masuk (sesi baru / kembali ke beranda), bukan tiap ronde
  if (id === 'title' || id === 'game') {
    const title = $(IDS[id]).querySelector<HTMLElement>('.title-line');
    if (title) playTitleTilt(title, titleImpact);
  }
}

export function currentScreen(): ScreenId {
  return (Object.keys(IDS) as ScreenId[]).find((k) => !$(IDS[k]).hidden) ?? 'title';
}
