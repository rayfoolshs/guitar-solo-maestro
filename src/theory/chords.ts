import { mod12, parseNote, pcName } from './pitch';

export type QualityId =
  | 'maj' | 'm' | '7' | 'maj7' | 'm7' | 'm7b5' | 'dim7' | 'dim' | 'aug'
  | '6' | 'm6' | '69' | 'sus4' | 'sus2' | '9' | 'maj9' | 'm9' | '13' | 'add9' | '7sus4' | '5'
  | '7b9' | '7#9' | '7#11' | '7b13' | '7b5' | '7#5' | 'alt'
  | '9#11' | '13#11' | '11' | 'm11' | 'maj7#11' | 'mMaj7' | 'madd9' | 'add11';

export interface Quality {
  id: QualityId;
  label: string;
  intervals: number[];
  /** rough family used by the chord-scale ranking */
  family: 'major' | 'minor' | 'dominant' | 'dim' | 'aug' | 'sus' | 'power';
}

export const QUALITIES: Record<QualityId, Quality> = {
  maj:    { id: 'maj',    label: '',        intervals: [0, 4, 7],           family: 'major' },
  m:      { id: 'm',      label: 'm',       intervals: [0, 3, 7],           family: 'minor' },
  '7':    { id: '7',      label: '7',       intervals: [0, 4, 7, 10],       family: 'dominant' },
  maj7:   { id: 'maj7',   label: 'maj7',    intervals: [0, 4, 7, 11],       family: 'major' },
  m7:     { id: 'm7',     label: 'm7',      intervals: [0, 3, 7, 10],       family: 'minor' },
  m7b5:   { id: 'm7b5',   label: 'm7♭5',    intervals: [0, 3, 6, 10],       family: 'dim' },
  dim7:   { id: 'dim7',   label: 'dim7',    intervals: [0, 3, 6, 9],        family: 'dim' },
  dim:    { id: 'dim',    label: 'dim',     intervals: [0, 3, 6],           family: 'dim' },
  aug:    { id: 'aug',    label: 'aug',     intervals: [0, 4, 8],           family: 'aug' },
  '6':    { id: '6',      label: '6',       intervals: [0, 4, 7, 9],        family: 'major' },
  m6:     { id: 'm6',     label: 'm6',      intervals: [0, 3, 7, 9],        family: 'minor' },
  '69':   { id: '69',     label: '6/9',     intervals: [0, 4, 7, 9, 2],     family: 'major' },
  sus4:   { id: 'sus4',   label: 'sus4',    intervals: [0, 5, 7],           family: 'sus' },
  sus2:   { id: 'sus2',   label: 'sus2',    intervals: [0, 2, 7],           family: 'sus' },
  '9':    { id: '9',      label: '9',       intervals: [0, 4, 7, 10, 2],    family: 'dominant' },
  maj9:   { id: 'maj9',   label: 'maj9',    intervals: [0, 4, 7, 11, 2],    family: 'major' },
  m9:     { id: 'm9',     label: 'm9',      intervals: [0, 3, 7, 10, 2],    family: 'minor' },
  '13':   { id: '13',     label: '13',      intervals: [0, 4, 7, 10, 2, 9], family: 'dominant' },
  add9:   { id: 'add9',   label: 'add9',    intervals: [0, 4, 7, 2],        family: 'major' },
  '7sus4':{ id: '7sus4',  label: '7sus4',   intervals: [0, 5, 7, 10],       family: 'sus' },
  '5':    { id: '5',      label: '5',       intervals: [0, 7],              family: 'power' },
  '7b9':  { id: '7b9',    label: '7♭9',     intervals: [0, 4, 7, 10, 1],    family: 'dominant' },
  '7#9':  { id: '7#9',    label: '7♯9',     intervals: [0, 4, 7, 10, 3],    family: 'dominant' },
  '7#11': { id: '7#11',   label: '7♯11',    intervals: [0, 4, 7, 10, 6],    family: 'dominant' },
  '7b13': { id: '7b13',   label: '7♭13',    intervals: [0, 4, 7, 10, 8],    family: 'dominant' },
  '7b5':  { id: '7b5',    label: '7♭5',     intervals: [0, 4, 6, 10],       family: 'dominant' },
  '7#5':  { id: '7#5',    label: '7♯5',     intervals: [0, 4, 8, 10],       family: 'dominant' },
  'alt':  { id: 'alt',    label: 'alt',     intervals: [0, 4, 10, 1, 8],    family: 'dominant' },
  '9#11': { id: '9#11',   label: '9♯11',    intervals: [0, 4, 7, 10, 2, 6], family: 'dominant' },
  '13#11':{ id: '13#11',  label: '13♯11',   intervals: [0, 4, 7, 10, 2, 9, 6], family: 'dominant' },
  '11':   { id: '11',     label: '11',      intervals: [0, 4, 7, 10, 2, 5], family: 'dominant' },
  'm11':  { id: 'm11',    label: 'm11',     intervals: [0, 3, 7, 10, 2, 5], family: 'minor' },
  'maj7#11': { id: 'maj7#11', label: 'maj7♯11', intervals: [0, 4, 7, 11, 6], family: 'major' },
  'mMaj7': { id: 'mMaj7', label: 'm(maj7)', intervals: [0, 3, 7, 11],       family: 'minor' },
  'madd9': { id: 'madd9', label: 'm(add9)', intervals: [0, 3, 7, 2],        family: 'minor' },
  'add11': { id: 'add11', label: 'add11',   intervals: [0, 4, 7, 5],        family: 'major' },
};

const SUFFIX_ALIASES: Record<string, QualityId> = {
  '': 'maj', 'maj': 'maj', 'M': 'maj', 'major': 'maj',
  'm': 'm', 'min': 'm', '-': 'm', 'minor': 'm',
  '7': '7', 'dom7': '7', 'dom': '7',
  'maj7': 'maj7', 'M7': 'maj7', 'Δ': 'maj7', 'Δ7': 'maj7', 'ma7': 'maj7',
  'm7': 'm7', 'min7': 'm7', '-7': 'm7', 'mi7': 'm7',
  'm7b5': 'm7b5', 'm7♭5': 'm7b5', 'ø': 'm7b5', 'ø7': 'm7b5', 'min7b5': 'm7b5',
  'dim7': 'dim7', '°7': 'dim7', 'o7': 'dim7',
  'dim': 'dim', '°': 'dim', 'o': 'dim',
  'aug': 'aug', '+': 'aug', '+7': 'aug',
  '6': '6', 'maj6': '6', 'M6': '6', '6/9': '69',
  'm6': 'm6', 'min6': 'm6',
  'sus4': 'sus4', 'sus': 'sus4',
  'sus2': 'sus2',
  '9': '9', 'dom9': '9',
  'maj9': 'maj9', 'M9': 'maj9',
  'm9': 'm9', 'min9': 'm9',
  '13': '13', 'dom13': '13',
  'add9': 'add9',
  '7sus4': '7sus4', '7sus': '7sus4',
  '5': '5',
  '7b9': '7b9', '7♭9': '7b9', 'dom7b9': '7b9',
  '7#9': '7#9', '7♯9': '7#9', 'dom7#9': '7#9',
  '7#11': '7#11', '7♯11': '7#11',
  '7b13': '7b13', '7♭13': '7b13',
  '7b5': '7b5', '7♭5': '7b5',
  '7#5': '7#5', '7♯5': '7#5', '7+5': '7#5',
  'alt': 'alt', '7alt': 'alt', '7altered': 'alt',
  '9#11': '9#11', '9♯11': '9#11',
  '13#11': '13#11', '13♯11': '13#11',
  '11': '11', 'dom11': '11',
  'm11': 'm11', 'min11': 'm11', '-11': 'm11',
  'maj7#11': 'maj7#11', 'M7#11': 'maj7#11', 'Δ7#11': 'maj7#11', 'maj7♯11': 'maj7#11',
  'mMaj7': 'mMaj7', 'm(maj7)': 'mMaj7', 'mmaj7': 'mMaj7', 'minmaj7': 'mMaj7',
  'mM7': 'mMaj7', 'mΔ7': 'mMaj7',
  'madd9': 'madd9', 'm(add9)': 'madd9', 'minadd9': 'madd9',
  'add11': 'add11',
};

export interface ParsedChord {
  ok: true;
  input: string;
  rootPc: number;
  quality: Quality;
  intervals: number[];
  bassPc?: number;
}

export interface BadChord { ok: false; input: string; error: string; }
export type ChordOrError = ParsedChord | BadChord;

/**
 * Parse a chord symbol such as `B♭maj7`, `F#m7b5`, `C6/9` or `D/F#`.
 * Slash notation is only treated as a bass note when the tail is a plain note.
 */
export function parseChord(raw: string): ChordOrError {
  const input = raw.trim();
  if (!input) return { ok: false, input, error: 'empty' };

  const slashAt = input.indexOf('/');
  let head = input;
  let bassPc: number | undefined;
  if (slashAt > 0) {
    const tail = input.slice(slashAt + 1).trim();
    const bass = parseNote(tail);
    if (bass !== null) {
      bassPc = bass;
      head = input.slice(0, slashAt).trim();
    }
  }

  const m = /^([A-Ga-g])([#♯b♭]?)(.*)$/.exec(head);
  if (!m) return { ok: false, input, error: 'not a chord symbol' };

  const rootPc = parseNote(m[1] + m[2]);
  if (rootPc === null) return { ok: false, input, error: 'not a note' };

  const suffix = m[3].trim();
  const qualityId = SUFFIX_ALIASES[suffix] ?? SUFFIX_ALIASES[suffix.toLowerCase()];
  if (!qualityId) return { ok: false, input, error: `unknown quality “${suffix}”` };

  const quality = QUALITIES[qualityId];
  return {
    ok: true,
    input,
    rootPc,
    quality,
    intervals: quality.intervals.map((i) => mod12(rootPc + i)),
    bassPc,
  };
}

export function chordSymbol(chord: ParsedChord, rootName: string): string {
  return rootName + chord.quality.label;
}

/**
 * Transpose a chord symbol by semitones, preserving the quality suffix and any
 * slash bass. Unparseable input is returned unchanged. `flats` chooses the
 * spelling of black keys.
 */
export function transposeChordSymbol(input: string, semitones: number, flats = false): string {
  const symbol = input.trim();
  if (!symbol || mod12(semitones) === 0) return input;

  let head = symbol;
  let bass: string | null = null;
  const slashAt = symbol.indexOf('/');
  if (slashAt > 0) {
    const tail = symbol.slice(slashAt + 1).trim();
    if (parseNote(tail) !== null) {
      bass = tail;
      head = symbol.slice(0, slashAt).trim();
    }
  }

  const m = /^([A-Ga-g])([#♯b♭]?)(.*)$/.exec(head);
  if (!m) return input;
  const rootPc = parseNote(`${m[1]}${m[2]}`);
  if (rootPc === null) return input;

  const nextRoot = pcName(rootPc + semitones, flats);
  const nextBass = bass ? pcName((parseNote(bass) ?? 0) + semitones, flats) : null;
  return `${nextRoot}${m[3]}${nextBass ? `/${nextBass}` : ''}`;
}
