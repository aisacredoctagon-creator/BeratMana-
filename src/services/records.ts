import { DIFFICULTIES, MODES } from '../config/difficulty';
import type { Difficulty, Mode } from '../config/difficulty';

/**
 * Rekor (best score) per kombinasi mode × kesulitan. SATU sumber kebenaran untuk seluruh game.
 *
 * Aturan:
 * - Satu key per kombinasi: `bm:best:v2:{mode}:{difficulty}` berisi satu bilangan bulat (teks). Data rusak di satu
 *   key tidak memengaruhi kombinasi lain.
 * - Membaca TIDAK PERNAH menulis. Kombinasi tanpa data = `null` ("belum ada rekor"), tidak pernah disimpan sebagai 0.
 * - Rekor hanya naik. Skor harus bilangan bulat ≥ 1 (skor 0 tidak direkam).
 * - Nilai berlaku = maksimum dari memori sesi dan localStorage, sehingga kegagalan tulis (kuota penuh, mode privat)
 *   atau penulisan oleh tab lain tidak membuat rekor "hilang" atau turun.
 * - Data lama (`bm.best`, satu JSON untuk semua kombinasi) dimigrasikan sekali jalan hanya bila PASTI terpetakan.
 */

export const BEST_PREFIX = 'bm:best:v2:';
export const LEGACY_BEST_KEY = 'bm.best';
export const MIGRATION_FLAG_KEY = 'bm:meta:best-migrated:v2';

/** Subset Storage yang dipakai (mudah dipalsukan di test). */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface SubmitResult {
  /** true bila skor ini menaikkan rekor dan dicatat. */
  recorded: boolean;
  /** Rekor sebelum skor ini (null = belum pernah ada). */
  previous: number | null;
  /** Rekor sesudahnya (null = masih belum ada). */
  best: number | null;
  /** false bila hanya tersimpan di memori (localStorage gagal/tidak ada). */
  persisted: boolean;
}

export type MigrationStatus = 'already' | 'none' | 'migrated' | 'corrupt';

export interface MigrationReport {
  status: MigrationStatus;
  /** Jumlah kombinasi yang dipindahkan/dipertahankan dari data lama. */
  moved: number;
  /** Entri lama yang tidak bisa dipetakan dengan pasti (diabaikan, tidak ditebak). */
  skipped: string[];
}

const isMode = (v: unknown): v is Mode => (MODES as readonly unknown[]).includes(v);
const isDifficulty = (v: unknown): v is Difficulty => (DIFFICULTIES as readonly unknown[]).includes(v);

export const bestKey = (mode: Mode, difficulty: Difficulty): string => `${BEST_PREFIX}${mode}:${difficulty}`;

/** Skor valid = bilangan bulat ≥ 1 dan aman. */
export const isValidScore = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= 1;

/** Mengurai nilai tersimpan: hanya bilangan bulat polos ≥ 1; selain itu dianggap tidak ada (rusak). */
export function parseScore(raw: string | null | undefined): number | null {
  if (typeof raw !== 'string') return null;
  const s = raw.trim();
  if (!/^\d{1,15}$/.test(s)) return null;
  const n = Number(s);
  return isValidScore(n) ? n : null;
}

export interface Records {
  getBest(mode: Mode, difficulty: Difficulty): number | null;
  submitScore(mode: Mode, difficulty: Difficulty, score: number): SubmitResult;
  migrateLegacy(): MigrationReport;
}

export function createRecords(storage: StorageLike | null): Records {
  const memory = new Map<string, number>();

  function readDisk(key: string): number | null {
    if (!storage) return null;
    try {
      return parseScore(storage.getItem(key));
    } catch {
      return null;
    }
  }

  function current(key: string): number | null {
    const mem = memory.get(key) ?? null;
    const disk = readDisk(key);
    if (mem === null) return disk;
    if (disk === null) return mem;
    return Math.max(mem, disk);
  }

  function write(key: string, score: number): boolean {
    memory.set(key, score);
    if (!storage) return false;
    try {
      storage.setItem(key, String(score));
      return true;
    } catch {
      return false;
    }
  }

  return {
    getBest(mode, difficulty) {
      if (!isMode(mode) || !isDifficulty(difficulty)) return null;
      return current(bestKey(mode, difficulty));
    },

    submitScore(mode, difficulty, score) {
      if (!isMode(mode) || !isDifficulty(difficulty)) return { recorded: false, previous: null, best: null, persisted: false };
      const key = bestKey(mode, difficulty);
      const previous = current(key);
      if (!isValidScore(score) || (previous !== null && score <= previous)) {
        return { recorded: false, previous, best: previous, persisted: true };
      }
      const persisted = write(key, score);
      return { recorded: true, previous, best: score, persisted };
    },

    migrateLegacy() {
      const report: MigrationReport = { status: 'none', moved: 0, skipped: [] };
      if (!storage) return report;
      try {
        if (storage.getItem(MIGRATION_FLAG_KEY) !== null) return { ...report, status: 'already' };
      } catch {
        return report;
      }
      let raw: string | null;
      try {
        raw = storage.getItem(LEGACY_BEST_KEY);
      } catch {
        return report;
      }
      if (raw === null) return report; // tidak ada data lama: tidak ada yang dimigrasi, bendera tidak dipasang

      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = undefined;
      }
      const flag = (): void => {
        try {
          storage.setItem(MIGRATION_FLAG_KEY, '1');
        } catch {
          /* tidak apa-apa: migrasi bersifat idempoten dan hanya menaikkan */
        }
      };
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        flag();
        return { status: 'corrupt', moved: 0, skipped: [LEGACY_BEST_KEY] };
      }

      for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
        const [m, d, extra] = k.split(':');
        // format lama PASTI: "{mode}:{kesulitan}" dengan nilai bilangan bulat ≥ 1 (dulu selalu Math.floor)
        if (extra === undefined && isMode(m) && isDifficulty(d) && isValidScore(v)) {
          const key = bestKey(m, d);
          const existing = current(key);
          if (existing === null || v > existing) write(key, v);
          report.moved++;
        } else {
          report.skipped.push(k);
        }
      }
      flag();
      return { ...report, status: 'migrated' };
    },
  };
}

/* ---------- instans bawaan yang terikat ke window.localStorage ---------- */
function browserStorage(): StorageLike | null {
  try {
    const probe = '__bm_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

const records = createRecords(browserStorage());

export const getBest = records.getBest;
export const submitScore = records.submitScore;
export const migrateLegacyBest = records.migrateLegacy;
