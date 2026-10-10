// Uji fungsional end-to-end (Chrome headless) terhadap dev server (jalankan npm run dev dulu).
// Mencetak PASS/FAIL per pemeriksaan. CHROME_PATH=... bila Chrome tidak di lokasi bawaan Windows.
import { chromium } from 'playwright-core';
const APP_URL = process.env.APP_URL ?? 'http://localhost:5173/BeratMana-/';

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
});
const page = await (await browser.newContext({ viewport: { width: 1280, height: 992 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

let fails = 0;
const check = (name, ok, extra = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  → ' + extra : ''}`);
  if (!ok) fails++;
};
const evalLabel = (s) =>
  Function('return ' + s.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/,/g, '.').replace(/(\d+)\/(\d+)/g, '($1/$2)'))();
const ready = () => page.waitForFunction(() => !document.querySelector('#btn-left').disabled, null, { timeout: 8000 });
async function answer(wrong = false) {
  // aria-label kartu = "Sisi kiri: <label polos>" (textContent pecahan bertumpuk tidak memuat "/")
  const [l, r] = await page.evaluate(() => ['#card-left', '#card-right'].map((s) => document.querySelector(s).getAttribute('aria-label').split(': ')[1]));
  const left = (evalLabel(l) > evalLabel(r)) !== wrong;
  await page.click(left ? '#btn-left' : '#btn-right');
  return left ? 'left' : 'right';
}

await page.goto(APP_URL);
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForSelector('#btn-play');

// ---- pengaturan ----
const types = () => page.$$eval('#chips input:checked', (els) => els.map((e) => e.value));
const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('bm.settings') ?? 'null'));
check('tidak ada teks info di bawah kesulitan maupun di bawah Main, dan tidak ada tombol Pengaturan', !(await page.$('#difficulty-hint')) && !(await page.$('#play-summary')) && !(await page.$('#btn-settings')));
check('"Cara Main" = tombol ikon "?" (aria-label, title, tanpa teks) di baris Musik/SFX', (await page.getAttribute('#btn-howto', 'aria-label')) === 'Cara Main' && (await page.getAttribute('#btn-howto', 'title')) === 'Cara Main' && (await page.textContent('#btn-howto')).trim() === '' && (await page.evaluate(() => { const t = [...document.querySelectorAll('#screen-title .toggles > *')].map((e) => Math.round(e.getBoundingClientRect().top)); return t.length === 3 && new Set(t).size === 1; })));
check('default: Penjumlahan + Perkalian', JSON.stringify(await types()) === JSON.stringify(['add', 'mul']));
check('tidak ada chip Mix, Pilih semua, atau Hapus semua', (await page.$$eval('#chips label', (e) => e.length)) === 6 && (await page.$$('#chips input[value="mix"], #btn-all, #btn-none')).length === 0 && !(await page.textContent('#settings')).match(/mix|pilih semua|hapus semua/i));
for (const t of ['sub', 'div', 'fraction', 'decimal']) await page.click(`#chips label:has(input[value="${t}"])`);
check('mencentang keenam tipe manual', (await types()).length === 6);
check('keenam tipe tersimpan', (await saved()).types.length === 6);
await page.click('#chips label:has(input[value="fraction"])');
check('menghapus satu tipe: lima tipe tersisa', (await types()).length === 5);
for (const t of ['sub', 'div', 'decimal', 'mul']) await page.click(`#chips label:has(input[value="${t}"])`);
check('menyisakan satu tipe (add)', JSON.stringify(await types()) === JSON.stringify(['add']));
await page.click('#chips label:has(input[value="add"])');
check('tipe terakhir tidak bisa dimatikan + toast pesan', JSON.stringify(await types()) === JSON.stringify(['add']) && (await page.textContent('.toast')) === 'Pilih minimal 1 tipe soal');
check('pengaturan default tersimpan (Medium, Time Attack)', (await saved()).difficulty === 'medium' && (await saved()).mode === 'time');
await page.click('label:has(input[name="difficulty"][value="hard"])');
await page.click('label:has(input[name="mode"][value="normal"])');
for (const t of ['sub', 'mul', 'div', 'fraction', 'decimal']) await page.click(`#chips label:has(input[value="${t}"])`);
await page.reload();
await page.waitForSelector('#btn-play');
check('pengaturan tersimpan setelah reload', (await page.isChecked('input[name="difficulty"][value="hard"]')) && (await page.isChecked('input[name="mode"][value="normal"]')) && (await types()).length === 6);

// ---- permainan Normal Hard ----
await page.click('#btn-play');
await ready();
check('layar game tampil + HUD mode Normal (hati, tanpa pil waktu)', (await page.getAttribute('#screen-game', 'data-mode')) === 'normal' && (await page.isVisible('.hearts')) && !(await page.isVisible('.hud-time')));
check('HUD hanya skor, hati, jeda: elemen lama hilang', (await page.$$eval('#screen-game .pill--level, #screen-game .pill--mode, #screen-game .pill--combo, #screen-game .pill__badge, #screen-game .pill--lives, #screen-game #btn-sound, #screen-game .tagline', (e) => e.length)) === 0);
check('hati: 2 nyawa Hard, aria-label tersembunyi', (await page.getAttribute('.hearts', 'aria-label')) === 'Nyawa 2 dari 2' && (await page.$$eval('.heart[data-state="full"]', (e) => e.length)) === 2);
const side = await answer(false);
await page.waitForTimeout(300);
const fb = await page.getAttribute(side === 'left' ? '#btn-left' : '#btn-right', 'data-feedback');
check('jawaban benar → feedback good + skor naik', fb === 'good' && (await page.textContent('#hud-score')) !== '0');
check('kartu pemenang ditandai', (await page.$$eval('.expr-card[data-result="win"]', (e) => e.length)) === 1 && (await page.$$eval('.expr-card[data-result="lose"]', (e) => e.length)) === 1);
await page.waitForTimeout(1300);
await ready();

// ---- notifikasi combo: streak 3 = pemanasan, hilang sendiri, tidak menangkap sentuhan ----
check('belum ada notifikasi combo di streak 1', !(await page.$eval('.combo-notice', (n) => n.classList.contains('is-on'))));
await answer(false);
await page.waitForTimeout(1300);
await ready();
await answer(false);
await page.waitForTimeout(350);
check('notifikasi combo muncul di streak 3 ("COMBO 3")', (await page.$eval('.combo-notice', (n) => n.classList.contains('is-on'))) && (await page.textContent('.combo-notice__text')) === 'COMBO 3');
check('notifikasi combo tidak menangkap sentuhan', (await page.$eval('.combo-notice', (n) => getComputedStyle(n).pointerEvents)) === 'none');
await page.waitForTimeout(1500);
check('notifikasi combo hilang sendiri (~1,2 dtk)', !(await page.$eval('.combo-notice', (n) => n.classList.contains('is-on'))));
await ready();

// ---- jeda ----
await page.keyboard.press('Space');
check('Spasi menjeda (fokus bukan tombol)', await page.isVisible('#overlay-pause'));
await page.keyboard.press('Escape');
check('Esc melanjutkan', !(await page.isVisible('#overlay-pause')));
await page.keyboard.press('p');
check('P menjeda', await page.isVisible('#overlay-pause'));
await page.click('#btn-resume');
check('tombol Lanjut', !(await page.isVisible('#overlay-pause')));

// ---- suara: toggle Musik/SFX di pop-up Dijeda (searah dengan beranda, tersimpan) ----
await page.keyboard.press('p');
check('Dijeda punya toggle Musik dan SFX', (await page.isVisible('#tgl-music-pause')) && (await page.isVisible('#tgl-sfx-pause')));
await page.click('#tgl-music-pause');
check('Musik mati, SFX tetap nyala (terpisah)', (await page.getAttribute('#tgl-music-pause', 'aria-checked')) === 'false' && (await page.getAttribute('#tgl-sfx-pause', 'aria-checked')) === 'true' && (await page.getAttribute('#tgl-music', 'aria-checked')) === 'false');
await page.click('#tgl-sfx-pause');
check('SFX mati, tersimpan di localStorage', (await page.evaluate(() => localStorage.getItem('bm.audio'))) === '{"music":false,"sfx":false}');
await page.click('#tgl-music-pause');
await page.click('#tgl-sfx-pause');
check('kedua toggle dinyalakan lagi', (await page.getAttribute('#tgl-music-pause', 'aria-checked')) === 'true' && (await page.getAttribute('#tgl-sfx-pause', 'aria-checked')) === 'true');
await page.click('#btn-resume');
await page.keyboard.press('m');
check('tombol M tidak lagi mengubah suara', (await page.getAttribute('#tgl-music', 'aria-checked')) === 'true');

// ---- game over (2 nyawa Hard) ----
await ready().catch(() => {});
await answer(true);
await page.waitForTimeout(1500);
await ready();
await answer(true);
await page.waitForSelector('#screen-over:not([hidden])', { timeout: 8000 });
check('game over: nyawa habis', (await page.textContent('#over-title')) === 'Nyawa Habis!');
check('ringkasan pengaturan di game over', (await page.textContent('#over-summary')).includes('Hard • Normal • Semua tipe'));
const scoreText = await page.textContent('#over-score');
check('rekor baru tampil bila skor > 0', (scoreText !== '0') === (await page.isVisible('#over-record')), `skor=${scoreText}`);
await page.click('#btn-again');
await ready();
check('Main Lagi memakai pengaturan sama', (await page.getAttribute('#screen-game', 'data-mode')) === 'normal');
await page.keyboard.press('p');
await page.click('#btn-quit');
check('Keluar ke Menu → layar judul', await page.isVisible('#btn-play'));

// ---- Cara Main ----
await page.click('#btn-howto');
check('modal Cara Main + fokus', (await page.evaluate(() => document.activeElement.id)) === 'btn-howto-close');
await page.keyboard.press('Escape');
check('Esc menutup Cara Main', !(await page.isVisible('#overlay-howto')));

// ---- area sentuh ----
const small = await page.evaluate(() => {
  const bad = [];
  for (const el of document.querySelectorAll('button, .chip, .seg__opt')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (Math.min(r.width, r.height) < 47.5) bad.push(`${el.className || el.id}:${Math.round(r.width)}x${Math.round(r.height)}`);
  }
  return bad;
});
console.log('  (info) elemen < 48px di desktop:', small.join(', ') || 'tidak ada');

// ---- feedback build-terbaru (jarak tombol 3D, radius, keybar mobile, tombol Beranda, jarak bawah) ----
// 2) satu nilai radius untuk semua tombol (di viewport desktop ini)
const radii = await page.evaluate(() => {
  const set = new Set();
  for (const el of document.querySelectorAll('.btn, .icon-btn, .answer, .switch, .seg__face, .chip__face')) {
    if (el.getBoundingClientRect().width === 0) continue;
    set.add(getComputedStyle(el).borderTopLeftRadius);
  }
  return [...set];
});
check('semua tombol memakai satu radius', radii.length === 1, radii.join(', '));

// 4) game over → tombol "Ke Beranda" menuju beranda; pengaturan tetap
await page.click('#btn-play');
await ready();
await answer(true);
await page.waitForTimeout(1500);
await ready();
await answer(true);
await page.waitForSelector('#screen-over:not([hidden])', { timeout: 8000 });
check('tombol game over berlabel "Ke Beranda"', (await page.textContent('#btn-home')).trim() === 'Ke Beranda');
// 1) jarak VISUAL antar tombol di game over sama (kedalaman bayangan sudah dikompensasi)
const gaps = await page.evaluate(() => {
  const btns = [...document.querySelectorAll('.over__actions .btn')];
  const out = [];
  for (let i = 0; i < btns.length - 1; i++) {
    const a = btns[i];
    const b = btns[i + 1];
    const depth = parseFloat(getComputedStyle(a).boxShadow.match(/(?:rgb|rgba)\([^)]*\)\s+0px\s+([\d.]+)px/)?.[1] ?? '0');
    out.push(b.getBoundingClientRect().top - (a.getBoundingClientRect().bottom + depth));
  }
  return out;
});
check('jarak visual tombol game over sama (merah = sekunder)', gaps.length === 2 && Math.abs(gaps[0] - gaps[1]) < 1, gaps.map((g) => g.toFixed(1)).join(' vs '));
await page.click('#btn-home');
check('Ke Beranda → layar judul + pengaturan tersimpan', (await page.isVisible('#btn-play')) && (await page.isChecked('input[name="difficulty"][value="hard"]')));
check('layar game tersembunyi setelah Ke Beranda', !(await page.isVisible('#screen-game')) && !(await page.isVisible('#overlay-pause')));

// 3) + 5) tampilan mobile (lebar 360, tanpa sentuh: bukti keybar tidak bergantung pada hover)
const mob = await (await browser.newContext({ viewport: { width: 360, height: 740 } })).newPage();
await mob.goto(APP_URL);
await mob.evaluate(() => localStorage.clear());
await mob.reload();
await mob.waitForSelector('#btn-play');
check('mobile: tidak ada tombol Pengaturan dan semua pengaturan tampil', !(await mob.$('#btn-settings')) && (await mob.isVisible('#settings')) && (await mob.isVisible('#chips')) && (await mob.isVisible('#tgl-music')) && (await mob.isVisible('#btn-howto')));
check('mobile: chip tipe soal berupa ikon, 3 per baris, 2 baris, tinggi ≥ 48px', await mob.evaluate(() => {
  const c = [...document.querySelectorAll('#chips label')].map((e) => e.getBoundingClientRect());
  const labelShown = [...document.querySelectorAll('.chip__label')].some((e) => e.getBoundingClientRect().width > 4);
  return c.length === 6 && !labelShown && new Set(c.map((r) => Math.round(r.top))).size === 2 && new Set(c.map((r) => Math.round(r.left))).size === 3 && c.every((r) => r.height >= 47.5);
}));
check('mobile: tiap chip punya aria-label nama lengkap', JSON.stringify(await mob.$$eval('#chips input', (e) => e.map((x) => x.getAttribute('aria-label')))) === JSON.stringify(['Penjumlahan', 'Pengurangan', 'Perkalian', 'Pembagian', 'Pecahan', 'Desimal']));
await mob.evaluate(() => {
  const s = document.getElementById('screen-title');
  s.scrollTop = s.scrollHeight;
});
await mob.waitForTimeout(250);
const bottomGap = await mob.evaluate(() => innerHeight - document.getElementById('btn-howto').getBoundingClientRect().bottom);
check('baris Musik/SFX/? (elemen paling bawah) punya jarak aman dari tepi bawah (≥ 16px)', bottomGap >= 16, `${bottomGap.toFixed(1)}px`);
await mob.evaluate(() => {
  const s = document.getElementById('screen-title');
  s.scrollTop = 0;
});
{
  const m390 = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await m390.goto(APP_URL);
  await m390.evaluate(() => localStorage.clear());
  await m390.reload();
  await m390.waitForSelector('#btn-play');
  check('390×844: semua pengaturan + tombol Main terlihat tanpa scroll', await m390.evaluate(() => { const s = document.getElementById('screen-title'); return s.scrollHeight <= s.clientHeight + 1; }));
  await m390.close();
}
await mob.click('#btn-play');
await mob.waitForFunction(() => !document.querySelector('#btn-left').disabled, null, { timeout: 8000 });
check('keybar (petunjuk keyboard) tidak tampil di mobile', !(await mob.isVisible('.keybar')));
const ansBottom = await mob.evaluate(() => innerHeight - document.getElementById('btn-left').getBoundingClientRect().bottom);
check('tombol jawab tidak mepet tepi bawah di mobile (≥ 12px)', ansBottom >= 12, `${ansBottom.toFixed(1)}px`);
check('keybar tetap tampil di desktop', await (async () => {
  await page.click('#btn-play');
  const v = await page.isVisible('.keybar');
  await page.keyboard.press('p');
  await page.click('#btn-quit');
  return v;
})());

// ---- rekor: keluar lebih awal, checkpoint, migrasi, isolasi kombinasi ----
const keyOf = (m, d) => `bm:best:v2:${m}:${d}`;
const stored = (m, d) => page.evaluate((k) => localStorage.getItem(k), keyOf(m, d));
const pickCombo = async (m, d) => {
  await page.click(`label:has(input[name="mode"][value="${m}"])`);
  await page.click(`label:has(input[name="difficulty"][value="${d}"])`);
};
const hudScore = async () => Number((await page.textContent('#hud-score')).replace(/\./g, ''));

await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForSelector('#btn-play');
await pickCombo('normal', 'medium');
await page.click('#btn-play');
await ready();
await answer(false);
await page.waitForTimeout(1500);
await ready();
await answer(false);
await page.waitForTimeout(800);
const scoreBefore = await hudScore();
await page.evaluate(() => window.dispatchEvent(new Event('pagehide'))); // checkpoint (tab ditutup/disembunyikan)
check('pagehide merekam skor saat ini tanpa menutup sesi', (await stored('normal', 'medium')) === String(scoreBefore) && (await page.isVisible('#screen-game')), `skor=${scoreBefore}`);
await page.keyboard.press('p');
await page.click('#btn-quit');
check('keluar ke menu sebelum tuntas: rekor tersimpan', scoreBefore > 0 && (await stored('normal', 'medium')) === String(scoreBefore));
check('beranda langsung menampilkan rekor baru', Number((await page.textContent('#title-best')).replace(/\./g, '')) === scoreBefore);
check('tanpa notifikasi REKOR BARU saat keluar lebih awal', !(await page.isVisible('#over-record')) && !(await page.isVisible('#screen-over')));
const others = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('bm:best:v2:')));
check('hanya kombinasi yang dimainkan yang punya rekor', JSON.stringify(others) === JSON.stringify([keyOf('normal', 'medium')]), others.join(','));

// Ulangi dari jeda merekam sesi lama; sesi baru memakai kombinasi yang sama
await page.click('#btn-play');
await ready();
await answer(false);
await page.waitForTimeout(900);
const scoreB = await hudScore();
await page.keyboard.press('p');
await page.click('#btn-restart');
await ready();
check('Ulangi dari jeda: sesi lama direkam bila lebih tinggi', scoreB <= scoreBefore ? (await stored('normal', 'medium')) === String(Math.max(scoreBefore, scoreB)) : (await stored('normal', 'medium')) === String(scoreB));
await page.keyboard.press('p');
await page.click('#btn-quit');

// migrasi dari bm.best lama (entri pasti saja)
await page.evaluate(() => {
  localStorage.clear();
  localStorage.setItem('bm.best', JSON.stringify({ 'time:easy': 120, 'normal:hard': 30, 'tidak:dikenal': 5 }));
});
await page.reload();
await page.waitForSelector('#btn-play');
await pickCombo('time', 'easy');
check('migrasi: rekor lama tampil di kombinasi yang benar', Number((await page.textContent('#title-best')).replace(/\./g, '')) === 120);
await pickCombo('normal', 'hard');
check('migrasi: kombinasi lain benar', Number((await page.textContent('#title-best')).replace(/\./g, '')) === 30);
await pickCombo('time', 'medium');
check('migrasi: kombinasi tak dimainkan tetap 0', Number((await page.textContent('#title-best')).replace(/\./g, '')) === 0);
check('migrasi: key lama dibiarkan sebagai arsip', (await page.evaluate(() => localStorage.getItem('bm.best'))) !== null);

// game over: tetap tampil REKOR BARU hanya bila mengalahkan rekor awal sesi
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForSelector('#btn-play');
await pickCombo('normal', 'hard');
await page.click('#btn-play');
await ready();
await answer(false);
await page.waitForTimeout(1500);
await ready();
await answer(true);
await page.waitForTimeout(1500);
await ready();
await answer(true);
await page.waitForSelector('#screen-over:not([hidden])', { timeout: 8000 });
check('game over pertama: REKOR BARU tampil, rekor tersimpan', (await page.isVisible('#over-record')) && (await stored('normal', 'hard')) !== null);
const firstBest = await stored('normal', 'hard');
await page.click('#btn-again');
await ready();
await answer(true);
await page.waitForTimeout(1500);
await ready();
await answer(true);
await page.waitForSelector('#screen-over:not([hidden])', { timeout: 8000 });
check('game over berikutnya (skor 0): tanpa REKOR BARU, rekor tidak turun', !(await page.isVisible('#over-record')) && (await stored('normal', 'hard')) === firstBest);

check('tidak ada error konsol/halaman', errors.filter((e) => !/vibrate/.test(e)).length === 0, errors.join(' | '));
console.log(fails === 0 ? '\nSEMUA LULUS' : `\n${fails} GAGAL`);
await browser.close();
process.exit(fails ? 1 : 0);
