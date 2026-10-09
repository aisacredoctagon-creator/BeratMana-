// Membuat public/og-image.png (1200 × 630) dengan menangkap komponen asli (judul, dua kartu, jungkat-jungkit).
//   node scripts/make-og.mjs      (butuh `npm run dev` di :5173 dan Chrome terpasang)
import { chromium } from 'playwright-core';

const APP = process.env.APP_URL ?? 'http://localhost:5173/BeratMana-/';
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  args: ['--disable-gpu'],
});
const page = await (await browser.newContext({ viewport: { width: 1200, height: 630 } })).newPage();
await page.goto(APP);
await page.waitForSelector('#btn-play');
await page.evaluate(() => document.fonts.ready);

await page.evaluate(async (base) => {
  const { createExpressionCard } = await import(`${base}src/ui/components/expression-card.ts`);
  const { Seesaw } = await import(`${base}src/ui/seesaw.ts`);
  const { ITEMS } = await import(`${base}src/config/items.ts`);
  const { makeExpr, txt } = await import(`${base}src/generator/expression.ts`);
  const { rat } = await import(`${base}src/generator/rational.ts`);

  const el = (tag, cls, html = '') => Object.assign(document.createElement(tag), { className: cls, innerHTML: html });
  const left = createExpressionCard('left', 'og-left');
  const right = createExpressionCard('right', 'og-right');
  left.set(makeExpr('mul', rat(16), [txt('4 × 4')]));
  right.set(makeExpr('mul', rat(12), [txt('3 × 4')]));
  const seesaw = new Seesaw({ id: 'og-seesaw' });
  const find = (id) => ITEMS.find((i) => i.id === id);
  seesaw.showStatic([find('bulu'), find('batu')]);
  seesaw.reveal('left'); // sisi kiri lebih berat (16 > 12), bukan yang gambarnya besar

  document.documentElement.style.setProperty('--u', '1.12px'); // kanvas desain 1280 × 992 → 1200 × 630
  const cards = el('div', 'game__cards');
  cards.style.cssText = 'inline-size:760px;margin:26px auto 0';
  cards.append(left.el, right.el);
  const board = el('div', 'game__board');
  board.style.cssText = 'width:680px;height:320px;flex:none;margin:6px auto 0';
  board.append(seesaw.el);
  const wrap = el('div', 'og-wrap');
  wrap.style.cssText = 'position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;padding-top:30px;background:var(--surface-app)';
  wrap.append(
    el('h1', 'h1 h1--hero', 'Berat <span class="h1__accent">Mana?</span>'),
    el('p', 'tagline', 'Berat = <strong>hasil hitungan,</strong> bukan ukuran visual objek!'),
    cards,
    board,
  );
  document.body.append(wrap);
  document.getElementById('app').style.visibility = 'hidden';
}, new URL(APP).pathname);

await page.waitForTimeout(1500); // gambar benda + transisi jungkat-jungkit selesai
await page.screenshot({ path: 'public/og-image.png' });
await browser.close();
console.log('og-image.png dibuat');
