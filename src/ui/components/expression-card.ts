import { formatValue, spokenLabel, visualLength } from '../../generator/expression';
import type { Expr, Token } from '../../generator/expression';
import { h } from '../dom';

type Side = 'left' | 'right';
type Size = 's' | 'm' | 'l' | 'xl';
export type CardResult = 'win' | 'wrong' | 'lose';

function tokenNode(k: Token): Node {
  if (k.t === 'txt') return h('span', { class: 'op' }, k.v);
  return h('span', { class: 'frac' }, h('span', { class: 'frac__n' }, String(k.n)), h('span', { class: 'frac__d' }, String(k.d)));
}

/** Ukuran font ekspresi menurut panjang visual supaya selalu muat (termasuk di 360px). */
export function sizeClass(tokens: readonly Token[]): Size {
  const len = visualLength(tokens);
  return len <= 7 ? 's' : len <= 10 ? 'm' : len <= 14 ? 'l' : 'xl';
}

export interface ExpressionCard {
  el: HTMLElement;
  /** Menampilkan ekspresi baru dan menghapus hasil sebelumnya. */
  set(expr: Expr): void;
  /** Menampilkan nilai hasil hitungan dan menandai kartu: win (lebih berat), wrong (dipilih tetapi salah), lose (sisanya). */
  reveal(expr: Expr, result: CardResult): void;
  clear(): void;
}

/**
 * Box soal bergaya speech bubble: tag "SISI KIRI/KANAN" + ekspresi + baris nilai, dengan ekor kecil di bawah.
 * Dipasang di dalam jungkat-jungkit (menempel di atas objek). Lihat DESIGN.md §4.4.
 */
export function createExpressionCard(side: Side, id: string): ExpressionCard {
  const expr = h('span', { class: 'expr-card__expr', id: `${id}-expr` });
  const valueText = h('span', { class: 'expr-card__value-text' });
  const el = h(
    'div',
    { id, class: `expr-card expr-card--${side}`, role: 'group', 'data-size': 's' },
    h('span', { class: 'tag' }, side === 'left' ? 'Sisi kiri' : 'Sisi kanan'),
    expr,
    h('span', { class: 'expr-card__value', 'aria-hidden': 'true' }, valueText),
    h('span', { class: 'expr-card__tail', 'aria-hidden': 'true' }),
  );
  return {
    el,
    set(e) {
      expr.replaceChildren(...e.tokens.map(tokenNode));
      el.dataset.size = sizeClass(e.tokens);
      el.dataset.expr = e.label; // ekspresi mentah untuk pengujian; aria-label memakai kata ("2 kali 21")
      el.setAttribute('aria-label', `Sisi ${side === 'left' ? 'kiri' : 'kanan'}: ${spokenLabel(e)}`);
      el.removeAttribute('data-result');
      valueText.textContent = '';
    },
    reveal(e, result) {
      valueText.textContent = `= ${formatValue(e.value)}`;
      el.dataset.result = result;
    },
    clear() {
      el.removeAttribute('data-result');
      valueText.textContent = '';
    },
  };
}
