import { ITEMS } from '../../config/items';
import type { Item } from '../../config/items';
import { settingsSummary } from '../../game/settings';
import type { GameSettings } from '../../game/settings';
import { getBest } from '../../services/records';
import { createButton } from '../components/button';
import { createSwitch } from '../components/controls';
import { icon } from '../components/icons';
import { h } from '../dom';
import { Seesaw } from '../seesaw';
import { SettingsPanel } from '../settings-panel';

export interface TitleScreen {
  el: HTMLElement;
  panel: SettingsPanel;
  playBtn: HTMLButtonElement;
  howtoBtn: HTMLButtonElement;
  settingsToggle: HTMLButtonElement;
  musicSwitch: HTMLButtonElement;
  sfxSwitch: HTMLButtonElement;
  /** Memperbarui ringkasan pengaturan dan rekor sesuai pengaturan aktif. */
  refresh(): void;
  setSettingsOpen(open: boolean): void;
  get settingsOpen(): boolean;
}

const findItem = (id: string): Item => ITEMS.find((i) => i.id === id) ?? (ITEMS[0] as Item);

/** Layar judul: logo, tagline, hiasan jungkat-jungkit, tombol Main, pengaturan, toggle suara, Cara Main. */
export function createTitleScreen(settings: GameSettings, onChange: (s: GameSettings) => void): TitleScreen {
  const deco = new Seesaw({ rock: true });
  deco.showStatic([findItem('bulu'), findItem('gajah')]);

  const summary = h('p', { id: 'play-summary', class: 'muted', 'aria-live': 'polite' });
  const bestValue = h('strong', { id: 'title-best' }, '0');
  const playBtn = createButton({ id: 'btn-play', label: 'Main', variant: 'primary' });
  const settingsToggle = createButton({ id: 'btn-settings', label: 'Pengaturan', icon: 'sliders', ariaExpanded: true, ariaControls: 'settings' });
  settingsToggle.classList.add('settings-toggle');
  settingsToggle.append(icon('chevronDown'));
  const howtoBtn = createButton({ id: 'btn-howto', label: 'Cara Main', block: true });
  const musicSwitch = createSwitch({ id: 'tgl-music', label: 'Musik', icon: 'music' });
  const sfxSwitch = createSwitch({ id: 'tgl-sfx', label: 'SFX', icon: 'sound' });

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
        h('h1', { id: 'game-title', class: 'h1 h1--hero' }, 'Berat ', h('span', { class: 'h1__accent' }, 'Mana?')),
        h('p', { class: 'tagline' }, 'Berat = ', h('strong', {}, 'hasil hitungan,'), ' bukan ukuran visual objek!'),
        deco.el,
        h('div', { class: 'play-block' }, playBtn, summary, h('p', { class: 'best' }, 'Rekor: ', bestValue)),
      ),
      h(
        'section',
        { class: 'title__panel' },
        settingsToggle,
        panel.el,
        h('div', { class: 'toggles' }, musicSwitch, sfxSwitch),
        howtoBtn,
      ),
    ),
  );

  function refresh(): void {
    const s = panel.value;
    summary.textContent = settingsSummary(s);
    bestValue.textContent = (getBest(s.mode, s.difficulty) ?? 0).toLocaleString('id-ID'); // null = belum ada rekor
  }
  refresh();

  const api: TitleScreen = {
    el,
    panel,
    playBtn,
    howtoBtn,
    settingsToggle,
    musicSwitch,
    sfxSwitch,
    refresh,
    setSettingsOpen(open) {
      panel.el.hidden = !open;
      settingsToggle.setAttribute('aria-expanded', String(open));
    },
    get settingsOpen() {
      return !panel.el.hidden;
    },
  };
  return api;
}
