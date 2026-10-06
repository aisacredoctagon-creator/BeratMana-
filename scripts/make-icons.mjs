// Membuat ikon PNG PWA dan gambar Open Graph dalam gaya Figma.
//   node scripts/make-icons.mjs      (butuh server dev berjalan di :5173 dan Chrome terpasang untuk og-image)
// Ikon dirender dari SVG di public/ memakai sharp. og-image.png dibuat dengan menangkap layar HTML kecil
// yang memakai font proyek (Fredoka) lewat Playwright; bila Playwright tidak ada, og-image dilewati.
import sharp from 'sharp';
import { readFileSync } from 'node:fs';

const fav = readFileSync('public/favicon.svg');
const mask = readFileSync('public/icons/icon-maskable.svg');
await sharp(fav, { density: 600 }).resize(192, 192).png().toFile('public/icons/icon-192.png');
await sharp(fav, { density: 600 }).resize(512, 512).png().toFile('public/icons/icon-512.png');
await sharp(mask).resize(512, 512).png().toFile('public/icons/icon-maskable-512.png');
await sharp(fav, { density: 600 }).resize(180, 180).png().toFile('public/icons/apple-touch-icon.png');
console.log('ikon dibuat');
