// Menangkap screenshot piksel-akurat dari dev server (npm run dev) memakai Chrome yang terpasang.
// Hasil ke .shots/ (diabaikan git). CHROME_PATH=... untuk Chrome/Edge di lokasi lain; REDUCED=1 untuk reduced-motion.
// Pemakaian: node shot.mjs <nama> <lebar> <tinggi> [skenario]
//   skenario: title | game | game-wrong | over | pause | howto | settings
import { chromium } from 'playwright-core';
const APP_URL = process.env.APP_URL ?? 'http://localhost:5173/BeratMana-/';
import { mkdirSync } from 'node:fs';

const [name = 'shot', w = '1280', h = '992', scenario = 'game'] = process.argv.slice(2);
const OUT = new URL('../../.shots/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
});
const ctx = await browser.newContext({
  viewport: { width: Number(w), height: Number(h) },
  deviceScaleFactor: 1,
  hasTouch: Number(w) < 700,
  isMobile: Number(w) < 700,
  reducedMotion: process.env.REDUCED === '1' ? 'reduce' : 'no-preference',
});
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
page.on('console', (m) => m.type() === 'error' && console.log('CONSOLE', m.text()));
await page.goto(APP_URL);
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForSelector('#btn-play');
await page.evaluate(() => document.fonts.ready);

const evalLabel = (s) =>
  Function(
    'return ' +
      s
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/−/g, '-')
        .replace(/,/g, '.'),
  )();

async function answer(wrong = false) {
  const labels = await page.evaluate(() => [
    document.querySelector('#card-left').getAttribute('aria-label').split(': ')[1],
    document.querySelector('#card-right').getAttribute('aria-label').split(': ')[1],
  ]);
  const l = evalLabel(labels[0]);
  const r = evalLabel(labels[1]);
  const left = (l > r) !== wrong;
  await page.click(left ? '#btn-left' : '#btn-right');
}

if (scenario === 'settings') {
  // gulir sampai dasar supaya jarak tombol terakhir ke tepi layar terlihat
  await page.evaluate(() => { const t = document.getElementById('screen-title'); t.scrollTop = t.scrollHeight; });
} else if (scenario !== 'title' && scenario !== 'howto' && scenario !== 'normal' && scenario !== 'streak') {
  await page.click('#btn-play');
  await page.waitForFunction(() => !document.querySelector('#btn-left').disabled, null, { timeout: 8000 });
  if (scenario === 'verdict-ok' || scenario === 'verdict-bad') {
    await answer(scenario === 'verdict-bad');
    await page.waitForTimeout(330);
    await page.screenshot({ path: `${OUT}${name}.png` });
    console.log('ok', name);
    await browser.close();
    process.exit(0);
  } else if (scenario === 'game-correct' || scenario === 'game-wrong') {
    await answer(scenario === 'game-wrong');
    await page.waitForTimeout(500);
  } else if (scenario === 'pause') {
    await page.keyboard.press('p');
    await page.waitForTimeout(400);
  } else if (scenario === 'over') {
    // Normal + Hard + 2 nyawa: jawab salah dua kali
    await page.evaluate(() => {
      localStorage.setItem('bm.settings', JSON.stringify({ mode: 'normal', difficulty: 'hard', types: ['add', 'mul', 'fraction'] }));
    });
    await page.reload();
    await page.click('#btn-play');
    for (let i = 0; i < 3; i++) {
      await page.waitForFunction(() => !document.querySelector('#btn-left').disabled, null, { timeout: 8000 });
      await answer(i > 0);
      await page.waitForTimeout(i === 0 ? 1200 : 400);
    }
    await page.waitForSelector('#screen-over:not([hidden])', { timeout: 8000 });
    await page.waitForTimeout(700);
  }
} else if (scenario === 'normal' || scenario === 'streak') {
  await page.evaluate((sc) => localStorage.setItem('bm.settings', JSON.stringify({ mode: sc === 'normal' ? 'normal' : 'time', difficulty: sc === 'normal' ? 'hard' : 'easy', types: ['add', 'mul', 'div'] })), scenario);
  await page.reload();
  await page.click('#btn-play');
  const n = scenario === 'streak' ? 11 : 1;
  for (let i = 0; i < n; i++) {
    await page.waitForFunction(() => !document.querySelector('#btn-left').disabled, null, { timeout: 8000 });
    await answer(scenario === 'normal');
    await page.waitForTimeout(i === n - 1 ? 450 : 1500);
  }
} else if (scenario === 'howto') {
  await page.click('#btn-howto');
  await page.waitForTimeout(400);
}
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}${name}.png` });
console.log('ok', `${OUT}${name}.png`);
await browser.close();
