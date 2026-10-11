/**
 * Seni statis jungkat-jungkit (SVG inline; warna lewat kelas CSS → token di tokens.css). Koordinat = satuan desain
 * 576 × 260 (sama dengan --ss-*). Semua dekoratif: aria-hidden, tanpa animasi. Lihat DESIGN.md §4.13.
 */
function svg(markup: string): SVGElement {
  const t = document.createElement('template');
  t.innerHTML = markup.trim();
  return t.content.firstElementChild as SVGElement;
}

const NS = 'xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"';

const cloud = (x: number, y: number, s: number): string => {
  const shape = '<circle cx="0" cy="0" r="12"/><circle cx="16" cy="-6" r="15"/><circle cx="34" cy="0" r="12"/><rect x="-12" y="0" width="58" height="12" rx="6"/>';
  return `<g transform="translate(${x} ${y}) scale(${s})"><g class="seesaw__cloud-shade" transform="translate(0 3)">${shape}</g><g class="seesaw__cloud">${shape}</g></g>`;
};

const star = (cx: number, cy: number, big: number, small: number): string => {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 ? small : big;
    return `${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`;
  }).join(' ');
  return `<polygon class="seesaw__star" points="${pts}"/>`;
};

/** Langit: dua awan di samping objek (di antara objek dan titik tumpu, di bawah box soal) dan dua bintang kecil di sudut bawah. */
export const skyArt = (): SVGElement =>
  svg(`<svg class="seesaw__sky" viewBox="0 0 576 260" ${NS}>${cloud(142, 84, 0.95)}${cloud(396, 70, 1.05)}${star(76, 224, 6, 3)}${star(506, 220, 6, 3)}</svg>`);

/** Rumput kecil di tepi tanah. */
export const grassArt = (): SVGElement =>
  svg(`<svg class="seesaw__grass" viewBox="0 0 576 260" ${NS}><path class="seesaw__tuft" d="M120 242l5-16 5 16zM132 242l4-12 4 12zM436 242l5-16 5 16zM448 242l4-12 4 12z"/></svg>`);

/** Penumpu segitiga bulat: badan, separuh kanan lebih gelap (bayangan datar), garis sorot di kiri. */
export const standArt = (): SVGElement =>
  svg(`<svg class="seesaw__stand" viewBox="0 0 116 126" ${NS}><path class="seesaw__stand-main" d="M58 7L108 119H8Z"/><path class="seesaw__stand-dark" d="M58 7L108 119H58Z"/><path class="seesaw__stand-light" d="M32 73L52 23"/></svg>`);
