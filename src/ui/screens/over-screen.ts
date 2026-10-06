import { DIFFICULTY_CONFIG, MODE_INFO } from '../../config/difficulty';
import type { RunSummary } from '../../game/engine';
import { settingsSummary } from '../../game/settings';
import type { GameSettings } from '../../game/settings';
import { createButton } from '../components/button';
import { icon } from '../components/icons';
import type { IconName } from '../components/icons';
import { createPill, createStarTile, pillIcon } from '../components/pill';
import type { PillVariant } from '../components/pill';
import { h, setText } from '../dom';

export interface OverData {
  summary: RunSummary;
  settings: GameSettings;
  best: number;
  isRecord: boolean;
}

const fmt = (n: number): string => n.toLocaleString('id-ID');

export function shareMessage(d: OverData): string {
  const { summary: s, settings } = d;
  return (
    `Aku dapat ${fmt(s.score)} poin di Berat Mana? (${settingsSummary(settings)}) — ` +
    `akurasi ${s.accuracy}%, streak terpanjang ${s.maxStreak}. Bisa kalahkan aku?`
  );
}

export interface OverScreen {
  el: HTMLElement;
  againBtn: HTMLButtonElement;
  homeBtn: HTMLButtonElement;
  shareBtn: HTMLButtonElement;
  render(d: OverData): void;
}

/** Layar game over: skor, rekor, statistik, ringkasan pengaturan, aksi. Lihat DESIGN.md §10 (A14). */
export function createOverScreen(): OverScreen {
  const title = h('h2', { id: 'over-title', class: 'h2' }, 'Game Over');
  const reason = h('p', { id: 'over-reason', class: 'muted over__reason' });
  const record = h('div', { id: 'over-record', class: 'ribbon', hidden: true }, icon('trophy'), 'REKOR BARU!');
  const score = createPill({ variant: 'score', lead: createStarTile(), label: 'Skor', value: '0' });
  score.el.classList.add('score-hero');

  const stat = (variant: PillVariant, ic: IconName, label: string) => {
    const p = createPill({ variant, lead: pillIcon(icon(ic)), label, value: '0' });
    return p;
  };
  const best = stat('score', 'trophy', 'Rekor terbaik');
  const accuracy = stat('time', 'target', 'Akurasi');
  const streak = stat('combo', 'streak', 'Streak maks');
  const counts = stat('level', 'check', 'Benar / Salah');
  score.value!.id = 'over-score';
  best.value!.id = 'over-best';
  accuracy.value!.id = 'over-accuracy';
  streak.value!.id = 'over-streak';
  counts.value!.id = 'over-counts';
  const summary = h('p', { id: 'over-summary', class: 'muted' });

  const againBtn = createButton({ id: 'btn-again', label: 'Main Lagi', variant: 'primary', block: true });
  const homeBtn = createButton({ id: 'btn-home', label: 'Ke Beranda', block: true });
  const shareBtn = createButton({ id: 'btn-share', label: 'Bagikan', icon: 'share', block: true });

  const el = h(
    'section',
    { id: 'screen-over', class: 'screen screen--over', hidden: true, 'aria-labelledby': 'over-title' },
    h(
      'div',
      { class: 'panel over' },
      title,
      reason,
      record,
      score.el,
      h('div', { class: 'stats' }, best.el, accuracy.el, streak.el, counts.el),
      summary,
      h('div', { class: 'over__actions' }, againBtn, homeBtn, shareBtn),
    ),
  );

  return {
    el,
    againBtn,
    homeBtn,
    shareBtn,
    render(d) {
      const s = d.summary;
      setText(title, s.reason === 'time' ? 'Waktu Habis!' : s.reason === 'lives' ? 'Nyawa Habis!' : 'Game Over');
      setText(reason, `${MODE_INFO[d.settings.mode].name} • ${DIFFICULTY_CONFIG[d.settings.difficulty].label}`);
      record.hidden = !d.isRecord;
      setText(score.value!, fmt(s.score));
      setText(best.value!, fmt(d.best));
      setText(accuracy.value!, `${s.accuracy}%`);
      setText(streak.value!, String(s.maxStreak));
      setText(counts.value!, `${s.correct} / ${s.wrong}`);
      setText(summary, `Pengaturan: ${settingsSummary(d.settings)}`);
    },
  };
}
