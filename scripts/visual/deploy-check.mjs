// Memeriksa situs yang sudah di-build/di-deploy: tidak ada 404 aset, tidak ada error konsol, manifest + ikon
// valid, service worker terdaftar, tag Open Graph absolut, tanpa localStorage tetap jalan.
//   node scripts/visual/deploy-check.mjs                     -> http://localhost:4173/BeratMana-/ (npm run preview)
//   APP_URL=https://aisacredoctagon-creator.github.io/BeratMana-/ node scripts/visual/deploy-check.mjs
import { chromium } from 'playwright-core';

const APP_URL = process.env.APP_URL ?? 'http://localhost:4173/BeratMana-/';
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
});

let fails = 0;
const check = (name, ok, extra = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  → ' + extra : ''}`);
  if (!ok) fails++;
};

async function run(label, { blockStorage = false } = {}) {
  console.log(`\n== ${label} ==`);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'allow' });
  if (blockStorage) {
    // meniru mode privat: localStorage melempar error
    await ctx.addInitScript(() => {
      const boom = () => {
        throw new DOMException('denied', 'SecurityError');
      };
      Object.defineProperty(window, 'localStorage', { get: boom });
    });
  }
  const page = await ctx.newPage();
  const bad = [];
  const errors = [];
  const seen = new Set();
  page.on('response', (r) => {
    seen.add(r.url());
    if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`);
  });
  page.on('requestfailed', (r) => bad.push(`FAILED ${r.url()} (${r.failure()?.errorText})`));
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && errors.push(`[${m.type()}] ${m.text()}`));

  await page.goto(APP_URL, { waitUntil: 'networkidle' });
  await page.waitForSelector('#btn-play');
  await page.click('#btn-play');
  await page.waitForFunction(() => !document.querySelector('#btn-left').disabled, null, { timeout: 10000 });
  await page.waitForTimeout(500);

  check('halaman termuat + game bisa dimulai', true);
  check('tidak ada respons 404/gagal', bad.length === 0, bad.join(' | '));
  check('tidak ada error/peringatan konsol', errors.filter((e) => !/vibrate/i.test(e)).length === 0, errors.join(' | '));
  const imgs = await page.$$eval('img', (els) => els.map((e) => [e.currentSrc, e.naturalWidth > 0]));
  check('semua gambar benda/penyangga termuat', imgs.length > 0 && imgs.every(([, ok]) => ok), imgs.filter(([, ok]) => !ok).map(([s]) => s).join(', '));
  const fonts = await page.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family));
  check('font Fredoka dimuat', fonts.some((f) => /Fredoka/.test(f)), fonts.join(', '));
  if (!blockStorage) {
    const meta = await page.evaluate(() => ({
      lang: document.documentElement.lang,
      title: document.title,
      desc: document.querySelector('meta[name="description"]')?.content,
      theme: document.querySelector('meta[name="theme-color"]')?.content,
      og: Object.fromEntries([...document.querySelectorAll('meta[property^="og:"],meta[name^="twitter:"]')].map((m) => [m.getAttribute('property') ?? m.name, m.content])),
      canonical: document.querySelector('link[rel="canonical"]')?.href,
      manifest: document.querySelector('link[rel="manifest"]')?.href,
    }));
    check('lang=id, title, description, theme-color ada', meta.lang === 'id' && !!meta.title && !!meta.desc && !!meta.theme);
    const abs = (u) => /^https:\/\//.test(u ?? '');
    check('og:image, og:url, twitter:image berupa URL absolut https', abs(meta.og['og:image']) && abs(meta.og['og:url']) && abs(meta.og['twitter:image']), `${meta.og['og:image']}`);
    const img = await page.request.get(meta.og['og:image'].replace(/^https:\/\/[^/]+\/BeratMana-\//, new URL(APP_URL).origin + new URL(APP_URL).pathname));
    check('gambar OG dapat diunduh (di lokasi yang sama)', img.ok(), `${img.status()}`);
    const man = await (await page.request.get(meta.manifest)).json();
    check('manifest: start_url/scope di dalam base', new URL(man.start_url, meta.manifest).href === APP_URL && new URL(man.scope, meta.manifest).href === APP_URL, `${man.start_url} ${man.scope}`);
    const iconRes = await Promise.all(man.icons.map((i) => page.request.get(new URL(i.src, meta.manifest).href)));
    check('semua ikon manifest 200', iconRes.every((r) => r.ok()), iconRes.map((r) => r.status()).join(','));
    check('ada ikon 192, 512, dan maskable', ['192x192', '512x512'].every((s) => man.icons.some((i) => i.sizes === s)) && man.icons.some((i) => i.purpose === 'maskable'));
    const sw = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return 'tidak didukung';
      const reg = await navigator.serviceWorker.getRegistration();
      return reg ? reg.scope : 'belum terdaftar';
    });
    check('service worker terdaftar dengan scope = base', sw === APP_URL, sw);
  } else {
    // dengan localStorage diblokir, game tetap berjalan dan pengaturan bertahan di memori
    await page.keyboard.press('p');
    await page.click('#btn-quit');
    check('tanpa localStorage: kembali ke beranda tanpa error', await page.isVisible('#btn-play'));
  }
  await ctx.close();
}

await run('normal');
await run('localStorage diblokir (mode privat)', { blockStorage: true });
console.log(fails === 0 ? '\nSEMUA LULUS' : `\n${fails} GAGAL`);
await browser.close();
process.exit(fails ? 1 : 0);
