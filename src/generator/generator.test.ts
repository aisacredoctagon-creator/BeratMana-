import { describe, expect, it } from 'vitest';
import { DIFFICULTIES, DIFFICULTY_CONFIG, QTYPES } from '../config/difficulty';
import type { Difficulty, QType } from '../config/difficulty';
import { formatScaled, formatValue } from './expression';
import {
  INITIAL_PACE,
  MAX_SAME_SIDE_RUN,
  generateQuestion,
  meetsMinDifference,
  nextPace,
  relativeGap,
} from './index';
import type { Pace, Question } from './index';
import { add, cmp, eq, isInt, rat, toNumber } from './rational';
import { seeded } from './random';

const ITER = 3000;

/* ---------- evaluator label yang INDEPENDEN dari kode generator (float, toleransi) ---------- */
function evaluate(label: string): number {
  const src = label.replace(/\s+/g, '');
  let pos = 0;
  const peek = () => src[pos];
  const num = (): number => {
    const m = /^\d+(,\d+)?/.exec(src.slice(pos));
    if (!m) throw new Error(`angka tidak valid pada "${label}" posisi ${pos}`);
    pos += m[0].length;
    return parseFloat(m[0].replace(',', '.'));
  };
  const factor = (): number => {
    let v = num();
    if (peek() === '/') {
      pos++;
      v /= num();
    }
    return v;
  };
  const term = (): number => {
    let v = factor();
    while (peek() === '×' || peek() === '÷') {
      const op = src[pos++];
      const r = factor();
      v = op === '×' ? v * r : v / r;
    }
    return v;
  };
  function expr(): number {
    let v = term();
    while (peek() === '+' || peek() === '−') {
      const op = src[pos++];
      const r = term();
      v = op === '+' ? v + r : v - r;
    }
    return v;
  }
  const result = expr();
  if (pos !== src.length) throw new Error(`sisa tak terparse pada "${label}"`);
  return result;
}

function run(
  types: readonly QType[],
  difficulty: Difficulty,
  count: number,
  seed: number,
  levelFor: (i: number) => number = (i) => i % (DIFFICULTY_CONFIG[difficulty].levelMax + 1),
): Question[] {
  const rng = seeded(seed);
  const out: Question[] = [];
  let previous: Question | null = null;
  let pace: Pace = INITIAL_PACE;
  for (let i = 0; i < count; i++) {
    const q = generateQuestion({ types, difficulty, level: levelFor(i), rng, previous, pace });
    out.push(q);
    previous = q;
    pace = nextPace(pace, q.heavier);
  }
  return out;
}

const TYPE_SETS: { name: string; types: QType[] }[] = [
  { name: 'add', types: ['add'] },
  { name: 'sub', types: ['sub'] },
  { name: 'mul', types: ['mul'] },
  { name: 'div', types: ['div'] },
  { name: 'fraction', types: ['fraction'] },
  { name: 'decimal', types: ['decimal'] },
  { name: 'default (add+mul)', types: ['add', 'mul'] },
  { name: 'fraction+decimal', types: ['fraction', 'decimal'] },
  { name: 'fraction+mul (rentang berjauhan)', types: ['fraction', 'mul'] },
  { name: 'semua tipe', types: [...QTYPES] },
];

describe('aritmetika rasional', () => {
  it('menjumlah pecahan secara eksak', () => {
    expect(eq(add(rat(1, 3), rat(1, 6)), rat(1, 2))).toBe(true);
    expect(eq(add(rat(1, 10), rat(2, 10)), rat(3, 10))).toBe(true); // 0,1 + 0,2 = 0,3 tanpa galat float
    expect(cmp(rat(5, 8), rat(3, 4))).toBe(-1);
    expect(cmp(rat(4, 8), rat(1, 2))).toBe(0);
  });

  it('format nilai gaya Indonesia', () => {
    expect(formatScaled(75, 2)).toBe('0,75');
    expect(formatScaled(5, 2)).toBe('0,05');
    expect(formatScaled(1250, 3)).toBe('1,250');
    expect(formatValue(rat(16))).toBe('16');
    expect(formatValue(rat(5, 8))).toBe('0,625');
    expect(formatValue(rat(3, 4))).toBe('0,75');
    expect(formatValue(rat(1, 2))).toBe('0,5');
    expect(formatValue(rat(2, 3))).toBe('≈ 0,667');
  });
});

describe('generator soal: aturan wajib', () => {
  for (const difficulty of DIFFICULTIES) {
    for (const set of TYPE_SETS) {
      describe(`${difficulty} • ${set.name}`, () => {
        const qs = run(set.types, difficulty, ITER, 1234 + set.name.length);
        const cfg = DIFFICULTY_CONFIG[difficulty];

        it('nilai kedua sisi tidak pernah sama', () => {
          for (const q of qs) expect(cmp(q.left.value, q.right.value)).not.toBe(0);
        });

        it('hasil dihitung benar (cocok dengan evaluasi independen dari label)', () => {
          for (const q of qs) {
            for (const e of [q.left, q.right]) {
              const expected = evaluate(e.label);
              expect(Math.abs(expected - toNumber(e.value)), e.label).toBeLessThan(1e-9);
            }
          }
        });

        it('selisih memenuhi batas kesulitan', () => {
          for (const q of qs) {
            expect(meetsMinDifference(q.left, q.right, cfg), `${q.left.label} vs ${q.right.label}`).toBe(true);
            expect(relativeGap(q.left, q.right)).toBeGreaterThanOrEqual(cfg.minDiffRatio - 1e-9);
            if (isInt(q.left.value) && isInt(q.right.value)) {
              expect(Math.abs(toNumber(q.left.value) - toNumber(q.right.value))).toBeGreaterThanOrEqual(
                cfg.minDiffAbs,
              );
            }
          }
        });

        it('sisi yang ditandai berat memang bernilai lebih besar', () => {
          for (const q of qs) {
            const c = cmp(q.left.value, q.right.value);
            expect(q.heavier).toBe(c > 0 ? 'left' : 'right');
          }
        });

        it('hanya tipe yang dipilih yang muncul', () => {
          for (const q of qs) {
            for (const e of [q.left, q.right]) expect(set.types).toContain(e.kind);
          }
        });

        it('tidak ada soal identik berurutan dan label bersih', () => {
          for (let i = 1; i < qs.length; i++) {
            const a = qs[i - 1] as Question;
            const b = qs[i] as Question;
            const ka = [a.left.label, a.right.label].sort().join('|');
            const kb = [b.left.label, b.right.label].sort().join('|');
            expect(kb).not.toBe(ka);
          }
          for (const q of qs) {
            for (const e of [q.left, q.right]) {
              expect(e.label).not.toMatch(/NaN|undefined|Infinity|\./);
              // muat di kotak: label polos tidak boleh kepanjangan
              expect(e.label.length).toBeLessThanOrEqual(22);
            }
          }
        });

        it('posisi jawaban benar seimbang, maks 3x beruntun di sisi sama', () => {
          let run = 0;
          let last: string | null = null;
          let left = 0;
          for (const q of qs) {
            run = q.heavier === last ? run + 1 : 1;
            last = q.heavier;
            expect(run).toBeLessThanOrEqual(MAX_SAME_SIDE_RUN);
            if (q.heavier === 'left') left++;
          }
          expect(left / qs.length).toBeGreaterThan(0.4);
          expect(left / qs.length).toBeLessThan(0.6);
        });
      });
    }
  }
});

describe('generator soal: per tipe', () => {
  it('pembagian selalu menghasilkan bilangan bulat', () => {
    for (const difficulty of DIFFICULTIES) {
      let seen = 0;
      for (const q of run(['div'], difficulty, ITER, 99)) {
        for (const e of [q.left, q.right]) {
          const m = /^(\d+) ÷ (\d+)$/.exec(e.label);
          expect(m, e.label).not.toBeNull();
          const dividend = Number(m?.[1]);
          const divisor = Number(m?.[2]);
          expect(dividend % divisor).toBe(0);
          expect(isInt(e.value)).toBe(true);
          expect(toNumber(e.value)).toBe(dividend / divisor);
          const r = DIFFICULTY_CONFIG[difficulty].ranges.div;
          expect(divisor).toBeGreaterThanOrEqual(r.divisor.min);
          expect(divisor).toBeLessThanOrEqual(r.divisor.max);
          seen++;
        }
      }
      expect(seen).toBe(ITER * 2);
    }
  });

  it('pembagian di antara tipe lain pun selalu bulat', () => {
    for (const difficulty of DIFFICULTIES) {
      for (const q of run([...QTYPES], difficulty, ITER, 7)) {
        for (const e of [q.left, q.right]) {
          if (e.kind !== 'div') continue;
          const m = /^(\d+) ÷ (\d+)$/.exec(e.label);
          expect(Number(m?.[1]) % Number(m?.[2])).toBe(0);
        }
      }
    }
  });

  it('pengurangan selalu positif dan operand dalam rentang', () => {
    for (const difficulty of DIFFICULTIES) {
      const r = DIFFICULTY_CONFIG[difficulty].ranges.sub;
      for (const q of run(['sub'], difficulty, ITER, 5)) {
        for (const e of [q.left, q.right]) {
          const m = /^(\d+) − (\d+)$/.exec(e.label);
          expect(m, e.label).not.toBeNull();
          const a = Number(m?.[1]);
          const b = Number(m?.[2]);
          expect(a).toBeGreaterThan(b);
          expect(a).toBeLessThanOrEqual(r.max);
          expect(b).toBeGreaterThanOrEqual(r.min);
        }
      }
    }
  });

  it('perkalian: Easy tabel 1–10, Medium 2 digit × 1 digit, Hard 2 digit × 2 digit', () => {
    const digits = (n: number) => String(n).length;
    for (const q of run(['mul'], 'easy', ITER, 3)) {
      for (const e of [q.left, q.right]) {
        const [a, b] = e.label.split(' × ').map(Number) as [number, number];
        expect(Math.max(a, b)).toBeLessThanOrEqual(10);
        expect(Math.min(a, b)).toBeGreaterThanOrEqual(1);
      }
    }
    for (const q of run(['mul'], 'medium', ITER, 3)) {
      for (const e of [q.left, q.right]) {
        const ds = e.label.split(' × ').map((s) => digits(Number(s))).sort();
        expect(ds).toEqual([1, 2]);
      }
    }
    for (const q of run(['mul'], 'hard', ITER, 3)) {
      for (const e of [q.left, q.right]) {
        for (const s of e.label.split(' × ')) expect(digits(Number(s))).toBe(2);
      }
    }
  });

  it('pecahan Easy: penyebut 2,3,4,5,10 dan nilai < 1; Medium: penyebut ≤ 12', () => {
    for (const q of run(['fraction'], 'easy', ITER, 11)) {
      for (const e of [q.left, q.right]) {
        const m = /^(\d+)\/(\d+)$/.exec(e.label);
        expect(m, e.label).not.toBeNull();
        expect([2, 3, 4, 5, 10]).toContain(Number(m?.[2]));
        expect(toNumber(e.value)).toBeLessThan(1);
      }
    }
    for (const q of run(['fraction'], 'medium', ITER, 11)) {
      for (const e of [q.left, q.right]) {
        const m = /^(\d+)\/(\d+)$/.exec(e.label);
        expect(Number(m?.[2])).toBeLessThanOrEqual(12);
      }
    }
  });

  it('pecahan Hard boleh berbentuk jumlah/selisih pecahan', () => {
    const forms = new Set<string>();
    for (const q of run(['fraction'], 'hard', ITER, 13)) {
      for (const e of [q.left, q.right]) forms.add(/[+−]/.test(e.label) ? 'ekspresi' : 'tunggal');
    }
    expect(forms.has('ekspresi')).toBe(true);
    expect(forms.has('tunggal')).toBe(true);
  });

  it('desimal: jumlah angka di belakang koma sesuai kesulitan, koma gaya Indonesia', () => {
    const places = (label: string) => [...label.matchAll(/\d+,(\d+)/g)].map((m) => (m[1] as string).length);
    for (const q of run(['decimal'], 'easy', ITER, 17)) {
      for (const e of [q.left, q.right]) for (const p of places(e.label)) expect(p).toBe(1);
    }
    for (const q of run(['decimal'], 'medium', ITER, 17)) {
      for (const e of [q.left, q.right]) for (const p of places(e.label)) expect(p).toBe(2);
    }
    const seen = new Set<number>();
    for (const q of run(['decimal'], 'hard', ITER, 17)) {
      for (const e of [q.left, q.right]) for (const p of places(e.label)) seen.add(p);
    }
    expect([...seen].sort()).toEqual([2, 3]);
  });

  it('nilai desimal eksak (tanpa galat floating point)', () => {
    for (const difficulty of DIFFICULTIES) {
      for (const q of run(['decimal'], difficulty, ITER, 21)) {
        for (const e of [q.left, q.right]) {
          // penyebut nilai eksak hanya berisi faktor 2 dan 5
          let d = e.value.d;
          while (d % 2 === 0) d /= 2;
          while (d % 5 === 0) d /= 5;
          expect(d).toBe(1);
        }
      }
    }
  });
});

describe('generator soal: beberapa tipe tercentang = soal campuran', () => {
  /** minMixed = batas bawah porsi pasangan beda tipe. Aturan lama: sisi kanan hanya dipasangkan dengan tipe yang rentang
   * nilainya tumpang tindih, jadi pecahan (nilai kecil) jarang bersanding dengan perkalian/pembagian (nilai besar). */
  const MULTI: { name: string; types: QType[]; minMixed: number }[] = [
    { name: 'dua tipe', types: ['add', 'sub'], minMixed: 0.2 },
    { name: 'tiga tipe (rentang berjauhan)', types: ['mul', 'div', 'fraction'], minMixed: 0.003 },
    { name: 'lima tipe', types: ['add', 'sub', 'mul', 'div', 'decimal'], minMixed: 0.2 },
    { name: 'semua tipe', types: [...QTYPES], minMixed: 0.2 },
  ];

  it('satu tipe saja hanya menghasilkan tipe itu', () => {
    for (const difficulty of DIFFICULTIES) {
      for (const t of QTYPES) {
        for (const q of run([t], difficulty, 800, 11 + QTYPES.indexOf(t))) {
          expect(q.left.kind).toBe(t);
          expect(q.right.kind).toBe(t);
        }
      }
    }
  });

  it('banyak tipe: semua tipe terpilih muncul, merata, dan kiri/kanan boleh beda tipe', () => {
    for (const difficulty of DIFFICULTIES) {
      for (const set of MULTI) {
        const count = new Map<string, number>();
        let mixedPairs = 0;
        const qs = run(set.types, difficulty, ITER, 31 + set.types.length);
        for (const q of qs) {
          for (const e of [q.left, q.right]) count.set(e.kind, (count.get(e.kind) ?? 0) + 1);
          if (q.left.kind !== q.right.kind) mixedPairs++;
        }
        const total = qs.length * 2;
        for (const t of set.types) {
          const share = (count.get(t) ?? 0) / total;
          expect(share, `${difficulty}/${set.name}: ${t} muncul ${(share * 100).toFixed(1)}%`).toBeGreaterThan(0.4 / set.types.length);
        }
        for (const k of count.keys()) expect(set.types).toContain(k as QType); // tidak ada tipe lain
        expect(mixedPairs, `${difficulty}/${set.name}: pasangan beda tipe`).toBeGreaterThan(ITER * set.minMixed);
      }
    }
  }, 60_000);

  it('soal akar, pangkat, dan kurung sudah dihapus: tidak ada label berisi √ ² ³ ( )', () => {
    const PER_COMBO = 1000; // 3 kesulitan × 10 set tipe × 1000 soal = 30.000 soal
    const banned = /[√²³()]/;
    let checked = 0;
    for (const difficulty of DIFFICULTIES) {
      for (const set of TYPE_SETS) {
        for (const q of run(set.types, difficulty, PER_COMBO, 77 + set.name.length)) {
          for (const e of [q.left, q.right]) {
            expect(banned.test(e.label), `${difficulty}/${set.name}: "${e.label}"`).toBe(false);
            expect(e.tokens.every((k) => k.t === 'txt' || k.t === 'frac')).toBe(true);
            expect(QTYPES).toContain(e.kind);
            checked++;
          }
        }
      }
    }
    expect(checked).toBeGreaterThanOrEqual(PER_COMBO * 2 * DIFFICULTIES.length * TYPE_SETS.length);
  }, 60_000);

  it('konfigurasi kesulitan tidak lagi punya rentang bonus', () => {
    for (const difficulty of DIFFICULTIES) {
      expect(Object.keys(DIFFICULTY_CONFIG[difficulty])).not.toContain('bonus');
      expect(Object.keys(DIFFICULTY_CONFIG[difficulty])).not.toContain('bonusChance');
    }
  });
});

describe('level intensitas', () => {
  it('level tinggi membuat selisih lebih tipis dan angka lebih besar', () => {
    for (const difficulty of DIFFICULTIES) {
      const cfg = DIFFICULTY_CONFIG[difficulty];
      const avg = (level: number) => {
        const qs = run(['add', 'sub', 'mul'], difficulty, 1500, 77, () => level);
        const gap = qs.reduce((s, q) => s + relativeGap(q.left, q.right), 0) / qs.length;
        const size = qs.reduce((s, q) => s + Math.max(toNumber(q.left.value), toNumber(q.right.value)), 0) / qs.length;
        return { gap, size };
      };
      const lo = avg(0);
      const hi = avg(cfg.levelMax);
      expect(hi.gap, `${difficulty} gap`).toBeLessThan(lo.gap);
      expect(hi.size, `${difficulty} size`).toBeGreaterThan(lo.size);
    }
  });

  it('level di atas batas tidak melewati batas kesulitan', () => {
    for (const difficulty of DIFFICULTIES) {
      const cfg = DIFFICULTY_CONFIG[difficulty];
      const qs = run(['add'], difficulty, 500, 5, () => 9999);
      for (const q of qs) {
        expect(q.level).toBe(cfg.levelMax);
        expect(toNumber(q.left.value)).toBeLessThanOrEqual(cfg.ranges.add.max * 2);
        expect(toNumber(q.right.value)).toBeLessThanOrEqual(cfg.ranges.add.max * 2);
      }
    }
  });
});
