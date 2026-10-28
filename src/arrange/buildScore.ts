import { mod12 } from '../theory/pitch';
import { parseChord } from '../theory/chords';
import type { KeyInfo } from '../theory/keys';
import { suggestForChord } from '../theory/suggest';
import { nearestMidi } from '../theory/fretboard';
import { beatsPerBar, type Chart, type Style } from '../chart/model';

export type ChannelId = 'piano' | 'bass' | 'drums';

export interface NoteEvent {
  beat: number;      // absolute beats from the start of the chart
  dur: number;       // in beats
  midi: number;
  velocity: number;  // 1–127
  channel: ChannelId;
}

interface PlacedChord {
  bar: number;
  beat: number;      // beat inside the bar
  absBeat: number;
  rootPc: number;
  intervals: number[];      // absolute pitch classes of the chord
  relative: number[];       // intervals from the root (0, 3, 7, 10 …)
  qualityFamily: string;
  nextRootPc: number | null;
  scalePcs: number[];
}

function placeChords(chart: Chart, key: KeyInfo): PlacedChord[] {
  const bpb = beatsPerBar(chart);
  const placed: PlacedChord[] = [];
  const bars = chart.bars.slice(0, chart.visibleBars);

  let last: PlacedChord | null = null;

  bars.forEach((bar, barIndex) => {
    if (bar.slots.length === 0 && last) {
      placed.push({
        ...last,
        bar: barIndex,
        beat: 0,
        absBeat: barIndex * bpb,
        nextRootPc: null,
      });
      return;
    }

    bar.slots.forEach((slot) => {
      const parsed = parseChord(slot.input);
      if (!parsed.ok) return;
      const candidates = suggestForChord(parsed, key);
      const pinned = chart.pins[slot.id];
      const chosen = (pinned && candidates.find((c) => c.scaleId === pinned)) || candidates[0];
      last = {
        bar: barIndex,
        beat: slot.beat,
        absBeat: barIndex * bpb + slot.beat,
        rootPc: parsed.rootPc,
        intervals: parsed.intervals,
        relative: parsed.quality.intervals,
        qualityFamily: parsed.quality.family,
        nextRootPc: null,
        scalePcs: chosen ? chosen.pcs : parsed.intervals,
      };
      placed.push(last);
    });
  });

  placed.sort((a, b) => a.absBeat - b.absBeat);
  placed.forEach((p, i) => {
    p.nextRootPc = placed[i + 1] ? placed[i + 1].rootPc : placed[0]?.rootPc ?? null;
  });
  return placed;
}

/**
 * Pick a colour tone that actually belongs to the chosen chord scale:
 * prefer the 9th, then ♭9, 11, ♯11, ♭6 — whichever is in the scale and not already a chord tone.
 */
function pickColour(p: PlacedChord): number | null {
  const chordSet = new Set(p.intervals);
  const scaleSet = new Set(p.scalePcs);
  for (const rel of [2, 1, 5, 6, 9, 3]) {
    const pc = mod12(p.rootPc + rel);
    if (scaleSet.has(pc) && !chordSet.has(pc)) return rel;
  }
  return null;
}

/**
 * Root-position voicing that stands on its own: root, third, fifth, seventh and a
 * scale-aware colour tone, all inside about an octave above the root.
 */
function voiceChord(p: PlacedChord, withColour: boolean): number[] {
  const root = nearestMidi(p.rootPc, 45, 57);
  const notes: number[] = [root];

  const rels = p.relative.slice(1);
  for (const rel of rels) {
    const pc = mod12(p.rootPc + rel);
    let m = nearestMidi(pc, root + 2, root + 26);
    while (notes.includes(m)) m += 12;
    if (m <= root + 26) notes.push(m);
    if (notes.length >= 4) break;
  }

  if (withColour) {
    const colour = pickColour(p);
    if (colour !== null) {
      const pc = mod12(p.rootPc + colour);
      let m = nearestMidi(pc, root + 2, root + 26);
      while (notes.includes(m)) m += 12;
      if (m <= root + 26) notes.push(m);
    }
  }

  return notes.sort((a, b) => a - b);
}

function rockVoicing(p: PlacedChord): number[] {
  const root = nearestMidi(p.rootPc, 40, 52);
  return [root, root + 7, root + 12];
}

function bassNote(prevBass: number | null, pc: number): number {
  return nearestMidi(pc, 28, 43, prevBass ?? undefined);
}

export interface BuildOptions {
  style: Style;
  swing: number;
}

export function buildScore(chart: Chart, key: KeyInfo, opts: BuildOptions): NoteEvent[] {
  const placed = placeChords(chart, key);
  const bpb = beatsPerBar(chart);
  const pianoShift = (chart.pianoOctave ?? 0) * 12;
  const events: NoteEvent[] = [];
  const swing = Math.max(0, Math.min(1, opts.swing));
  const swingOffset = swing * (1 / 6); // 0 → straight, 1 → triplet feel

  const push = (p: PlacedChord, offset: number, dur: number, midi: number, velocity: number, channel: ChannelId) => {
    events.push({ beat: p.absBeat + offset, dur, midi, velocity, channel });
  };

  const rhythm = (offset: number) => {
    if (opts.style !== 'jazz') return offset;
    // swing the off-beat eighths
    if (Math.abs(offset % 1 - 0.5) < 1e-6) return Math.floor(offset) + 0.5 + swingOffset;
    return offset;
  };

  let prevBass: number | null = null;

  placed.forEach((p) => {
    const isJazz = opts.style === 'jazz';
    const isRock = opts.style === 'rock';

    // ---------- piano ----------
    const voicing = isRock ? rockVoicing(p) : voiceChord(p, true);
    const compHits = isJazz
      ? [{ at: 0, dur: 0.42, vel: 84 }, { at: 1, dur: 0.42, vel: 72 }, { at: 2, dur: 0.42, vel: 80 }, { at: 3, dur: 0.42, vel: 72 }]
      : isRock
        ? Array.from({ length: 8 }, (_, i) => ({ at: i * 0.5, dur: 0.36, vel: i % 2 === 0 ? 94 : 74 }))
        : [
            { at: 0, dur: 0.5, vel: 82 },
            { at: 1.5, dur: 0.5, vel: 70 },
            { at: 2.5, dur: 0.5, vel: 78 },
            { at: 3.5, dur: 0.5, vel: 66 },
          ];

    compHits.forEach((hit) => {
      if (hit.at >= bpb) return;
      const at = rhythm(hit.at);
      voicing.forEach((m) => push(p, at, hit.dur, m + pianoShift, hit.vel, 'piano'));
    });

    // ---------- bass ----------
    if (isJazz) {
      const root = bassNote(prevBass, p.rootPc);
      push(p, 0, 1.7, root, 96, 'bass');
      push(p, 2, 1.7, root, 88, 'bass');
      if (p.nextRootPc !== null) {
        const approach = bassNote(root, mod12(p.nextRootPc - 1));
        push(p, rhythm(3.5), 0.4, approach, 82, 'bass');
        prevBass = root;
      }
    } else if (isRock) {
      const root = bassNote(prevBass, p.rootPc);
      for (let i = 0; i < bpb * 2; i++) {
        push(p, i * 0.5, 0.38, root, i % 2 === 0 ? 100 : 82, 'bass');
      }
      prevBass = root;
    } else {
      const root = bassNote(prevBass, p.rootPc);
      push(p, 0, 0.9, root, 94, 'bass');
      push(p, 1.5, 0.7, root, 80, 'bass');
      push(p, 3, 0.7, root, 86, 'bass');
      if (p.nextRootPc !== null) {
        const approach = bassNote(root, mod12(p.nextRootPc - 1));
        push(p, 3.5, 0.4, approach, 74, 'bass');
      }
      prevBass = root;
    }

    // ---------- drums ----------
    const bar = p.bar;
    if (isJazz) {
      // ride: 1 · 2 · 2& · 3 · 4 · 4&  — the classic "ding, ding-a-ding"
      [0, 1, 2, 3].forEach((b) => {
        push(p, b, 0.2, 51, b === 1 || b === 3 ? 100 : 84, 'drums');
        push(p, b, 0.2, 36, 22, 'drums'); // feathered kick
      });
      [1.5, 3.5].forEach((b) => push(p, rhythm(b), 0.2, 51, 72, 'drums'));
      push(p, 1, 0.2, 44, 64, 'drums'); // hi-hat foot on 2 and 4
      push(p, 3, 0.2, 44, 64, 'drums');
    } else if (isRock) {
      push(p, 0, 0.2, 36, 112, 'drums');
      push(p, 2, 0.2, 36, 106, 'drums');
      push(p, 2.5, 0.2, 36, 78, 'drums');
      push(p, 1, 0.2, 38, 112, 'drums');
      push(p, 3, 0.2, 38, 110, 'drums');
      for (let i = 0; i < bpb * 2; i++) push(p, i * 0.5, 0.1, 42, i % 2 === 0 ? 74 : 56, 'drums');
      if (bar === 0) push(p, 0, 0.2, 49, 96, 'drums');
    } else {
      // Bossa nova, two-bar cycle.
      // Shaker: continuous 16ths, accented on the beat.
      for (let i = 0; i < bpb * 4; i++) {
        const at = i * 0.25;
        const vel = i % 4 === 0 ? 58 : i % 2 === 0 ? 44 : 32;
        push(p, at, 0.07, 70, vel, 'drums');
      }
      // Cross-stick playing a 3-2 son clave:
      //   bar 1: 1 · 2& · 4      bar 2: 2 · 3
      const clave = bar % 2 === 0 ? [0, 1.5, 3] : [1, 2];
      clave.forEach((at) => push(p, at, 0.14, 37, at === 0 ? 94 : 84, 'drums'));
      // Surdo-style kick on 1 and 3, light.
      push(p, 0, 0.22, 36, 74, 'drums');
      push(p, 2, 0.22, 36, 60, 'drums');
    }
  });

  events.sort((a, b) => a.beat - b.beat);
  return events;
}
