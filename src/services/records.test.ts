import { describe, expect, it } from 'vitest';
import { DIFFICULTIES, MODES } from '../config/difficulty';
import type { Difficulty, Mode } from '../config/difficulty';
import { seeded } from '../generator/random';
import { LEGACY_BEST_KEY, MIGRATION_FLAG_KEY, bestKey, createRecords, parseScore } from './records';
import type { StorageLike } from './records';

class FakeStorage implements StorageLike {
  data = new Map<string, string>();
  failSets = false;
  failGets = false;
  getItem(k: string): string | null {
    if (this.failGets) throw new DOMException('denied', 'SecurityError');
    return this.data.has(k) ? (this.data.get(k) as string) : null;
  }
  setItem(k: string, v: string): void {
    if (this.failSets) throw new DOMException('quota', 'QuotaExceededError');
    this.data.set(k, v);
  }
  removeItem(k: string): void {
    this.data.delete(k);
  }
  /** jumlah key di storage (untuk membuktikan pembacaan tidak menulis) */
  get size(): number {
    return this.data.size;
  }
}

const COMBOS: [Mode, Difficulty][] = MODES.flatMap((m) => DIFFICULTIES.map((d): [Mode, Difficulty] => [m, d]));
const allBest = (r: ReturnType<typeof createRecords>) => COMBOS.map(([m, d]) => r.getBest(m, d));

describe('records: dasar', () => {
  it('belum ada data → null (bukan 0) di keenam kombinasi, dan membaca tidak menulis apa pun', () => {
    const ls = new FakeStorage();
    const r = createRecords(ls);
    for (let i = 0; i < 500; i++) expect(allBest(r).every((v) => v === null)).toBe(true);
    expect(ls.size).toBe(0);
  });

  it('enam kombinasi terisolasi: tulis satu, lima lainnya tetap kosong', () => {
    COMBOS.forEach(([m, d], idx) => {
      const ls = new FakeStorage();
      const r = createRecords(ls);
      r.submitScore(m, d, 100 + idx);
      const got = allBest(r);
      got.forEach((v, j) => expect(v, `${m}:${d} → indeks ${j}`).toBe(j === idx ? 100 + idx : null));
      expect([...ls.data.keys()]).toEqual([bestKey(m, d)]);
    });
  });

  it('key per kombinasi berformat bm:best:v2:{mode}:{difficulty} dengan nilai bilangan bulat polos', () => {
    const ls = new FakeStorage();
    const r = createRecords(ls);
    r.submitScore('time', 'hard', 420);
    expect(ls.data.get('bm:best:v2:time:hard')).toBe('420');
  });

  it('rekor hanya naik; skor sama atau lebih rendah tidak mengubah apa pun', () => {
    const ls = new FakeStorage();
    const r = createRecords(ls);
    expect(r.submitScore('normal', 'easy', 50)).toMatchObject({ recorded: true, previous: null, best: 50 });
    expect(r.submitScore('normal', 'easy', 50)).toMatchObject({ recorded: false, best: 50 });
    expect(r.submitScore('normal', 'easy', 10)).toMatchObject({ recorded: false, best: 50 });
    expect(r.submitScore('normal', 'easy', 51)).toMatchObject({ recorded: true, previous: 50, best: 51 });
    expect(r.getBest('normal', 'easy')).toBe(51);
  });

  it('skor tidak valid ditolak: 0, negatif, NaN, Infinity, pecahan, bukan angka', () => {
    const ls = new FakeStorage();
    const r = createRecords(ls);
    for (const bad of [0, -1, -50, Number.NaN, Infinity, 12.5, 1e300, '30' as unknown as number, null as unknown as number]) {
      expect(r.submitScore('time', 'easy', bad).recorded).toBe(false);
    }
    expect(ls.size).toBe(0);
    expect(r.getBest('time', 'easy')).toBeNull();
  });

  it('kombinasi tidak dikenal ditolak dan tidak menulis', () => {
    const ls = new FakeStorage();
    const r = createRecords(ls);
    expect(r.submitScore('x' as Mode, 'easy', 10).recorded).toBe(false);
    expect(r.submitScore('time', 'z' as Difficulty, 10).recorded).toBe(false);
    expect(r.getBest('x' as Mode, 'easy')).toBeNull();
    expect(ls.size).toBe(0);
  });

  it('parseScore: hanya bilangan bulat polos ≥ 1', () => {
    expect(parseScore('120')).toBe(120);
    expect(parseScore(' 7 ')).toBe(7);
    for (const bad of ['0', '-5', '12.5', '1e3', '{"a":1}', '', 'abc', '[]', 'null', '00x', null, undefined]) expect(parseScore(bad as string)).toBeNull();
  });
});

describe('records: data rusak dan penyimpanan bermasalah', () => {
  it('data rusak di satu kombinasi tidak memengaruhi kombinasi lain, dan skor baru menggantikan hanya key itu', () => {
    const ls = new FakeStorage();
    const r = createRecords(ls);
    r.submitScore('time', 'easy', 120);
    r.submitScore('time', 'hard', 400);
    ls.data.set(bestKey('time', 'easy'), '{"rusak"'); // rusak
    const r2 = createRecords(ls); // reload
    expect(r2.getBest('time', 'easy')).toBeNull();
    expect(r2.getBest('time', 'hard')).toBe(400);
    r2.submitScore('time', 'easy', 30);
    expect(r2.getBest('time', 'easy')).toBe(30);
    expect(r2.getBest('time', 'hard')).toBe(400);
  });

  it('localStorage tidak tersedia (null): rekor tetap bekerja di memori sesi', () => {
    const r = createRecords(null);
    expect(r.getBest('time', 'easy')).toBeNull();
    expect(r.submitScore('time', 'easy', 80)).toMatchObject({ recorded: true, persisted: false, best: 80 });
    expect(r.getBest('time', 'easy')).toBe(80);
    expect(r.submitScore('time', 'easy', 70).recorded).toBe(false);
    expect(r.migrateLegacy().status).toBe('none');
  });

  it('setItem gagal (kuota/ITP): rekor baru tetap terbaca dari memori dan tidak "hilang"', () => {
    const ls = new FakeStorage();
    const r = createRecords(ls);
    r.submitScore('time', 'easy', 100);
    ls.failSets = true;
    const res = r.submitScore('normal', 'hard', 777);
    expect(res).toMatchObject({ recorded: true, persisted: false });
    expect(r.getBest('normal', 'hard')).toBe(777);
    expect(r.getBest('time', 'easy')).toBe(100);
  });

  it('getItem melempar (akses diblokir): tidak ada error, memori tetap dipakai', () => {
    const ls = new FakeStorage();
    const r = createRecords(ls);
    r.submitScore('time', 'medium', 60);
    ls.failGets = true;
    expect(r.getBest('time', 'medium')).toBe(60);
    expect(r.getBest('normal', 'easy')).toBeNull();
    expect(() => r.submitScore('normal', 'easy', 5)).not.toThrow();
  });

  it('tab lain menaikkan rekor: nilai berlaku = maksimum memori dan disk; tidak pernah turun', () => {
    const ls = new FakeStorage();
    const r = createRecords(ls);
    r.submitScore('time', 'easy', 100);
    ls.data.set(bestKey('time', 'easy'), '250'); // ditulis tab lain
    expect(r.getBest('time', 'easy')).toBe(250);
    ls.data.set(bestKey('time', 'easy'), '40'); // nilai lebih rendah di disk
    expect(r.getBest('time', 'easy')).toBe(100);
  });
});

describe('records: migrasi data lama (bm.best)', () => {
  it('memindahkan entri valid; key lama dibiarkan sebagai arsip', () => {
    const ls = new FakeStorage();
    ls.data.set(LEGACY_BEST_KEY, JSON.stringify({ 'time:easy': 120, 'normal:hard': 30 }));
    const r = createRecords(ls);
    expect(r.migrateLegacy()).toEqual({ status: 'migrated', moved: 2, skipped: [] });
    expect(r.getBest('time', 'easy')).toBe(120);
    expect(r.getBest('normal', 'hard')).toBe(30);
    expect(r.getBest('time', 'medium')).toBeNull();
    expect(ls.data.has(LEGACY_BEST_KEY)).toBe(true);
    expect(ls.data.get(MIGRATION_FLAG_KEY)).toBe('1');
  });

  it('entri yang tidak pasti diabaikan dan dilaporkan, tidak ditebak', () => {
    const ls = new FakeStorage();
    ls.data.set(
      LEGACY_BEST_KEY,
      JSON.stringify({ 'time:easy': 90, time: 55, 'time:ultra': 10, 'normal:easy': 12.5, 'normal:medium': null, 'normal:hard': -3, 'a:b:c': 4 }),
    );
    const r = createRecords(ls);
    const rep = r.migrateLegacy();
    expect(rep.status).toBe('migrated');
    expect(rep.moved).toBe(1);
    expect(rep.skipped.sort()).toEqual(['a:b:c', 'normal:easy', 'normal:hard', 'normal:medium', 'time', 'time:ultra'].sort());
    expect(COMBOS.map(([m, d]) => r.getBest(m, d))).toEqual([90, null, null, null, null, null]);
  });

  it('JSON lama rusak / bukan objek: tidak ada yang dimigrasi, tidak melempar, tidak menyentuh data baru', () => {
    for (const raw of ['{"time:easy":12', '5', '[]', 'null', 'abc']) {
      const ls = new FakeStorage();
      const r = createRecords(ls);
      r.submitScore('time', 'hard', 400);
      ls.data.set(LEGACY_BEST_KEY, raw);
      expect(r.migrateLegacy().status).toBe('corrupt');
      expect(r.getBest('time', 'hard')).toBe(400);
      expect(r.getBest('time', 'easy')).toBeNull();
      expect(ls.data.get(LEGACY_BEST_KEY)).toBe(raw);
    }
  });

  it('migrasi tidak menurunkan rekor baru dan hanya berjalan sekali', () => {
    const ls = new FakeStorage();
    ls.data.set(LEGACY_BEST_KEY, JSON.stringify({ 'time:easy': 120 }));
    const r = createRecords(ls);
    r.submitScore('time', 'easy', 500);
    expect(r.migrateLegacy().status).toBe('migrated');
    expect(r.getBest('time', 'easy')).toBe(500);
    ls.data.set(LEGACY_BEST_KEY, JSON.stringify({ 'time:easy': 9999 }));
    expect(r.migrateLegacy().status).toBe('already'); // bendera terpasang
    expect(r.getBest('time', 'easy')).toBe(500);
  });

  it('tanpa data lama: status none dan tidak menulis apa pun', () => {
    const ls = new FakeStorage();
    const r = createRecords(ls);
    expect(r.migrateLegacy().status).toBe('none');
    expect(ls.size).toBe(0);
  });
});

describe('records: fuzz acak terhadap model (ribuan operasi)', () => {
  for (const seed of [1, 2, 3, 4, 5, 6]) {
    it(`seed ${seed}: 6.000 operasi, hasil selalu sama dengan model`, () => {
      const rng = seeded(seed * 7919);
      const ls = new FakeStorage();
      let r = createRecords(ls);
      // model: mem = memori sesi, disk = isi valid di localStorage
      const mem = new Map<string, number>();
      const disk = new Map<string, number>();
      const pick = <T,>(a: readonly T[]): T => a[Math.floor(rng() * a.length)] as T;
      const expected = (key: string): number | null => {
        const a = mem.get(key) ?? null;
        const b = disk.get(key) ?? null;
        return a === null ? b : b === null ? a : Math.max(a, b);
      };

      for (let i = 0; i < 6000; i++) {
        const [m, d] = pick(COMBOS);
        const key = bestKey(m, d);
        const op = Math.floor(rng() * 100);
        if (op < 40) {
          const score = Math.floor(rng() * 600) - 20; // termasuk 0 dan negatif
          const before = expected(key);
          const res = r.submitScore(m, d, score);
          const ok = score >= 1 && (before === null || score > before);
          expect(res.recorded, `op#${i} submit ${key}=${score}`).toBe(ok);
          if (ok) {
            mem.set(key, score);
            if (!ls.failSets) disk.set(key, score);
          }
        } else if (op < 70) {
          expect(r.getBest(m, d), `op#${i} get ${key}`).toBe(expected(key));
        } else if (op < 78) {
          ls.data.set(key, pick(['{"x"', '-5', '12.5', 'abc', '', '0', 'null', '[1]']));
          disk.delete(key); // nilai rusak = tidak ada di disk
        } else if (op < 84) {
          const v = 1 + Math.floor(rng() * 700); // tab lain menulis nilai valid (bisa lebih rendah)
          ls.data.set(key, String(v));
          disk.set(key, v);
        } else if (op < 88) {
          ls.failSets = !ls.failSets;
        } else if (op < 92) {
          r = createRecords(ls); // reload: memori sesi hilang
          mem.clear();
        } else if (op < 95) {
          ls.data.clear(); // pengguna membersihkan data situs
          disk.clear();
        } else {
          for (const [mm, dd] of COMBOS) {
            const k2 = bestKey(mm, dd);
            expect(r.getBest(mm, dd), `op#${i} sapu ${k2}`).toBe(expected(k2));
          }
        }
      }
    });
  }
});
