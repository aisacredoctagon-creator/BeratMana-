// Merakit potongan vektor hasil ekspor Figma (scripts/figma-src/*.svg) menjadi SVG utuh:
//   public/assets/seesaw/stand.svg
// (benda di public/assets/items/ digambar langsung sebagai SVG proyek; skrip ini tidak menyentuhnya)
// Posisi tiap potongan diturunkan dari persentase inset pada kode referensi Figma
// (frame 17:248). Jalankan sekali: node scripts/build-figma-art.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const src = (name) => readFileSync(`scripts/figma-src/${name}.svg`, 'utf8');

/** Mengambil isi di dalam <svg ...>...</svg> beserta viewBox aslinya. */
function parse(name) {
  const raw = src(name);
  const open = raw.match(/<svg[^>]*>/)[0];
  const viewBox = open.match(/viewBox="([^"]+)"/)[1];
  const inner = raw.slice(raw.indexOf('>', raw.indexOf('<svg')) + 1, raw.lastIndexOf('</svg>'));
  return { viewBox, inner };
}

const pct = (s) => parseFloat(s) / 100;

/**
 * part: { file, outer: [top,right,bottom,left] (persen dari container), inner: [top,right,bottom,left]
 *         (persen dari kotak part) atau {x: [l,r] px} }
 */
function place(container, part) {
  const [ot, or, ob, ol] = part.outer.map(pct);
  const cb = {
    x: container.w * ol,
    y: container.h * ot,
    w: container.w * (1 - ol - or),
    h: container.h * (1 - ot - ob),
  };
  let box;
  if (part.innerPx) {
    box = { x: cb.x - part.innerPx, y: cb.y, w: cb.w + part.innerPx * 2, h: cb.h };
  } else {
    const [it, ir, ib, il] = (part.inner ?? [0, 0, 0, 0]).map(pct);
    box = {
      x: cb.x + cb.w * il,
      y: cb.y + cb.h * it,
      w: cb.w * (1 - il - ir),
      h: cb.h * (1 - it - ib),
    };
  }
  return box;
}

function compose({ container, parts, origin }) {
  const boxes = parts.map((p) => ({ p, box: place(container, p) }));
  const minX = Math.min(...boxes.map((b) => b.box.x));
  const minY = Math.min(...boxes.map((b) => b.box.y));
  const maxX = Math.max(...boxes.map((b) => b.box.x + b.box.w));
  const maxY = Math.max(...boxes.map((b) => b.box.y + b.box.h));
  const vb = origin ?? { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  const f = (n) => Number(n.toFixed(3));
  const nested = boxes
    .map(({ p, box }) => {
      const { viewBox, inner } = parse(p.file);
      return `<svg x="${f(box.x)}" y="${f(box.y)}" width="${f(box.w)}" height="${f(box.h)}" viewBox="${viewBox}" preserveAspectRatio="none" overflow="visible" fill="none">${inner}</svg>`;
    })
    .join('\n  ');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f(vb.x)} ${f(vb.y)} ${f(vb.w)} ${f(vb.h)}">\n  ${nested}\n</svg>\n`;
}

const beam = { w: 576, h: 124 };

// ---------- penyangga segitiga (17:293, 80 x 112) ----------
const stand = compose({
  container: { w: 80, h: 112 },
  origin: { x: 0, y: 0, w: 80, h: 112 },
  parts: [
    { file: 'vector14', outer: ['9.82%', '6.25%', '5.36%', '6.25%'], inner: ['-0.64%', '-2.5%', '-1.84%', '-2.5%'] },
    { file: 'vector15', outer: ['13.39%', '24.38%', '8.04%', '50%'] },
    { file: 'vector16', outer: ['13.39%', '50%', '8.04%', '50%'], innerPx: 1.25 },
  ],
});
writeFileSync('public/assets/seesaw/stand.svg', stand);

console.log('stand.svg dibuat');
