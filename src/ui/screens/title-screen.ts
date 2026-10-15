import { ITEMS } from '../../config/items';
import type { Item } from '../../config/items';
import type { GameSettings } from '../../game/settings';
import { getBest } from '../../services/records';
import { createButton } from '../components/button';
import { createAudioToggle, createSymbolButton } from '../components/controls';
import { createTitle } from '../components/title';
import { h } from '../dom';
import { Seesaw } from '../seesaw';
import { SettingsPanel } from '../settings-panel';

export interface TitleScreen {
  el: HTMLElement;
  panel: SettingsPanel;
  playBtn: HTMLButtonElement;
  howtoBtn: HTMLButtonElement;
  musicToggle: HTMLButtonElement;
  sfxToggle: HTMLButtonElement;
  /** Memperbarui rekor sesuai pengaturan aktif. */
  refresh(): void;
}

const findItem = (id: string): Item => ITEMS.find((i) => i.id === id) ?? (ITEMS[0] as Item);

/** Layar judul: logo (judul), hiasan jungkat-jungkit, tombol Main, pengaturan (selalu tampil), toggle suara + tombol "?" Cara Main. */
export function createTitleScreen(settings: GameSettings, onChange: (s: GameSettings) => void): TitleScreen {
  const deco = new Seesaw({ rock: true });
  deco.showStatic([findItem('feather'), findItem('rock')]);

  const bestValue = h('strong', { id: 'title-best' }, '0');
  const playBtn = createButton({ id: 'btn-play', label: 'Main', variant: 'primary' });
  const howtoBtn = createSymbolButton({ id: 'btn-howto', label: 'Cara Main', icon: 'help' });
  const musicToggle = createAudioToggle({ id: 'tgl-music', kind: 'music' });
  const sfxToggle = createAudioToggle({ id: 'tgl-sfx', kind: 'sfx' });

  const panel = new SettingsPanel(settings, (s) => {
    onChange(s);
    refresh();
  });

  const el = h(
    'main',
    { id: 'screen-title', class: 'screen screen--title', 'aria-labelledby': 'game-title' },
    h(
      'div',
      { class: 'title' },
      h(
        'section',
        { class: 'title__hero' },
        createTitle('game-title', 'menu'),
        deco.el,
        h('div', { class: 'play-block' }, playBtn, h('p', { class: 'best' }, 'Rekor Saya: ', bestValue)),
      ),
      h(
        'section',
        { class: 'title__panel' },
        panel.el,
        h('div', { class: 'toggles' }, musicToggle, sfxToggle, howtoBtn),
      ),
    ),
  );

  function refresh(): void {
    const s = panel.value;
    bestValue.textContent = (getBest(s.mode, s.difficulty) ?? 0).toLocaleString('id-ID'); // null = belum ada rekor
  }
  refresh();

  const api: TitleScreen = {
    el,
    panel,
    playBtn,
    howtoBtn,
    musicToggle,
    sfxToggle,
    refresh,
  };
  return api;
}
