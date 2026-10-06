import type { Difficulty, Mode } from '../config/difficulty';
import { DEFAULT_SETTINGS, sanitizeSettings } from '../game/settings';
import type { GameSettings } from '../game/settings';

/**
 * Pembungkus localStorage. Bila tidak tersedia (mode privat, diblokir, quota penuh)
 * semua data jatuh ke memori selama sesi berjalan.
 */
const memory = new Map<string, string>();

let backing: Storage | null = null;
try {
  const probe = '__bm_probe__';
  window.localStorage.setItem(probe, '1');
  window.localStorage.removeItem(probe);
  backing = window.localStorage;
} catch {
  backing = null;
}

function read(key: string): string | null {
  if (backing) {
    try {
      const v = backing.getItem(key);
      if (v !== null) return v;
    } catch {
      /* jatuh ke memori */
    }
  }
  return memory.get(key) ?? null;
}

function write(key: string, value: string): void {
  memory.set(key, value);
  if (backing) {
    try {
      backing.setItem(key, value);
    } catch {
      /* tetap tersimpan di memori */
    }
  }
}

function readJSON<T>(key: string): T | null {
  const raw = read(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

const KEY = {
  settings: 'bm.settings',
  best: 'bm.best',
  audio: 'bm.audio',
} as const;

export function loadSettings(): GameSettings {
  const raw = readJSON<unknown>(KEY.settings);
  return raw === null ? { ...DEFAULT_SETTINGS, types: [...DEFAULT_SETTINGS.types] } : sanitizeSettings(raw);
}

export function saveSettings(s: GameSettings): void {
  write(KEY.settings, JSON.stringify(s));
}

export interface AudioPrefs {
  music: boolean;
  sfx: boolean;
}

export function loadAudioPrefs(): AudioPrefs {
  const raw = readJSON<Partial<AudioPrefs>>(KEY.audio);
  return { music: raw?.music !== false, sfx: raw?.sfx !== false };
}

export function saveAudioPrefs(p: AudioPrefs): void {
  write(KEY.audio, JSON.stringify(p));
}

const bestKey = (mode: Mode, difficulty: Difficulty): string => `${mode}:${difficulty}`;

/** Rekor terpisah per kombinasi mode × kesulitan (6 rekor). Tipe soal tidak memecah rekor. */
export function loadBest(mode: Mode, difficulty: Difficulty): number {
  const all = readJSON<Record<string, number>>(KEY.best);
  const v = all?.[bestKey(mode, difficulty)];
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.floor(v) : 0;
}

export function saveBest(mode: Mode, difficulty: Difficulty, score: number): void {
  const all = readJSON<Record<string, number>>(KEY.best) ?? {};
  all[bestKey(mode, difficulty)] = Math.floor(score);
  write(KEY.best, JSON.stringify(all));
}
