import { mod12 } from '../theory/pitch';
import { parseChord } from '../theory/chords';
import type { KeyInfo } from '../theory/keys';
import { suggestForChord } from '../theory/suggest';
import { nearestMidi } from '../theory/fretboard';
import { beatsPerBar, type Chart, type Style } from '../chart/model';
import { STYLES, effectiveSwing } from './styles';

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
 * Rootless voicing: 3rd, 7th (or 6th), the altered fifth for dim/aug chords, and
 * a colour tone drawn from the chosen scale. Roots are left to the bass.
 */
function rootlessVoicing(p: PlacedChord, center: number): number[] {
  const rel = p.relative;
  const has = (i: number) => rel.includes(i);
  const pc = (i: number) => mod12(p.rootPc + i);
  const pcs: number[] = [];

  if (has(4)) pcs.push(pc(4));
  else if (has(3)) pcs.push(pc(3));
  else if (has(5)) pcs.push(pc(5));

  if (has(10)) pcs.push(pc(10));
  else if (has(11)) pcs.push(pc(11));
  else if (has(9)) pcs.push(pc(9));

  if (!has(10) && !has(11) && !has(9)) {
    if (has(7)) pcs.push(pc(7));
    else if (has(6)) pcs.push(pc(6));
    else if (has(8)) pcs.push(pc(8));
  }

  if (p.qualityFamily === 'dim' && has(6)) pcs.push(pc(6));
  if (p.qualityFamily === 'aug' && has(8)) pcs.push(pc(8));

  const colour = pickColour(p);
  if (colour !== null) pcs.push(pc(colour));

  return placePcs([...new Set(pcs)].slice(0, 4), center);
}

/** Map pitch classes to MIDI notes near `center`, avoiding unisons and tight clusters. */
function placePcs(pcs: number[], center: number, lo = 50, hi = 80): number[] {
  const notes: number[] = [];
  for (const pc of pcs) {
    let best = -1;
    let bestScore = Infinity;
    for (let m = mod12(pc); m <= hi; m += 12) {
      if (m < lo || notes.includes(m)) continue;
      const nearest = notes.length ? Math.min(...notes.map((n) => Math.abs(n - m))) : 12;
      if (nearest < 3) continue;
      const score = Math.abs(m - center);
      if (score < bestScore) { bestScore = score; best = m; }
    }
    if (best > 0) notes.push(best);
  }
  return notes.sort((a, b) => a - b);
}

/** Ballad: rootless guide tones over a low root for a fuller left hand. */
function balladVoicing(p: PlacedChord, center: number): number[] {
  const root = nearestMidi(p.rootPc, 36, 48);
  const upper = rootlessVoicing(p, center).slice(0, 3);
  return [...new Set([root, ...upper])].sort((a, b) => a - b);
}

/** Shuffle: root, third and seventh/sixth — the classic blues-piano shell. */
function shellVoicing(p: PlacedChord): number[] {
  const root = nearestMidi(p.rootPc, 40, 52);
  const third = p.relative.includes(4) ? 4 : 3;
  const seventh = p.relative.includes(10) ? 10 : p.relative.includes(11) ? 11 : 9;
  return [...new Set([root, root + third, root + seventh])].sort((a, b) => a - b);
}

const average = (notes: number[]) => notes.reduce((a, b) => a + b, 0) / notes.length;

function voicingFor(style: Style, p: PlacedChord, prev: number[] | null): number[] {
  const center = prev && prev.length ? average(prev) : 64;
  switch (style) {
    case 'rock':
      return rockVoicing(p);
    case 'shuffle':
      return shellVoicing(p);
    case 'ballad':
      return balladVoicing(p, center);
    case 'jazz':
    case 'funk':
    case 'bossa':
    default:
      return rootlessVoicing(p, center);
  }
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

interface CompHit {
  at: number;
  dur: number;
  vel: number;
}

const JAZZ_COMP: CompHit[][] = [
  [{ at: 0, dur: 0.4, vel: 84 }, { at: 1.5, dur: 0.25, vel: 70 }, { at: 3, dur: 0.3, vel: 76 }],
  [{ at: 0.5, dur: 0.25, vel: 72 }, { at: 1.5, dur: 0.3, vel: 80 }, { at: 3.5, dur: 0.2, vel: 66 }],
  [{ at: 0, dur: 0.5, vel: 86 }, { at: 2, dur: 0.3, vel: 72 }, { at: 3.5, dur: 0.25, vel: 70 }],
  [{ at: 0.5, dur: 0.25, vel: 74 }, { at: 2.5, dur: 0.3, vel: 82 }, { at: 3.5, dur: 0.2, vel: 68 }],
];

const BALLAD_COMP: CompHit[][] = [
  [{ at: 0, dur: 2.2, vel: 68 }, { at: 2.5, dur: 1.2, vel: 58 }],
  [{ at: 0, dur: 1.4, vel: 64 }, { at: 2, dur: 0.8, vel: 56 }, { at: 3.5, dur: 0.4, vel: 52 }],
];

const SHUFFLE_COMP: CompHit[][] = [
  [{ at: 0, dur: 1.2, vel: 84 }, { at: 2, dur: 1.0, vel: 76 }, { at: 3.5, dur: 0.25, vel: 68 }],
  [{ at: 0, dur: 1.0, vel: 82 }, { at: 1.5, dur: 0.4, vel: 66 }, { at: 2.5, dur: 0.8, vel: 76 }],
];

const ROCK_COMP: CompHit[][] = [
  Array.from({ length: 8 }, (_, i) => ({ at: i * 0.5, dur: 0.36, vel: i % 2 === 0 ? 94 : 74 })),
  [
    { at: 0, dur: 0.35, vel: 92 },
    { at: 0.5, dur: 0.3, vel: 76 },
    { at: 1.5, dur: 0.3, vel: 72 },
    { at: 2, dur: 0.35, vel: 88 },
    { at: 2.5, dur: 0.3, vel: 74 },
    { at: 3.5, dur: 0.3, vel: 70 },
  ],
];

const FUNK_COMP: CompHit[][] = [
  [{ at: 0.5, dur: 0.12, vel: 88 }, { at: 1.5, dur: 0.12, vel: 74 }, { at: 2.25, dur: 0.12, vel: 82 }, { at: 3.25, dur: 0.12, vel: 72 }],
  [{ at: 0.75, dur: 0.12, vel: 80 }, { at: 1.75, dur: 0.12, vel: 86 }, { at: 2.5, dur: 0.12, vel: 76 }, { at: 3.5, dur: 0.12, vel: 70 }],
  [{ at: 0, dur: 0.12, vel: 90 }, { at: 0.75, dur: 0.12, vel: 74 }, { at: 1.25, dur: 0.12, vel: 68 }, { at: 2.5, dur: 0.12, vel: 84 }, { at: 3.75, dur: 0.12, vel: 72 }],
  [{ at: 0.5, dur: 0.12, vel: 82 }, { at: 1.25, dur: 0.12, vel: 72 }, { at: 2.75, dur: 0.12, vel: 86 }, { at: 3.5, dur: 0.12, vel: 74 }],
];

const BOSSA_COMP: CompHit[][] = [
  [{ at: 0, dur: 0.8, vel: 78 }, { at: 1.5, dur: 0.5, vel: 68 }, { at: 3, dur: 0.5, vel: 74 }],
  [{ at: 0.5, dur: 0.5, vel: 70 }, { at: 2, dur: 0.6, vel: 76 }, { at: 3.5, dur: 0.5, vel: 66 }],
];

/** Piano comping rhythm for a style, varied over a short bar cycle. */
function compHits(style: Style, bar: number): CompHit[] {
  const cycle = (patterns: CompHit[][]) => patterns[bar % patterns.length];
  switch (style) {
    case 'jazz':
      return cycle(JAZZ_COMP);
    case 'ballad':
      return cycle(BALLAD_COMP);
    case 'shuffle':
      return cycle(SHUFFLE_COMP);
    case 'rock':
      return cycle(ROCK_COMP);
    case 'funk':
      return cycle(FUNK_COMP);
    case 'bossa':
    default:
      return cycle(BOSSA_COMP);
  }
}

export function buildScore(chart: Chart, key: KeyInfo, opts: BuildOptions): NoteEvent[] {
  const placed = placeChords(chart, key);
  const bpb = beatsPerBar(chart);
  const pianoShift = (chart.pianoOctave ?? 0) * 12;
  const events: NoteEvent[] = [];
  const def = STYLES[opts.style];
  const feel = def?.feel ?? 'straight';
  const swing = effectiveSwing(opts.style, opts.swing);
  const swingOffset = swing * (1 / 6); // 0 → straight, 1 → triplet feel

  const push = (p: PlacedChord, offset: number, dur: number, midi: number, velocity: number, channel: ChannelId) => {
    events.push({ beat: p.absBeat + offset, dur, midi, velocity, channel });
  };

  const rhythm = (offset: number) => {
    if (feel !== 'swung8') return offset;
    // swing the off-beat eighths
    if (Math.abs(offset % 1 - 0.5) < 1e-6) return Math.floor(offset) + 0.5 + swingOffset;
    return offset;
  };

  let prevBass: number | null = null;
  let prevVoicing: number[] | null = null;

  placed.forEach((p) => {
    // ---------- piano ----------
    const voicing = voicingFor(opts.style, p, prevVoicing);
    prevVoicing = voicing;
    compHits(opts.style, p.bar).forEach((hit) => {
      if (hit.at >= bpb) return;
      const at = rhythm(hit.at);
      voicing.forEach((m) => push(p, at, hit.dur, m + pianoShift, hit.vel, 'piano'));
    });

    // ---------- bass ----------
    const root = bassNote(prevBass, p.rootPc);
    const approach = p.nextRootPc !== null ? bassNote(root, mod12(p.nextRootPc - 1)) : null;

    switch (opts.style) {
      case 'jazz':
        push(p, 0, 1.7, root, 96, 'bass');
        push(p, 2, 1.7, root, 88, 'bass');
        if (approach !== null) push(p, rhythm(3.5), 0.4, approach, 82, 'bass');
        break;
      case 'ballad':
        push(p, 0, 1.8, root, 86, 'bass');
        push(p, 2, 1.8, root, 78, 'bass');
        if (approach !== null) push(p, rhythm(3.5), 0.4, approach, 72, 'bass');
        break;
      case 'shuffle':
        // 1 · 5 · 6 · ♭7 shuffle line, one note per beat.
        [0, 7, 9, 10].forEach((interval, beat) => {
          if (beat >= bpb) return;
          push(p, beat, 0.85, root + interval, beat === 0 ? 96 : 84, 'bass');
        });
        break;
      case 'rock':
        for (let i = 0; i < bpb * 2; i++) {
          push(p, i * 0.5, 0.38, root, i % 2 === 0 ? 100 : 82, 'bass');
        }
        break;
      case 'funk': {
        const funkBass: Array<[number, number, number, number]> = [
          [0, 0, 0.22, 104],
          [0.75, 0, 0.18, 84],
          [1.5, 0, 0.18, 96],
          [2.25, 12, 0.18, 88],
          [3, 0, 0.2, 100],
          [3.5, 12, 0.18, 82],
        ];
        funkBass.forEach(([at, octave, dur, vel]) => {
          if (at >= bpb) return;
          push(p, at, dur, root + octave, vel, 'bass');
        });
        break;
      }
      case 'bossa':
      default:
        push(p, 0, 0.9, root, 94, 'bass');
        push(p, 1.5, 0.7, root, 80, 'bass');
        push(p, 3, 0.7, root, 86, 'bass');
        if (approach !== null) push(p, 3.5, 0.4, approach, 74, 'bass');
        break;
    }
    prevBass = root;

    // ---------- drums ----------
    const bar = p.bar;
    switch (opts.style) {
      case 'jazz':
        // ride: 1 · 2 · 2& · 3 · 4 · 4&  — the classic "ding, ding-a-ding"
        [0, 1, 2, 3].forEach((b) => {
          push(p, b, 0.2, 51, b === 1 || b === 3 ? 100 : 84, 'drums');
          push(p, b, 0.2, 36, 22, 'drums'); // feathered kick
        });
        [1.5, 3.5].forEach((b) => push(p, rhythm(b), 0.2, 51, 72, 'drums'));
        push(p, 1, 0.2, 44, 64, 'drums'); // hi-hat foot on 2 and 4
        push(p, 3, 0.2, 44, 64, 'drums');
        break;

      case 'ballad':
        // Brushes: soft ride on every beat, ghosted snare on 2 and 4, feathered kick.
        for (let b = 0; b < bpb; b++) {
          push(p, b, 0.2, 51, b === 0 || b === 2 ? 46 : 38, 'drums');
          push(p, b, 0.2, 36, 18, 'drums');
        }
        push(p, 1, 0.2, 38, 30, 'drums');
        if (bpb > 3) push(p, 3, 0.2, 38, 30, 'drums');
        break;

      case 'shuffle':
        // 12/8 ride: each beat plus its triplet "a".
        for (let b = 0; b < bpb; b++) {
          push(p, b, 0.2, 51, b === 0 || b === 2 ? 100 : 88, 'drums');
          push(p, rhythm(b + 0.5), 0.2, 51, 70, 'drums');
          push(p, b, 0.2, 36, 26, 'drums'); // feathered kick
        }
        push(p, 1, 0.2, 38, 98, 'drums');
        push(p, 1, 0.2, 44, 66, 'drums');
        if (bpb > 3) {
          push(p, 3, 0.2, 38, 98, 'drums');
          push(p, 3, 0.2, 44, 66, 'drums');
        }
        break;

      case 'rock':
        push(p, 0, 0.2, 36, 112, 'drums');
        push(p, 2, 0.2, 36, 106, 'drums');
        push(p, 2.5, 0.2, 36, 78, 'drums');
        push(p, 1, 0.2, 38, 112, 'drums');
        push(p, 3, 0.2, 38, 110, 'drums');
        for (let i = 0; i < bpb * 2; i++) push(p, i * 0.5, 0.1, 42, i % 2 === 0 ? 74 : 56, 'drums');
        if (bar === 0) push(p, 0, 0.2, 49, 96, 'drums');
        break;

      case 'funk':
        // 16th hats with accented downbeats, syncopated kick, backbeat snare.
        for (let i = 0; i < bpb * 4; i++) {
          const at = i * 0.25;
          const vel = i % 4 === 0 ? 78 : i % 2 === 0 ? 54 : 36;
          push(p, at, 0.07, 42, vel, 'drums');
        }
        [[0, 112], [1.75, 92], [2.5, 100], [3.75, 86]].forEach(([at, vel]) => {
          if (at < bpb) push(p, at, 0.2, 36, vel, 'drums');
        });
        [1, 3].forEach((b) => {
          if (b < bpb) push(p, b, 0.2, 38, 110, 'drums');
        });
        push(p, 2.75, 0.12, 38, 34, 'drums'); // ghost note
        if (bar === 0) push(p, 0, 0.2, 49, 96, 'drums');
        break;

      case 'bossa':
      default:
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
        break;
    }
  });

  events.sort((a, b) => a.beat - b.beat);
  return events;
}
