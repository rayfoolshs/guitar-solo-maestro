import { mod12, pcName, preferFlatsFor } from './pitch';
import type { ParsedChord } from './chords';

export type Mode = 'major' | 'minor';

export interface KeyInfo {
  tonic: number;
  mode: Mode;
  pcs: number[];
  name: string;
  flats: boolean;
}

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const NATURAL_MINOR = [0, 2, 3, 5, 7, 8, 10];

export function makeKey(tonic: number, mode: Mode, flats?: boolean): KeyInfo {
  const pcs = (mode === 'major' ? MAJOR : NATURAL_MINOR).map((i) => mod12(tonic + i));
  const f = flats ?? preferFlatsFor(tonic, mode);
  return { tonic: mod12(tonic), mode, pcs, name: `${pcName(tonic, f)} ${mode}`, flats: f };
}

export const ALL_KEYS: KeyInfo[] = (() => {
  const out: KeyInfo[] = [];
  for (let t = 0; t < 12; t++) out.push(makeKey(t, 'major'));
  for (let t = 0; t < 12; t++) out.push(makeKey(t, 'minor'));
  return out;
})();

const MODE_IDS_MAJOR = ['ionian', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'locrian'];

/** The mode of the key that sits on a given scale degree (0-based). */
export function modeOnDegree(key: KeyInfo, degreeIndex: number): string {
  const offset = key.mode === 'major' ? 0 : 5; // aeolian is the 6th mode of major
  return MODE_IDS_MAJOR[(degreeIndex + offset) % 7];
}

export function degreeOfRoot(key: KeyInfo, rootPc: number): number {
  return key.pcs.indexOf(mod12(rootPc));
}

function scaleSemitones(pcs: number[], rootPc: number): number[] {
  return pcs.map((p) => mod12(p - rootPc)).sort((a, b) => a - b);
}

/** Coarse triad family of the diatonic chord built on a degree. */
function diatonicFamily(pcs: number[], degreeIndex: number): 'major' | 'minor' | 'dim' | 'aug' | 'dominant' {
  const root = pcs[degreeIndex];
  const third = mod12(pcs[(degreeIndex + 2) % 7] - root);
  const fifth = mod12(pcs[(degreeIndex + 4) % 7] - root);
  const seventh = mod12(pcs[(degreeIndex + 6) % 7] - root);
  const hasSeventh = seventh === 10 || seventh === 11 || seventh === 9;
  const isMinorThird = third === 3;
  const isDimFifth = fifth === 6;
  const isAugFifth = fifth === 8;
  if (isAugFifth) return 'aug';
  if (isDimFifth) return 'dim';
  if (isMinorThird) return hasSeventh && seventh === 10 ? 'minor' : 'minor';
  if (hasSeventh && seventh === 10) return 'dominant';
  return 'major';
}

export interface KeyCandidate {
  key: KeyInfo;
  score: number;
  maxScore: number;
  confidence: number;
}

/**
 * Score all 24 keys against a chord list. Returns them ranked, best first.
 * Weights mirror the plan: root in key, chord-tone coverage, diatonic quality,
 * tonic weighting on the first/last chord.
 */
export function rankKeys(chords: ParsedChord[]): KeyCandidate[] {
  const usable = chords.filter(Boolean);
  if (!usable.length) {
    return [{ key: makeKey(0, 'major'), score: 0, maxScore: 1, confidence: 0 }];
  }

  const results: KeyCandidate[] = [];

  for (const key of ALL_KEYS) {
    const set = new Set(key.pcs);
    let score = 0;
    let maxScore = 0;

    for (let i = 0; i < usable.length; i++) {
      const chord = usable[i];
      maxScore += 8;

      if (set.has(chord.rootPc)) score += 2;
      else score -= 1;

      const inKey = chord.intervals.filter((p) => set.has(p)).length;
      const coverage = inKey / chord.intervals.length;
      score += coverage * 3;
      score -= (chord.intervals.length - inKey) * 0.8;

      const deg = degreeOfRoot(key, chord.rootPc);
      if (deg >= 0) {
        const fam = diatonicFamily(key.pcs, deg);
        if (fam === chord.quality.family) score += 3;
        else if (chord.quality.family === 'dominant' && fam === 'major') score += 1;
      }
    }

    const first = usable[0];
    const last = usable[usable.length - 1];
    maxScore += 6;
    if (mod12(first.rootPc) === key.tonic) score += 3;
    if (mod12(last.rootPc) === key.tonic) score += 3;
    else if (key.mode === 'major' && mod12(last.rootPc) === mod12(key.tonic + 7)) score += 2;
    else if (key.mode === 'minor' && mod12(last.rootPc) === mod12(key.tonic + 7)) score += 2;

    results.push({ key, score, maxScore, confidence: Math.max(0, score) / maxScore });
  }

  results.sort((a, b) => b.confidence - a.confidence);
  return results;
}

export function detectKey(chords: ParsedChord[]): { key: KeyInfo; confidence: number; runnerUp?: KeyInfo } {
  const ranked = rankKeys(chords);
  const best = ranked[0];
  let runnerUp: KeyInfo | undefined;
  for (const r of ranked.slice(1)) {
    if (r.key.name !== best.key.name) {
      runnerUp = r.key;
      break;
    }
  }
  return { key: best.key, confidence: best.confidence, runnerUp };
}
