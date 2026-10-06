import { describe, expect, it } from 'vitest';
import { QTYPES } from '../config/difficulty';
import {
  DEFAULT_TYPES,
  clearTypes,
  isMix,
  sanitizeSettings,
  selectAllTypes,
  settingsSummary,
  toggleMix,
  toggleType,
} from './settings';

describe('aturan chip tipe soal', () => {
  it('default: Penjumlahan dan Perkalian, Mix mati', () => {
    expect(DEFAULT_TYPES).toEqual(['add', 'mul']);
    expect(isMix([...DEFAULT_TYPES])).toBe(false);
  });

  it('mencentang semua tipe manual otomatis menyalakan Mix', () => {
    let manual = [...DEFAULT_TYPES];
    for (const t of ['sub', 'div', 'fraction', 'decimal'] as const) manual = toggleType(manual, t).types;
    expect(isMix(manual)).toBe(true);
  });

  it('Mix menyalakan semua; menghapus satu tipe mematikan Mix', () => {
    const all = toggleMix(['add', 'mul'], null);
    expect(all).toEqual([...QTYPES]);
    const after = toggleType(all, 'fraction');
    expect(after.rejected).toBe(false);
    expect(isMix(after.types)).toBe(false);
  });

  it('mematikan Mix memulihkan pilihan sebelumnya', () => {
    expect(toggleMix([...QTYPES], ['sub', 'div'])).toEqual(['sub', 'div']);
    expect(toggleMix([...QTYPES], null)).toEqual(['add', 'mul']);
  });

  it('tipe terakhir tidak bisa dimatikan', () => {
    const r = toggleType(['mul'], 'mul');
    expect(r.rejected).toBe(true);
    expect(r.types).toEqual(['mul']);
  });

  it('Hapus semua menyisakan tepat satu tipe', () => {
    const r = clearTypes(['sub', 'div']);
    expect(r.types).toEqual(['sub']);
    expect(r.rejected).toBe(true);
    expect(selectAllTypes()).toEqual([...QTYPES]);
  });

  it('ringkasan pengaturan', () => {
    expect(settingsSummary({ mode: 'time', difficulty: 'medium', types: ['add', 'mul'] })).toBe(
      'Medium • Time Attack • Tambah, Kali',
    );
    expect(settingsSummary({ mode: 'normal', difficulty: 'hard', types: [...QTYPES] })).toBe('Hard • Normal • Mix');
  });

  it('sanitizeSettings menolak data rusak', () => {
    expect(sanitizeSettings(null)).toEqual({ mode: 'time', difficulty: 'medium', types: ['add', 'mul'] });
    expect(sanitizeSettings({ mode: 'x', difficulty: 'hard', types: [] }).types).toEqual(['add', 'mul']);
    expect(sanitizeSettings({ mode: 'normal', difficulty: 'easy', types: ['div', 'bogus', 'add'] })).toEqual({
      mode: 'normal',
      difficulty: 'easy',
      types: ['add', 'div'],
    });
  });
});
