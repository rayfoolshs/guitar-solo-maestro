import { mod12, pcName } from './pitch';

export type ParentKind = 'major' | 'harmonic-minor' | 'melodic-minor';

export interface ScaleDef {
  id: string;
  name: string;
  short: string;
  intervals: number[];
  parent?: { kind: ParentKind; degree: number };
  family: 'mode' | 'minor' | 'pentatonic' | 'blues' | 'symmetric' | 'altered';
}

const MAJOR = [0, 2, 4, 5, 7, 9, 11];

export const SCALES: ScaleDef[] = [
  { id: 'ionian',   name: 'Ionian',           short: 'Ionian',    intervals: MAJOR,                        parent: { kind: 'major', degree: 1 }, family: 'mode' },
  { id: 'dorian',   name: 'Dorian',           short: 'Dorian',    intervals: [0, 2, 3, 5, 7, 9, 10],      parent: { kind: 'major', degree: 2 }, family: 'mode' },
  { id: 'phrygian', name: 'Phrygian',         short: 'Phrygian',  intervals: [0, 1, 3, 5, 7, 8, 10],      parent: { kind: 'major', degree: 3 }, family: 'mode' },
  { id: 'lydian',   name: 'Lydian',           short: 'Lydian',    intervals: [0, 2, 4, 6, 7, 9, 11],      parent: { kind: 'major', degree: 4 }, family: 'mode' },
  { id: 'mixolydian', name: 'Mixolydian',     short: 'Mixolyd.',  intervals: [0, 2, 4, 5, 7, 9, 10],      parent: { kind: 'major', degree: 5 }, family: 'mode' },
  { id: 'aeolian',  name: 'Aeolian',          short: 'Aeolian',   intervals: [0, 2, 3, 5, 7, 8, 10],      parent: { kind: 'major', degree: 6 }, family: 'mode' },
  { id: 'locrian',  name: 'Locrian',          short: 'Locrian',   intervals: [0, 1, 3, 5, 6, 8, 10],      parent: { kind: 'major', degree: 7 }, family: 'mode' },

  { id: 'harmonicMinor', name: 'Harmonic minor', short: 'Harm. minor', intervals: [0, 2, 3, 5, 7, 8, 11], family: 'minor' },
  { id: 'melodicMinor',  name: 'Melodic minor',  short: 'Mel. minor',  intervals: [0, 2, 3, 5, 7, 9, 11], family: 'minor' },

  { id: 'phrygianDominant', name: 'Phrygian dominant', short: 'Phryg. dom.', intervals: [0, 1, 4, 5, 7, 8, 10], parent: { kind: 'harmonic-minor', degree: 5 }, family: 'mode' },
  { id: 'lydianDominant',   name: 'Lydian dominant',   short: 'Lyd. dom.',   intervals: [0, 2, 4, 6, 7, 9, 10], parent: { kind: 'melodic-minor', degree: 4 }, family: 'mode' },
  { id: 'altered',          name: 'Altered',           short: 'Altered',     intervals: [0, 1, 3, 4, 6, 8, 10], parent: { kind: 'melodic-minor', degree: 7 }, family: 'altered' },
  { id: 'locrian2',         name: 'Locrian ♮2',        short: 'Locrian ♮2',  intervals: [0, 2, 3, 5, 6, 8, 10], parent: { kind: 'melodic-minor', degree: 2 }, family: 'mode' },

  { id: 'majorPent', name: 'Major pentatonic', short: 'Maj. pent.', intervals: [0, 2, 4, 7, 9],  family: 'pentatonic' },
  { id: 'minorPent', name: 'Minor pentatonic', short: 'Min. pent.', intervals: [0, 3, 5, 7, 10], family: 'pentatonic' },
  { id: 'blues',     name: 'Blues',            short: 'Blues',      intervals: [0, 3, 5, 6, 7, 10], family: 'blues' },

  { id: 'wholeTone',    name: 'Whole tone',      short: 'Whole tone', intervals: [0, 2, 4, 6, 8, 10], family: 'symmetric' },
  { id: 'halfWholeDim', name: 'Half–whole dim.', short: 'H–W dim.',   intervals: [0, 1, 3, 4, 6, 7, 9, 10], family: 'symmetric' },
  { id: 'wholeHalfDim', name: 'Whole–half dim.', short: 'W–H dim.',   intervals: [0, 2, 3, 5, 6, 8, 9, 11], family: 'symmetric' },
];

export const SCALE_BY_ID: Record<string, ScaleDef> = Object.fromEntries(
  SCALES.map((s) => [s.id, s]),
);

export function scalePcs(rootPc: number, scale: ScaleDef): number[] {
  return scale.intervals.map((i) => mod12(rootPc + i));
}

const PARENT_SCALES: Record<ParentKind, number[]> = {
  major: MAJOR,
  'harmonic-minor': [0, 2, 3, 5, 7, 8, 11],
  'melodic-minor': [0, 2, 3, 5, 7, 9, 11],
};

const PARENT_LABEL: Record<ParentKind, string> = {
  major: 'major',
  'harmonic-minor': 'harmonic minor',
  'melodic-minor': 'melodic minor',
};

const ORDINAL = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th'];

/** "2nd mode of C major" — null when the scale has no parent. */
export function parentLabel(rootPc: number, scale: ScaleDef, flats: boolean): string | null {
  if (!scale.parent) return null;
  const parentPcs = PARENT_SCALES[scale.parent.kind];
  const parentTonic = mod12(rootPc - parentPcs[scale.parent.degree - 1]);
  return `${ORDINAL[scale.parent.degree - 1]} mode of ${pcName(parentTonic, flats)} ${PARENT_LABEL[scale.parent.kind]}`;
}

export function scaleName(rootPc: number, scale: ScaleDef, flats: boolean): string {
  return `${pcName(rootPc, flats)} ${scale.name}`;
}

const DEGREE_LABEL: Record<number, string> = {
  0: '1', 1: '♭2', 2: '2', 3: '♭3', 4: '3', 5: '4', 6: '♭5', 7: '5', 8: '♭6', 9: '6', 10: '♭7', 11: '7',
};

export function degreeLabel(interval: number): string {
  return DEGREE_LABEL[mod12(interval)] ?? '?';
}

export function degreeRow(scale: ScaleDef): string {
  return scale.intervals.map(degreeLabel).join(' ');
}
