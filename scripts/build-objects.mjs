// Membuat aset objek jungkat-jungkit dari Microsoft Fluent Emoji (gaya Flat, MIT) dan data pendukungnya.
// Dijalankan manual (tidak ikut build):  FLUENT_DIR=<folder clone fluentui-emoji> node scripts/build-objects.mjs
//   1. clone ringan di luar proyek:
//        GIT_LFS_SKIP_SMUDGE=1 git clone --depth 1 --filter=blob:none --sparse https://github.com/microsoft/fluentui-emoji <dir>
//        git -C <dir> sparse-checkout set "assets/<Nama emoji>/Flat" ...      (folder yang dipilih saja)
//   2. tambahkan entri ke OBJECTS di bawah (folder = nama folder Fluent persis, id = slug unik, name = label Indonesia,
//      category = kosmetik saja, size = tingkat ukuran), lalu jalankan skrip ini.
// Skrip: salin SVG → WARNA diselaraskan dengan palet game (soft) → optimasi SVGO (id diberi awalan id objek) → tambah KONTUR (seperti objek lama: garis tebal rata, sudut membulat,
// warna = nuansa gelap dari warna dominan objek; bisa ditimpa lewat `outline` di OBJECTS) → hitung bounding box isi lewat Chrome
// (getBBox) → tulis viewBox rapat ke isi + tebal kontur (dasar objek menyentuh dasar gambar, terpusat) →
// src/config/items.data.ts (aspek + skala). Kontur = salinan semua bentuk di belakang objek, berisi + bergaris warna kontur.
import { chromium } from 'playwright-core';
import { optimize } from 'svgo';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

/** Tingkat ukuran: skala sisi terpanjang gambar terhadap slot objek di papan (1 = penuh). Hanya mengatur "bobot visual" tampilan. */
const SIZE = { lg: 1, md: 0.86, sm: 0.72 };

/**
 * Palet game (skala Tailwind, sama dengan token --color-* di src/styles/tokens.css). Setiap warna Fluent dilunakkan lalu
 * dipetakan ke warna palet terdekat (OKLab), sehingga semua objek memakai keluarga warna yang sama dengan UI game.
 * Rumpun yang dipakai: slate, rose (merah), pink, orange, amber (+cokelat), yellow, emerald (hijau), sky, blue, indigo, violet.
 */
const PALETTE = [
  '#ffffff', '#f1f5f9', '#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b', '#475569', '#334155', '#1e293b', // slate
  '#ffe4e6', '#fecdd3', '#fda4af', '#fb7185', '#f43f5e', '#e11d48', '#be123c', // rose
  '#fbcfe8', '#f9a8d4', '#f472b6', '#ec4899', // pink
  '#ffedd5', '#fed7aa', '#fdba74', '#fb923c', '#f97316', '#ea580c', '#c2410c', '#9a3412', // orange
  '#fef3c7', '#fde68a', '#fcd34d', '#fbbf24', '#f59e0b', '#d97706', '#b45309', '#92400e', '#78350f', // amber (cokelat: 700–900)
  '#fef9c3', '#fef08a', '#fde047', '#facc15', // yellow
  '#d1fae5', '#a7f3d0', '#6ee7b7', '#34d399', '#10b981', '#059669', '#047857', // emerald
  '#e0f2fe', '#bae6fd', '#7dd3fc', '#38bdf8', '#0ea5e9', '#0284c7', '#0369a1', '#075985', // sky
  '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', // blue
  '#e0e7ff', '#c7d2fe', '#a5b4fc', '#818cf8', '#6366f1', '#4f46e5', '#312e81', // indigo
  '#ede9fe', '#ddd6fe', '#c4b5fd', '#a78bfa', '#8b5cf6', '#7c3aed', // violet
];
/** Pelunakan sebelum dipetakan: kroma × SOFT_CHROMA, terang digeser SOFT_LIGHT ke arah putih (0 = tanpa). */
const SOFT_CHROMA = 0.85;
const SOFT_LIGHT = 0.06;

const lin = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const toOklab = (hex) => {
  const h = hex.length === 4 ? '#' + [...hex.slice(1)].map((c) => c + c).join('') : hex;
  const [r, g, b] = [1, 3, 5].map((i) => lin(parseInt(h.slice(i, i + 2), 16) / 255));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const sc = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * sc, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * sc, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * sc];
};
const PAL = PALETTE.map((hex) => ({ hex, lab: toOklab(hex) }));
const soften = (hex) => {
  const [L, a, b] = toOklab(hex);
  return [L + (1 - L) * SOFT_LIGHT, a * SOFT_CHROMA, b * SOFT_CHROMA];
};
const nearest = (hex) => {
  const [L, a, b] = soften(hex);
  let best = PAL[0];
  let bd = Infinity;
  for (const c of PAL) {
    const d = (c.lab[0] - L) ** 2 * 1.4 + (c.lab[1] - a) ** 2 + (c.lab[2] - b) ** 2; // terang sedikit lebih diutamakan (detail tetap terbaca)
    if (d < bd) { bd = d; best = c; }
  }
  return best.hex;
};
const recolor = (svg) => svg.replace(/((?:fill|stroke|stop-color)=")(#[0-9a-fA-F]{3,6})(")/g, (_, a, hex, c) => a + nearest(hex) + c);

/** Tebal kontur (sisi luar) = rasio × sisi terpanjang isi. Objek lama: 6/200 ≈ 3% dari gambar; 0,04 menjaga garis terlihat di slot 43 px (HP). */
const OUTLINE = 0.04;

/** category: 'berat' | 'ringan' | 'menengah' (murni kosmetik, tidak memengaruhi hasil hitungan). */
const OBJECTS = [
  // terlihat berat
  { id: 'elephant', folder: 'Elephant', name: 'Gajah', category: 'berat', size: 'lg' },
  { id: 'hippopotamus', folder: 'Hippopotamus', name: 'Kuda nil', category: 'berat', size: 'lg' },
  { id: 'whale', folder: 'Whale', name: 'Paus', category: 'berat', size: 'lg' },
  { id: 'anchor', folder: 'Anchor', name: 'Jangkar', category: 'berat', size: 'md' },
  { id: 'brick', folder: 'Brick', name: 'Batu bata', category: 'berat', size: 'md' },
  { id: 'rock', folder: 'Rock', name: 'Batu', category: 'berat', size: 'md' },
  { id: 'bowling', folder: 'Bowling', name: 'Bola bowling', category: 'berat', size: 'md' },
  { id: 'automobile', folder: 'Automobile', name: 'Mobil', category: 'berat', size: 'lg' },
  { id: 'delivery-truck', folder: 'Delivery truck', name: 'Truk pengantar', category: 'berat', size: 'lg' },
  { id: 'bus', folder: 'Bus', name: 'Bus', category: 'berat', size: 'lg' },
  { id: 'locomotive', folder: 'Locomotive', name: 'Lokomotif', category: 'berat', size: 'lg' },
  { id: 'rocket', folder: 'Rocket', name: 'Roket', category: 'berat', size: 'md' },
  { id: 'ship', folder: 'Ship', name: 'Kapal', category: 'berat', size: 'lg' },
  // terlihat ringan
  { id: 'feather', folder: 'Feather', name: 'Bulu', category: 'ringan', size: 'sm' },
  { id: 'balloon', folder: 'Balloon', name: 'Balon', category: 'ringan', size: 'sm' },
  { id: 'bubbles', folder: 'Bubbles', name: 'Gelembung', category: 'ringan', size: 'sm' },
  { id: 'butterfly', folder: 'Butterfly', name: 'Kupu-kupu', category: 'ringan', size: 'sm' },
  { id: 'leaf', folder: 'Leaf fluttering in wind', name: 'Daun tertiup angin', category: 'ringan', size: 'sm' },
  { id: 'snowflake', folder: 'Snowflake', name: 'Kepingan salju', category: 'ringan', size: 'sm' },
  { id: 'honeybee', folder: 'Honeybee', name: 'Lebah', category: 'ringan', size: 'sm' },
  { id: 'kite', folder: 'Kite', name: 'Layang-layang', category: 'ringan', size: 'sm' },
  { id: 'candle', folder: 'Candle', name: 'Lilin', category: 'ringan', size: 'sm' },
  { id: 'cherries', folder: 'Cherries', name: 'Ceri', category: 'ringan', size: 'sm' },
  { id: 'mushroom', folder: 'Mushroom', name: 'Jamur', category: 'ringan', size: 'sm' },
  { id: 'cupcake', folder: 'Cupcake', name: 'Kue cupcake', category: 'ringan', size: 'sm' },
  // menengah
  { id: 'watermelon', folder: 'Watermelon', name: 'Semangka', category: 'menengah', size: 'md' },
  { id: 'coconut', folder: 'Coconut', name: 'Kelapa', category: 'menengah', size: 'md' },
  { id: 'basketball', folder: 'Basketball', name: 'Bola basket', category: 'menengah', size: 'md' },
  { id: 'soccer-ball', folder: 'Soccer ball', name: 'Bola sepak', category: 'menengah', size: 'md' },
  { id: 'teddy-bear', folder: 'Teddy bear', name: 'Boneka beruang', category: 'menengah', size: 'md' },
  { id: 'penguin', folder: 'Penguin', name: 'Pinguin', category: 'menengah', size: 'md' },
  { id: 'backpack', folder: 'Backpack', name: 'Ransel', category: 'menengah', size: 'md' },
  { id: 'luggage', folder: 'Luggage', name: 'Koper', category: 'menengah', size: 'md' },
  { id: 'books', folder: 'Books', name: 'Buku', category: 'menengah', size: 'md' },
  { id: 'cactus', folder: 'Cactus', name: 'Kaktus', category: 'menengah', size: 'md' },
  { id: 'package', folder: 'Package', name: 'Paket', category: 'menengah', size: 'md' },
];

const FLUENT = process.env.FLUENT_DIR;
if (!FLUENT) throw new Error('Set FLUENT_DIR ke folder clone fluentui-emoji (berisi assets/<Nama>/Flat).');
const OUT_SVG = new URL('../public/assets/objects/', import.meta.url);
const OUT_DATA = new URL('../src/config/items.data.ts', import.meta.url);
mkdirSync(OUT_SVG, { recursive: true });

const slug = (s) => s.toLowerCase().replace(/ /g, '_');
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true });
const page = await browser.newPage();
const rows = [];
let total = 0;
for (const o of OBJECTS) {
  const file = `${FLUENT}/assets/${o.folder}/Flat/${slug(o.folder)}_flat.svg`;
  if (!existsSync(file)) throw new Error(`Tidak ada: ${file}`);
  const raw = readFileSync(file, 'utf8');
  const { data } = optimize(recolor(raw), {
    multipass: true,
    floatPrecision: 2,
    plugins: ['preset-default', { name: 'prefixIds', params: { prefix: o.id } }], // svgo 4 mempertahankan viewBox secara bawaan
  });
  // kontur + bounding box di Chrome (DOM asli, getBBox akurat)
  const res = await page.evaluate(
    async ([svg, outlineOverride, ratio]) => {
      const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
      const root = doc.documentElement;
      // bounding box isi tanpa kontur
      const host = document.createElement('div');
      host.innerHTML = svg;
      document.body.append(host);
      const bb = host.querySelector('svg').getBBox();
      host.remove();
      const T = Math.max(bb.width, bb.height) * ratio;

      // warna dominan: gambar dirender kecil, ambil warna terbanyak yang bukan putih/transparan (utamakan yang berwarna)
      const img = new Image();
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      await img.decode();
      const c = document.createElement('canvas');
      c.width = c.height = 64;
      const cx = c.getContext('2d');
      cx.drawImage(img, 0, 0, 64, 64);
      const px = cx.getImageData(0, 0, 64, 64).data;
      const bins = new Map();
      for (let i = 0; i < px.length; i += 4) {
        if (px[i + 3] < 200) continue;
        const r = px[i], g = px[i + 1], b = px[i + 2];
        if (r > 225 && g > 225 && b > 225) continue;
        const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
        const sat = mx === 0 ? 0 : (mx - mn) / mx;
        const key = (r >> 4) + ',' + (g >> 4) + ',' + (b >> 4);
        const e = bins.get(key) ?? { n: 0, sat, r, g, b };
        e.n += sat > 0.25 ? 2 : 1; // warna jenuh diutamakan
        bins.set(key, e);
      }
      let best = null;
      for (const e of bins.values()) if (!best || e.n > best.n) best = e;
      const toHsl = (r, g, b) => {
        r /= 255; g /= 255; b /= 255;
        const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
        const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
        let h = 0;
        if (d !== 0) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
        return [(h * 60 + 360) % 360, s, l];
      };
      const hex = (h, s, l) => {
        const a = s * Math.min(l, 1 - l);
        const f = (n) => { const k = (n + h / 30) % 12; return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))); };
        return '#' + [f(0), f(8), f(4)].map((x) => x.toString(16).padStart(2, '0')).join('');
      };
      let color = outlineOverride;
      if (!color) {
        const [h, sat, l] = best ? toHsl(best.r, best.g, best.b) : [215, 0.2, 0.3];
        color = hex(h, Math.min(1, sat * 0.95 + 0.05), Math.max(0.16, Math.min(0.3, l * 0.42)));
      }

      // klon bentuk (tanpa defs) → berisi + bergaris warna kontur, ditaruh di BELAKANG objek
      const SHAPES = 'path,circle,ellipse,rect,polygon,polyline,line';
      const g = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
      for (const k of [...root.children]) {
        if (['defs', 'style', 'title', 'desc'].includes(k.localName)) continue;
        g.append(k.cloneNode(true));
      }
      g.querySelectorAll('[id]').forEach((e) => e.removeAttribute('id'));
      g.querySelectorAll(SHAPES).forEach((e) => {
        for (const a of ['opacity', 'fill-opacity', 'stroke-opacity', 'style', 'filter']) e.removeAttribute(a);
        if (e.getAttribute('fill') !== 'none') e.setAttribute('fill', color);
        e.setAttribute('stroke', color);
        e.setAttribute('stroke-width', String(+(2 * T).toFixed(3)));
        e.setAttribute('stroke-linejoin', 'round');
        e.setAttribute('stroke-linecap', 'round');
      });
      const firstShape = [...root.children].find((k) => !['defs', 'style', 'title', 'desc'].includes(k.localName));
      root.insertBefore(g, firstShape ?? null);
      const x = bb.x - T, y = bb.y - T, w = bb.width + 2 * T, h = bb.height + 2 * T;
      const r2 = (n) => Math.round(n * 100) / 100;
      root.setAttribute('viewBox', [x, y, w, h].map(r2).join(' '));
      root.setAttribute('width', String(r2(w)));
      root.setAttribute('height', String(r2(h)));
      return { svg: new XMLSerializer().serializeToString(root), color, aspect: w / h };
    },
    [data, o.outline ?? null, OUTLINE],
  );
  const out = optimize(res.svg, { multipass: true, floatPrecision: 2, plugins: ['preset-default'] }).data;
  const r2 = (n) => Math.round(n * 100) / 100;
  const bb = { w: res.aspect, h: 1 };
  writeFileSync(new URL(`${o.id}.svg`, OUT_SVG), out);
  total += Buffer.byteLength(out);
  rows.push({ ...o, aspect: r2(bb.w / bb.h), scale: SIZE[o.size], outlineColor: res.color });
}
await browser.close();

const header = `/* DIHASILKAN oleh scripts/build-objects.mjs (jangan diedit tangan). Objek dari Microsoft Fluent Emoji (Flat, MIT).
   aspect = lebar/tinggi isi (viewBox sudah dirapatkan ke isi); scale = skala sisi terpanjang terhadap slot di papan. */
export interface ItemData {
  id: string;
  name: string;
  category: 'berat' | 'ringan' | 'menengah';
  scale: number;
  aspect: number;
}

export const ITEM_DATA: readonly ItemData[] = [
`;
writeFileSync(
  OUT_DATA,
  header + rows.map((r) => `  { id: '${r.id}', name: '${r.name}', category: '${r.category}', scale: ${r.scale}, aspect: ${r.aspect} },`).join('\n') + '\n];\n',
);
console.log(`${rows.length} objek; total SVG ${(total / 1024).toFixed(1)} KB`);
