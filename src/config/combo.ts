/**
 * Notifikasi combo: kapan muncul, seberapa ramai efeknya, dan bunyinya. HANYA presentasi;
 * aturan combo (streak → pengali) tetap di SCORING (config/difficulty.ts) dan engine.
 */
export const COMBO_NOTICE = {
  /** Streak "pemanasan": versi kecil sebelum pengali pertama naik. */
  warmupStreak: 3,
  /** Setelah pengali maksimum, notifikasi sedang muncul tiap kelipatan ini (streak 25, 30, …). */
  repeatEvery: 5,
  /** Jumlah partikel per tingkat 1–5 (indeks 0 = tingkat 1). Dibatasi agar tetap ringan di HP. */
  particles: [0, 6, 8, 10, 14],
} as const;

/** SFX notifikasi combo (arpeggio naik). Semua disintesis Web Audio, tanpa berkas. */
export const COMBO_SFX = {
  /** Volume per nada. Sengaja di bawah 'correct' (0,4) supaya tidak mengalahkan bunyi jawaban benar. */
  volume: 0.22,
  /** Pengali volume untuk tingkat 1 (pemanasan) agar lebih lembut. */
  warmupVolume: 0.6,
  /** Detik setelah bunyi 'correct' dimulai, supaya keduanya tidak bertumpuk. */
  delay: 0.2,
  /** Jarak antarnada dan lama tiap nada (detik). */
  noteGap: 0.07,
  noteDur: 0.16,
  /** Nada dasar (C5, Hz) dan geseran akar (semiton) per tingkat 1–5: makin tinggi combo, makin tinggi nadanya. */
  baseFreq: 523.25,
  rootSemitones: [0, 0, 2, 4, 7],
  /** Tangga arpeggio (semiton dari akar). Tingkat 1 = 3 nada pertama, tingkat L ≥ 2 = L + 2 nada. */
  intervals: [0, 4, 7, 12, 16, 19, 24],
  /** Lapisan oktaf atas (sinus) relatif volume nada utama. */
  octaveLayer: 0.45,
  /** Dari tingkat ini ditambah dua denting kilau di akhir. */
  shimmerFromLevel: 4,
  shimmerVolume: 0.5,
} as const;

/** Getaran (ms) per tingkat 1–5; hanya bila perangkat mendukung. */
export const COMBO_HAPTIC: readonly (readonly number[])[] = [
  [10, 25, 10],
  [18, 30, 18],
  [18, 30, 18, 30, 24],
  [18, 30, 18, 30, 18, 30, 32],
  [18, 30, 18, 30, 18, 30, 18, 30, 44],
];
