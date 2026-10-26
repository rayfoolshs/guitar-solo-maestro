import { mod12, pcName } from './pitch';
import type { ParsedChord } from './chords';
import { SCALES, SCALE_BY_ID, scalePcs, parentLabel, scaleName, degreeRow, type ScaleDef } from './scales';
import { degreeOfRoot, modeOnDegree, type KeyInfo } from './keys';

export type Bucket = 'key' | 'alt' | 'out';

export interface Candidate {
  id: string;
  scaleId: string;
  scale: ScaleDef;
  rootPc: number;
  pcs: number[];
  name: string;
  parent: string | null;
  degrees: string;
  bucket: Bucket;
  added: number[];
  missing: number[];
  score: number;
  reason: string;
}

function familyBonus(scaleId: string, family: string): number {
  const sets: Record<string, string[]> = {
    major: ['ionian', 'lydian', 'majorPent', 'mixolydian'],
    minor: ['dorian', 'aeolian', 'phrygian', 'minorPent', 'blues'],
    dominant: ['mixolydian', 'phrygianDominant', 'lydianDominant', 'altered', 'halfWholeDim', 'wholeTone'],
    dim: ['locrian', 'locrian2', 'wholeHalfDim', 'halfWholeDim'],
    aug: ['wholeTone', 'lydian', 'altered'],
    sus: ['mixolydian', 'dorian', 'ionian', 'majorPent'],
    power: ['minorPent', 'majorPent', 'blues'],
  };
  const list = sets[family] ?? [];
  const i = list.indexOf(scaleId);
  return i === -1 ? 0 : 14 - i * 2;
}

const COMMON: Record<string, number> = {
  ionian: 8, dorian: 6, aeolian: 4, mixolydian: 10, locrian: 6,
  phrygianDominant: 6, lydian: -6, lydianDominant: -6, altered: -2,
};

function sizeBonus(scale: ScaleDef, chord: ParsedChord): number {
  const isSeventh = chord.intervals.length >= 4;
  if (isSeventh) return scale.intervals.length >= 7 ? 6 : scale.intervals.length === 6 ? 2 : 0;
  return scale.intervals.length <= 5 ? 4 : 0;
}

function describe(scale: ScaleDef, rootPc: number, key: KeyInfo, added: number[]): string {
  const parts: string[] = [];
  if (added.length === 0) parts.push('in key');
  else parts.push(`adds ${added.map((p) => pcName(p, key.flats)).join(' · ')}`);
  return parts.join(' · ');
}

/** Rank chord scales for one chord, relative to the chart key. */
export function suggestForChord(chord: ParsedChord, key: KeyInfo, limit = 8): Candidate[] {
  const keySet = new Set(key.pcs);
  const deg = degreeOfRoot(key, chord.rootPc);
  const naturalMode = deg >= 0 ? modeOnDegree(key, deg) : null;

  const candidates: Candidate[] = [];

  for (const scale of SCALES) {
    const pcs = scalePcs(chord.rootPc, scale);
    const set = new Set(pcs);

    // every chord tone must live inside the scale
    if (!chord.intervals.every((p) => set.has(p))) continue;

    const added = pcs.filter((p) => !keySet.has(p));
    const missing = key.pcs.filter((p) => !set.has(p));
    const bucket: Bucket = added.length === 0 ? 'key' : added.length <= 2 ? 'alt' : 'out';

    let score = 100;
    score -= added.length * 12;
    score -= missing.length * 1.5;
    score += familyBonus(scale.id, chord.quality.family);
    score += COMMON[scale.id] ?? 0;
    score += sizeBonus(scale, chord);
    if (naturalMode && scale.id === naturalMode) score += 34;
    if (scale.family === 'symmetric') score -= 8;
    if (bucket === 'out') score -= 10;

    candidates.push({
      id: `${chord.rootPc}:${scale.id}`,
      scaleId: scale.id,
      scale,
      rootPc: chord.rootPc,
      pcs,
      name: scaleName(chord.rootPc, scale, key.flats),
      parent: parentLabel(chord.rootPc, scale, key.flats),
      degrees: degreeRow(scale),
      bucket,
      added,
      missing,
      score,
      reason: describe(scale, chord.rootPc, key, added),
    });
  }

  candidates.sort((a, b) => b.score - a.score);

  // de-duplicate by pitch-class set, keeping the best-scoring name for it
  const seen = new Set<string>();
  const unique: Candidate[] = [];
  for (const c of candidates) {
    const sig = [...c.pcs].sort((x, y) => x - y).join(',');
    if (seen.has(sig)) continue;
    seen.add(sig);
    unique.push(c);
  }

  return unique.slice(0, limit);
}

/** The one-scale-for-the-whole-chart recommendation. */
export function suggestGlobal(chords: ParsedChord[], key: KeyInfo): Candidate[] {
  const keyScaleId = key.mode === 'major' ? 'ionian' : 'aeolian';
  const base = SCALES.find((s) => s.id === keyScaleId)!;
  const pcs = scalePcs(key.tonic, base);
  const keySet = new Set(key.pcs);
  const added = pcs.filter((p) => !keySet.has(p));

  const list: Candidate[] = [
    {
      id: `global:${base.id}`,
      scaleId: base.id,
      scale: base,
      rootPc: key.tonic,
      pcs,
      name: scaleName(key.tonic, base, key.flats),
      parent: parentLabel(key.tonic, base, key.flats),
      degrees: degreeRow(base),
      bucket: 'key',
      added,
      missing: [],
      score: 100,
      reason: 'the key itself',
    },
  ];

  for (const id of ['majorPent', 'minorPent', 'blues']) {
    const scale = SCALE_BY_ID[id];
    if (!scale) continue;
    const sp = scalePcs(key.tonic, scale);
    const out = sp.filter((p) => !keySet.has(p));
    list.push({
      id: `global:${id}`,
      scaleId: id,
      scale,
      rootPc: key.tonic,
      pcs: sp,
      name: scaleName(key.tonic, scale, key.flats),
      parent: null,
      degrees: degreeRow(scale),
      bucket: out.length === 0 ? 'key' : 'alt',
      added: out,
      missing: key.pcs.filter((p) => !new Set(sp).has(p)),
      score: 80 - out.length * 5,
      reason: out.length === 0 ? 'in key' : `adds ${out.map((p) => pcName(p, key.flats)).join(' · ')}`,
    });
  }

  return list.sort((a, b) => b.score - a.score);
}

/** 1 − Jaccard distance between two note sets: 1 means identical. */
export function transitionScore(a: number[], b: number[]): number {
  const A = new Set(a);
  const B = new Set(b);
  let inter = 0;
  A.forEach((p) => { if (B.has(p)) inter++; });
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 1 : inter / union;
}

export function addedLabels(c: Candidate, flats: boolean): string[] {
  return c.added.map((p) => pcName(p, flats));
}

export { mod12 };
