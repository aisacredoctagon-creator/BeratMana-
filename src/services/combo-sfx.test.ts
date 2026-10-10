import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { COMBO_SFX } from '../config/combo';
import { AudioManager } from './audio';
import { comboNotes } from './combo-sfx';

const CORRECT_VOLUME = 0.4; // volume nada 'correct' di audio.ts

describe('SFX combo: nada arpeggio', () => {
  it('makin tinggi tingkat → nada makin banyak dan nada tertinggi makin tinggi', () => {
    const counts = [1, 2, 3, 4, 5].map((l) => comboNotes(l).length);
    const peaks = [1, 2, 3, 4, 5].map((l) => Math.max(...comboNotes(l).map((n) => n.freq)));
    for (let i = 1; i < 5; i++) {
      expect(counts[i]).toBeGreaterThan(counts[i - 1] as number);
      expect(peaks[i]).toBeGreaterThan(peaks[i - 1] as number);
    }
  });

  it('arpeggio naik: nada utama (triangle) tiap tingkat naik berurutan', () => {
    for (const l of [1, 2, 3, 4, 5]) {
      const main = comboNotes(l)
        .filter((n) => n.type === 'triangle')
        .sort((a, b) => a.start - b.start);
      for (let i = 1; i < main.length; i++) expect(main[i]!.freq).toBeGreaterThan(main[i - 1]!.freq);
    }
  });

  it('dimulai setelah bunyi jawaban benar dan volumenya di bawahnya (tidak bertabrakan / tidak terlalu keras)', () => {
    for (const l of [1, 2, 3, 4, 5]) {
      const notes = comboNotes(l);
      expect(Math.min(...notes.map((n) => n.start))).toBeGreaterThanOrEqual(COMBO_SFX.delay);
      expect(Math.max(...notes.map((n) => n.vol))).toBeLessThanOrEqual(COMBO_SFX.volume);
      expect(COMBO_SFX.volume).toBeLessThan(CORRECT_VOLUME);
      expect(Math.max(...notes.map((n) => n.start + n.dur))).toBeLessThan(1.2);
    }
  });

  it('tingkat 1 (pemanasan) lebih lembut; kilau hanya di tingkat tinggi; tingkat di luar rentang dijepit', () => {
    expect(Math.max(...comboNotes(1).map((n) => n.vol))).toBeLessThan(Math.max(...comboNotes(2).map((n) => n.vol)));
    expect(comboNotes(3).length).toBe(2 * 5);
    expect(comboNotes(4).length).toBe(2 * 6 + 2);
    expect(comboNotes(99)).toEqual(comboNotes(5));
    expect(comboNotes(-3)).toEqual(comboNotes(1));
  });
});

/* ---------- AudioManager dengan AudioContext palsu: SFX mute = diam ---------- */
class FakeParam {
  value = 0;
  setValueAtTime = vi.fn();
  linearRampToValueAtTime = vi.fn();
  exponentialRampToValueAtTime = vi.fn();
  cancelScheduledValues = vi.fn();
  setTargetAtTime = vi.fn();
}
const created = { osc: 0 };
class FakeNode {
  connect(n: unknown) {
    return n;
  }
}
class FakeCtx {
  state: string = 'running';
  currentTime = 0;
  sampleRate = 22050;
  destination = new FakeNode();
  createGain() {
    return Object.assign(new FakeNode(), { gain: new FakeParam() });
  }
  createOscillator() {
    created.osc++;
    return Object.assign(new FakeNode(), { type: '', frequency: new FakeParam(), start: vi.fn(), stop: vi.fn() });
  }
  createBiquadFilter() {
    return Object.assign(new FakeNode(), { type: '', frequency: new FakeParam() });
  }
  createBuffer() {
    return { getChannelData: () => new Float32Array(8) };
  }
  createBufferSource() {
    return Object.assign(new FakeNode(), { buffer: null, start: vi.fn(), stop: vi.fn() });
  }
  resume() {
    return Promise.resolve();
  }
  suspend() {
    return Promise.resolve();
  }
}

describe('SFX combo: menghormati toggle SFX dan aturan autoplay', () => {
  beforeEach(() => {
    created.osc = 0;
    vi.stubGlobal('window', { AudioContext: FakeCtx, setInterval: () => 1, clearInterval: () => undefined });
  });
  afterEach(() => vi.unstubAllGlobals());

  const make = (): AudioManager => {
    const a = new AudioManager();
    a.prefs = { music: false, sfx: true };
    return a;
  };

  it('SFX nyala + sudah terbuka (gestur) → combo berbunyi', () => {
    const a = make();
    a.unlock();
    a.play('combo', 3);
    expect(created.osc).toBe(comboNotes(3).length);
  });

  it('SFX dimatikan → combo diam total (tidak ada osilator dibuat), untuk semua tingkat', () => {
    const a = make();
    a.unlock();
    a.setSfx(false);
    for (const l of [1, 2, 3, 4, 5]) a.play('combo', l);
    expect(created.osc).toBe(0);
    a.setSfx(true);
    a.play('combo', 2);
    expect(created.osc).toBe(comboNotes(2).length);
  });

  it('sebelum ada gestur pengguna (belum unlock) → diam, tidak melempar error', () => {
    const a = make();
    expect(() => a.play('combo', 5)).not.toThrow();
    expect(created.osc).toBe(0);
  });

  it('saat dijeda / tab tersembunyi (setActive false) → diam', () => {
    const a = make();
    a.unlock();
    a.setActive(false);
    a.play('combo', 4);
    expect(created.osc).toBe(0);
  });
});
