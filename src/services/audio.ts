import { comboNotes } from './combo-sfx';
import { loadAudioPrefs, saveAudioPrefs } from './storage';
import type { AudioPrefs } from './storage';

export type Sfx = 'click' | 'correct' | 'wrong' | 'combo' | 'gameover' | 'tick' | 'thud';

const MUSIC_VOLUME = 0.16;
const SFX_VOLUME = 0.9;

// Akor latar (C – Am – F – G), tiap akor = satu bar 8 not.
const CHORDS: number[][] = [
  [261.63, 329.63, 392.0], // C
  [220.0, 261.63, 329.63], // Am
  [174.61, 220.0, 261.63], // F
  [196.0, 246.94, 293.66], // G
];
const BASS: number[] = [130.81, 110.0, 87.31, 98.0];
const ARP = [0, 1, 2, 1, 2, 1, 0, 1];
const BPM = 108;
const STEP = 60 / BPM / 2; // delapan not per bar
const LOOKAHEAD = 0.25;

/**
 * Audio sepenuhnya disintesis dengan Web Audio API (tanpa file aset).
 * - Dua bus terpisah: Musik dan SFX, masing-masing hanya mute/unmute, tersimpan di localStorage.
 * - AudioContext baru dibuat setelah interaksi pengguna pertama (aturan autoplay).
 * - setActive(false) menangguhkan semuanya (pause / tab tersembunyi).
 */
export class AudioManager {
  private ctx: AudioContext | null = null;
  private musicBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private timer = 0;
  private nextTime = 0;
  private step = 0;
  private bar = 0;
  private active = true;
  private musicWanted = false;
  private listeners = new Set<(p: AudioPrefs) => void>();
  prefs: AudioPrefs = loadAudioPrefs();

  get unlocked(): boolean {
    return this.ctx !== null;
  }

  onChange(fn: (p: AudioPrefs) => void): void {
    this.listeners.add(fn);
  }

  /** Dipanggil dari gestur pengguna pertama. Aman dipanggil berulang. */
  unlock(): void {
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      try {
        this.ctx = new Ctor();
      } catch {
        return;
      }
      this.musicBus = this.ctx.createGain();
      this.sfxBus = this.ctx.createGain();
      this.musicBus.connect(this.ctx.destination);
      this.sfxBus.connect(this.ctx.destination);
      this.applyPrefs(true);
      this.noise = this.makeNoise(this.ctx);
      // iOS: putar buffer kosong untuk membuka audio
      const b = this.ctx.createBuffer(1, 1, 22050);
      const s = this.ctx.createBufferSource();
      s.buffer = b;
      s.connect(this.ctx.destination);
      s.start(0);
    }
    if (this.active) void this.ctx.resume();
    if (this.musicWanted) this.startScheduler();
  }

  setMusic(on: boolean): void {
    this.prefs = { ...this.prefs, music: on };
    this.commit();
  }

  setSfx(on: boolean): void {
    this.prefs = { ...this.prefs, sfx: on };
    this.commit();
  }

  private commit(): void {
    saveAudioPrefs(this.prefs);
    this.applyPrefs(false);
    for (const fn of this.listeners) fn(this.prefs);
  }

  private applyPrefs(immediate: boolean): void {
    if (!this.ctx || !this.musicBus || !this.sfxBus) return;
    const t = this.ctx.currentTime;
    const set = (g: GainNode, v: number) => {
      g.gain.cancelScheduledValues(t);
      if (immediate) g.gain.setValueAtTime(v, t);
      else g.gain.setTargetAtTime(v, t, 0.03);
    };
    set(this.musicBus, this.prefs.music ? MUSIC_VOLUME : 0);
    set(this.sfxBus, this.prefs.sfx ? SFX_VOLUME : 0);
  }

  /** Musik latar: dimulai/dihentikan oleh aplikasi; tetap menghormati toggle Musik. */
  startMusic(): void {
    this.musicWanted = true;
    if (this.ctx) this.startScheduler();
  }

  stopMusic(): void {
    this.musicWanted = false;
    window.clearInterval(this.timer);
    this.timer = 0;
  }

  /** false = tangguhkan seluruh audio (pause, tab tersembunyi). */
  setActive(active: boolean): void {
    this.active = active;
    if (!this.ctx) return;
    if (active) {
      void this.ctx.resume();
      if (this.musicWanted) this.startScheduler();
    } else {
      window.clearInterval(this.timer);
      this.timer = 0;
      void this.ctx.suspend();
    }
  }

  private startScheduler(): void {
    if (!this.ctx || this.timer) return;
    this.nextTime = this.ctx.currentTime + 0.05;
    this.timer = window.setInterval(() => this.schedule(), 60);
  }

  private schedule(): void {
    const ctx = this.ctx;
    if (!ctx || !this.musicBus || ctx.state !== 'running') return;
    while (this.nextTime < ctx.currentTime + LOOKAHEAD) {
      this.playStep(this.nextTime);
      this.nextTime += STEP;
      this.step++;
      if (this.step % 8 === 0) this.bar = (this.bar + 1) % CHORDS.length;
    }
  }

  private playStep(t: number): void {
    const chord = CHORDS[this.bar] as number[];
    const i = this.step % 8;
    const note = (chord[ARP[i] as number] as number) * 2;
    this.tone({ freq: note, start: t, dur: STEP * 0.9, type: 'triangle', vol: 0.5, bus: this.musicBus, attack: 0.01 });
    if (i % 4 === 0) {
      this.tone({ freq: BASS[this.bar] as number, start: t, dur: STEP * 3.6, type: 'sine', vol: 0.9, bus: this.musicBus, attack: 0.02 });
    }
    if (i % 2 === 1) this.hat(t, 0.12);
  }

  private hat(t: number, vol: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.noise || !this.musicBus) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 7000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    src.connect(hp).connect(g).connect(this.musicBus);
    src.start(t);
    src.stop(t + 0.06);
  }

  private makeNoise(ctx: AudioContext): AudioBuffer {
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  private tone(o: {
    freq: number;
    start: number;
    dur: number;
    type: OscillatorType;
    vol: number;
    bus: GainNode | null;
    slideTo?: number;
    attack?: number;
    lowpass?: number;
  }): void {
    const ctx = this.ctx;
    if (!ctx || !o.bus) return;
    const osc = ctx.createOscillator();
    osc.type = o.type;
    osc.frequency.setValueAtTime(o.freq, o.start);
    if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(o.slideTo, o.start + o.dur);
    const g = ctx.createGain();
    const a = o.attack ?? 0.005;
    g.gain.setValueAtTime(0.0001, o.start);
    g.gain.linearRampToValueAtTime(o.vol, o.start + a);
    g.gain.exponentialRampToValueAtTime(0.0001, o.start + o.dur);
    let node: AudioNode = osc;
    if (o.lowpass) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = o.lowpass;
      osc.connect(f);
      node = f;
    }
    node.connect(g).connect(o.bus);
    osc.start(o.start);
    osc.stop(o.start + o.dur + 0.05);
  }

  /** Memainkan efek. `level` (1–5, tingkat combo) hanya dipakai untuk 'combo'. */
  play(name: Sfx, level = 1): void {
    const ctx = this.ctx;
    if (!ctx || !this.prefs.sfx || !this.active || ctx.state !== 'running') return;
    const t = ctx.currentTime + 0.005;
    const bus = this.sfxBus;
    switch (name) {
      case 'click':
        this.tone({ freq: 880, slideTo: 620, start: t, dur: 0.05, type: 'sine', vol: 0.25, bus });
        break;
      case 'correct':
        this.tone({ freq: 659.25, start: t, dur: 0.12, type: 'triangle', vol: 0.4, bus });
        this.tone({ freq: 987.77, start: t + 0.09, dur: 0.2, type: 'triangle', vol: 0.4, bus });
        break;
      case 'wrong':
        this.tone({ freq: 220, slideTo: 90, start: t, dur: 0.32, type: 'sawtooth', vol: 0.35, bus, lowpass: 900 });
        this.tone({ freq: 165, slideTo: 70, start: t + 0.05, dur: 0.3, type: 'square', vol: 0.15, bus, lowpass: 600 });
        break;
      case 'combo':
        // arpeggio naik (lihat services/combo-sfx.ts); dimulai sesudah bunyi 'correct' selesai
        for (const n of comboNotes(level)) {
          this.tone({ freq: n.freq, start: t + n.start, dur: n.dur, type: n.type, vol: n.vol, bus, lowpass: 6000 });
        }
        break;
      case 'gameover': {
        const seq = [392.0, 349.23, 311.13, 261.63];
        seq.forEach((f, i) => this.tone({ freq: f, start: t + i * 0.18, dur: 0.3, type: 'triangle', vol: 0.4, bus }));
        this.tone({ freq: 130.81, start: t + 0.72, dur: 0.7, type: 'sine', vol: 0.5, bus });
        break;
      }
      case 'tick':
        this.tone({ freq: 1500, start: t, dur: 0.03, type: 'square', vol: 0.12, bus, lowpass: 4000 });
        break;
      case 'thud':
        this.tone({ freq: 140, slideTo: 55, start: t, dur: 0.14, type: 'sine', vol: 0.5, bus });
        break;
    }
  }
}
