# Berat Mana?

Minigame browser: dua benda di jungkat-jungkit, masing-masing diberi **hitungan**. **Berat = hasil hitungan, bukan ukuran gambar.** Tekan `<` bila sisi kiri lebih berat, `>` bila sisi kanan.

Vite + TypeScript (strict) tanpa framework. UI dibangun dari komponen DOM + CSS bertoken (design system dari Figma, lihat [DESIGN.md](DESIGN.md)), animasi hanya `transform`/`opacity`, audio disintesis dengan Web Audio API (tanpa file audio). JS ±21 kB gzip, CSS ±10 kB, font ±56 kB (self-host).

## Menjalankan

Butuh Node.js 20+.

```bash
npm install
npm run dev        # server dev di http://localhost:5173/BeratMana-/ (base path ikut dipakai)
```

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | server pengembangan (hot reload) |
| `npm run build` | lint token + cek tipe (`tsc`) + build produksi ke `dist/` |
| `npm run preview` | menyajikan hasil build untuk dicoba lokal |
| `npm test` | lint token + seluruh unit test (Vitest) |
| `npm run lint:tokens` | menolak warna/ukuran yang di-hardcode di luar `src/styles/tokens.css` |
| `npm run e2e` | uji fungsional di Chrome headless (jalankan `npm run dev` dulu) |
| `npm run typecheck` | hanya cek tipe |

## Deploy (GitHub Pages)

**Main di: https://aisacredoctagon-creator.github.io/BeratMana-/**

Repo: https://github.com/aisacredoctagon-creator/BeratMana- (nama repo diakhiri tanda hubung; itu bagian dari nama dan ikut di URL dan `base`).

- **Otomatis:** workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) berjalan pada setiap push ke `main` (atau manual lewat tab *Actions → Deploy to GitHub Pages → Run workflow*): `npm ci` → `npm test` → `npm run build` → publikasi `dist/`.
- **Cara update:** edit → `npm test && npm run build` → `git commit` → `git push origin main` → live dalam ±1–2 menit. **Push ke `main` = deploy ke produksi.**
- **Rollback:** `git revert <commit>` lalu `git push` (live kembali otomatis). Alternatif: tab *Actions*, pilih run lama yang sukses, *Re-run all jobs*.
- **Syarat:** di akun GitHub Free, GitHub Pages hanya untuk repo **publik**. Jangan commit rahasia (`.env`), `references/`, atau `feedback/` (sudah ada di `.gitignore`).
- **Base path:** `vite.config.ts` memakai `base: '/BeratMana-/'`. Semua path aset memakai `import.meta.env.BASE_URL` (atau `%BASE_URL%` di `index.html`). Untuk hosting di root domain (Netlify/Vercel/lokal): `BASE_PATH=/ npm run build`.
- **Cek hasil deploy:** `APP_URL=https://aisacredoctagon-creator.github.io/BeratMana-/ node scripts/visual/deploy-check.mjs` (tanpa 404, tanpa error konsol, manifest/ikon/service worker, tag Open Graph). Lokal: `npm run build && npm run preview` lalu `node scripts/visual/deploy-check.mjs`.
- **Cache:** GitHub Pages mengatur cache sendiri (±10 menit). `public/sw.js` memuat halaman dari jaringan dulu, jadi versi baru langsung dipakai; naikkan `VERSION` di `sw.js` bila perlu membuang cache lama.
- **Routing:** game satu halaman tanpa routing, jadi tidak perlu `404.html`. `public/.nojekyll` memastikan Jekyll tidak memproses berkas.
- **Pratinjau tautan:** gambar OG ada di `public/og-image.png` (1200 × 630). WhatsApp menyimpan pratinjau di cache; untuk menguji ulang tempel tautan dengan parameter baru, mis. `...BeratMana-/?v=2`, atau pakai https://developers.facebook.com/tools/debug/ (Facebook Sharing Debugger) untuk menyegarkan cache.

## Aturan permainan

- **Mode**: *Time Attack* (60 detik; salah = penalti waktu dan combo reset; streak 5, 10, 15, … = +2 detik) dan *Normal* (tanpa timer, nyawa terbatas). Timer Time Attack hanya berjalan saat menunggu jawaban, tidak saat animasi hasil.
- **Skor** = 10 × combo × pengali kesulitan (Easy ×1, Medium ×1,5, Hard ×2), dibulatkan. Combo: ×2 di streak 5, ×3 di 10, ×4 di 15, ×5 di 20 (maksimum).
- **Rekor** terpisah per kombinasi mode × kesulitan (6 rekor); pilihan tipe soal tidak memecah rekor. Lihat bagian *Penyimpanan rekor*.
- **Level intensitas** naik tiap 5 jawaban benar: angka makin besar dan selisih makin tipis, dibatasi `levelMax` kesulitan.
- Kontrol: `←` `→` atau `A` `D` menjawab, `P`/`Esc` jeda, `M` bisukan semua suara. Game otomatis dijeda saat tab disembunyikan.

## Penyimpanan rekor

Satu-satunya pintu: `src/services/records.ts` (`getBest`, `submitScore`) dan `src/game/session.ts` (`GameSession`).

- **Key per kombinasi:** `bm:best:v2:{mode}:{difficulty}` berisi satu bilangan bulat (mis. `bm:best:v2:time:hard` = `400`). Data rusak di satu key tidak memengaruhi kombinasi lain.
- **Membaca tidak pernah menulis.** Kombinasi tanpa data = `null` ("belum ada rekor"; di UI tampil 0), tidak pernah disimpan sebagai 0.
- **Rekor hanya naik.** Skor harus bilangan bulat ≥ 1; skor 0 tidak direkam. Nilai berlaku = maksimum dari memori sesi dan localStorage, jadi gagal-tulis (kuota, mode privat) atau tab lain tidak membuat rekor hilang atau turun. Tanpa localStorage, rekor bertahan di memori selama sesi.
- **Kombinasi = pengaturan saat sesi dimulai.** `GameSession` mengambil snapshot beku `{mode, difficulty}` di awal; mengubah pilihan di beranda sesudahnya tidak memengaruhi sesi yang berjalan.
- **Merekam saat keluar.** `endSession(reason)` idempoten (`gameover`, `quit`, `restart`): game over, "Keluar ke Menu" dan "Ulangi" di jeda merekam skor terakhir. Saat tab disembunyikan atau ditutup (`visibilitychange: hidden`, `pagehide`) dilakukan *checkpoint*: skor saat itu direkam tanpa menutup sesi (pemain bisa kembali). "REKOR BARU!" hanya tampil di layar game over.
- **Migrasi:** data lama `bm.best` (satu JSON untuk semua kombinasi) dimigrasikan sekali jalan, hanya entri berbentuk `mode:kesulitan` dengan bilangan bulat valid. Entri yang tidak pasti diabaikan (peringatan di konsol), JSON lama yang rusak dilewati, dan key lama dibiarkan sebagai arsip.
- **Origin bersama:** semua situs `aisacredoctagon-creator.github.io/*` berbagi localStorage. Semua key game ini berawalan `bm:`; jangan pakai awalan itu di proyek lain.

## Struktur

```
src/
  config/difficulty.ts   DIFFICULTY_CONFIG + semua konstanta tuning
  config/items.ts        daftar benda (gambar) + preload
  generator/             PURE, tanpa DOM, mudah diuji
    rational.ts            aritmetika pecahan eksak (tanpa float)
    expression.ts          Expr, token label, format angka gaya Indonesia
    types/                 satu file per tipe soal + registry.ts
    index.ts               generateQuestion(...)
    generator.test.ts      Vitest, ribuan iterasi acak
  game/                  engine.ts (skor, combo, timer, nyawa), scoring.ts, settings.ts
  services/              records.ts (rekor), storage.ts (pengaturan, audio), audio.ts, haptics.ts, share.ts
  ui/
    components/            komponen reusable: button, pill, controls, expression-card, modal, toast, icons
    screens/               title-screen, game-screen, over-screen, overlays, router
    game-view.ts hud.ts seesaw.ts settings-panel.ts effects.ts   controller
  styles/
    tokens.css             SATU-SATUNYA sumber warna/ukuran/tipografi/bayangan/gerak
    base.css  motion.css  fonts.css
    components/            button, card, pill, controls, hud, seesaw, overlay
    screens/               title, game, over
public/                  favicon, manifest, ikon, sw.js, assets/items/, assets/seesaw/
scripts/                 build-figma-art.mjs, make-icons.mjs, check-tokens.mjs, visual/ (e2e, screenshot)
references/              screenshot Figma sumber + hasil implementasi
DESIGN.md                dokumentasi design system  ·  CLAUDE.md  aturan kerja
```

## Design system

Seluruh tampilan mengikuti satu frame Figma (`Html → Body`, node `17:248`). Nilai visual hidup di [`src/styles/tokens.css`](src/styles/tokens.css); komponen, state, aturan boleh/tidak boleh, dan daftar **asumsi desain** untuk layar yang tidak ada di Figma ada di [DESIGN.md](DESIGN.md). Semua ukuran = `N * var(--u)` (`--u` = 1px pada kanvas 1280 × 992, mengecil otomatis sampai 360px). Menulis warna/ukuran langsung di CSS/TS akan menggagalkan `npm run lint:tokens`.

## Menyesuaikan `DIFFICULTY_CONFIG`

Semua parameter ada di [`src/config/difficulty.ts`](src/config/difficulty.ts); tidak ada angka kesulitan di logika.

```ts
medium: {
  minDiffRatio: 0.1,      // selisih relatif minimum: |a-b| / max(a,b)
  minDiffAbs: 1,          // selisih absolut minimum (untuk dua sisi bernilai bulat)
  timePenalty: 3,         // detik yang hilang saat salah (Time Attack)
  lives: 3,               // nyawa (Normal)
  scoreMultiplier: 1.5,
  levelMax: 10,           // level intensitas tertinggi
  gap: { start: 0.5, end: 0.2 },  // batas ATAS selisih relatif: level 0 → levelMax
  magnitudeStart: 0.4,    // porsi rentang nilai yang dipakai di level 0 (naik ke 1)
  ranges: { add, sub, mul, div, fraction, decimal },  // rentang angka per tipe
}
```

Contoh: agar Hard lebih manusiawi, naikkan `minDiffRatio` ke `0.05`, perbesar `gap.end` ke `0.12`, atau naikkan `timePenalty`. Durasi Time Attack, bonus streak, dan tangga combo ada di `TIME_ATTACK` dan `SCORING` pada file yang sama. `LEVEL_EVERY` mengatur seberapa cepat level naik.

Catatan tentang "selisih absolut minimal 1": syarat ini hanya berlaku bila **kedua sisi bilangan bulat**. Untuk pecahan/desimal syaratnya relatif saja (mis. 3/4 vs 5/8 selisihnya 0,125, yang mustahil bila harus ≥ 1). Nilai kedua sisi tidak pernah sama.

## Menambah tipe soal baru

Contoh: tipe "persen". Ada empat langkah.

1. **Daftarkan id** di `src/config/difficulty.ts`: tambahkan `'percent'` ke `type QType`, ke `QTYPES`, dan ke `QTYPE_INFO` (nama lengkap + nama singkat untuk ringkasan).
2. **Rentang** (opsional): tambahkan `percent: {...}` ke `ranges` di tiap kesulitan dan ke tipe `DifficultyConfig`.
3. **Buat `src/generator/types/percent.ts`** yang mengekspor `QuestionTypeDef`:
   ```ts
   export const percentType: QuestionTypeDef = {
     id: 'percent',
     span: (cfg) => ({ min: 1, max: 200 }),           // rentang nilai alami
     build({ cfg, rng }, target) {                     // buat ekspresi ≈ target
       // ... hitung nilai sebagai Rat eksak, lalu:
       return makeExpr('percent', rat(nilai), [txt('25% × 80')]);
     },
   };
   ```
   `build` harus **selalu** mengembalikan ekspresi (jepit target ke jangkauan tipe), dan nilai harus berupa `Rat` (`rat(n, d)`) agar perbandingan eksak.
4. **Daftarkan** di `src/generator/types/registry.ts` (`TYPE_DEFS`). Chip di panel pengaturan, ringkasan, dan mode Mix otomatis mengikuti `QTYPES`.

Lalu tambahkan `percent` ke daftar di `TYPE_SETS` pada `generator.test.ts`; semua tes aturan wajib (tidak pernah sama, hasil benar, selisih sesuai kesulitan, dst.) langsung berlaku untuk tipe baru. Bila ada label baru, perluas parser kecil `evaluate()` di file tes tersebut.

## Mengganti gambar benda

Benda ada di `public/assets/items/` dan didaftarkan di [`src/config/items.ts`](src/config/items.ts).

- `bulu.svg` dan `gajah.svg` dirakit dari vektor Figma (`node scripts/build-figma-art.mjs`, sumber di `scripts/figma-src/`).
- Sisanya (landasan, balon, bola bowling, kapas, batu, bantal, dumbel, mobil) adalah **SVG placeholder** dalam gaya yang sama. Untuk mengganti: timpa file dengan nama yang sama, atau tambah/ubah entri di `ITEMS` (SVG/PNG/WebP).
- Gaya: isi datar lembut + garis lebih gelap sewarna (±3% lebar gambar) + sorotan putih tipis, tanpa gradasi. Gambar persegi (viewBox 200 × 200), latar transparan, benda menempel di **dasar** gambar supaya duduk rapi di atas papan. Detail di DESIGN.md §9.

## Audio

Dua toggle terpisah (Musik, SFX), masing-masing hanya mute/unmute dan tersimpan. Semua suara disintesis di `src/services/audio.ts` (benar, salah, combo, game over, klik, tick 10 detik terakhir). `AudioContext` baru dibuat setelah interaksi pertama pengguna dan ditangguhkan saat jeda atau tab disembunyikan.

## Catatan teknis

- Perbandingan nilai memakai `Rat` (pecahan integer): `0,1 + 0,2` sama persis dengan `0,3`, `1/3 + 1/6` dengan `1/2`.
- Generator memilih nilai target bersama untuk kedua sisi, membangun ekspresi A ≈ target dan B ≈ target·(1 ± selisih), lalu memvalidasi eksak. Jika pemain mencentang tipe dengan rentang nilai jauh berbeda (mis. pecahan + perkalian Hard), generator memilih pasangan tipe yang rentangnya beririsan lebih dulu; bila tak ada, soal tetap valid tetapi lebih mudah.
- `prefers-reduced-motion` dihormati: shake dan partikel dimatikan, transisi dipersingkat.
- Font Fredoka dan Plus Jakarta Sans (lisensi OFL) di-self-host lewat paket `@fontsource`, hanya subset latin.
- Double-tap zoom, seleksi teks, dan scroll bounce dicegah lewat CSS (`touch-action: manipulation`, `overscroll-behavior: none`); pinch-zoom tetap boleh demi aksesibilitas.

## Kredit & lisensi aset

| Bagian | Sumber | Lisensi |
| --- | --- | --- |
| Font **Fredoka** (variabel, subset latin) | paket npm `@fontsource-variable/fredoka` | SIL Open Font License 1.1 |
| Font **Plus Jakarta Sans** (miring 500/700, subset latin) | paket npm `@fontsource/plus-jakarta-sans` | SIL Open Font License 1.1 |
| Ikon petir (mode) | Bootstrap Icons (`bi:lightning-charge-fill`), via desain Figma | MIT |
| Ikon api (combo) | Ant Design Icons (`ant-design:fire-filled`), via desain Figma | MIT |
| Ilustrasi bulu, gajah, penyangga segitiga; ikon chevron, suara, jeda | file desain Figma milik pemilik proyek, dirakit oleh `scripts/build-figma-art.mjs` | © pemilik proyek |
| Benda lain (landasan, balon, bola bowling, kapas, batu, bantal, dumbel, mobil), ikon lain (centang, silang, hati, piala, bagikan, dll.), ikon aplikasi, gambar OG | digambar untuk proyek ini | © pemilik proyek |
| **Musik dan efek suara** | **tidak ada berkas audio**; semuanya disintesis oleh kode (Web Audio API) di `src/services/audio.ts` | © pemilik proyek |
| Alat pengembangan (tidak ikut ke situs): Vite, Vitest (MIT), TypeScript, sharp, playwright-core (Apache-2.0) | npm | lihat masing-masing paket |

Tidak ada library JavaScript runtime pihak ketiga yang dikirim ke browser selain font di atas.
