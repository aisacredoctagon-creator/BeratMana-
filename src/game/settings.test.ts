import { describe, expect, it } from 'vitest';
import { QTYPES } from '../config/difficulty';
import type { QType } from '../config/difficulty';
import { seeded } from '../generator/random';
import { DEFAULT_TYPES, sanitizeSettings, settingsSummary, toggleType, typesSummary } from './settings';

describe('aturan chip tipe soal', () => {
  it('default: Penjumlahan dan Perkalian', () => {
    expect(DEFAULT_TYPES).toEqual(['add', 'mul']);
    expect(sanitizeSettings(null)).toEqual({ mode: 'time', difficulty: 'medium', types: ['add', 'mul'] });
  });

  it('mencentang satu per satu menambah tipe, hasil selalu urut sesuai QTYPES', () => {
    let types: QType[] = ['add'];
    for (const t of ['decimal', 'sub', 'fraction'] as const) types = toggleType(types, t).types;
    expect(types).toEqual(['add', 'sub', 'fraction', 'decimal']);
  });

  it('mencentang keenam tipe manual menghasilkan soal campuran dari semua tipe', () => {
    let manual: QType[] = [...DEFAULT_TYPES];
    for (const t of ['sub', 'div', 'fraction', 'decimal'] as const) manual = toggleType(manual, t).types;
    expect(manual).toEqual([...QTYPES]);
  });

  it('tipe terakhir tidak bisa dimatikan (ditolak, pilihan tidak berubah)', () => {
    const r = toggleType(['mul'], 'mul');
    expect(r.rejected).toBe(true);
    expect(r.types).toEqual(['mul']);
  });

  it('ribuan operasi acak: selalu ≥ 1 tipe, urut, tanpa duplikat, hanya tipe valid', () => {
    const rng = seeded(2024);
    let types: QType[] = [...DEFAULT_TYPES];
    let rejected = 0;
    for (let i = 0; i < 5000; i++) {
      const t = QTYPES[Math.floor(rng() * QTYPES.length)] as QType;
      const r = toggleType(types, t);
      if (r.rejected) {
        rejected++;
        expect(types.length).toBe(1);
        expect(r.types).toEqual(types);
      }
      types = r.types;
      expect(types.length).toBeGreaterThanOrEqual(1);
      expect(new Set(types).size).toBe(types.length);
      expect(types).toEqual(QTYPES.filter((q) => types.includes(q)));
    }
    expect(rejected).toBeGreaterThan(0); // skenario "tipe terakhir" benar-benar teruji
  });
});

describe('ringkasan pengaturan', () => {
  it('daftar tipe singkat bila sebagian, "Semua tipe" bila keenamnya aktif', () => {
    expect(settingsSummary({ mode: 'time', difficulty: 'medium', types: ['add', 'mul'] })).toBe(
      'Medium • Time Attack • Tambah, Kali',
    );
    expect(settingsSummary({ mode: 'normal', difficulty: 'hard', types: [...QTYPES] })).toBe('Hard • Normal • Semua tipe');
    expect(typesSummary(['add', 'sub', 'mul', 'div', 'fraction'])).not.toBe('Semua tipe');
  });

  it('tidak ada lagi kata "Mix" di ringkasan untuk kombinasi apa pun', () => {
    for (let mask = 1; mask < 1 << QTYPES.length; mask++) {
      const types = QTYPES.filter((_, i) => mask & (1 << i));
      expect(typesSummary(types)).not.toMatch(/mix/i);
    }
  });
});

describe('sanitizeSettings: data tersimpan', () => {
  it('menolak data rusak dan jatuh ke default tanpa error', () => {
    const def = { mode: 'time', difficulty: 'medium', types: ['add', 'mul'] };
    for (const bad of [null, undefined, 42, 'x', [], true, { types: 5 }, { types: {} }, { types: [null, 3, {}] }]) {
      expect(() => sanitizeSettings(bad)).not.toThrow();
      expect(sanitizeSettings(bad)).toEqual(def);
    }
    expect(sanitizeSettings({ mode: 'x', difficulty: 'hard', types: [] }).types).toEqual(['add', 'mul']);
    expect(sanitizeSettings({ mode: 'normal', difficulty: 'easy', types: ['div', 'bogus', 'add'] })).toEqual({
      mode: 'normal',
      difficulty: 'easy',
      types: ['add', 'div'],
    });
  });

  it('migrasi: pengaturan lama yang memakai "mix" menjadi keenam tipe tercentang', () => {
    for (const types of [['mix'], 'mix', ['mix', 'add'], ['add', 'mix', 'bogus']]) {
      const s = sanitizeSettings({ mode: 'normal', difficulty: 'hard', types });
      expect(s).toEqual({ mode: 'normal', difficulty: 'hard', types: [...QTYPES] });
    }
  });

  it('keenam tipe yang sudah tersimpan tetap keenam tipe (Mix lama = semua tipe)', () => {
    expect(sanitizeSettings({ mode: 'time', difficulty: 'easy', types: [...QTYPES] }).types).toEqual([...QTYPES]);
  });

  it('data lama diambil dari localStorage palsu tanpa menyentuh data rekor', () => {
    const store = new Map<string, string>([
      ['bm.settings', JSON.stringify({ mode: 'normal', difficulty: 'hard', types: ['mix'] })],
      ['bm:best:v2:normal:hard', '777'],
    ]);
    const s = sanitizeSettings(JSON.parse(store.get('bm.settings') as string));
    expect(s.types).toEqual([...QTYPES]);
    expect(store.get('bm:best:v2:normal:hard')).toBe('777'); // sanitizeSettings murni: tidak membaca/menulis rekor
  });
});
