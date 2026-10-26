import { parseChord, type ParsedChord } from '../theory/chords';
import type { Mode } from '../theory/keys';

export type Style = 'jazz' | 'rock' | 'bossa';

export interface ChordSlot {
  id: string;
  beat: number;      // 0-based within the bar
  input: string;     // what the user typed
}

export interface Bar {
  id: string;
  slots: ChordSlot[]; // sorted by beat; empty = no chord
}

export interface Chart {
  id: string;
  name: string;
  timeSignature: '4/4' | '3/4';
  bars: Bar[];
  visibleBars: number;      // 4–32, view length (hidden bars keep chords)
  keyManual: { tonic: number; mode: Mode } | null;
  tempo: number;
  style: Style;
  swing: number;            // 0–1
  countIn: boolean;
  metronome: boolean;
  pianoOctave: number;      // −2…+2, transposes the piano voicing
  pins: Record<string, string>; // slotId -> scaleId
}

let seq = 0;
export const uid = (prefix = 'id') => `${prefix}${Date.now().toString(36)}${(seq++).toString(36)}`;

export const beatsPerBar = (chart: Chart) => (chart.timeSignature === '3/4' ? 3 : 4);

export function makeBar(beats: number): Bar {
  return { id: uid('b'), slots: [] };
}

export function makeEmptyChart(): Chart {
  const bars = Array.from({ length: 4 }, () => makeBar(4));
  return {
    id: uid('c'),
    name: '',
    timeSignature: '4/4',
    bars,
    visibleBars: 4,
    keyManual: null,
    tempo: 120,
    style: 'jazz',
    swing: 0.62,
    countIn: true,
    metronome: false,
    pianoOctave: 0,
    pins: {},
  };
}

const BB_16: Array<[string, number]> = [
  ['Cm7', 0], ['Cm7', 0], ['Fm7', 0], ['Fm7', 0],
  ['Dm7b5', 0], ['G7', 0], ['Cm7', 0], ['Cm7', 0],
  ['Ebm7', 0], ['Ab7', 0], ['Dbmaj7', 0], ['Dbmaj7', 0],
  ['Dm7b5', 0], ['G7', 0], ['Cm7', 0], ['Cm7', 0],
];

export function blueBossa(): Chart {
  const bars: Bar[] = [];
  for (let chorus = 0; chorus < 2; chorus++) {
    for (const [input, beat] of BB_16) {
      bars.push({ id: uid('b'), slots: [{ id: uid('s'), beat, input }] });
    }
  }
  return {
    id: uid('c'),
    name: 'Blue Bossa',
    timeSignature: '4/4',
    bars,
    visibleBars: 32,
    keyManual: null,
    tempo: 140,
    style: 'bossa',
    swing: 0.5,
    countIn: true,
    metronome: false,
    pianoOctave: 0,
    pins: {},
  };
}

export function setVisibleBars(chart: Chart, n: number): Chart {
  const count = Math.max(4, Math.min(32, n));
  const bars = [...chart.bars];
  while (bars.length < count) bars.push(makeBar(4));
  return { ...chart, bars, visibleBars: count };
}

export function setBarCountRaw(chart: Chart, n: number): Chart {
  const count = Math.max(4, Math.min(32, n));
  const bars = chart.bars.slice(0, count);
  while (bars.length < count) bars.push(makeBar(4));
  return { ...chart, bars, visibleBars: Math.min(chart.visibleBars, count) };
}

export function setChord(chart: Chart, barIndex: number, beat: number, input: string): Chart {
  const bars = chart.bars.map((bar, i) => {
    if (i !== barIndex) return bar;
    const slots = bar.slots.filter((s) => s.beat !== beat);
    if (input.trim()) {
      const existing = bar.slots.find((s) => s.beat === beat);
      slots.push({ id: existing?.id ?? uid('s'), beat, input: input.trim() });
      slots.sort((a, b) => a.beat - b.beat);
    }
    return { ...bar, slots };
  });
  return { ...chart, bars };
}

export function setBeatCount(chart: Chart, beats: number): Chart {
  return {
    ...chart,
    bars: chart.bars.map((bar) => ({
      ...bar,
      slots: bar.slots.filter((s) => s.beat < beats),
    })),
  };
}

export interface SlotRef {
  slotId: string;
  barIndex: number;
  beat: number;
  input: string;
  chord: ParsedChord | null;
}

/** Flatten the visible bars into an ordered slot list for the theory engine. */
export function slotRefs(chart: Chart): SlotRef[] {
  const out: SlotRef[] = [];
  chart.bars.slice(0, chart.visibleBars).forEach((bar, barIndex) => {
    bar.slots.forEach((slot) => {
      const parsed = parseChord(slot.input);
      out.push({
        slotId: slot.id,
        barIndex,
        beat: slot.beat,
        input: slot.input,
        chord: parsed.ok ? parsed : null,
      });
    });
  });
  return out;
}

export function parseSlots(chart: Chart): ParsedChord[] {
  return slotRefs(chart).map((s) => s.chord).filter((c): c is ParsedChord => !!c);
}

/** Friendly display: turns `Bb` into `B♭`, `F#` into `F♯`. */
export function prettyChord(input: string): string {
  return input
    .replace(/([A-G])b/g, '$1♭')
    .replace(/([A-G])#/g, '$1♯')
    .replace(/m7b5/g, 'm7♭5')
    .replace(/maj7/g, 'maj7');
}

export function autoName(chart: Chart): string {
  const chords = slotRefs(chart).slice(0, 3).map((s) => prettyChord(s.input));
  if (!chords.length) return 'Untitled chart';
  return chords.join(' · ') + (slotRefs(chart).length > 3 ? '…' : '');
}
