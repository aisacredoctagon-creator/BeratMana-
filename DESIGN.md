# DESIGN.md — Design System "Berat Mana?"

**Sumber kebenaran visual:** frame Figma `Html → Body` (node `17:248`, 1280 × 992; tautan file tidak dicantumkan karena repo publik).
Figma tidak punya variables/styles, jadi nama token diturunkan dari nama layer dan skala warna (Tailwind) yang dipakai frame.

> **Aturan emas:** semua UI wajib memakai token di [`src/styles/tokens.css`](src/styles/tokens.css) dan komponen di dokumen ini.
> Dilarang menulis warna atau ukuran langsung di CSS/TS. `npm run lint:tokens` (ikut `npm test` dan `npm run build`) menggagalkan build bila ada pelanggaran.

---

## 1. Prinsip

1. **Mainan, bukan dasbor.** Bentuk bulat besar (radius 16–24), garis tebal 2px, permukaan putih di atas latar biru-abu muda, dan tombol **3D "chunky"** yang benar-benar turun saat ditekan.
2. **Satu keluarga warna = satu makna.** Kuning = skor, hijau = benar/pengaturan aktif, ungu = pilihan terpilih, merah muda = combo (game over)/kanan, biru langit = waktu, biru = kiri. Jangan memakai warna itu untuk makna lain.
3. **Kiri biru, kanan koral.** Tombol jawab, kartu ekspresi, dan label sisi memakai pasangan warna yang sama.
4. **Feedback jawaban memakai overlay warna pada jawaban yang dipilih, tanpa ikon.** State salah: overlay merah pada jawaban yang dipilih, sisi benar di-fade out (tanpa overlay hijau). State benar: overlay hijau pada jawaban yang dipilih. Isyarat nonvisual (aria-live, gerak, SFX, haptic) wajib menyertai.
5. **Satu kanvas, skala fluid.** Desain dibuat di 1280 × 992; semua ukuran = `N × var(--u)` sehingga tampil sama di 1280px dan mengecil rapi sampai 360px.

## 2. Skala fluid (`--u`)

`--u: clamp(0.72px, min(0.078125vw, 0.100806dvh), 1.25px)`

| Viewport | `--u` | Efek |
| --- | --- | --- |
| 1280 × 992 (kanvas Figma) | 1px | pixel-perfect |
| 1920 × 1080 | ±1.09px | ikut tinggi layar |
| 1280 × 720 | ±0.73px | semua mengecil proporsional |
| 360 × 740 (HP) | 0.72px (lantai) | tata letak berubah (lihat §8), teks pakai lantai sendiri |

Aturan: `calc(24 * var(--u))` boleh (itu isi token); menulis `24px` di luar `tokens.css` **tidak boleh**.
Teks memakai token `--fs-*` yang sudah punya lantai (`max(rem, N*u)`), jadi tidak pernah di bawah 12px (eyebrow), 13px (tag), 15px (badan).
Area sentuh minimum `--tap-min` = 48px (ikon 40px diperluas dengan area transparan).

## 3. Token

### 3.1 Warna primitif (skala Tailwind)
`--color-{slate,amber,orange,emerald,violet,purple,indigo,rose,sky,blue,yellow}-{50…950}`, `--color-app-bg` (`#f4f7fb`), `--color-white/black`, `--color-rose-chip`, `--color-red-pin(-deep)`.
Warna berlabel **"turunan"** di `tokens.css` tidak ada di Figma (lihat §10).

### 3.2 Warna semantik (yang boleh dipakai komponen)

| Kelompok | Token |
| --- | --- |
| Permukaan | `--surface-app` `--surface-bar` `--surface-card` `--surface-sunken` `--surface-scrim` |
| Garis | `--line-bar` `--line-control` |
| Teks | `--text-strong` `--text-body` `--text-muted` `--text-muted-on-app` `--text-subtle` `--text-on-accent` |
| Fokus | `--focus-ring` |
| Hasil | `--good-bg` `--good-soft` `--good-line` `--bad-bg` `--bad-soft` `--flash-good` `--flash-bad` |
| Sisi kiri | `--side-left-{bg,line,solid,glow,tag-bg,tag-line,tag-text}` |
| Sisi kanan | `--side-right-{bg,line,solid,glow,tag-bg,tag-line,tag-text}` |
| Teks soal | `--color-question-text` (satu warna untuk semua teks soal; = sky-950 `#082f49`, kontras 13,9:1 di putih, 13,2:1 di kartu menang) |
| Tombol | `--btn-primary-*` `--btn-secondary-*` `--btn-off-*` |
| Pil | `--pill-{score,level,mode,combo,time}-*` `--star-tile-*` (HUD memakai skor dan waktu; level/combo hanya di game over) |
| Hati (nyawa) | `--heart-{full,lost}` `--heart-size` `--heart-gap` |
| Jungkat-jungkit | `--beam-*` `--pin-*` `--base-*` |
| Judul | `--title-lead` (slate-800) `--title-accent` (rose-500, flat) |

### 3.3 Tipografi

| Peran | Font | Bobot | Ukuran (desain) | Token |
| --- | --- | --- | --- | --- |
| Judul game (satu baris) | **Montserrat** | pembuka 700, aksen 900 | aksen **72** *(turunan)*, pembuka 0,6 × aksen (43,2), lh 1 | `--font-title` `--fs-title-heavy` `--fs-title-lead` `--lh-title` |
| H2 (judul modal/game over) | Fredoka | 600 | 40 *(turunan)* | `--fs-h2` `--lh-h1` `--ls-h1` |
| Ekspresi kartu | Fredoka | 600 | 48 / 48, tracking 0,02em | `--fs-expr` `--lh-expr` `--ls-expr` |
| Skor besar (game over) | Fredoka | 600 | 64 *(turunan)* | `--fs-score-hero` |
| Nilai HUD | Fredoka | 600 | **24** (Figma 20) / 1,2 | `--fs-value` `--lh-value` |
| Tombol utama | Fredoka | 600 | **28** *(turunan)* | `--fs-button` |
| Teks pil / badan | Fredoka | 500–600 | **16** (Figma 14) / 1,4 | `--fs-body` `--lh-body` |
| Teks besar (daftar Cara Main) | Fredoka | 500–600 | **18** *(turunan)* | `--fs-body-lg` |
| Tag kartu, hint | Fredoka | 600 | **14** (Figma 12) / 1,3, UPPERCASE, tracking 0,05em | `--fs-tag` `--lh-tag` `--ls-tag` |
| Eyebrow HUD | Fredoka | 600 | **12** (Figma 10) / 1,2, UPPERCASE | `--fs-eyebrow` `--lh-eyebrow` `--ls-eyebrow` |

Aturan: angka dan teks UI = Fredoka; **Montserrat HANYA untuk judul game** (`.title-line`, §4.14), bobot 700 dan 900 saja. Label kecil selalu UPPERCASE + tracking. Angka memakai `font-variant-numeric: tabular-nums` pada skor/timer. Jangan pakai bobot di luar 500/600/700 (kecuali judul: 700/900).

### 3.4 Spasi, radius, garis
- **Spasi** `--space-{2,4,6,8,10,12,14,16,20,22,24,30,40,64,128}` (nama = px di kanvas desain).
- **Radius** `--radius-sm` 8 (kotak centang, badge, tombol di Cara Main), `-md` 12 (ubin bintang), `-lg` 16 (pil, ubin ikon jawab), `-xl` 24 (kartu, panel, sheet), `-full` (tag, lencana, pita, toast, papan, pin).
- **`--radius-button`** (= `-xl`, 24) = SATU-SATUNYA radius untuk semua tombol: tombol utama/sekunder, tombol ikon, tombol jawab, toggle, segmented control, chip. Dipilih karena itu radius paling membulat di antara tombol saat audit. Pil, tag, dan badge bukan tombol dan tidak memakainya. Tombol baru wajib memakai token ini.
- **Garis** `--border-1` (kartu), `--border-2` (pil, tombol), `--ring-width`/`--ring-offset` (fokus).

### 3.5 Bayangan
`--shadow-pill`, `--shadow-bar`, `--shadow-key` (tombol ikon 3D), `--shadow-answer-{left,right}` (+`-pressed`), `--shadow-btn-primary` (+`-pressed`), `--shadow-btn-off`, `--shadow-inset-tile`, `--shadow-sheet`, `--shadow-toast`, `--shadow-beam/pin/base/stand`, `--shadow-title`.
Bayangan tombol terdiri dari **dasar solid** (tampak seperti ketebalan tombol) + **glow** lembut.

### 3.6 Gerak
Durasi `--dur-{instant,fast,base,slow,tilt,tilt-reset,enter,verdict,shake,pop,rock}`; easing `--ease-{out,in-out,pop,reset}` dan `--spring` (diganti `linear()` pegas oleh JS bila didukung).
Jarak tekan tombol 3D `--press-travel` (8) dan `--press-travel-sm` (4). Z-index `--z-{bar,overlay,toast,flash}`.

### 3.7 Responsif & area aman
`--u`, `--safe-{top,right,bottom,left}` (`env(safe-area-inset-*)`), `--gutter`, `--tap-min`. Varian layar sempit (`@media (max-width: 720px)`) hanya mengubah token (padding HUD, jarak antarblok, padding kartu).

---

## 4. Komponen

Semua komponen ada di `src/ui/components/` (pabrik DOM: `createX(...)`) dan `src/styles/components/*.css`. **Hanya memakai token.**

**Aturan tombol 3D (kedalaman bayangan):** bayangan solid di bawah tombol (`--depth-3d` = 4 untuk tombol standar, `--depth-3d-lg` = 8 untuk tombol utama merah dan tombol jawab) hanya cat, tidak masuk ukuran layout. Setiap tombol 3D karena itu wajib menambah `margin-block-end` sebesar kedalamannya (`--_depth` pada `.btn`, `.answer`, `.switch`; `padding-block-end: var(--depth-3d)` pada wadah `.chip` / `.seg__opt`) supaya jarak visual antar-elemen sama dengan jarak layout (`gap`). Pengecualian: `.icon-btn` di HUD (posisinya ditentukan baris HUD). Jangan menambal jarak per layar; tombol 3D baru cukup memakai pola ini.

State yang wajib ada pada komponen interaktif: **default · hover · pressed · disabled · focus-visible · selected/checked** (bila relevan) + **feedback** (khusus tombol jawab).

### 4.1 Tombol utama / sekunder — `.btn`
| | Primer `.btn--primary` | Sekunder `.btn--secondary` |
| --- | --- | --- |
| Default | latar `--btn-primary-bg`, garis `--btn-primary-line`, radius 24, bayangan `--shadow-btn-primary`, teks putih `--fs-button` | latar putih, garis `--btn-secondary-line` 2px, bayangan `--shadow-key`, teks `--btn-secondary-text` |
| Hover | naik `--lift`, glow menguat | naik `--lift` |
| Pressed | turun `--press-travel`, bayangan solid hilang (`-pressed`) | turun `--press-travel-sm` |
| Disabled | `--btn-off-*`, turun `--press-travel-sm`, tidak bisa diklik | sama |
| Focus | cincin `--focus-ring` (`--ring-width`, offset `--ring-offset`) | sama |
Tinggi minimum `--tap-min`.

### 4.2 Tombol ikon — `.icon-btn`
40 × 40 (`--icon-btn`), putih, garis 2px slate-300, radius 16, `--shadow-key`, ikon 20. Area sentuh diperluas ke ≥ 48px lewat `::after`. Pressed: turun + bayangan hilang. Pakai untuk Jeda (HUD).

### 4.3 Tombol jawab (panah tebal kiri/kanan) — `.answer`
Kiri biru (`--side-left-*`), kanan koral (`--side-right-*`). Tinggi `--answer-h`, radius 24, garis 2px, bayangan 3D (`--shadow-answer-*`). **Panah tebal berekor** (ikon `arrowLeft`/`arrowRight`, SVG inline, viewBox 48 × 32) berdiri langsung di muka tombol, tanpa ubin (A50): putih solid (`currentColor`), sudut membulat (garis + isi sewarna, `stroke-linejoin: round`), lebar `--answer-arrow` = `clamp(96u, 40cqi, 112u)` (±40% lebar tombol lewat `container-type: inline-size` pada `.answer`; batas atas menjaga tinggi panah ≤ 60% tinggi tombol). Bayangan = `filter: drop-shadow(0 --answer-arrow-depth 0 --_solid)` pada pembungkus `.answer__arrow`, dengan `--_solid` = `--side-left-solid`/`--side-right-solid` (satu tingkat lebih gelap dari tombol; abu `--btn-off-solid` saat disabled). Panah kiri adalah CERMIN panah kanan di dalam SVG (`matrix(-1 0 0 1 48 0)`, bukan `scaleX` CSS), sehingga bayangan tetap jatuh ke BAWAH di kedua tombol. Pressed: panah ikut turun bersama tombol dan bayangannya mengecil (`--answer-arrow-depth-pressed`). `aria-hidden` pada panah; `aria-label` tombol tetap.

**Mengganti ikon panah:** ubah `body`/`viewBox` `arrowRight` di `src/ui/components/icons.ts` (dan cerminkan untuk `arrowLeft`), lalu sesuaikan `--answer-arrow`/`--answer-arrow-depth` di `tokens.css`. Varian alternatif **B** (dua nada, tidak dipakai): tambahkan di dalam `<g>` yang sama sebuah path kedua dengan `d` yang sama dan kelas `arrow__shade`, dengan CSS `.arrow__shade { fill: var(--_solid); opacity: .2; clip-path: inset(50% 0 0 0) }` (bagian bawah panah tampak bernada lebih gelap = efek mengilap). Dipilih A karena lebih tegas/kontras di ukuran kecil (360px); B menurunkan kontras badan panah.
| State | Perilaku |
| --- | --- |
| Default | seperti Figma |
| Hover | naik `--lift` |
| Pressed (`:active`) | turun `--press-travel`, bayangan solid → 0 |
| Disabled | `--btn-off-*`, turun `--press-travel-sm` (belum bisa dijawab / sedang animasi) |
| Focus-visible | cincin `--focus-ring` |
| `data-feedback="good"` | animasi pop (denyut kecil); tanpa lencana/ikon |
| `data-feedback="bad"` | goyang horizontal; tanpa lencana/ikon |

### 4.4 Box soal (speech bubble) — `.expr-card` (`--left` / `--right`)
Box putih bersudut `--radius-xl` dengan **ekor kecil membulat di tengah bawah** yang menunjuk objek, **menempel di atas objeknya** dan ikut naik-turun bersama objek saat jungkat-jungkit miring, tanpa ikut berputar (teks selalu tegak). Isi: tag "SISI KIRI/KANAN" (pil kecil) + ekspresi + satu baris nilai "= N" (ruangnya selalu dicadangkan, tampil lewat opacity: tinggi box stabil).
- **Warna:** garis 1px biru muda (kiri, `--bubble-line-left`) dan merah muda (kanan, `--bubble-line-right`), turunan 55% dari `--side-*-line` ke putih; bayangan halus senada (`--side-*-glow`) lewat `filter: drop-shadow` pada wadah, sehingga garis dan bayangan menyambung mulus sampai ke ekor. **Warna teks soal satu token** `--color-question-text` untuk kedua sisi dan semua tipe (tambah, kurang, kali, bagi, pecahan, desimal); tanpa warna per sisi/operator/tipe dan tanpa opacity pada kondisi normal.
- **Ekor:** `.expr-card__tail` = persegi `--bubble-tail` dirotasi 45° dengan latar dan garis yang sama (sudut ujung membulat). Posisi ekor terpisah dari posisi box: box digeser `--bubble-shift` (terdaftar `@property <length>`) agar tidak keluar tepi jungkat-jungkit (`--bubble-edge`), sedangkan ekor tetap di tengah objek (`left = 50% − shift`, dibatasi `--bubble-tail-min` dari sudut).
- **Penempelan di objek:** kartu dipasang di dalam `.seesaw__item` lewat jangkar nol-ukuran `.seesaw__anchor` di puncak objek yang sebenarnya (`--item-top` = bagian kosong di atas gambar, `Item.top` di `items.ts`, default 0) dikurangi `--bubble-gap` dan `--bubble-tail-depth` (ujung ekor berjarak satu token spasi kecil dari objek). Jangkar diputar BALIK `rotate(-tilt)` dengan transisi/durasi yang sama seperti papan, jadi rotasi bersih 0. Lebar box `--bubble-w` ≈ 40–48% lebar jungkat-jungkit (`cqi`).
- **Ekspresi:** `data-size="s|m|l|xl"` mengecilkan ekspresi panjang (font mengikuti lebar box lewat `cqi`; 'xl' boleh dua baris); pecahan bertumpuk (`.frac`). Box tumbuh ke atas (ekor tetap) untuk pecahan bertumpuk. Soal akar, pangkat, dan kurung sudah dihapus dari game.
- **Aksesibilitas:** `aria-label` membacakan kata ("Sisi kiri: 2 kali 21", pecahan "3 per 7 kurang 2 per 5", lewat `spokenLabel`); ekspresi mentah di `data-expr` (untuk pengujian). Ekor `aria-hidden`. Jungkat-jungkit game memakai `role="group"` (bukan `img`, supaya box terbaca pembaca layar).
- **Ketahanan:** diuji dengan ekspresi terpanjang tiap tipe (pecahan Hard, desimal 3 angka, 2 digit × 2 digit, 1980 ÷ 20, dll.) di 360–1920px dan landscape, datar dan miring: tanpa overflow, tanpa keluar layar, tanpa menimpa HUD/judul/tombol/titik tumpu/box lawan; font terkecil ≥ 12px.
| State | Perilaku |
| --- | --- |
| Default | box putih, garis dan bayangan senada sisi |
| `data-result="win"` | overlay hijau: latar `--good-soft`, garis `--good-line`; HANYA saat jawaban benar (pada box yang dipilih = sisi yang lebih berat); baris "= N" tampil |
| `data-result="faded"` | sisi benar saat jawaban SALAH: tanpa overlay/warna/ikon; box + objek di sisi itu di-fade (`.seesaw__item[data-faded]`, opacity `--opacity-faded` = 0,65, transisi opacity `--dur-base`); teks tidak dipudarkan lebih jauh; baris "= N" tampil |
| `data-result="wrong"` | overlay merah: latar `--bad-soft`, garis `--bad-line`, glow `--alpha-glow-rose`; HANYA pada box yang dipilih pemain bila salah; geometri, lapisan, durasi, dan easing sama persis dengan `win`; teks tidak dipudarkan (kontras terjaga); baris "= N" tampil |
| `data-result="lose"` | box yang tidak dipilih dan tidak benar (hanya muncul saat jawaban benar; tidak ikut `faded`): baris "= N" tampil, teks soal dan tag agak pudar (opacity .6) |
| Antar ronde | ikut animasi masuk/keluar objek (opacity + scale); posisi absolut → tanpa layout shift |

### 4.5 Pil — `.pill` (+ `--score`, `--time` di HUD; `--level`, `--combo` di statistik game over)
Latar & garis 2px per keluarga warna, radius 16, `--shadow-pill`, padding 8 × 16. Bagian: `.pill__icon`, `.pill__text` > `.pill__label` (eyebrow) + `.pill__value`. Lencana bintang skor = `.star-tile`.
**Skor (HUD):** hanya lencana bintang + angka (tanpa kata "SKOR"); teks tersembunyi "Skor" untuk pembaca layar, tanpa `aria-live` (tidak berisik). Lebar stabil: `tabular-nums` + `--score-min-w`.
**Waktu (HUD, `.hud-time`):** tanpa kotak dan tanpa tulisan; ikon jam (`clock`, garis 2,2, `--hud-time-icon`, tinggi `1em` = tinggi angka) di kiri angka (`--hud-time-text`), jarak `--space-8`. `role="timer"`, `aria-live="off"`, teks tersembunyi "Sisa waktu"; lebar stabil (`tabular-nums` + `--hud-time-min-w`). Layar game over tetap memakai `.pill--time` berkotak untuk "Akurasi".
HUD saat bermain **hanya**: skor, waktu (Time Attack) atau hati (Normal), dan tombol jeda. Tingkat, mode, pengali EXP, dan combo tetap dihitung engine tetapi tidak ditampilkan.
Waktu: `.is-low` (≤ 10 detik) → angka dan ikon merah (`--bad-bg`) dan berdenyut (skala `low-time`); dengan `prefers-reduced-motion` tanpa denyut, diganti garis bawah statis pada angka (bukan hanya warna). SFX tick tidak berubah.

### 4.5b Nyawa — `.hearts` > `.heart` (mode Normal)
Hanya ikon hati, tanpa wadah dan tanpa tulisan. Penuh = hati terisi (`--heart-full`), hilang = hati outline (`--heart-lost`): beda bentuk, bukan hanya warna. Ukuran `--heart-size` (≥ 20px), jarak `--heart-gap`; 5 hati (Easy) muat di 360px. Pembungkus `role="img"` dengan `aria-label` "Nyawa N dari M". Saat nyawa berkurang, hati yang hilang mengecil + bergetar (`heart-hit`, hanya `transform`/`opacity`; instan bila `prefers-reduced-motion`).

### 4.6 Toggle — `.switch` (`role="switch"`)
Pil dengan ikon + label + teks status "Nyala/Mati". Nyala = keluarga hijau; mati = putih + coret + ikon redup. Min tinggi 48. Fokus: cincin.
Varian ikon `.switch--icon` (persegi, tanpa label, bukan `role="switch"`): dipakai tombol "?" Cara Main (`#btn-howto`, `aria-label` + `title` "Cara Main") di baris yang sama dengan Musik dan SFX (`.toggles`: 3 kolom). Ukuran, radius, bayangan, dan kompensasi kedalaman 3D memakai aturan `.switch`. Di HP (≤ 720px dan landscape pendek) pil "Nyala/Mati" disembunyikan supaya satu baris muat di 360px; status tetap terbaca dari ikon redup + label dicoret + latar putih saat mati dan dari `aria-checked` (A47).

### 4.7 Segmented control — `.seg` (radio asli)
Opsi sejajar; terpilih = gradasi mode (ungu) + ✓ + bayangan 3D hilang (tampak "rata"), posisi tidak bergeser supaya baris tetap sejajar; tidak terpilih = putih 3D. Navigasi panah keyboard bawaan radio.

### 4.8 Chip/checkbox — `.chip` (checkbox asli)
Kartu kecil min 48px dengan kotak centang 24px berisi ✓. Tercentang = latar `--pill-time-bg`, garis `--pill-time-line`, bayangan 3D hilang, kotak terisi biru + ✓ (posisi tidak bergeser). **Mode ringkas** (HP: ≤ 720px, dan landscape pendek) memakai chip berupa ikon: grid 3 kolom × 2 baris; ikon SVG satu keluarga (+, −, ×, ÷, pie dengan satu bagian kosong untuk pecahan, 0,5; garis 2,1–2,4, `--chip-icon`); teks tetap ada tetapi tersembunyi secara visual (`.chip__label`) dan input punya `aria-label` nama lengkap; kotak ✓ disembunyikan (permintaan pemilik proyek); garis chip tercentang sama tebal dengan versi web; status dibaca dari bentuk, bukan hanya warna: chip tercentang "rata" (bayangan 3D hilang) + latar biru muda, sedangkan chip mati terangkat (3D) dan putih; semantik checkbox asli tetap untuk pembaca layar. Desktop/tablet (> 720px) tetap bertuliskan teks dalam grid dua kolom (tiga baris); tidak ada chip "Mix", tombol "Pilih semua", maupun "Hapus semua" (A46). Tipe terakhir tidak bisa dimatikan: toast "Pilih minimal 1 tipe soal".

### 4.10 Badge — `.badge`
Pil info kecil (mis. lencana kesulitan di game over/ringkasan) memakai keluarga pil level.

### 4.11 Modal / bottom sheet — `.overlay` + `.sheet`
Scrim `--surface-scrim` + blur. Desktop: kartu tengah (radius 24, `--shadow-sheet`). Layar sempit: **bottom sheet** menempel di bawah (radius atas 24, area aman bawah). Fokus terkunci di dalam dialog, Esc menutup. Pop-up Dijeda: judul, dua toggle Musik/SFX (`.switch`, 2 kolom, ≥ 48px), lalu `.sheet__actions` (Lanjut / Ulangi / Keluar ke Menu; di landscape pendek tiga kolom sejajar agar tidak melebihi tinggi layar). Teks tebal di daftar "Cara Main" (`.sheet__list b`) memakai `--fw-semibold` (600), bukan Bold 700; Fredoka Variable menyediakan bobot 600 secara asli.

### 4.12 Notifikasi combo — `.combo-notice` (`data-level="1…5"`, `data-kind="warmup|rise|max"`)
Kapsul kecil berisi ikon (api untuk tingkat ≥ 2, bintang untuk pemanasan) + teks ("COMBO 3", "COMBO ×2!" … "COMBO ×5!", "MAKS ×5 · 25"). Dipasang di dalam `.game` (pojok kanan atas, tepat di bawah HUD; `inset-inline-end` memakai `--gutter` dan `--safe-right`), dekoratif (`aria-hidden`, `pointer-events: none`); pembaca layar mendapat teksnya lewat live region game.
- **Kapan muncul** (`game/combo-notice.ts`, konfigurasi `config/combo.ts`): streak 3 (pemanasan, tingkat 1), tiap pengali naik (streak 5, 10, 15, 20 = tingkat 2–5), lalu tiap +5 setelah ×5 (25, 30, …; tingkat 5). Jawaban salah tidak memunculkan apa pun. Hanya presentasi: skor, timer, dan logika combo tidak disentuh.
- **Tingkat**: warna (`--combo-notice-{bg,line,text,icon}-{1,2,4}`: 1 rose muda, 2–3 hangat/amber, 4–5 panas/rose + cahaya), ukuran (`--combo-notice-scale-1…5`, lebih kecil di ≤ 720px), dan partikel (`COMBO_NOTICE.particles` = 0/6/8/10/14, maks 14) naik bersama tingkat. Bukan hanya warna: teks dan ikon selalu ada.
- **Animasi** (`--dur-combo-notice` 1200 ms, hanya `transform`/`opacity`, keyframes di `motion.css`): `combo-notice-in` (masuk dari kanan dengan pegas) → tahan dengan denyut (`combo-pulse`) dan kilau (`combo-shine`) → keluar menggeser + memudar. Notifikasi baru saat yang lama masih tampil memakai `combo-notice-swap` (pop di tempat, timer keluar diulang), tidak menumpuk. Partikel (`.combo-notice__spark`) terbang ke kiri/atas (tidak keluar tepi kanan layar dan tidak turun ke kartu), jangkauan `--combo-spark-reach`. `prefers-reduced-motion`: hanya fade (`combo-notice-fade`), tanpa geser, denyut, kilau, dan partikel.
- **Bunyi dan getar**: `'combo'` di `services/audio.ts` memainkan `comboNotes(level)` (`services/combo-sfx.ts`): arpeggio naik triangle + lapisan oktaf sinus, 3 nada (pemanasan, lebih lembut) sampai 7 nada + denting kilau (tingkat ≥ 4), akar naik per tingkat, dimulai `COMBO_SFX.delay` setelah bunyi jawaban benar. Volume `COMBO_SFX.volume` (< volume 'correct'). Mengikuti toggle SFX dan aturan autoplay. Haptic berjenjang (`COMBO_HAPTIC`).
- **Posisi aman**: tidak menimpa kartu, benda/jungkat-jungkit, atau tombol jawab di semua ukuran uji (360–1920, landscape HP). Di HP portrait ia menutupi sebagian ujung kanan judul "Mana yang lebih BERAT?" selama ±1,2 detik (A42).

### 4.13 Toast — `.toast`
Pil gelap (slate-800), teks putih, `--shadow-toast`, muncul dari bawah. `role="status"`.

### 4.13 Jungkat-jungkit — `.seesaw`
Koordinat desain 576 × 260 (`--ss-*`, unit `--ss-u`). Papan kayu (gradasi kuning), pin merah, penyangga biru (`assets/seesaw/stand.svg`), alas hijau. Papan berputar `±--ss-tilt` dengan pegas; benda duduk di atas papan dan ikut berputar.

---

### 4.14 Judul — `.title-line` (`createTitle(id, lead, accent)`, `src/ui/components/title.ts`)
Satu komponen untuk judul layar game ("Mana yang lebih **BERAT?**", `#question`) dan layar judul ("Berat **MANA?**", `#game-title`); gaya identik, hanya teks yang berbeda. Elemen `<h1>`, teks sungguhan; kata aksen ditulis "Berat?" di DOM dan dikapitalkan lewat `text-transform` (pembaca layar tidak mengeja huruf).
- **Susunan:** satu baris di semua lebar (flex, baseline sejajar, rata tengah). Kata pembuka dan aksen dipisah `--title-gap` (0,43 × aksen). Di layar sempit font mengecil mengikuti lebar viewport (`--fs-title-heavy: clamp(1.5rem, 9.2vw, 72u)`); lebar total ≈ 9,76 × ukuran aksen, jadi tetap muat di 320–430px tanpa pecah baris.
- **Gaya (diukur dari gambar referensi `judul-miring.png`, u = 1,25):** pembuka Montserrat Bold 700, slate-800 (`--title-lead`), ukuran 0,6 × aksen; aksen Montserrat Black 900, huruf kapital, rose-500 flat (`--title-accent`), 72u; letter-spacing 0; tanpa bayangan/outline. Kemiringan ±5° pada aksen di gambar BELUM dikerjakan (prompt berikutnya).
- **Ruang kemiringan:** padding `--title-room-block/inline` dibatalkan margin negatif (tidak menambah tinggi tata letak) dan tidak ada `overflow: hidden` pada pembungkusnya.
- **Font:** self-host di `public/fonts/` (woff2 latin 700 dan 900, lisensi OFL ikut disalin), `font-display: swap`, di-preload dari `index.html`. Cadangan "Montserrat Fallback" = Arial Bold dengan `size-adjust` (111% / 108%) dan override ascent/descent supaya tidak ada layout shift (diuji dengan font diperlambat 2 detik: selisih lebar < 1px, tinggi sama, CLS 0).
- **Kontras:** pembuka 13,6:1; aksen rose-500 di atas latar 3,4:1 (lolos untuk teks besar ≥ 3:1, di bawah 4,5:1; mengikuti gambar referensi, A54).

## 5. Layout layar game

```
┌───────────────────────── HUD (bar putih 90%, blur) ─────────────────────────┐
│ [Skor]                  [Waktu] atau [♥♥♥♥♥]                      [⏸]    │
├──────────────────────────────────────────────────────────────────────────────┤
│               Mana yang lebih  BERAT?   (judul, Montserrat 700 + 900)         │
│        [ SISI KIRI 32 + 15 ]             [ SISI KANAN 23 × 3 ]                │
│                ▽ (ekor)                          ▽ (ekor)                    │
│              (benda kiri)  ── jungkat-jungkit 576 × 260 ──  (benda kanan)     │
│                    [   ←  (biru)  ]   [  →  (koral)  ]                        │
└──────────────────────────────────────────────────────────────────────────────┘
```
- Isi utama dibatasi `--main-max-w` (1024) dan rata tengah. Box soal ada di dalam jungkat-jungkit (menempel di atas objek), tombol jawab `--answers-max-w` (473).
- HUD satu baris di semua lebar (skor kiri, waktu/hati tepat di tengah, jeda kanan); tinggi mengikuti tombol jeda (≥ 48px). Tagline tidak ada di layar game (infonya ada di Cara Main dan beranda); ruangnya dipakai box soal di atas objek (jungkat-jungkit terpusat di area yang lebih tinggi; A51). Tidak ada footer/petunjuk keyboard di layar game (A49): pintasan (←/→/A/D menjawab, Spasi/P jeda) tetap berfungsi dan dijelaskan di Cara Main. `.game` menambah `env(safe-area-inset-bottom)` pada padding bawah agar tombol jawab tidak tertutup home indicator.
- Layar yang bisa di-scroll (judul, game over) memakai `--screen-pad-start` / `--screen-pad-end` (padding bawah = 40 + area aman) dan kontainer isinya `flex: none` supaya padding bawah ikut terhitung saat di-scroll.
- Layar sempit (≤ 720px): box soal mengecil dengan teks mengikuti lebar box (`cqi`), judul pertanyaan mengikuti lebar viewport (tetap satu baris di 360px), tombol jawab tetap besar.
- **Landscape pendek** (tinggi ≤ 520px, mis. HP miring): tata letak dua kolom. Kiri = jungkat-jungkit (di dasar kolom, ruang di atasnya untuk box soal, termasuk saat miring); kanan = tombol jawab bertumpuk. Judul disembunyikan. `--u` mengikuti tinggi 560 (bukan 992).

```
┌ HUD: [Skor]              [Waktu / ♥♥♥]            [⏸] ┐
│   [ SISI KIRI ]    [ SISI KANAN ]         [ ← ]       │
│  ── benda ── jungkat-jungkit ── benda ──   [ → ]       │
└────────────────────────────────────────────────────────┘
```

## 6. Aturan pemakaian

**Boleh**
- Menambah warna/ukuran baru **hanya** dengan menambah token di `tokens.css` (dan mendokumentasikannya di sini, ditandai "turunan" bila tidak ada di Figma).
- Membuat komponen baru dari komponen yang ada (komposisi) dan memakai token semantik.
- Memakai `--u` untuk semua ukuran yang harus ikut skala.

**Tidak boleh**
- `#hex`, `rgb()`, `hsl()`, nama warna, `px/rem/vw/dvh` mentah, `ms/s` mentah, `z-index`/`font-weight`/`line-height` angka polos di luar `tokens.css`.
- Gaya baru (warna aksen baru, radius baru, font baru) tanpa menambah token dan mencatat di §10.
- Menganimasikan properti selain `transform` dan `opacity` (kecuali perubahan state sekali jalan seperti warna latar saat hover).
- Menyampaikan benar/salah hanya dengan warna.
- Area sentuh di bawah 48px.

## 7. Aksesibilitas
- Kontras teks ≥ 4,5:1 (token "turunan" untuk teks kecil: `--pill-combo-label` (game over), `--pill-time-label`, `--side-right-tag-text`, `--text-emphasis`). Ikon besar ≥ 3:1.
- Fokus selalu terlihat (`--focus-ring`). Radio/checkbox/switch memakai elemen asli atau ARIA yang benar.
- `prefers-reduced-motion`: animasi dipangkas ke `--dur-instant`, tanpa goyang/partikel, wobble papan dimatikan.
- Hasil dibacakan lewat `role="status"`.

## 8. Responsif
| Lebar | Perubahan |
| --- | --- |
| ≥ 1280 × 992 | persis Figma kecuali bagian HUD/tagline yang disederhanakan (A40) |
| 961–1279 | `--u` mengecil mengikuti viewport |
| 721–960 (tablet portrait) | padding HUD mengecil; papan, kartu, tombol jawab selebar isi (orientasi portrait) |
| ≤ 720 | token padding/jarak mengecil; box soal lebih ringkas (`--bubble-min-h`); modal menjadi bottom sheet |
| Landscape pendek (tinggi ≤ 520) | tata letak dua kolom (lihat §5), `--u` mengikuti tinggi 560 |

## 9. Aset
- **Benda**: SVG persegi (viewBox 200 × 200), latar transparan, benda menempel di **dasar** gambar. Gaya (awalnya dari bulu/gajah Figma; kini semua benda digambar ulang di gaya yang sama, A45) = isi datar berwarna lembut + garis lebih gelap sewarna ±3% lebar + sorotan putih tipis, tanpa gradasi. `bulu.svg` dan `gajah.svg` dirakit dari vektor Figma (`node scripts/build-figma-art.mjs`, sumber di `scripts/figma-src/`). **Placeholder** selaras gaya: `landasan`, `balon`, `bola-bowling`, `kapas`, `batu`, `bantal`, `dumbel`, `mobil`. Ganti dengan menimpa file bernama sama di `public/assets/items/`, atau ubah `src/config/items.ts`.
- **Ikon aplikasi / OG**: `public/favicon.svg` + `icons/icon-maskable.svg` (PNG dibuat `node scripts/make-icons.mjs`); `public/og-image.png` ditangkap dari komponen asli (judul, dua kartu, jungkat-jungkit).
- **Penyangga**: `public/assets/seesaw/stand.svg` (dari Figma).
- **Ikon UI**: SVG inline (`src/ui/components/icons.ts`) berwarna `currentColor`/token.

## 10. ASUMSI DESAIN (tidak ada di Figma — mohon ditinjau/digambar)

| # | Keputusan turunan | Dasar |
| --- | --- | --- |
| A1 | State hover/pressed/disabled/focus semua tombol (lihat §4) | pola tombol 3D Figma: bayangan solid = tinggi tekan |
| A2 | Tombol nonaktif memakai slate-300/200/400 | kebalikan dari tombol aktif; slate-400 ditambahkan |
| A3 | Umpan balik jawaban: box yang dipilih hijau bila benar / merah bila salah (sisi benar di-fade saat salah, A53), pil "Benar!/Salah" (teks saja) di atas pin; tanpa ikon ✓/✗ (lihat A52) | diganti A52 |
| A4 | Latar "Benar" emerald-700 dan "Salah" rose-700 (teks putih) | emerald/rose Figma terlalu terang untuk teks putih kecil |
| A5 | Teks kecil memakai varian lebih gelap (rose-700, sky-700, orange-700) | kontras Figma 3,1–3,8:1 < 4,5:1 |
| A6 | Nyawa (mode Normal) menggantikan pil waktu; hanya ikon hati (A40) | slot waktu tidak dipakai di Normal |
| A9 | Skor berformat Indonesia (3.650), bukan "3,650" | bahasa UI Indonesia |
| A10 | Ikon bintang SVG, bukan glyph font | glyph FreeSans tidak konsisten antar perangkat |
| A11 | Judul layar judul memakai gaya H1; H2 (40) dan skor besar (64) adalah ukuran turunan | layar tidak ada di Figma |
| A12 | Tombol "Main" memakai gaya tombol koral 3D, tombol sekunder memakai gaya tombol ikon | konsisten dengan tombol Figma |
| A13 | Panel pengaturan = kartu putih 24px; segmented terpilih = gradasi pil mode; chip tercentang = keluarga biru langit; switch nyala = keluarga hijau | memakai keluarga warna yang sudah ada |
| A14 | Game over: kartu putih tengah, pita "REKOR BARU!" gradasi kuning, statistik berupa pil per keluarga warna | konsisten dengan pil HUD |
| A15 | Pause/Cara Main = modal; di layar sempit = bottom sheet | pola mobile umum |
| A17 | Tombol ikon 40px diperluas ke 48px lewat area transparan | aturan area sentuh 48px |
| A18 | Spasi menjeda game hanya bila fokus tidak di tombol/input | footer Figma menyebut "Spasi / P"; tidak merusak keyboard standar |
| A19 | (digantikan A48) Cincin timer sebagai indikator progres | ikon Figma berupa cincin |
| A20 | Semua benda adalah SVG yang digambar untuk proyek ini dalam satu gaya (A45) | aset Figma hanya tersedia untuk bulu/gajah |
| A21 | Elips abu-abu tengah latar dan persegi `#f4f7fb` di belakang bulu (`17:657`) diabaikan | tidak terlihat di screenshot / artefak |
| A22 | Durasi & easing animasi diwarisi dari implementasi sebelumnya | Figma statis |
| A23 | Tilt papan 12° (sebelumnya 14°) | papan Figma lebih lebar |
| A24 | (digantikan A54: aksen judul kini flat rose-500) Gradasi "Berat?" mulai dari koral (campuran oranye 54% + merah muda), bukan kuning | diukur dari screenshot Figma: gradasi membentang di seluruh judul, kata terakhir hanya menampilkan 73–100% |
| A25 | Ukuran judul pertanyaan `--fs-h1` ikut lebar viewport di layar sempit; judul layar judul memakai `--fs-hero` (60) | satu baris di 360px |
| A26 | Layout landscape pendek dua kolom (kartu+papan kiri, tombol jawab kanan) | Figma hanya 1280 × 992 |
| A27 | (A54: tagline di beranda juga dihapus; kalimatnya tetap ada di pop-up Cara Main) Tagline "Berat = hasil hitungan…" hanya di beranda; dihapus dari layar game (A40) | permintaan pemilik proyek |
| A28 | Kartu menang: cincin hijau + latar hijau muda; kalah: ekspresi memudar; nilai "= N" sebagai pil gelap menempel di tepi bawah (ikon ✓ dihapus oleh A52) | diganti A52 |
| A30 | Pil statistik game over memakai keluarga warna pil HUD (rekor=kuning, akurasi=biru langit, streak=merah muda, benar/salah=hijau) | konsisten dengan HUD |
| A31 | Tombol jawab: yang tidak dipilih menjadi abu-abu saat hasil ditampilkan; yang dipilih tetap berwarna dan beranimasi (pop / goyang), tanpa lencana (A52) | diganti A52 |
| A34 | Layar judul: tombol Main + rekor berada di kolom kiri di bawah jungkat-jungkit; kolom kanan hanya pengaturan dan satu baris Musik · SFX · "?" (dua kolom seimbang; landscape pendek juga dua kolom). Pesan "Pilih minimal 1 tipe soal" memakai toast (A46) | rapi, tanpa baris kosong |
| A35 | Orientasi portrait: papan, kartu, dan tombol jawab memakai lebar penuh isi (bukan 576/672/473 satuan) | terlihat kecil di tablet portrait |
| A36 | Tombol game over "Ubah Pengaturan" diganti "Ke Beranda" (id `btn-home`); menu Jeda tetap "Keluar ke Menu" | tujuannya layar judul; "beranda" = istilah layar itu |
| A37 | Semua tombol 3D mengompensasi kedalaman bayangan lewat margin (lihat §4); tombol jawab di desktop turun 8 → `--game-pad-bottom` 56 → 48 agar posisinya tetap sama dengan Figma | tombol merah terlihat dempet dengan elemen di sekitarnya |
| A38 | Satu `--radius-button` (24) untuk semua tombol; tombol ikon HUD 40px menjadi bulat penuh di desktop | konsistensi radius |
| A39 | (digantikan A49) Footer keyboard disembunyikan di ≤ 960px | — |
| A40 | HUD game disederhanakan: tidak ada pil Tingkat, pil Mode (+ badge EXP), pil Combo, tombol Mute, dan wadah/tulisan "Nyawa"; tagline dihapus dari layar game. Level, combo, dan pengali tetap berjalan di engine. Nyawa = hanya ikon hati (penuh terisi, hilang outline) | permintaan pemilik proyek (bar ringkas); Figma menang diganti keputusan ini |
| A41 | Musik/SFX dipindah ke pop-up Dijeda (komponen `.switch` yang sama dengan beranda, dua toggle terpisah, tersimpan); pintasan keyboard M dan petunjuknya dihapus | mute tidak lagi di bar; M membisukan keduanya sehingga tidak sejalan dengan dua toggle terpisah |
| A42 | Notifikasi combo di pojok kanan atas area main; di HP portrait menutupi sebagian judul sesaat karena tidak ada ruang kosong lain pada lebar 360–430 | judul bukan elemen interaktif/informatif; kartu, papan, dan tombol tetap bebas |
| A43 | SFX `bonus` (+2 detik) dihapus: ia selalu jatuh di streak yang sama dengan notifikasi combo, sehingga menyatu ke arpeggio combo (teks "+2 detik" tetap melayang) | mencegah tiga bunyi bertumpuk (benar + combo + bonus) |
| A44 | Tingkat notifikasi: 1 = pemanasan (streak 3), 2–5 = pengali; setelah ×5 tetap tingkat 5 sebagai pengingat tiap +5 streak | konsisten dengan SFX combo lama yang berbunyi tiap kelipatan 5 |
| A45 | Gajah dihapus dari daftar benda (sulit dikenali) dan dekorasi beranda memakai bulu + batu. Bulu, kapas, bantal, dumbel digambar ulang agar jelas di ±42px: bulu bergerigi dengan tangkai, kapas = buah kapas dengan kelopak cokelat + batang + daun, bantal lavender berumbai + lipatan tengah, dumbel hijau tebal. `og-image.png` dibuat ulang tanpa gajah (`scripts/make-og.mjs`) | benda lama mirip daun / awan / mentega; bantal kuning menyatu dengan papan kuning |
| A46 | Pemilihan tipe soal disederhanakan: chip "Mix", tombol "Pilih semua", dan "Hapus semua" dihapus (Figma menampilkannya; prompt pemilik proyek menang). Banyak tipe tercentang = soal campuran, tiap sisi memilih tipe merata dari daftar (boleh beda tipe). Ringkasan: daftar tipe, atau "Semua tipe" bila keenamnya aktif. Pengaturan lama ber-"mix" dimigrasi menjadi keenam tipe. Tidak ada ekspresi bonus (sudah dihapus sebelumnya), jadi tidak ada perilaku khusus saat keenam tipe aktif | permintaan pemilik proyek; satu cara memilih lebih sederhana |
| A47 | Beranda dirapikan (Figma menampilkannya; prompt pemilik proyek menang): teks "Selisih minimal … • Salah = … • skor …" di bawah kesulitan dan ringkasan "Medium • Time Attack • Tambah, Kali" di bawah Main dihapus; tombol "Pengaturan" dan mekanisme lipat dihapus di semua ukuran (pengaturan selalu tampil; desktop memang tidak pernah punya tombol itu); "Cara Main" menjadi tombol ikon "?" di baris Musik/SFX; chip tipe soal berupa ikon 3 × 2 tanpa kotak centang di HP (≤ 720px dan landscape pendek); pil Nyala/Mati disembunyikan di HP; landscape pendek memakai dua kolom (hero kiri, pengaturan kanan); hiasan jungkat-jungkit beranda diperkecil di HP agar 390 × 844 tanpa scroll | beranda ringkas; info yang sama ada di Cara Main |
| A48 | Indikator HUD dirapikan (prompt pemilik proyek menang atas Figma): kata "SKOR" dan "WAKTU" dihapus; waktu tanpa kotak, ikon jam di kiri angka (ikon cincin progres dan `.timer-ring*` dihapus, A19 tidak berlaku); skor tetap berkotak. Satu warna teks soal (`--color-question-text`): akar masalah lama = `--side-left-expr` (sky-950) berbeda dari `--side-right-expr` (purple-950); kedua token dihapus. State kalah (opacity .6, kontras 4,0:1) sengaja tidak diubah, dilaporkan ke pemilik proyek | bar atas lebih ringkas; teks soal seragam |
| A49 | Footer petunjuk keyboard (komponen `.keybar`, `.keyhint`, `.keycap`) dihapus dari layar game di semua ukuran, termasuk versi web (Figma menampilkannya; permintaan pemilik proyek menang). Pintasan keyboard tetap berfungsi dan dijelaskan di Cara Main. Ruang 62 di bawah dipakai area main | game lebih bersih; info yang sama ada di Cara Main |
| A50 | Tombol jawab memakai panah tebal berekor ala arcade (varian A: putih solid + bayangan satu tingkat lebih gelap) menggantikan chevron "<" ">"; ubin kaca 64 dihapus (panah langsung di muka tombol). Cara Main: keycap "<" ">" diganti lencana panah kecil berwarna tombol (dekoratif, kata "biru"/"merah" tetap di teks); README/DESIGN menyebut "panah kiri/kanan". Token `--answer-tile`/`--answer-icon` tetap (dipakai layar game over) | permintaan pemilik proyek; panah lebih tegas dan terbaca sekilas |
| A51 | Box soal berbentuk speech bubble dengan ekor, menempel di atas objek (target pemilik proyek; Figma menampilkan dua kartu di atas papan). Baris kartu dikeluarkan dari alur layout sehingga jungkat-jungkit dan objek bergeser ke atas ±35–104px (disetujui); di landscape pendek papan di dasar kolom. Nilai "= N" menjadi baris kecil di dalam box (bukan pil di tepi bawah yang bertabrakan dengan ekor). aria-label memakai kata ("2 kali 21"). Tag "SISI KIRI/KANAN" sudah ada dan dipertahankan | benda dan box kini berdekatan; pembaca layar membaca soal dengan jelas |
| A52 | Feedback jawaban tanpa ikon (permintaan pemilik proyek): lencana ✓ di box, lencana ✓/✗ di tombol, dan ikon di pil "Benar!/Salah" dihapus. Penanda visual = overlay warna pada box yang dipilih (hijau bila benar; merah `--bad-line`/`--bad-soft` bila salah; sisi benar saat salah di-fade, lihat A53). Tombol yang dipilih TIDAK diberi overlay (merah di atas tombol merah tidak terbedakan, hijau menjadi keruh di atas biru/merah); penandanya gerak yang sudah ada (pop / goyang). Isyarat nonvisual: `#sr-status` (aria-live polite) mengumumkan "Benar…"/"Salah…" tiap jawaban, gerak, SFX, haptic. Berlaku untuk `prefers-reduced-motion`: overlay tetap tampil, gerak dimatikan | box lebih bersih; makna tidak hanya lewat warna karena ada teks pil, aria-live, dan gerak |
| A53 | Sisi benar saat jawaban SALAH tidak lagi berwarna hijau, tetapi di-fade out (box + objek, `--opacity-faded`); overlay merah pada jawaban yang dipilih dan seluruh state benar tidak berubah. Nilai 0,65 (bukan 0,35–0,5 yang diminta awal) karena teks soal di bawah 0,6 gagal kontras 4,5:1 (0,5 = 3,1:1; 0,65 = 4,7:1); alternatif "hanya box-hantu + objek 0,4 dengan teks tegas" ditolak pemilik proyek demi kesederhanaan. Tombol jawab tidak ikut di-fade. aria-live "Salah. Sisi … yang lebih berat: …" sudah menyebut sisi benar | permintaan pemilik proyek; keterbacaan nilai dijaga |
| A54 | Judul game memakai Montserrat (pembuka 700, aksen 900 kapital, rose-500 flat) sesuai gambar referensi pemilik proyek (menggantikan Fredoka + gradasi, A24). Satu komponen `.title-line` di game dan beranda; beranda tetap "Berat MANA?" (keputusan pemilik proyek), game "Mana yang lebih BERAT?". Satu baris di semua lebar (font mengecil di layar sempit). Tagline beranda dihapus (kalimat tetap di Cara Main); font Plus Jakarta Sans, `--font-body`, `--text-emphasis`, `--shadow-title`, `--fs-h1`, `--fs-hero` dihapus karena tidak terpakai. Warna aksen 3,4:1 di atas latar (teks besar, di bawah aturan 4,5:1); alternatif rose-600 = 4,37:1 | permintaan pemilik proyek; gambar referensi menang atas Figma |
| A33 | Skala font teks kecil dinaikkan dari Figma: eyebrow 10→12, tag 12→14, badan/tagline/pil 14→16, nilai HUD 20→24, tombol utama 24→28 (keycap 32→36). Proporsi komponen ikut menyesuaikan lewat padding/tinggi isi | permintaan: font terlalu kecil di Figma, terutama di HP |
| A32 | Gambar OG dan ikon aplikasi digambar ulang dalam palet Figma | produk harus konsisten |

## 11. Verifikasi visual & fungsional
- `references/Figma_17-248_game.png` = screenshot sumber; `references/impl_game_1280x992.png` = hasil implementasi (folder `references/` hanya lokal, tidak di-commit) pada ukuran yang sama (selisih geometri ≤ 1–2px; selisih sisanya hanya data berbeda: skor, ekspresi, benda).
- `node scripts/visual/shot.mjs <nama> <lebar> <tinggi> <skenario>` menangkap layar piksel-akurat (Chrome headless, hasil ke `.shots/`); skenario: `title game game-wrong verdict-ok pause settings howto over normal streak`.
- `npm run e2e` (server dev harus berjalan) menjalankan ±25 pemeriksaan fungsional: pengaturan, mode, jeda, keyboard (Spasi/P/Esc), toggle suara di Dijeda, game over, rekor, area sentuh ≥ 48px, tanpa error konsol.
- `npm run lint:tokens` memastikan tidak ada warna/ukuran yang di-hardcode di luar `tokens.css`.
