import { describe, expect, it } from 'vitest';
import { DIFFICULTIES, MODES } from '../config/difficulty';
import type { Difficulty, Mode } from '../config/difficulty';
import { seeded } from '../generator/random';
import { createRecords } from '../services/records';
import type { StorageLike } from '../services/records';
import { GameSession } from './session';

class FakeStorage implements StorageLike {
  data = new Map<string, string>();
  getItem(k: string) {
    return this.data.has(k) ? (this.data.get(k) as string) : null;
  }
  setItem(k: string, v: string) {
    this.data.set(k, v);
  }
  removeItem(k: string) {
    this.data.delete(k);
  }
}

function setup(initial: Record<string, string> = {}) {
  const ls = new FakeStorage();
  for (const [k, v] of Object.entries(initial)) ls.data.set(k, v);
  const records = createRecords(ls);
  let score = 0;
  const start = (mode: Mode, difficulty: Difficulty) =>
    new GameSession({ mode, difficulty }, { getBest: records.getBest, submitScore: records.submitScore, getScore: () => score });
  return { ls, records, start, setScore: (n: number) => (score = n) };
}

describe('GameSession', () => {
  it('game over normal: merekam skor dan menandai REKOR BARU bila mengalahkan rekor awal sesi', () => {
    const t = setup({ 'bm:best:v2:time:easy': '100' });
    const s = t.start('time', 'easy');
    t.setScore(150);
    expect(s.end('gameover')).toEqual({ reason: 'gameover', score: 150, best: 150, isNewRecord: true });
    expect(t.records.getBest('time', 'easy')).toBe(150);
  });

  it('skor tidak mengalahkan rekor: tidak ada REKOR BARU, rekor tidak berubah', () => {
    const t = setup({ 'bm:best:v2:time:easy': '100' });
    const s = t.start('time', 'easy');
    t.setScore(60);
    expect(s.end('gameover')).toMatchObject({ score: 60, best: 100, isNewRecord: false });
    expect(t.records.getBest('time', 'easy')).toBe(100);
  });

  it('keluar lebih awal (quit) merekam skor terakhir dan menjadi rekor bila lebih tinggi', () => {
    const t = setup();
    const s = t.start('normal', 'hard');
    t.setScore(75);
    const r = s.end('quit');
    expect(r).toMatchObject({ reason: 'quit', score: 75, best: 75 });
    expect(t.records.getBest('normal', 'hard')).toBe(75);
    expect(t.records.getBest('normal', 'easy')).toBeNull();
  });

  it('keluar lebih awal dengan skor lebih rendah tidak menurunkan rekor', () => {
    const t = setup({ 'bm:best:v2:normal:hard': '300' });
    const s = t.start('normal', 'hard');
    t.setScore(20);
    s.end('restart');
    expect(t.records.getBest('normal', 'hard')).toBe(300);
  });

  it('skor 0 tidak direkam di jalur mana pun', () => {
    for (const reason of ['gameover', 'quit', 'restart'] as const) {
      const t = setup();
      const s = t.start('time', 'medium');
      t.setScore(0);
      s.checkpoint();
      const r = s.end(reason);
      expect(r).toMatchObject({ score: 0, best: 0, isNewRecord: false });
      expect(t.ls.data.size).toBe(0);
    }
  });

  it('end() dua kali: hanya satu perekaman; panggilan kedua mengembalikan hasil pertama (walau skor berubah)', () => {
    const t = setup();
    const s = t.start('time', 'easy');
    t.setScore(90);
    const first = s.end('quit');
    t.setScore(500); // tidak boleh memengaruhi apa pun
    const second = s.end('gameover');
    expect(second).toBe(first);
    expect(t.records.getBest('time', 'easy')).toBe(90);
    expect(s.ended).toBe(true);
  });

  it('keluar lalu game over (urutan ganda) tidak menggandakan dan tidak menaikkan', () => {
    const t = setup();
    const s = t.start('time', 'easy');
    t.setScore(40);
    s.end('quit');
    t.setScore(80);
    s.end('gameover');
    expect(t.records.getBest('time', 'easy')).toBe(40);
  });

  it('snapshot pengaturan: pengaturan di beranda berubah di tengah sesi, skor tetap masuk ke kombinasi awal', () => {
    const t = setup();
    const settings = { mode: 'time' as Mode, difficulty: 'easy' as Difficulty };
    const s = t.start(settings.mode, settings.difficulty);
    settings.mode = 'normal'; // pemain "mengubah" pilihan sesudah sesi dimulai
    settings.difficulty = 'hard';
    t.setScore(33);
    s.end('quit');
    expect(t.records.getBest('time', 'easy')).toBe(33);
    expect(t.records.getBest('normal', 'hard')).toBeNull();
    expect(s.combo).toEqual({ mode: 'time', difficulty: 'easy' });
    expect(Object.isFrozen(s.combo)).toBe(true);
  });

  it('checkpoint (tab disembunyikan) merekam tanpa menutup sesi; skor lanjutan tetap terekam saat game over, tanpa hitungan ganda', () => {
    const t = setup();
    const s = t.start('time', 'hard');
    t.setScore(100);
    s.checkpoint();
    s.checkpoint();
    expect(t.records.getBest('time', 'hard')).toBe(100);
    expect(s.ended).toBe(false);
    t.setScore(180); // pemain kembali ke tab dan lanjut
    const r = s.end('gameover');
    expect(r).toMatchObject({ score: 180, best: 180, isNewRecord: true });
    expect(t.records.getBest('time', 'hard')).toBe(180);
    s.checkpoint(); // sesudah berakhir: tidak melakukan apa pun
    t.setScore(999);
    s.checkpoint();
    expect(t.records.getBest('time', 'hard')).toBe(180);
  });

  it('REKOR BARU dihitung terhadap rekor saat sesi DIMULAI, walau checkpoint sudah menyimpannya lebih dulu', () => {
    const t = setup({ 'bm:best:v2:time:easy': '100' });
    const s = t.start('time', 'easy');
    t.setScore(130);
    s.checkpoint(); // rekor sudah 130 sebelum game over
    expect(s.end('gameover')).toMatchObject({ score: 130, best: 130, isNewRecord: true });
  });

  it('rekor dinaikkan tab lain di tengah sesi: skor kita tidak lagi dianggap rekor baru', () => {
    const t = setup({ 'bm:best:v2:time:easy': '100' });
    const s = t.start('time', 'easy');
    t.ls.data.set('bm:best:v2:time:easy', '500'); // tab lain
    t.setScore(150);
    expect(s.end('gameover')).toMatchObject({ score: 150, best: 500, isNewRecord: false });
  });

  it('localStorage rusak/tidak ada: end() dan checkpoint() tidak pernah melempar', () => {
    const records = createRecords(null);
    const s = new GameSession({ mode: 'time', difficulty: 'easy' }, { getBest: records.getBest, submitScore: records.submitScore, getScore: () => 12 });
    expect(() => s.checkpoint()).not.toThrow();
    expect(s.end('quit')).toMatchObject({ score: 12, best: 12, isNewRecord: true });
    const boom = new GameSession(
      { mode: 'time', difficulty: 'easy' },
      {
        getBest: () => null,
        submitScore: () => {
          throw new Error('x');
        },
        getScore: () => 5,
      },
    );
    expect(() => boom.checkpoint()).not.toThrow();
    expect(() => boom.end('quit')).not.toThrow();
  });
});

describe('GameSession: simulasi acak ribuan sesi terhadap model', () => {
  it('rekor akhir tiap kombinasi = skor tertinggi yang pernah dicapai pada kombinasi itu (6.000 sesi)', () => {
    const rng = seeded(424242);
    const t = setup();
    const model = new Map<string, number>();
    const combos = MODES.flatMap((m) => DIFFICULTIES.map((d) => [m, d] as const));
    for (let i = 0; i < 6000; i++) {
      const [m, d] = combos[Math.floor(rng() * combos.length)] as readonly [Mode, Difficulty];
      const s = t.start(m, d);
      const final = Math.floor(rng() * 400);
      const steps = 1 + Math.floor(rng() * 4);
      for (let k = 0; k < steps; k++) {
        t.setScore(Math.floor((final * (k + 1)) / steps));
        if (rng() < 0.3) s.checkpoint(); // tab sering disembunyikan
      }
      const reason = (['gameover', 'quit', 'restart'] as const)[Math.floor(rng() * 3)] as 'gameover' | 'quit' | 'restart';
      s.end(reason);
      if (rng() < 0.2) s.end('gameover'); // pemanggilan ganda
      const key = `${m}:${d}`;
      if (final >= 1) model.set(key, Math.max(model.get(key) ?? 0, final));
      expect(t.records.getBest(m, d), `sesi#${i} ${key}`).toBe(model.get(key) ?? null);
    }
    for (const [m, d] of combos) expect(t.records.getBest(m, d)).toBe(model.get(`${m}:${d}`) ?? null);
  });
});
