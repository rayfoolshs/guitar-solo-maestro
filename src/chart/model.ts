import { parseChord, transposeChordSymbol, type ParsedChord } from '../theory/chords';
import { mod12, preferFlatsFor } from '../theory/pitch';
import { detectKey, makeKey, type Mode } from '../theory/keys';

export type Style = 'jazz' | 'ballad' | 'shuffle' | 'rock' | 'funk' | 'bossa';

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
  visibleBars: number;      // 4–64, view length (hidden bars keep chords)
  keyManual: { tonic: number; mode: Mode } | null;
  tempo: number;
  style: Style;
  swing: number;            // 0–1
  countIn: boolean;
  metronome: boolean;
  pianoOctave: number;      // −2…+2, transposes the piano voicing
  pins: Record<string, string>; // slotId -> scaleId
  transpose?: number;           // cumulative semitones applied to chord symbols
  composer?: string;
  year?: number;
  form?: string;
  tags?: string[];
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

const AL_A: string[] = [
  'Cm7', 'F7', 'Bbmaj7', 'Ebmaj7', 'Am7b5', 'D7', 'Gm7', 'Gm7',
];
const AL_B: string[] = [
  'Am7b5', 'D7', 'Gm7', 'Gm7', 'Cm7', 'F7', 'Bbmaj7', 'Bbmaj7',
];

export function autumnLeaves(): Chart {
  const bars: Bar[] = [];
  for (const input of [...AL_A, ...AL_A, ...AL_B, ...AL_A]) {
    bars.push({ id: uid('b'), slots: [{ id: uid('s'), beat: 0, input }] });
  }
  return {
    id: uid('c'),
    name: 'Autumn Leaves',
    timeSignature: '4/4',
    bars,
    visibleBars: 32,
    keyManual: null,
    tempo: 132,
    style: 'jazz',
    swing: 0.62,
    countIn: true,
    metronome: false,
    pianoOctave: 0,
    pins: {},
  };
}

type BarInput = string | string[];

/** Build bars from one chord (string) or several chords (array spread evenly across the bar). */
function barsFromInputs(rows: BarInput[]): Bar[] {
  return rows.map((row) => {
    const inputs = Array.isArray(row) ? row : [row];
    const step = 4 / inputs.length;
    return {
      id: uid('b'),
      slots: inputs.map((input, i) => ({
        id: uid('s'),
        beat: i === 0 ? 0 : Math.round(i * step * 100) / 100,
        input,
      })),
    };
  });
}

interface PresetOptions {
  tempo: number;
  style: Style;
  swing: number;
}

function presetChart(name: string, rows: BarInput[], opts: PresetOptions): Chart {
  const bars = barsFromInputs(rows);
  return {
    id: uid('c'),
    name,
    timeSignature: '4/4',
    bars,
    visibleBars: Math.min(64, bars.length),
    keyManual: null,
    tempo: opts.tempo,
    style: opts.style,
    swing: opts.swing,
    countIn: true,
    metronome: false,
    pianoOctave: 0,
    pins: {},
  };
}

/** Herbie Hancock — 16 bars, four-bar blocks of Fm7 / Db7 / Dm7 / Fm7. */
export function cantaloupeIsland(): Chart {
  return presetChart(
    'Cantaloupe Island',
    [
      'Fm7', 'Fm7', 'Fm7', 'Fm7',
      'Db7', 'Db7', 'Db7', 'Db7',
      'Dm7', 'Dm7', 'Dm7', 'Dm7',
      'Fm7', 'Fm7', 'Fm7', 'Fm7',
    ],
    { tempo: 100, style: 'funk', swing: 0 },
  );
}

/** Coltrane — 12-bar minor blues in C. */
export function mrPC(): Chart {
  return presetChart(
    'Mr. P.C.',
    ['Cm7', 'Fm7', 'Cm7', 'Cm7', 'Fm7', 'Fm7', 'Cm7', 'Cm7', 'Ab7', 'G7', 'Cm7', 'G7'],
    { tempo: 152, style: 'shuffle', swing: 1 },
  );
}

/** Erroll Garner — 32-bar AABA ballad in E♭. */
export function misty(): Chart {
  const aSection: BarInput[] = [
    'Ebmaj7',
    ['Bbm7', 'Eb7'],
    'Abmaj7',
    ['Abm7', 'Db7'],
    ['Ebmaj7', 'Cm7'],
    ['Fm7', 'Bb7'],
    ['Gm7', 'C7'],
    ['Fm7', 'Bb7'],
  ];
  const bridge: BarInput[] = [
    'Bbm7', 'Eb7', 'Abmaj7', 'Abmaj7',
    'Am7', 'D7', 'Gm7', 'C7',
  ];
  const aFinal: BarInput[] = [
    'Ebmaj7',
    ['Bbm7', 'Eb7'],
    'Abmaj7',
    ['Abm7', 'Db7'],
    ['Ebmaj7', 'Cm7'],
    ['Fm7', 'Bb7'],
    'Ebmaj7',
    'Ebmaj7',
  ];
  return presetChart('Misty', [...aSection, ...aSection, ...bridge, ...aFinal], {
    tempo: 66,
    style: 'ballad',
    swing: 0.62,
  });
}

/** Wrap a cumulative transposition to the shortest interval (−5…+6). */
const wrapTranspose = (semitones: number): number => {
  const wrapped = ((semitones % 12) + 12) % 12;
  return wrapped > 6 ? wrapped - 12 : wrapped;
};

/**
 * Rewrite every chord symbol in the chart by `semitones`, update a manual key,
 * and track the cumulative offset for display/reset. Spelling follows the
 * destination key, so transposing repeatedly stays readable.
 */
export function transposeChart(chart: Chart, semitones: number): Chart {
  if (!semitones) return chart;
  const currentKey = chart.keyManual
    ? makeKey(chart.keyManual.tonic, chart.keyManual.mode)
    : detectKey(parseSlots(chart)).key;
  const flats = preferFlatsFor(mod12(currentKey.tonic + semitones), currentKey.mode);
  const keyManual = chart.keyManual
    ? { ...chart.keyManual, tonic: mod12(chart.keyManual.tonic + semitones) }
    : null;
  return {
    ...chart,
    bars: transposeSlots(chart.bars, semitones, flats),
    keyManual,
    transpose: wrapTranspose((chart.transpose ?? 0) + semitones),
  };
}

/** Rewrite chord symbols in place, spelling for the destination key. */
function transposeSlots(bars: Bar[], semitones: number, flats: boolean): Bar[] {
  return bars.map((bar) => ({
    ...bar,
    slots: bar.slots.map((slot) => ({
      ...slot,
      input: transposeChordSymbol(slot.input, semitones, flats),
    })),
  }));
}

/**
 * Move the whole chart into a chosen key: transpose by the shortest interval
 * from the key currently in force, spell for the destination key, and make that
 * key manual. Choosing the key already in force just pins it.
 */
export function transposeToKey(chart: Chart, tonic: number, mode: Mode): Chart {
  const currentKey = chart.keyManual
    ? makeKey(chart.keyManual.tonic, chart.keyManual.mode)
    : detectKey(parseSlots(chart)).key;
  const delta = mod12(tonic - currentKey.tonic);
  const semitones = delta > 6 ? delta - 12 : delta;
  const keyManual = { tonic: mod12(tonic), mode };
  if (!semitones) return { ...chart, keyManual };
  return {
    ...chart,
    bars: transposeSlots(chart.bars, semitones, preferFlatsFor(tonic, mode)),
    keyManual,
    transpose: wrapTranspose((chart.transpose ?? 0) + semitones),
  };
}

export function setVisibleBars(chart: Chart, n: number): Chart {  const count = Math.max(4, Math.min(64, n));
  const bars = [...chart.bars];
  while (bars.length < count) bars.push(makeBar(4));
  return { ...chart, bars, visibleBars: count };
}

export function setBarCountRaw(chart: Chart, n: number): Chart {
  const count = Math.max(4, Math.min(64, n));
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
