import './styles/fonts.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components/button.css';
import './styles/components/card.css';
import './styles/components/pill.css';
import './styles/components/controls.css';
import './styles/components/hud.css';
import './styles/components/combo-notice.css';
import './styles/components/seesaw.css';
import './styles/components/overlay.css';
import './styles/screens/title.css';
import './styles/screens/game.css';
import './styles/screens/over.css';
import './styles/motion.css';

import { preloadItems } from './config/items';
import { AudioManager } from './services/audio';
import { shareText } from './services/share';
import { loadBest, loadSettings, saveBest, saveSettings } from './services/storage';
import { setSwitch } from './ui/components/controls';
import { toast } from './ui/components/toast';
import { $, h } from './ui/dom';
import { installSpringEasing } from './ui/effects';
import { GameView } from './ui/game-view';
import type { GameEnd } from './ui/game-view';
import { createGameScreen } from './ui/screens/game-screen';
import { createHowtoModal, createPauseModal } from './ui/screens/overlays';
import { createOverScreen, shareMessage } from './ui/screens/over-screen';
import type { OverData } from './ui/screens/over-screen';
import { currentScreen, showScreen } from './ui/screens/router';
import { createTitleScreen } from './ui/screens/title-screen';

installSpringEasing();
void preloadItems();

/* ================= merakit layar dari komponen ================= */
const audio = new AudioManager();
audio.startMusic(); // baru benar-benar berbunyi setelah interaksi pertama (aturan autoplay)

const title = createTitleScreen(loadSettings(), saveSettings);
const gameScreen = createGameScreen();
const over = createOverScreen();
const pause = createPauseModal();
const howto = createHowtoModal();

$('app').append(
  title.el,
  gameScreen.el,
  over.el,
  pause.modal.el,
  howto.modal.el,
  h('div', { id: 'flash', class: 'flash', 'aria-hidden': 'true' }),
  h('div', { id: 'sr-status', class: 'sr-only', role: 'status', 'aria-live': 'polite' }),
);
showScreen('title');

/* ================= pengaturan terbuka/terlipat ================= */
const wide = matchMedia('(min-width: 900px) and (min-height: 620px)');
title.setSettingsOpen(wide.matches);
wide.addEventListener('change', () => title.setSettingsOpen(wide.matches));
title.settingsToggle.addEventListener('click', () => title.setSettingsOpen(!title.settingsOpen));

/* ================= audio ================= */
// toggle Musik/SFX ada di dua tempat (beranda dan pop-up Dijeda) dan selalu searah
const switchPairs = [
  { music: title.musicSwitch, sfx: title.sfxSwitch },
  { music: pause.musicSwitch, sfx: pause.sfxSwitch },
];
const syncAudio = (): void => {
  for (const pair of switchPairs) {
    setSwitch(pair.music, audio.prefs.music);
    setSwitch(pair.sfx, audio.prefs.sfx);
  }
};
audio.onChange(syncAudio);
syncAudio();
for (const pair of switchPairs) {
  pair.music.addEventListener('click', () => audio.setMusic(!audio.prefs.music));
  pair.sfx.addEventListener('click', () => {
    audio.setSfx(!audio.prefs.sfx);
    audio.play('click');
  });
}

// audio hanya aktif setelah gestur pertama
const unlock = (): void => audio.unlock();
for (const type of ['pointerdown', 'keydown', 'touchend'] as const) {
  document.addEventListener(type, unlock, { capture: true, passive: true });
}

// bunyi klik untuk tombol UI (tombol jawab, jeda, dan toggle SFX punya bunyi/aturan sendiri)
document.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest('button');
  if (!btn || btn.classList.contains('answer')) return;
  if (['btn-pause', 'btn-resume', 'tgl-sfx', 'tgl-sfx-pause'].includes(btn.id)) return;
  audio.play('click');
});
title.panel.el.addEventListener('change', () => audio.play('click'));

/* ================= alur permainan ================= */
let lastOver: OverData | null = null;

const game = new GameView(audio, gameScreen, pause, onGameEnd);

function startGame(): void {
  showScreen('game');
  game.start({ ...title.panel.value, types: [...title.panel.value.types] });
}

function toTitle(): void {
  game.stop();
  title.refresh();
  showScreen('title');
  title.playBtn.focus({ preventScroll: true });
}

function onGameEnd({ summary, engine }: GameEnd): void {
  const { mode, difficulty } = engine.settings;
  const previous = loadBest(mode, difficulty);
  const isRecord = summary.score > previous && summary.score > 0;
  if (isRecord) saveBest(mode, difficulty, summary.score);
  lastOver = { summary, settings: engine.settings, best: Math.max(previous, summary.score), isRecord };
  over.render(lastOver);
  showScreen('over');
  over.againBtn.focus({ preventScroll: true });
}

title.playBtn.addEventListener('click', startGame);
over.againBtn.addEventListener('click', startGame); // pengaturan sama: panel tidak berubah selama bermain
over.homeBtn.addEventListener('click', toTitle);
over.shareBtn.addEventListener('click', async () => {
  if (!lastOver) return;
  const url = `${location.origin}${location.pathname}`;
  const result = await shareText(shareMessage(lastOver), url);
  if (result === 'copied') toast('Hasil disalin ke papan klip');
  else if (result === 'failed') toast('Gagal membagikan. Salin manual ya.');
});

/* ================= modal ================= */
title.howtoBtn.addEventListener('click', () => howto.modal.open(howto.closeBtn));
howto.closeBtn.addEventListener('click', () => howto.modal.close());
howto.modal.el.addEventListener('click', (e) => {
  if (e.target === howto.modal.el) howto.modal.close();
});

pause.resumeBtn.addEventListener('click', () => game.resume());
pause.restartBtn.addEventListener('click', () => {
  game.stop();
  startGame();
});
pause.quitBtn.addEventListener('click', toTitle);

/* ================= keyboard ================= */
const isInteractive = (el: Element | null): boolean =>
  !!el && (el.matches('button, a, input, select, textarea, [role="switch"]') || (el as HTMLElement).isContentEditable);

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;

  if (howto.modal.isOpen) {
    if (e.key === 'Escape') howto.modal.close();
    else howto.modal.handleKey(e);
    return;
  }
  if (pause.modal.isOpen) {
    if (e.key === 'Escape' || e.key.toLowerCase() === 'p') game.resume();
    else pause.modal.handleKey(e);
    return;
  }

  const key = e.key.toLowerCase();
  if (currentScreen() !== 'game' || e.repeat) return;
  if (key === 'arrowleft' || key === 'a') {
    e.preventDefault();
    game.answer('left');
  } else if (key === 'arrowright' || key === 'd') {
    e.preventDefault();
    game.answer('right');
  } else if (key === 'p' || key === 'escape') {
    game.pause();
  } else if (key === ' ' && !isInteractive(document.activeElement)) {
    // Spasi menjeda hanya bila fokus tidak di tombol/input (agar tidak merusak aktivasi keyboard standar)
    e.preventDefault();
    game.pause();
  }
});

/* ================= tab disembunyikan ================= */
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    game.pause();
    audio.setActive(false);
  } else {
    audio.setActive(!game.isPaused);
  }
});

/* ================= PWA ================= */
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => undefined);
  });
}
