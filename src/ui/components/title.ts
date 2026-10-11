import { h } from '../dom';

/**
 * Judul game satu baris: teks pembuka (Montserrat 700) + kata aksen (Montserrat 900, huruf kapital, merah muda).
 * Satu komponen untuk layar game dan layar judul; gaya di src/styles/components/title.css. Lihat DESIGN.md §4.14.
 */
export function createTitle(id: string, lead: string, accent: string): HTMLHeadingElement {
  // spasi di antara dua span dipertahankan di DOM (nama aksesibel "Mana yang lebih Berat?"); secara visual jaraknya dari CSS
  return h('h1', { id, class: 'title-line' }, h('span', { class: 'title-line__lead' }, lead), ' ', h('span', { class: 'title-line__accent' }, accent));
}
