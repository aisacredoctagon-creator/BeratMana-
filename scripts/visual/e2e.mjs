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
  const [l, r] = await page.evaluate(() => ['#card-left', '#card-right'].map((s) => document.querySelector(s).dataset.expr));
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
check('judul menu (variant menu): "BERAT" tekanan di depan (Black, kapital, merah), "Mana?" normal di belakang (Poppins SemiBold 600, slate, tanpa kapital, ≈50% ukuran), tagline hilang', await page.evaluate(() => { const t = document.querySelector('#game-title'); const [em, pl] = t.children; const cs = getComputedStyle; const fs = (e) => parseFloat(cs(e).fontSize); return t.tagName === 'H1' && t.dataset.variant === 'menu' && t.classList.contains('title-line') && t.textContent === 'Berat Mana?' && em.className === 'title-line__emphasis' && pl.className === 'title-line__plain' && cs(em).fontWeight === '900' && cs(em).textTransform === 'uppercase' && cs(em).color === 'rgb(244, 63, 94)' && cs(pl).fontWeight === '600' && cs(pl).textTransform === 'none' && cs(pl).color === 'rgb(30, 41, 59)' && /Poppins/.test(cs(pl).fontFamily) && /Montserrat/.test(cs(em).fontFamily) && Math.abs(fs(pl) / fs(em) - 0.5) < 0.01 && !document.querySelector('#screen-title .tagline') && !/hasil hitungan|ukuran visual/.test(document.querySelector('#screen-title').textContent); }));
await page.waitForFunction(() => document.querySelector('#game-title').dataset.tilt === 'done', null, { timeout: 8000 });
check('animasi judul menu: HANYA "BERAT" miring ±5,3° (data-tilt=done), will-change dilepas; "Mana?" diam (tanpa transform/animasi) dan tidak bergeser', await page.evaluate(() => { const t = document.querySelector('#game-title'); const [em, pl] = t.children; const cs = getComputedStyle; const ang = (el) => { const m = new DOMMatrix(cs(el).transform); return Math.atan2(m.b, m.a) * 180 / Math.PI; }; return Math.abs(ang(em) - 5.3) < 0.1 && cs(em).willChange === 'auto' && ang(pl) === 0 && cs(pl).transform === 'none' && cs(pl).animationName === 'none' && cs(pl).willChange === 'auto'; }));
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
await page.waitForFunction(() => document.querySelector('#question').dataset.tilt === 'done', null, { timeout: 8000 });
await page.evaluate(() => { window.__tiltEv = 0; document.addEventListener('animationend', (ev) => { if (ev.animationName.startsWith('title-tilt')) window.__tiltEv++; }, true); });
check('judul game (variant ingame): "Mana yang lebih" normal lalu "BERAT?" tekanan, gaya kata sama dengan menu, satu baris, jarak = token ingame', await page.evaluate(() => { const t = document.querySelector('#question'); const m = document.querySelector('#game-title'); const cs = getComputedStyle; const [pl, em] = t.children; const mem = m.querySelector('.title-line__emphasis'), mpl = m.querySelector('.title-line__plain'); const same = ['fontFamily', 'fontWeight', 'color', 'textTransform'].every((k) => cs(pl)[k] === cs(mpl)[k] && cs(em)[k] === cs(mem)[k]); const l = pl.getBoundingClientRect(), a = em.getBoundingClientRect(); const fsE = parseFloat(cs(em).fontSize); return t.className === m.className && t.dataset.variant === 'ingame' && pl.className === 'title-line__plain' && em.className === 'title-line__emphasis' && same && t.textContent === 'Mana yang lebih Berat?' && Math.abs(parseFloat(cs(pl).fontSize) / fsE - 0.6) < 0.01 && Math.abs(parseFloat(cs(t).columnGap) / fsE - 0.27) < 0.01 && Math.abs(l.bottom - a.bottom) < t.getBoundingClientRect().height && a.left >= l.right - fsE * 0.1 && document.documentElement.scrollWidth <= innerWidth + 1; }));
check('HUD hanya skor, hati, jeda: elemen lama hilang', (await page.$$eval('#screen-game .pill--level, #screen-game .pill--mode, #screen-game .pill--combo, #screen-game .pill__badge, #screen-game .pill--lives, #screen-game #btn-sound, #screen-game .tagline', (e) => e.length)) === 0);
check('hati: 2 nyawa Hard, aria-label tersembunyi', (await page.getAttribute('.hearts', 'aria-label')) === 'Nyawa 2 dari 2' && (await page.$$eval('.heart[data-state="full"]', (e) => e.length)) === 2);
const boxH = () => page.evaluate(() => { const r = (q) => document.querySelector(q).getBoundingClientRect(); return { l: r('#card-left').height, r: r('#card-right').height, vl: r('#card-left .expr-card__value').height, vr: r('#card-right .expr-card__value').height, below: r('#card-left').bottom - r('#card-left .expr-card__expr').bottom }; });
const boxPre = await boxH();
check('box soal sebelum menjawab: tanpa ruang cadangan (baris nilai tinggi 0, tanpa min-height, ruang bawah ekspresi = padding saja)', boxPre.vl === 0 && boxPre.vr === 0 && (await page.evaluate(() => getComputedStyle(document.querySelector('#card-left')).minHeight)) === '0px' && boxPre.below < 30);
const side = await answer(false);
await page.waitForTimeout(300);
const fb = await page.getAttribute(side === 'left' ? '#btn-left' : '#btn-right', 'data-feedback');
check('jawaban benar → feedback good + skor naik', fb === 'good' && (await page.textContent('#hud-score')) !== '0');
check('benar: overlay hijau di box yang dipilih (lebih berat), box lain memudar, tanpa ikon ✓/✗ di box/tombol/pil', (await page.$$eval('.expr-card__mark, .answer__badge, #screen-game .seesaw__verdict .icon, .expr-card .icon, .answer[data-feedback] .icon--check, .answer[data-feedback] .icon--cross', (e) => e.length)) === 0 && (await page.$eval(side === 'left' ? '#card-left' : '#card-right', (e) => e.dataset.result)) === 'win' && (await page.$$eval('.expr-card[data-result="wrong"], .expr-card[data-result="faded"], .seesaw__item[data-faded]', (e) => e.length)) === 0);
const boxPost = await boxH();
check('box soal melebar setelah menjawab sebesar nilai + jarak, kedua box sama besar dan bersamaan', boxPost.vl > 15 && boxPost.vl === boxPost.vr && Math.abs(boxPost.l - boxPre.l - boxPost.vl) < 0.6 && Math.abs(boxPost.r - boxPre.r - boxPost.vr) < 0.6);
check('benar: aria-live mengumumkan "Benar" dan pil hanya teks', (await page.textContent('#sr-status')).startsWith('Benar') && (await page.textContent('#screen-game .seesaw__verdict')) === 'Benar!');
check('animasi judul game tidak berulang saat ronde berganti', (await page.evaluate(() => window.__tiltEv)) === 0 && (await page.getAttribute('#question', 'data-tilt')) === 'done');
check('kartu pemenang ditandai', (await page.$$eval('.expr-card[data-result="win"]', (e) => e.length)) === 1 && (await page.$$eval('.expr-card[data-result="lose"]', (e) => e.length)) === 1);
await page.waitForTimeout(1300);
await ready();
const boxNext = await boxH();
check('ronde baru: box kembali ke tinggi awal (tanpa sisa ruang nilai atau hasil)', boxNext.vl === 0 && boxNext.vr === 0 && (await page.$$eval('.expr-card[data-result]', (e) => e.length)) === 0);

// ---- notifikasi combo: streak 3 = pemanasan, hilang sendiri, tidak menangkap sentuhan ----
check('belum ada notifikasi combo di streak 1', !(await page.$eval('.combo-notice', (n) => n.classList.contains('is-on'))));
await answer(false);
await page.waitForTimeout(1300);
await ready();
await answer(false);
await page.waitForTimeout(350);
check('notifikasi combo muncul di streak 3 ("COMBO" + angka 3), teks sumber sama, aria-hidden, diumumkan lewat live region', (await page.$eval('.combo-notice', (n) => n.classList.contains('is-on'))) && (await page.textContent('.combo-notice__word')) === 'COMBO' && (await page.textContent('.combo-notice__num')) === '3' && (await page.getAttribute('.combo-notice', 'aria-hidden')) === 'true' && (await page.textContent('#sr-status')).includes('COMBO 3'));
check('combo arcade: tanpa pil/wadah (tanpa latar, border, radius, bayangan wadah, ikon), angka lebih besar dari kata, font arcade', await page.evaluate(() => { const f = document.querySelector('.combo-notice__face'); const cs = getComputedStyle; const w = cs(document.querySelector('.combo-notice__word')), n = cs(document.querySelector('.combo-notice__num')); return cs(f).backgroundColor === 'rgba(0, 0, 0, 0)' && cs(f).borderTopWidth === '0px' && cs(f).borderTopLeftRadius === '0px' && cs(f).boxShadow === 'none' && !document.querySelector('.combo-notice svg, .combo-notice .icon') && parseFloat(n.fontSize) > parseFloat(w.fontSize) * 1.4 && /Titan One/.test(w.fontFamily); }));
check('combo arcade: diletakkan tepat di bawah judul (relatif judul), menempel di tepi kanan, tanpa scroll horizontal saat tampil', await page.evaluate(() => { const n = document.querySelector('.combo-notice').getBoundingClientRect(); const t = document.querySelector('#question').getBoundingClientRect(); const s = document.querySelector('.combo-notice__slot').getBoundingClientRect(); return n.top >= t.bottom && innerWidth - s.right < innerWidth * 0.1 && document.documentElement.scrollWidth <= innerWidth + 1 && document.body.scrollWidth <= innerWidth + 1; }));
check('notifikasi combo tidak menangkap sentuhan (lapisan dan slot)', (await page.$eval('.combo-notice', (n) => getComputedStyle(n).pointerEvents)) === 'none' && (await page.$eval('.combo-notice__slot', (n) => getComputedStyle(n).pointerEvents)) === 'none');
await page.waitForTimeout(2000);
check('notifikasi combo hilang sendiri (~1,8 dtk) dan dibersihkan (tanpa kelas aktif, tanpa partikel)', !(await page.$eval('.combo-notice', (n) => n.classList.contains('is-on'))) && (await page.$$eval('.combo-notice__spark', (e) => e.length)) === 0 && (await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)));
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
check('Musik mati, SFX tetap nyala (terpisah)', (await page.getAttribute('#tgl-music-pause', 'aria-pressed')) === 'false' && (await page.getAttribute('#tgl-sfx-pause', 'aria-pressed')) === 'true' && (await page.getAttribute('#tgl-music', 'aria-pressed')) === 'false');
await page.click('#tgl-sfx-pause');
check('SFX mati, tersimpan di localStorage', (await page.evaluate(() => localStorage.getItem('bm.audio'))) === '{"music":false,"sfx":false}');
await page.click('#tgl-music-pause');
await page.click('#tgl-sfx-pause');
check('kedua toggle dinyalakan lagi', (await page.getAttribute('#tgl-music-pause', 'aria-pressed')) === 'true' && (await page.getAttribute('#tgl-sfx-pause', 'aria-pressed')) === 'true');
await page.click('#btn-resume');
await page.keyboard.press('m');
check('tombol M tidak lagi mengubah suara', (await page.getAttribute('#tgl-music', 'aria-pressed')) === 'true');

// ---- game over (2 nyawa Hard) ----
await ready().catch(() => {});
const wrongSide = await answer(true);
await page.waitForTimeout(400);
const other = wrongSide === 'left' ? '#card-right' : '#card-left';
check('salah: overlay merah HANYA di box yang dipilih; sisi benar faded, tanpa overlay hijau', (await page.$eval(wrongSide === 'left' ? '#card-left' : '#card-right', (e) => e.dataset.result)) === 'wrong' && (await page.$eval(other, (e) => e.dataset.result)) === 'faded' && (await page.$$eval('.expr-card[data-result="win"]', (e) => e.length)) === 0 && (await page.$$eval('.expr-card[data-result="lose"]', (e) => e.length)) === 0);
check('salah: sisi benar (box + objek) faded ≈ --opacity-faded (pada box dan gambar, bukan pada .seesaw__item), sisi dipilih penuh, tombol tidak ikut', await page.evaluate(([f, c]) => { const item = (id) => document.querySelector(id).closest('.seesaw__item'); const o = (el) => +getComputedStyle(el).opacity; const tok = +getComputedStyle(document.documentElement).getPropertyValue('--opacity-faded'); const fi = item(f), ci = item(c); return Math.abs(o(fi.querySelector('.expr-card')) - tok) < 0.02 && Math.abs(o(fi.querySelector('img')) - tok) < 0.02 && o(fi) === 1 && o(ci) === 1 && o(ci.querySelector('.expr-card')) === 1 && o(ci.querySelector('img')) === 1 && o(document.querySelector('#btn-left')) === 1 && o(document.querySelector('#btn-right')) === 1; }, [other, wrongSide === 'left' ? '#card-left' : '#card-right']));
check('salah: tanpa ikon ✓/✗, tombol terpilih beranimasi goyang, aria-live "Salah"', (await page.$$eval('.expr-card__mark, .answer__badge, #screen-game .seesaw__verdict .icon, .expr-card .icon, .answer[data-feedback] .icon--check, .answer[data-feedback] .icon--cross', (e) => e.length)) === 0 && (await page.getAttribute(wrongSide === 'left' ? '#btn-left' : '#btn-right', 'data-feedback')) === 'bad' && (await page.textContent('#sr-status')).startsWith('Salah') && (await page.textContent('#screen-game .seesaw__verdict')) === 'Salah');
check('salah: overlay merah terbaca (latar box dipilih ≠ box benar ≠ default)', await page.evaluate(([a, b]) => { const bg = (q) => getComputedStyle(document.querySelector(q)).backgroundColor; return bg(a) !== bg(b); }, [wrongSide === 'left' ? '#card-left' : '#card-right', other]));
await page.waitForTimeout(1100);
await ready();
check('ronde berikut: overlay, faded, dan feedback dilepas', (await page.$$eval('.expr-card[data-result], .answer[data-feedback], .seesaw__item[data-faded]', (e) => e.length)) === 0);
await answer(true);
await page.waitForSelector('#screen-over:not([hidden])', { timeout: 8000 });
check('game over: nyawa habis', (await page.textContent('#over-title')) === 'Nyawa Habis!');
check('ringkasan pengaturan di game over: isinya tetap, TANPA label "Pengaturan"', (await page.textContent('#over-summary')).includes('Hard • Normal • Semua tipe') && !/Pengaturan/.test(await page.textContent('#screen-over')));
check('panel akhir: tanpa info kecil di bawah judul, label "Combo maks" (bukan Streak) dan "Benar" (bukan "Benar / Salah")', await page.evaluate(() => { const t = document.querySelector('#screen-over').textContent; return !document.querySelector('#over-reason') && !/Streak/i.test(t) && t.includes('Combo maks') && t.includes('Benar') && !t.includes('Benar / Salah'); }));
check('panel akhir: hitungan "benar / dijawab" (kiri ≤ kanan) dan akurasi memakai counter yang sama', await page.evaluate(() => { const m = /^(\d+) \/ (\d+)$/.exec(document.querySelector('#over-counts').textContent.trim()); if (!m) return false; const c = +m[1], n = +m[2]; const acc = +document.querySelector('#over-accuracy').textContent.replace('%', ''); return c <= n && acc === (n === 0 ? 0 : Math.round((c / n) * 100)); }));
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
check('Cara Main tetap menjelaskan "Berat = hasil hitungan"', (await page.textContent('#overlay-howto')).includes('Berat = hasil hitungan'));
check('modal Cara Main + fokus di tombol X', (await page.evaluate(() => document.activeElement.id)) === 'btn-howto-close');
await page.keyboard.press('Escape');
check('Esc menutup Cara Main', !(await page.isVisible('#overlay-howto')));
check('fokus kembali ke tombol "?" setelah Esc', (await page.evaluate(() => document.activeElement.id)) === 'btn-howto');
await page.click('#btn-howto');
await page.waitForTimeout(500); // animasi masuk panel selesai
check('Cara Main: tombol "Mengerti" sudah tidak ada; X punya aria-label "Tutup", ikon SVG, tanpa teks', !(await page.textContent('#overlay-howto')).includes('Mengerti') && (await page.getAttribute('#btn-howto-close', 'aria-label')) === 'Tutup' && (await page.$('#btn-howto-close svg')) !== null && (await page.textContent('#btn-howto-close')).trim() === '');
check('Cara Main: X ≥ 48px, di pojok kanan atas panel, panel tidak meluap layar', await page.evaluate(() => { const x = document.querySelector('#btn-howto-close').getBoundingClientRect(); const sh = document.querySelector('#overlay-howto .sheet').getBoundingClientRect(); return x.width >= 48 && x.height >= 48 && x.right <= sh.right && x.top >= sh.top - 1 && x.left > sh.left + sh.width / 2 && sh.bottom <= innerHeight + 1 && sh.top >= 0; }));
await page.click('#btn-howto-close');
check('X menutup Cara Main dan fokus kembali ke "?"', !(await page.isVisible('#overlay-howto')) && (await page.evaluate(() => document.activeElement.id)) === 'btn-howto');
await page.click('#btn-howto');
await page.mouse.click(4, 4);
check('klik backdrop menutup Cara Main', !(await page.isVisible('#overlay-howto')));
await page.setViewportSize({ width: 360, height: 300 });
await page.click('#btn-howto');
await page.waitForTimeout(500);
check('layar sangat pendek: panel scroll di dalam dan X tetap terlihat setelah di-scroll', await page.evaluate(async () => { const sh = document.querySelector('#overlay-howto .sheet'); sh.scrollTop = sh.scrollHeight; await new Promise((r) => requestAnimationFrame(r)); const x = document.querySelector('#btn-howto-close').getBoundingClientRect(); return sh.scrollHeight > sh.clientHeight && x.top >= 0 && x.bottom <= innerHeight; }));
await page.click('#btn-howto-close');
check('layar sangat pendek: X tetap menutup', !(await page.isVisible('#overlay-howto')));
await page.setViewportSize({ width: 1280, height: 992 });
check('Musik/SFX: hanya simbol (tanpa teks), aria-label "Musik"/"Efek suara", title, aria-pressed, ukuran sama dengan "?"', await page.evaluate(() => { const g = (id) => document.getElementById(id); const m = g('tgl-music'), f = g('tgl-sfx'), q = g('btn-howto'); const r = (e) => { const b = e.getBoundingClientRect(); return [Math.round(b.width), Math.round(b.height)].join('x'); }; return m.textContent.trim() === '' && f.textContent.trim() === '' && m.getAttribute('aria-label') === 'Musik' && f.getAttribute('aria-label') === 'Efek suara' && m.title === 'Musik' && f.title === 'Efek suara' && m.getAttribute('aria-pressed') === 'true' && r(m) === r(q) && r(f) === r(q) && m.offsetWidth >= 48; }));
await page.click('#tgl-music');
await page.waitForTimeout(400); // transisi opacity selesai
check('Musik mati: aria-pressed=false, ikon memudar (opacity token) dan coretan terlihat', await page.evaluate(() => { const m = document.getElementById('tgl-music'); const [ic, st] = m.querySelectorAll('svg'); return m.getAttribute('aria-pressed') === 'false' && parseFloat(getComputedStyle(ic).opacity) < 1 && parseFloat(getComputedStyle(st).opacity) === 1; }));
await page.click('#tgl-music');
check('Musik nyala lagi: ikon penuh dan coretan hilang', await page.evaluate(async () => { await new Promise((r) => setTimeout(r, 400)); const m = document.getElementById('tgl-music'); const [ic, st] = m.querySelectorAll('svg'); return m.getAttribute('aria-pressed') === 'true' && parseFloat(getComputedStyle(ic).opacity) === 1 && parseFloat(getComputedStyle(st).opacity) === 0; }));
check('rekor beranda: "Rekor Saya" dan nilai berwarna hitam token (bukan cokelat)', await page.evaluate(() => { const p = document.querySelector('.best'); const v = document.querySelector('#title-best'); const q = getComputedStyle(document.documentElement).getPropertyValue('--color-question-text'); const probe = document.createElement('i'); probe.style.color = q; document.body.append(probe); const want = getComputedStyle(probe).color; probe.remove(); return p.textContent.startsWith('Rekor Saya') && getComputedStyle(v).color === want; }));
check('chip Pecahan: glyph 1/2 bersusun (SVG), aria-label "Pecahan"', await page.evaluate(() => { const i = document.querySelector('#chips input[value="fraction"]'); const svg = i.closest('label').querySelector('.chip__icon svg'); return i.getAttribute('aria-label') === 'Pecahan' && !!svg && !svg.querySelector('circle'); }));

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

// ---- feedback build-terbaru (jarak tombol 3D, radius, tanpa keybar, tombol Beranda, jarak bawah) ----
// 2) satu nilai radius untuk semua tombol (di viewport desktop ini)
const radii = await page.evaluate(() => {
  const set = new Set();
  for (const el of document.querySelectorAll('.btn, .icon-btn, .answer, .sym-btn, .seg__face, .chip__face')) {
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
check('tidak ada petunjuk keyboard (keybar) di game, mobile', (await mob.$$('.keybar, .keyhint, .keycap')).length === 0);
const ansBottom = await mob.evaluate(() => innerHeight - document.getElementById('btn-left').getBoundingClientRect().bottom);
check('tombol jawab tidak mepet tepi bawah di mobile (≥ 12px)', ansBottom >= 12, `${ansBottom.toFixed(1)}px`);
check('tidak ada petunjuk keyboard (keybar) di game, desktop', await (async () => {
  await page.click('#btn-play');
  await page.waitForFunction(() => !document.querySelector('#btn-left').disabled, null, { timeout: 8000 });
  const none = (await page.$$('.keybar, .keyhint, .keycap')).length === 0;
  await page.keyboard.press('p');
  const paused = await page.isVisible('#overlay-pause'); // pintasan tetap berfungsi
  await page.click('#btn-quit');
  return none && paused;
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

// reduced-motion: "BERAT?" langsung miring statis (5,3°), tanpa animasi, di menu dan game
// ---- layout in-game: desktop seimbang, HP portrait lebih dekat ke tombol, box tidak mepet/bertumpuk, fade tidak memotong ----
{
  const open = async (w, h, mobile) => {
    const p = await (await browser.newContext({ viewport: { width: w, height: h }, hasTouch: mobile, isMobile: mobile })).newPage();
    await p.goto(APP_URL);
    await p.evaluate(() => localStorage.clear());
    await p.reload();
    await p.click('#btn-play');
    await p.waitForFunction(() => !document.querySelector('#btn-left').disabled, null, { timeout: 8000 });
    await p.waitForTimeout(900);
    return p;
  };
  const geo = (p) => p.evaluate(() => {
    const r = (e) => e.getBoundingClientRect();
    const L = r(document.querySelector('#card-left')), R = r(document.querySelector('#card-right'));
    const head = r(document.querySelector('.game__head')), ss = r(document.querySelector('#screen-game .seesaw'));
    return {
      margin: Math.min(L.left, innerWidth - L.right, R.left, innerWidth - R.right),
      overlap: !(L.right <= R.left || R.right <= L.left || L.bottom <= R.top || R.bottom <= L.top),
      gapTitle: Math.min(L.top, R.top) - head.bottom,
      gapBtn: r(document.querySelector('#btn-left')).top - (ss.top + (ss.height * 258) / 260),
      scroll: Math.max(document.documentElement.scrollHeight - innerHeight, document.documentElement.scrollWidth - innerWidth),
    };
  });
  for (const [w, h] of [[1280, 720], [1366, 768], [1440, 900], [1920, 1080]]) {
    const p = await open(w, h, false);
    const g = await geo(p);
    check(`desktop ${w}×${h}: jarak judul→area utama ≈ area utama→tombol (selisih ≤ 16px; tergantung puncak objek), tanpa scroll`, Math.abs(g.gapTitle - g.gapBtn) <= 16 && g.scroll <= 0, `${g.gapTitle.toFixed(0)} vs ${g.gapBtn.toFixed(0)}`);
    await p.context().close();
  }
  for (const [w, h] of [[360, 640], [390, 844], [430, 932]]) {
    const p = await open(w, h, true);
    let worst = 1e9, overlap = false, gapBtn = 0, scroll = 0, titleGap = 1e9;
    for (let i = 0; i < 4; i++) {
      const flat = await geo(p);
      gapBtn = flat.gapBtn;
      await p.click(i % 2 ? '#btn-left' : '#btn-right');
      await p.waitForTimeout(1000); // papan miring + nilai terbuka (keadaan tetap)
      const tilt = await geo(p);
      for (const g of [flat, tilt]) { worst = Math.min(worst, g.margin); overlap ||= g.overlap; scroll = Math.max(scroll, g.scroll); titleGap = Math.min(titleGap, g.gapTitle); }
      await p.waitForTimeout(1500);
      await p.waitForFunction(() => !document.querySelector('#btn-left').disabled, null, { timeout: 8000 });
      await p.waitForTimeout(700);
    }
    check(`${w}×${h}: box ≥ 15px dari tepi layar (datar dan miring, kiri dan kanan), dua box tidak bertumpuk, tanpa scroll, tidak menabrak judul`, worst >= 15 && !overlap && scroll <= 0 && titleGap > 8, `margin min ${worst.toFixed(1)}px, jarak judul ${titleGap.toFixed(0)}px`);
    check(`${w}×${h}: jarak area utama ke tombol ≤ 20% tinggi layar (sebelumnya ±22–28%)`, gapBtn <= 0.2 * h, `${gapBtn.toFixed(0)}px`);
    await p.context().close();
  }
}

const rm = await (await browser.newContext({ viewport: { width: 1280, height: 992 }, reducedMotion: 'reduce' })).newPage();
await rm.goto(APP_URL);
await rm.waitForSelector('#btn-play');
const rmState = (sel) => rm.evaluate((s) => { const el = document.querySelector(s + ' .title-line__emphasis'); const m = new DOMMatrix(getComputedStyle(el).transform); return { ang: Math.atan2(m.b, m.a) * 180 / Math.PI, anim: getComputedStyle(el).animationName }; }, sel);
const rmMenu = await rmState('#screen-title');
await rm.click('#btn-play');
await rm.waitForTimeout(150);
const rmGame = await rmState('#screen-game');
check('reduced-motion: "BERAT?" miring statis 5,3° sejak frame pertama, tanpa animasi (menu dan game)', Math.abs(rmMenu.ang - 5.3) < 0.1 && rmMenu.anim === 'none' && Math.abs(rmGame.ang - 5.3) < 0.1 && rmGame.anim === 'none');

check('tidak ada error konsol/halaman', errors.filter((e) => !/vibrate/.test(e)).length === 0, errors.join(' | '));
console.log(fails === 0 ? '\nSEMUA LULUS' : `\n${fails} GAGAL`);
await browser.close();
process.exit(fails ? 1 : 0);
