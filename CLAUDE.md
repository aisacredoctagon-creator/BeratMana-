# CLAUDE.md — Berat Mana?

Minigame browser (Vite + TypeScript strict + CSS, tanpa framework). UI berbahasa Indonesia.

## Aturan UI (WAJIB)
**Semua UI baru wajib memakai token di `src/styles/tokens.css` dan komponen di `DESIGN.md`. Dilarang hardcode warna atau ukuran.**

- Sumber kebenaran visual: frame Figma `Html → Body` (node `17:248`; tautan file tidak dicantumkan karena repo publik). Bila ada perbedaan, Figma menang; catat keputusan turunan di `DESIGN.md` §10.
- Warna, ukuran (px/rem/vw/dvh/…), durasi, z-index, bobot/tinggi baris/tracking font: hanya lewat variabel `--*` dari `tokens.css`. Ukuran desain = `calc(N * var(--u))`.
- Butuh nilai baru? Tambahkan token di `tokens.css` dulu (tandai "turunan" bila tidak dari Figma) dan dokumentasikan di `DESIGN.md`.
- Pakai/komposisikan komponen yang ada (`src/ui/components/`, `src/styles/components/`). Jangan membuat gaya tombol/kartu/pil baru di luar sana.
- Tombol: semua memakai `--radius-button`; tombol 3D wajib mengompensasi kedalaman bayangannya dengan `margin-block-end` (`--_depth`, lihat DESIGN.md §4) — jangan menambal jarak per layar.
- Wajib: area sentuh ≥ 48px, kontras teks ≥ 4,5:1, benar/salah tidak hanya warna (ikon ✓/✗), hormati `prefers-reduced-motion`, animasi hanya `transform`/`opacity`.
- `npm run lint:tokens` harus lulus (ikut `npm test` dan `npm run build`).

## Deploy (GitHub Pages)
- **Push ke `main` = deploy ke produksi** (https://aisacredoctagon-creator.github.io/BeratMana-/). Jalankan `npm run build` dan `npm test` sebelum push.
- Jangan commit `.env`, `references/`, atau `feedback/` (repo publik; sudah di `.gitignore`).
- Semua path aset memakai `import.meta.env.BASE_URL` (atau `%BASE_URL%` di `index.html`); jangan tulis path absolut `/…` atau `./…` di kode.
- Nama repo adalah **`BeratMana-`** (dengan tanda hubung); itu ikut di `base` (`vite.config.ts`), URL, dan tag Open Graph.
- Cek setelah deploy: `node scripts/visual/deploy-check.mjs` (set `APP_URL` ke URL produksi).

## Perintah
- `npm run dev` · `npm run build` (lint token + tsc + vite) · `npm test` (lint token + vitest) · `npm run typecheck`
- Aset Figma: `node scripts/build-figma-art.mjs` (merakit penyangga jungkat-jungkit dari `scripts/figma-src/`).
- Verifikasi: `npm run e2e` (butuh `npm run dev` berjalan + Chrome), `node scripts/visual/shot.mjs <nama> <lebar> <tinggi> <skenario>` untuk screenshot piksel-akurat ke `.shots/`. Setelah mengubah UI, tangkap layar di 1280×992 dan 360×740 dan bandingkan dengan `references/Figma_17-248_game.png` (berkas lokal, tidak di-commit; ambil ulang dari Figma `17:248` bila tidak ada).

## Arsitektur singkat
- `src/config/` — `difficulty.ts` (DIFFICULTY_CONFIG, semua tuning), `items.ts` (benda).
- `src/generator/` — pembuat soal murni (tanpa DOM), aritmetika rasional eksak, tes Vitest.
- `src/game/` — engine (skor, combo, timer, nyawa), settings.
- `src/services/` — storage, audio (Web Audio), haptics, share.
- `src/ui/` — controller layar + `components/` (pabrik DOM yang dapat dipakai ulang).
- `src/styles/` — `tokens.css` (satu-satunya sumber nilai), `components/`, `screens/`, `motion.css`.

## Konvensi
- Logika game tidak boleh menyentuh DOM; UI tidak boleh berisi aturan game.
- Komentar dan teks UI berbahasa Indonesia; identifier berbahasa Inggris.
