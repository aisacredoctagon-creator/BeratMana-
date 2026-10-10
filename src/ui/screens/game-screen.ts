import { createAnswerButton } from '../components/button';
import { createComboNotice } from '../components/combo-notice';
import type { ComboNoticeView } from '../components/combo-notice';
import { createExpressionCard } from '../components/expression-card';
import type { ExpressionCard } from '../components/expression-card';
import { h } from '../dom';
import { Hud } from '../hud';
import { Seesaw } from '../seesaw';

export interface GameScreen {
  el: HTMLElement;
  hud: Hud;
  seesaw: Seesaw;
  cardLeft: ExpressionCard;
  cardRight: ExpressionCard;
  btnLeft: HTMLButtonElement;
  btnRight: HTMLButtonElement;
  comboNotice: ComboNoticeView;
}

/** Layar game: HUD, judul, dua kartu, jungkat-jungkit, tombol jawab. Pintasan keyboard dijelaskan di Cara Main. */
export function createGameScreen(): GameScreen {
  const hud = new Hud();
  const seesaw = new Seesaw({ id: 'seesaw' });
  const cardLeft = createExpressionCard('left', 'card-left');
  const cardRight = createExpressionCard('right', 'card-right');
  const btnLeft = createAnswerButton('left', 'btn-left', 'Kiri lebih berat (←)');
  const btnRight = createAnswerButton('right', 'btn-right', 'Kanan lebih berat (→)');
  const comboNotice = createComboNotice();

  const el = h(
    'section',
    { id: 'screen-game', class: 'screen screen--game', hidden: true, 'aria-label': 'Permainan', 'data-mode': 'time' },
    hud.el,
    h(
      'div',
      { class: 'game' },
      comboNotice.el,
      h(
        'div',
        { class: 'game__head' },
        h('h1', { id: 'question', class: 'h1' }, 'Mana yang Lebih ', h('span', { class: 'h1__accent' }, 'Berat?')),
      ),
      h('div', { class: 'game__cards' }, cardLeft.el, cardRight.el),
      h('div', { class: 'game__board' }, seesaw.el, h('div', { id: 'fx-layer', class: 'fx-layer', 'aria-hidden': 'true' })),
      h('div', { class: 'game__answers' }, btnLeft, btnRight),
    ),
  );

  return { el, hud, seesaw, cardLeft, cardRight, btnLeft, btnRight, comboNotice };
}
