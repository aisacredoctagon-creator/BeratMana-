import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** Palsu secukupnya untuk Web Audio dan localStorage; tes ini memeriksa default audio dan pembukaan lewat gestur pertama. */
class FakeParam {
  value = 0;
  calls: Array<[string, ...number[]]> = [];
  setValueAtTime(v: number, t: number): void {
    this.value = v;
    this.calls.push(['set', v, t]);
  }
  setTargetAtTime(v: number, t: number, k: number): void {
    this.value = v;
    this.calls.push(['target', v, t, k]);
  }
  linearRampToValueAtTime(v: number, t: number): void {
    this.calls.push(['ramp', v, t]);
  }
  exponentialRampToValueAtTime(v: number, t: number): void {
    this.calls.push(['expramp', v, t]);
  }
  cancelScheduledValues(t: number): void {
    this.calls.push(['cancel', t]);
  }
}
class FakeNode {
  connect(n: unknown): unknown {
    return n;
  }
}

const made = { osc: 0, ctx: [] as FakeCtx[], gains: [] as FakeParam[] };

class FakeCtx {
  state: 'suspended' | 'running' = 'suspended';
  currentTime = 0;
  sampleRate = 22050;
  destination = new FakeNode();
  resumeCalls = 0;
  /** true = resume() berhasil seketika (gestur sah); false = tetap 'suspended' (gestur tidak dianggap browser). */
  static allowResume = true;
  private listeners: Array<() => void> = [];
  constructor() {
    made.ctx.push(this);
  }
  addEventListener(type: string, fn: () => void): void {
    if (type === 'statechange') this.listeners.push(fn);
  }
  createGain() {
    const gain = new FakeParam();
    made.gains.push(gain);
    return Object.assign(new FakeNode(), { gain });
  }
  createOscillator() {
    made.osc++;
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
  /** Seperti browser: resume() asinkron; state berubah menjadi 'running' setelahnya (hanya bila gestur dianggap sah). */
  resume(): Promise<void> {
    this.resumeCalls++;
    return Promise.resolve().then(() => {
      if (FakeCtx.allowResume && this.state !== 'running') {
        this.state = 'running';
        for (const l of this.listeners) l();
      }
    });
  }
  suspend(): Promise<void> {
    this.state = 'suspended';
    return Promise.resolve();
  }
}

const flush = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

/** Target event palsu: mencatat listener dan bisa "menembakkan" gestur. */
function fakeTarget() {
  const handlers = new Map<string, Set<() => void>>();
  return {
    addEventListener: (t: string, fn: () => void) => {
      if (!handlers.has(t)) handlers.set(t, new Set());
      handlers.get(t)?.add(fn);
    },
    removeEventListener: (t: string, fn: () => void) => {
      handlers.get(t)?.delete(fn);
    },
    fire: (t: string) => [...(handlers.get(t) ?? [])].forEach((fn) => fn()),
    count: () => [...handlers.values()].reduce((n, s) => n + s.size, 0),
    types: () => [...handlers.entries()].filter(([, s]) => s.size > 0).map(([t]) => t).sort(),
  };
}

function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  const writes: string[] = [];
  return {
    data,
    writes,
    api: {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => {
        writes.push(k);
        data.set(k, v);
      },
      removeItem: (k: string) => void data.delete(k),
    },
  };
}

async function loadModules(localStorage: unknown) {
  vi.resetModules();
  vi.stubGlobal('window', { localStorage, AudioContext: FakeCtx, setInterval: () => 1, clearInterval: () => undefined });
  const storage = await import('./storage');
  const audio = await import('./audio');
  return { storage, audio };
}

describe('default audio: Musik ON dan SFX ON', () => {
  beforeEach(() => {
    made.osc = 0;
    made.ctx = [];
    made.gains = [];
    FakeCtx.allowResume = true;
  });
  afterEach(() => vi.unstubAllGlobals());

  it('kunjungan pertama (key belum ada) → keduanya ON, dan membaca TIDAK menulis bm.audio', async () => {
    const st = fakeStorage();
    const { storage, audio } = await loadModules(st.api);
    expect(storage.loadAudioPrefs()).toEqual({ music: true, sfx: true });
    expect(new audio.AudioManager().prefs).toEqual({ music: true, sfx: true });
    expect(st.writes).not.toContain('bm.audio');
    expect(st.data.has('bm.audio')).toBe(false);
  });

  it('pilihan mute eksplisit yang tersimpan tetap dihormati', async () => {
    for (const [saved, expected] of [
      [{ music: false, sfx: true }, { music: false, sfx: true }],
      [{ music: true, sfx: false }, { music: true, sfx: false }],
      [{ music: false, sfx: false }, { music: false, sfx: false }],
    ] as const) {
      const st = fakeStorage({ 'bm.audio': JSON.stringify(saved) });
      const { storage } = await loadModules(st.api);
      expect(storage.loadAudioPrefs()).toEqual(expected);
    }
  });

  it('hanya key yang belum ada yang default ON: data rusak atau sebagian tetap tidak mematikan audio', async () => {
    for (const raw of ['{}', '{"music":false}', 'bukan json', 'null']) {
      const st = fakeStorage({ 'bm.audio': raw });
      const { storage } = await loadModules(st.api);
      const p = storage.loadAudioPrefs();
      expect(p.sfx).toBe(true);
      expect(p.music).toBe(raw === '{"music":false}' ? false : true);
    }
  });

  it('localStorage gagal (diblokir) → tetap ON memakai memori, dan pilihan sesi tetap tersimpan di memori', async () => {
    const blocked = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    };
    const { storage, audio } = await loadModules(blocked);
    expect(storage.loadAudioPrefs()).toEqual({ music: true, sfx: true });
    const a = new audio.AudioManager();
    expect(a.prefs).toEqual({ music: true, sfx: true });
    a.setMusic(false); // pilihan pemain di sesi ini tetap dihormati walau penyimpanan gagal
    expect(storage.loadAudioPrefs()).toEqual({ music: false, sfx: true });
  });
});

describe('gestur pertama membuka audio', () => {
  beforeEach(() => {
    made.osc = 0;
    made.ctx = [];
    made.gains = [];
    FakeCtx.allowResume = true;
  });
  afterEach(() => vi.unstubAllGlobals());

  const setup = async (saved?: Record<string, unknown>) => {
    const st = fakeStorage(saved ? { 'bm.audio': JSON.stringify(saved) } : {});
    const { audio } = await loadModules(st.api);
    const a = new audio.AudioManager();
    a.startMusic();
    const target = fakeTarget();
    a.armGestureUnlock(target);
    return { a, target, st };
  };

  it('sebelum gestur: belum ada AudioContext (tidak mengakali autoplay); listener click, touchend, keydown terpasang', async () => {
    const { a, target } = await setup();
    expect(a.unlocked).toBe(false);
    expect(made.ctx.length).toBe(0);
    expect(target.types()).toEqual(['click', 'keydown', 'touchend']);
  });

  it('gestur pertama (apa pun, mis. klik/tap tombol Main) → AudioContext dibuat dan resume() dipanggil di dalam handler', async () => {
    for (const type of ['click', 'touchend', 'keydown']) {
      made.ctx = [];
      const { a, target } = await setup();
      target.fire(type);
      expect(a.unlocked).toBe(true);
      expect(made.ctx.length).toBe(1);
      expect(made.ctx[0]?.resumeCalls).toBe(1);
    }
  });

  it('setelah running: listener dilepas, dan musik fade-in dari 0 ke volume dalam ±1,2 dtk (tanpa menyentuh toggle)', async () => {
    const { a, target } = await setup();
    target.fire('click');
    await flush();
    expect(made.ctx[0]?.state).toBe('running');
    expect(target.count()).toBe(0);
    const music = made.gains[0] as FakeParam; // bus Musik dibuat lebih dulu
    const ramp = music.calls.find((c) => c[0] === 'ramp');
    expect(ramp).toBeDefined();
    expect(ramp?.[1]).toBeCloseTo(0.16, 5);
    expect(ramp?.[2]).toBeCloseTo(1.2, 5);
    const lastSet = [...music.calls].reverse().find((c) => c[0] === 'set');
    expect(lastSet?.[1]).toBe(0); // mulai dari senyap (fade-in, bukan lompatan volume)
    expect(a.prefs).toEqual({ music: true, sfx: true });
  });

  it('gestur yang tidak dianggap browser (context tetap suspended) → listener tetap ada dan mencoba lagi di gestur berikutnya', async () => {
    FakeCtx.allowResume = false;
    const { target } = await setup();
    target.fire('keydown');
    await flush();
    expect(made.ctx[0]?.state).toBe('suspended');
    expect(target.count()).toBe(3);
    FakeCtx.allowResume = true;
    target.fire('touchend');
    await flush();
    expect(made.ctx.length).toBe(1); // satu context saja
    expect(made.ctx[0]?.resumeCalls).toBe(2);
    expect(made.ctx[0]?.state).toBe('running');
    expect(target.count()).toBe(0);
  });

  it('Musik dimute eksplisit → tidak ada fade-in (tetap senyap), SFX tetap berfungsi', async () => {
    const { a, target } = await setup({ music: false, sfx: true });
    target.fire('click');
    await flush();
    const music = made.gains[0] as FakeParam;
    expect(music.calls.some((c) => c[0] === 'ramp')).toBe(false);
    expect(music.value).toBe(0);
    a.play('click');
    expect(made.osc).toBe(1);
  });

  it('SFX gestur pertama (klik Main) menunggu resume() lalu berbunyi; SFX dimute eksplisit tetap diam', async () => {
    const { a, target } = await setup();
    target.fire('click');
    a.play('click'); // dipanggil segera setelah gestur, sebelum resume() selesai
    expect(made.osc).toBe(0);
    await flush();
    await flush();
    expect(made.osc).toBe(1);

    made.osc = 0;
    const m = await setup({ music: true, sfx: false });
    m.target.fire('click');
    m.a.play('click');
    await flush();
    await flush();
    expect(made.osc).toBe(0);
  });

  it('tanpa Web Audio (mis. browser dalam aplikasi) → tidak melempar error dan tidak membuat context', async () => {
    const st = fakeStorage();
    vi.resetModules();
    vi.stubGlobal('window', { localStorage: st.api, setInterval: () => 1, clearInterval: () => undefined });
    const { AudioManager } = await import('./audio');
    const a = new AudioManager();
    const target = fakeTarget();
    a.armGestureUnlock(target);
    expect(() => target.fire('click')).not.toThrow();
    expect(a.unlocked).toBe(false);
    expect(target.count()).toBe(0);
  });
});
