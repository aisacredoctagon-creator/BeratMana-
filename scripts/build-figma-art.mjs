// Merakit potongan vektor hasil ekspor Figma (scripts/figma-src/*.svg) menjadi SVG utuh:
//   public/assets/items/gajah.svg, public/assets/items/bulu.svg, public/assets/seesaw/stand.svg
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

// ---------- gajah (grup 17:672) ----------
const elephant = compose({
  container: beam,
  parts: [
    { file: 'vector', outer: ['2.32%', '8.14%', '60.52%', '81.86%'], inner: ['-2.17%', '-1.74%', '-2.17%', '-1.74%'] },
    { file: 'vector1', outer: ['0%', '12.81%', '72.13%', '81.19%'], inner: ['-2.89%', '13.77%', '13.77%', '-2.89%'] },
    { file: 'vector2', outer: ['4.65%', '13.56%', '74.59%', '84.14%'], inner: ['-3.88%', '9.12%', '12.78%', '-7.53%'] },
    { file: 'vector3', outer: ['9.68%', '16.23%', '84.9%', '82.61%'], inner: ['0%', '16.67%', '16.67%', '0%'] },
    { file: 'vector4', outer: ['10.3%', '16.78%', '87.85%', '82.82%'], inner: ['0%', '16.67%', '16.67%', '0%'] },
    { file: 'vector5', outer: ['15.48%', '15.64%', '79.87%', '83.36%'], inner: ['0%', '16.67%', '16.67%', '0%'] },
    { file: 'vector6', outer: ['17.03%', '17.81%', '67.51%', '80.56%'], inner: ['-14.61%', '-13.06%', '2.06%', '-29.73%'] },
    { file: 'vector7', outer: ['30.97%', '14.14%', '55.1%', '84.52%'], inner: ['-4.63%', '6.25%', '12.04%', '-10.42%'] },
    { file: 'vector8', outer: ['32.52%', '12.14%', '55.1%', '86.52%'], inner: ['0%', '16.67%', '16.67%', '0%'] },
    { file: 'vector7', outer: ['30.97%', '10.48%', '55.1%', '88.19%'], inner: ['-4.63%', '6.25%', '12.04%', '-10.42%'] },
    { file: 'vector9', outer: ['32.52%', '8.81%', '55.1%', '89.86%'], inner: ['0%', '16.67%', '16.67%', '0%'] },
    { file: 'vector10', outer: ['20.13%', '7.27%', '70.58%', '91.52%'], inner: ['-10.42%', '-0.59%', '6.25%', '-17.26%'] },
  ],
});
writeFileSync('public/assets/items/gajah.svg', elephant);

// ---------- bulu (grup 17:673) ----------
const feather = compose({
  container: beam,
  parts: [
    { file: 'vector11', outer: ['-4.03%', '79.8%', '48.37%', '8.21%'], inner: ['0%', '16.67%', '16.67%', '0%'] },
    { file: 'vector12', outer: ['13.76%', '82.93%', '60.83%', '11.31%'], inner: ['0%', '16.67%', '16.67%', '0%'] },
    { file: 'vector13', outer: ['-2.08%', '80.38%', '47.65%', '8.16%'], inner: ['-2.78%', '13.83%', '13.89%', '-2.84%'] },
  ],
});
writeFileSync('public/assets/items/bulu.svg', feather);

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

console.log('gajah.svg, bulu.svg, stand.svg dibuat');
