// Pengecek aturan design system: CSS (selain tokens.css dan fonts.css) dan TS dilarang
// menulis warna atau ukuran secara langsung. Semua lewat variabel di src/styles/tokens.css.
//
//   node scripts/check-tokens.mjs        -> keluar dengan kode 1 bila ada pelanggaran
//
// Yang diperiksa pada deklarasi CSS: warna (#hex, rgb(), hsl(), oklch(), nama warna), satuan panjang
// (px rem em vw vh dvh svh lvh vmin vmax cqw cqh cqi cqb pt ch ex), satuan waktu (ms, s), serta angka
// polos untuk z-index, font-weight, line-height, letter-spacing.
// Dikecualikan: baris @media/@container/@supports (breakpoint tidak bisa memakai var()), persentase,
// satuan sudut (deg), dan angka 0.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const EXEMPT_CSS = new Set(['tokens.css', 'fonts.css']);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const NAMED_COLORS = /\b(white|black|red|green|blue|gray|grey|yellow|orange|purple|pink|silver|gold|navy|teal|cyan|magenta|lime|maroon|olive|aqua)\b/i;
const COLOR_FN = /\b(rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color)\(/i;
const HEX = /#[0-9a-fA-F]{3,8}\b/;
const LENGTH = /(?<![\w-])-?(?:\d+\.?\d*|\.\d+)(?:px|rem|em|vw|vh|dvh|svh|lvh|vmin|vmax|cqw|cqh|cqi|cqb|pt|ch|ex)\b/;
const TIME = /(?<![\w-])-?(?:\d+\.?\d*|\.\d+)(?:ms|s)\b/;
const PLAIN_NUMBER_PROPS = /^(z-index|font-weight|line-height|letter-spacing)\s*:\s*-?\d/;

const problems = [];

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
}

function checkCss(file) {
  const lines = stripComments(readFileSync(file, 'utf8')).split('\n');
  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (!line || line.startsWith('@') || line.endsWith('{') || line === '}') return;
    const colon = line.indexOf(':');
    if (colon < 1) return;
    const prop = line.slice(0, colon).trim();
    // buang isi url(...) dan string agar nama file/selektor tidak dianggap nilai
    const value = line
      .slice(colon + 1)
      .replace(/url\([^)]*\)/g, '')
      .replace(/(['"]).*?\1/g, '');
    const add = (why) => problems.push(`${relative(ROOT, file)}:${i + 1}  ${why}  →  ${line}`);
    if (HEX.test(value)) add('warna hex');
    if (COLOR_FN.test(value)) add('fungsi warna');
    const bare = value.replace(/var\([^)]*\)/g, '');
    if (NAMED_COLORS.test(bare) && !/^(content|font-family|animation-name|transition-property|will-change|grid-template-areas|grid-area|counter-reset)$/.test(prop)) {
      add('nama warna');
    }
    const lenValue = value.replace(/\bvar\(--[a-z0-9-]+\)/gi, '');
    if (LENGTH.test(lenValue) && !/^(0|0px)$/.test(lenValue.trim())) add('ukuran literal');
    if (TIME.test(lenValue) && !/(?<![\w-])0s\b/.test(lenValue)) add('durasi literal');
    if (PLAIN_NUMBER_PROPS.test(line)) add('angka polos (pakai token)');
  });
}

function checkTs(file) {
  const text = readFileSync(file, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .split('\n');
  text.forEach((raw, i) => {
    const line = raw.replace(/\/\/.*$/, '');
    // warna hex di dalam string literal, atau fungsi warna
    const strings = line.match(/(['"`])(?:\\.|(?!\1).)*\1/g) ?? [];
    for (const s of strings) {
      if (/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/.test(s) && !/querySelector|getElementById/.test(line)) {
        problems.push(`${relative(ROOT, file)}:${i + 1}  warna hex di TS  →  ${raw.trim()}`);
      }
      if (/\b(rgb|rgba|hsl|hsla)\(/.test(s)) problems.push(`${relative(ROOT, file)}:${i + 1}  fungsi warna di TS  →  ${raw.trim()}`);
      if (/(?<![\w-])\d+(\.\d+)?(px|rem|em|vw|vh|dvh)\b/.test(s) && !/@media|matchMedia|min-width|max-width|min-height|max-height/.test(line)) {
        problems.push(`${relative(ROOT, file)}:${i + 1}  ukuran literal di TS  →  ${raw.trim()}`);
      }
    }
  });
}

for (const f of walk(join(ROOT, 'src'))) {
  const name = f.split(/[\\/]/).pop();
  if (f.endsWith('.css') && !EXEMPT_CSS.has(name)) checkCss(f);
  else if (f.endsWith('.ts') && !f.endsWith('.test.ts')) checkTs(f);
}

if (problems.length > 0) {
  console.error(`\n✗ ${problems.length} pelanggaran aturan token:\n`);
  for (const p of problems) console.error('  ' + p);
  console.error('\nGunakan variabel dari src/styles/tokens.css (lihat DESIGN.md).\n');
  process.exit(1);
}
console.log('✓ check-tokens: tidak ada warna/ukuran yang di-hardcode di luar tokens.css');
