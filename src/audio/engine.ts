import type { NoteEvent, ChannelId } from '../arrange/buildScore';
import { getSoundfont, MIDI_CHANNEL, dbToCC7, loadSoundfont, type LoadProgress } from './soundfont';

export type { ChannelId };

export interface PlayOptions {
  tempo: number;
  beatsPerBar: number;
  fromBar: number;
  toBar: number;
  countIn: boolean;
  loop?: boolean;
}

export interface Position {
  bar: number;
  beat: number;
  playing: boolean;
  counting: boolean;
}

const dbToGain = (db: number) => (db <= -60 ? 0 : Math.pow(10, db / 20));

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private gains: Record<ChannelId, GainNode> | null = null;
  private noise: AudioBuffer | null = null;

  private events: NoteEvent[] = [];
  private opts: PlayOptions | null = null;
  private timer: number | null = null;
  private nextBar = 0;
  private nextBarTime = 0;
  private anchorTime = 0;
  private loopLen = 1;
  private barDur = 2;
  private countInBars = 0;
  private running = false;
  private volumes: Record<ChannelId, number> = { piano: -6, bass: -9, drums: -8 };
  private mutes: Record<ChannelId, boolean> = { piano: false, bass: false, drums: false };

  get playing() { return this.running; }

  /** Load the GM soundfont in the background; falls back silently to the built-in synth. */
  prepareSoundfont(onProgress?: (p: LoadProgress) => void) {
    const ctx = this.ensure();
    return loadSoundfont(ctx, onProgress);
  }

  ensure(): AudioContext {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return this.ctx;
    }
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctor();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(ctx.destination);
    this.gains = {
      piano: ctx.createGain(),
      bass: ctx.createGain(),
      drums: ctx.createGain(),
    };
    (Object.keys(this.gains) as ChannelId[]).forEach((ch) => {
      this.gains![ch].gain.value = dbToGain(this.volumes[ch]);
      this.gains![ch].connect(this.master!);
    });
    this.noise = this.makeNoise(ctx);
    return ctx;
  }

  setVolume(ch: ChannelId, db: number) {
    this.volumes[ch] = db;
    if (this.gains) this.gains[ch].gain.value = this.mutes[ch] ? 0 : dbToGain(db);
    const sf = getSoundfont();
    if (sf) sf.controllerChange(MIDI_CHANNEL[ch], 7, this.mutes[ch] ? 0 : dbToCC7(db));
  }

  setMuted(ch: ChannelId, muted: boolean) {
    this.mutes[ch] = muted;
    if (this.gains) this.gains[ch].gain.value = muted ? 0 : dbToGain(this.volumes[ch]);
    const sf = getSoundfont();
    if (sf) sf.controllerChange(MIDI_CHANNEL[ch], 7, muted ? 0 : dbToCC7(this.volumes[ch]));
  }

  setMaster(db: number) {
    if (this.master) this.master.gain.value = dbToGain(db);
  }

  play(events: NoteEvent[], opts: PlayOptions) {
    const ctx = this.ensure();
    this.stop();
    this.ensure();
    if (!this.ctx) return;

    this.events = events;
    this.opts = opts;
    this.barDur = (opts.beatsPerBar * 60) / opts.tempo;
    this.loopLen = opts.toBar - opts.fromBar + 1;
    this.countInBars = opts.countIn ? 1 : 0;
    this.nextBar = opts.fromBar;
    this.anchorTime = ctx.currentTime + 0.08 + this.countInBars * this.barDur;
    this.nextBarTime = this.anchorTime;
    this.running = true;

    if (opts.countIn) this.click(0, ctx.currentTime + 0.08, 1000, 0.05);
    this.tick();
    this.timer = window.setInterval(() => this.tick(), 25);
  }

  stop() {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
    this.running = false;
    this.events = [];
    if (this.ctx && this.gains) {
      // let tails ring but avoid new notes; nothing else needed
    }
  }

  position(): Position {
    if (!this.ctx || !this.opts || !this.running) {
      return { bar: this.opts?.fromBar ?? 0, beat: 0, playing: false, counting: false };
    }
    const now = this.ctx.currentTime;
    if (now < this.anchorTime) {
      const remaining = this.anchorTime - now;
      return {
        bar: this.opts.fromBar,
        beat: Math.max(0, 1 - remaining / this.barDur) * this.opts.beatsPerBar,
        playing: true,
        counting: true,
      };
    }
    const elapsedBars = Math.floor((now - this.anchorTime) / this.barDur);
    const bar = this.opts.fromBar + (elapsedBars % this.loopLen);
    const frac = ((now - this.anchorTime) % this.barDur) / this.barDur;
    return { bar, beat: frac * this.opts.beatsPerBar, playing: true, counting: false };
  }

  private tick() {
    const ctx = this.ctx;
    const opts = this.opts;
    if (!ctx || !opts || !this.running) return;
    const horizon = ctx.currentTime + 0.25;
    let guard = 0;
    while (this.nextBarTime < horizon && guard++ < 64) {
      this.scheduleBar(this.nextBar, this.nextBarTime);
      this.nextBarTime += this.barDur;
      this.nextBar += 1;
      if (this.nextBar > opts.toBar) {
        if (opts.loop === false) {
          const delay = Math.max(0, (this.nextBarTime - ctx.currentTime) * 1000 + 60);
          window.setTimeout(() => this.stop(), delay);
          return;
        }
        this.nextBar = opts.fromBar;
      }
    }
  }

  private scheduleBar(bar: number, time: number) {
    const { events, opts } = this;
    if (!opts) return;
    const bpb = opts.beatsPerBar;
    const secPerBeat = this.barDur / bpb;
    for (const e of events) {
      const eBar = Math.floor(e.beat / bpb);
      if (eBar !== bar) continue;
      const beatInBar = e.beat - eBar * bpb;
      const at = time + beatInBar * secPerBeat;
      this.note(e.channel, e.midi, at, Math.max(0.05, e.dur * secPerBeat), e.velocity);
    }
  }

  // ---------------- synthesis ----------------

  private makeNoise(ctx: AudioContext): AudioBuffer {
    const buf = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  private env(gain: GainNode, t: number, peak: number, attack: number, dur: number) {
    const g = gain.gain;
    g.cancelScheduledValues(t);
    g.setValueAtTime(0.0001, t);
    g.linearRampToValueAtTime(peak, t + attack);
    g.exponentialRampToValueAtTime(Math.max(0.0001, peak * 0.35), t + Math.max(attack + 0.05, dur * 0.35));
    g.exponentialRampToValueAtTime(0.0001, t + Math.max(dur, attack + 0.12));
  }

  private note(channel: ChannelId, midi: number, time: number, dur: number, velocity: number) {
    const ctx = this.ctx;
    const out = this.gains?.[channel];
    if (!ctx || !out) return;

    const sf = getSoundfont();
    if (sf) {
      const ch = MIDI_CHANNEL[channel];
      sf.noteOn(ch, midi, Math.max(1, Math.min(127, Math.round(velocity))), { time });
      sf.noteOff(ch, midi, { time: time + Math.max(0.03, dur) });
      return;
    }
    const vel = Math.max(0.05, velocity / 127);

    if (channel === 'drums') {
      this.drum(midi, time, vel);
      return;
    }

    const freq = 440 * Math.pow(2, (midi - 69) / 12);

    if (channel === 'piano') {
      const gain = ctx.createGain();
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(Math.min(9000, freq * 8 + 900), time);
      lp.Q.value = 0.4;

      const o1 = ctx.createOscillator();
      o1.type = 'triangle';
      o1.frequency.value = freq;

      const o2 = ctx.createOscillator();
      o2.type = 'sine';
      o2.frequency.value = freq * 2.002;

      const g2 = ctx.createGain();
      g2.gain.value = 0.28 + vel * 0.2;

      const o3 = ctx.createOscillator();
      o3.type = 'sine';
      o3.frequency.value = freq * 3.01;

      const g3 = ctx.createGain();
      g3.gain.value = 0.08;

      o1.connect(lp);
      o2.connect(g2).connect(lp);
      o3.connect(g3).connect(lp);
      lp.connect(gain).connect(out);

      this.env(gain, time, 0.22 * vel, 0.006, Math.max(0.25, dur));
      const stop = time + Math.max(0.3, dur) + 0.15;
      [o1, o2, o3].forEach((o) => { o.start(time); o.stop(stop); });
      return;
    }

    // bass
    const gain = ctx.createGain();
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(320 + freq * 3, time);
    lp.Q.value = 1.2;

    const o1 = ctx.createOscillator();
    o1.type = 'sine';
    o1.frequency.value = freq;

    const o2 = ctx.createOscillator();
    o2.type = 'triangle';
    o2.frequency.value = freq * 2;

    const g2 = ctx.createGain();
    g2.gain.value = 0.2;

    o1.connect(lp);
    o2.connect(g2).connect(lp);
    lp.connect(gain).connect(out);

    this.env(gain, time, 0.34 * vel, 0.008, Math.max(0.2, dur));
    const stop = time + Math.max(0.25, dur) + 0.1;
    [o1, o2].forEach((o) => { o.start(time); o.stop(stop); });
  }

  private click(midi: number, time: number, freq: number, dur: number) {
    const ctx = this.ctx;
    if (!ctx || !this.gains) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'square';
    o.frequency.value = freq;
    o.connect(g).connect(this.gains.drums);
    this.env(g, time, 0.12, 0.001, dur);
    o.start(time);
    o.stop(time + dur + 0.05);
    void midi;
  }

  private drum(midi: number, time: number, vel: number) {
    const ctx = this.ctx;
    if (!ctx || !this.gains) return;
    const out = this.gains.drums;

    const noise = (type: BiquadFilterType, freq: number, q: number, dur: number, peak: number, len = dur) => {
      if (!this.noise) return;
      const src = ctx.createBufferSource();
      src.buffer = this.noise;
      src.loop = true;
      const f = ctx.createBiquadFilter();
      f.type = type;
      f.frequency.value = freq;
      f.Q.value = q;
      const g = ctx.createGain();
      src.connect(f).connect(g).connect(out);
      this.env(g, time, peak * vel, 0.002, dur);
      src.start(time);
      src.stop(time + len + 0.05);
    };

    if (midi === 36) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(130, time);
      o.frequency.exponentialRampToValueAtTime(45, time + 0.16);
      o.connect(g).connect(out);
      this.env(g, time, 0.5 * vel, 0.002, 0.22);
      o.start(time);
      o.stop(time + 0.3);
      return;
    }
    if (midi === 38) {
      noise('bandpass', 1900, 0.9, 0.16, 0.34);
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = 190;
      o.connect(g).connect(out);
      this.env(g, time, 0.12 * vel, 0.002, 0.1);
      o.start(time);
      o.stop(time + 0.14);
      return;
    }
    if (midi === 37) {
      noise('bandpass', 1500, 2.5, 0.07, 0.28);
      return;
    }
    if (midi === 42) { noise('highpass', 7500, 1, 0.05, 0.16); return; }
    if (midi === 44) { noise('highpass', 6800, 1, 0.09, 0.14); return; }
    if (midi === 46) { noise('highpass', 7000, 1, 0.3, 0.16); return; }
    if (midi === 49) { noise('highpass', 5200, 0.8, 0.9, 0.24); return; }
    if (midi === 51) {
      noise('bandpass', 6200, 1.4, 0.42, 0.16);
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'square';
      o.frequency.value = 520;
      o.connect(g).connect(out);
      this.env(g, time, 0.045 * vel, 0.002, 0.3);
      o.start(time);
      o.stop(time + 0.35);
      return;
    }
    if (midi === 70) { noise('highpass', 9000, 0.8, 0.07, 0.1); return; }
    noise('bandpass', 3000, 1, 0.1, 0.15);
  }
}

export const engine = new AudioEngine();
