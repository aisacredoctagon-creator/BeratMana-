import { describe, expect, it } from 'vitest';
import { ITEMS, pickItemPair } from './items';

// berkas aset dibaca lewat Vite (?raw), jadi tes tidak butuh modul Node
const files = import.meta.glob('../../public/assets/objects/*', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const file = (name: string): string | undefined => files[`../../public/assets/objects/${name}`];

/** RNG deterministik (mulberry32) supaya tes stabil. */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('daftar objek (Fluent Emoji Flat)', () => {
  it('28–36 objek dengan id unik dan label Indonesia', () => {
    expect(ITEMS.length).toBeGreaterThanOrEqual(28);
    expect(ITEMS.length).toBeLessThanOrEqual(36);
    expect(new Set(ITEMS.map((i) => i.id)).size).toBe(ITEMS.length);
    for (const i of ITEMS) expect(i.name.trim().length).toBeGreaterThan(1);
  });

  it('tiap objek punya berkas SVG, total di bawah 150 KB, dan lisensi MIT Fluent disertakan', () => {
    let total = 0;
    for (const i of ITEMS) {
      const svg = file(`${i.id}.svg`);
      expect(svg, `${i.id}.svg`).toBeDefined();
      total += (svg as string).length;
      expect((svg as string).startsWith('<svg')).toBe(true);
      expect(svg).toContain('viewBox=');
      expect(i.src.endsWith(`assets/objects/${i.id}.svg`)).toBe(true);
    }
    expect(total).toBeLessThan(150 * 1024);
    expect(file('LICENSE-fluent-emoji.txt')).toContain('MIT License');
  });

  it('campuran kategori tampilan, skala dan puncak objek masuk akal', () => {
    for (const cat of ['berat', 'ringan', 'menengah'] as const) {
      expect(ITEMS.filter((i) => i.category === cat).length, cat).toBeGreaterThanOrEqual(8);
    }
    for (const i of ITEMS) {
      expect(i.scale).toBeGreaterThan(0.5);
      expect(i.scale).toBeLessThanOrEqual(1);
      expect(i.top).toBeGreaterThanOrEqual(0);
      expect(i.top).toBeLessThan(0.6); // ekor box soal tidak terlalu jauh dari puncak slot
    }
  });

  it('tanpa konten yang dikecualikan (orang, bendera, senjata, alkohol, rokok, tengkorak, simbol bahaya)', () => {
    const banned = /person|people|man|woman|boy|girl|hand|finger|face|flag|gun|pistol|bomb|knife|sword|beer|wine|cocktail|cigarette|smok|skull|bone|fire|religio|cross|star-of|hammer-and/i;
    for (const i of ITEMS) expect(banned.test(i.id), i.id).toBe(false);
  });
});

describe('pemasangan pasangan objek', () => {
  it('ribuan ronde: kedua sisi berbeda dan tidak sama dengan objek di sisi yang sama pada ronde sebelumnya', () => {
    const rng = seeded(42);
    let prev: [string, string] | null = null;
    for (let n = 0; n < 20000; n++) {
      const [l, r] = pickItemPair(rng, prev);
      expect(l.id).not.toBe(r.id);
      if (prev) {
        expect(l.id).not.toBe(prev[0]);
        expect(r.id).not.toBe(prev[1]);
      }
      prev = [l.id, r.id];
    }
  });

  it('tanpa ronde sebelumnya tetap menghasilkan dua objek berbeda', () => {
    const rng = seeded(7);
    for (let n = 0; n < 2000; n++) {
      const [l, r] = pickItemPair(rng, null);
      expect(l.id).not.toBe(r.id);
    }
  });

  it('semua objek muncul di kedua sisi dan sebarannya kira-kira merata', () => {
    const rng = seeded(2024);
    const left = new Map<string, number>();
    const right = new Map<string, number>();
    let prev: [string, string] | null = null;
    const N = 36000;
    for (let n = 0; n < N; n++) {
      const [l, r] = pickItemPair(rng, prev);
      left.set(l.id, (left.get(l.id) ?? 0) + 1);
      right.set(r.id, (right.get(r.id) ?? 0) + 1);
      prev = [l.id, r.id];
    }
    const expected = N / ITEMS.length;
    for (const i of ITEMS) {
      expect(left.get(i.id) ?? 0, `kiri ${i.id}`).toBeGreaterThan(expected * 0.8);
      expect(left.get(i.id) ?? 0, `kiri ${i.id}`).toBeLessThan(expected * 1.2);
      expect(right.get(i.id) ?? 0, `kanan ${i.id}`).toBeGreaterThan(expected * 0.8);
      expect(right.get(i.id) ?? 0, `kanan ${i.id}`).toBeLessThan(expected * 1.2);
    }
  });

  it('murni acak: tidak membaca kategori maupun hasil hitungan (kategori sisi kiri dan kanan saling bebas)', () => {
    expect(pickItemPair.length).toBe(2); // hanya rng dan pasangan sebelumnya; tidak ada parameter hasil/kategori
    const rng = seeded(99);
    const cats = ['berat', 'ringan', 'menengah'] as const;
    const joint = new Map<string, number>();
    const marg = { l: new Map<string, number>(), r: new Map<string, number>() };
    const N = 60000;
    let prev: [string, string] | null = null;
    for (let n = 0; n < N; n++) {
      const [l, r] = pickItemPair(rng, prev);
      prev = [l.id, r.id];
      joint.set(`${l.category}|${r.category}`, (joint.get(`${l.category}|${r.category}`) ?? 0) + 1);
      marg.l.set(l.category, (marg.l.get(l.category) ?? 0) + 1);
      marg.r.set(r.category, (marg.r.get(r.category) ?? 0) + 1);
    }
    for (const a of cats) {
      for (const b of cats) {
        const observed = (joint.get(`${a}|${b}`) ?? 0) / N;
        const independent = ((marg.l.get(a) ?? 0) / N) * ((marg.r.get(b) ?? 0) / N);
        expect(Math.abs(observed - independent), `${a}|${b}`).toBeLessThan(0.02);
      }
    }
  });
});
