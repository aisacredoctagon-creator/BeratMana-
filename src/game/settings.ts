import { DIFFICULTIES, MODES, QTYPES, QTYPE_INFO, MODE_INFO, DIFFICULTY_CONFIG } from '../config/difficulty';
import type { Difficulty, Mode, QType } from '../config/difficulty';

export interface GameSettings {
  mode: Mode;
  difficulty: Difficulty;
  /** Urut sesuai QTYPES, minimal 1 elemen. "Mix" = semua tipe tercentang. */
  types: QType[];
}

export const DEFAULT_TYPES: readonly QType[] = ['add', 'mul'];

export const DEFAULT_SETTINGS: GameSettings = {
  mode: 'time',
  difficulty: 'medium',
  types: [...DEFAULT_TYPES],
};

export const TYPES_MIN_MESSAGE = 'Pilih minimal 1 tipe soal';

const order = (types: Iterable<QType>): QType[] => {
  const set = new Set(types);
  return QTYPES.filter((t) => set.has(t));
};

export const isMix = (types: readonly QType[]): boolean => QTYPES.every((t) => types.includes(t));

export interface TypeChange {
  types: QType[];
  /** true bila perubahan ditolak karena akan mengosongkan pilihan. */
  rejected: boolean;
}

export function toggleType(types: readonly QType[], t: QType): TypeChange {
  if (types.includes(t)) {
    if (types.length <= 1) return { types: [...types], rejected: true };
    return { types: order(types.filter((x) => x !== t)), rejected: false };
  }
  return { types: order([...types, t]), rejected: false };
}

/** Mix menyala = pilih semua; mati = kembali ke pilihan sebelum Mix (atau default). */
export function toggleMix(types: readonly QType[], previous: readonly QType[] | null): QType[] {
  if (isMix(types)) {
    const back = previous && previous.length > 0 && !isMix(previous) ? previous : DEFAULT_TYPES;
    return order(back);
  }
  return [...QTYPES];
}

export const selectAllTypes = (): QType[] => [...QTYPES];

/** "Hapus semua": sisakan satu tipe (yang pertama aktif) karena minimal harus ada satu. */
export function clearTypes(types: readonly QType[]): TypeChange {
  const keep = types[0] ?? DEFAULT_TYPES[0] ?? 'add';
  return { types: [keep], rejected: true };
}

export function typesSummary(types: readonly QType[]): string {
  if (isMix(types)) return 'Mix';
  return types.map((t) => QTYPE_INFO[t].short).join(', ');
}

/** Contoh: "Medium • Time Attack • Tambah, Kali". */
export function settingsSummary(s: GameSettings): string {
  return [DIFFICULTY_CONFIG[s.difficulty].label, MODE_INFO[s.mode].name, typesSummary(s.types)].join(' • ');
}

/** Membersihkan data hasil baca dari storage supaya selalu valid. */
export function sanitizeSettings(raw: unknown): GameSettings {
  const o = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  const mode = MODES.find((m) => m === o.mode) ?? DEFAULT_SETTINGS.mode;
  const difficulty = DIFFICULTIES.find((d) => d === o.difficulty) ?? DEFAULT_SETTINGS.difficulty;
  const rawTypes = Array.isArray(o.types) ? o.types : [];
  const types = order(QTYPES.filter((t) => rawTypes.includes(t)));
  return { mode, difficulty, types: types.length > 0 ? types : [...DEFAULT_TYPES] };
}
