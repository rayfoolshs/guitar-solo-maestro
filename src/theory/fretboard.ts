import { mod12 } from './pitch';

/** Standard tuning, index 0 = low E (6th string) … 5 = high E (1st string). */
export const TUNING = [40, 45, 50, 55, 59, 64];
export const STRING_NAMES = ['E', 'A', 'D', 'G', 'B', 'E'];

export const FRET_COUNT = 24;

/** Vertical position of a string row in the fretboard SVG. */
export function rowY(index: number): number {
  return 24 + index * 26;
}

export function noteAt(stringIndex: number, fret: number): number {
  return TUNING[stringIndex] + fret;
}

const DEGREE: Record<number, string> = {
  0: '1', 1: '♭2', 2: '2', 3: '♭3', 4: '3', 5: '4',
  6: '♭5', 7: '5', 8: '♭6', 9: '6', 10: '♭7', 11: '7',
};

/** Degree label of a pitch class inside a scale rooted at `rootPc`. */
export function degreeOf(pc: number, rootPc: number, scaleIntervals: number[]): string | null {
  const interval = mod12(pc - rootPc);
  if (!scaleIntervals.includes(interval)) return null;
  return DEGREE[interval] ?? null;
}

/** Pitch classes of a scale. */
export function scalePitchClasses(rootPc: number, intervals: number[]): number[] {
  return intervals.map((i) => mod12(rootPc + i));
}

/** Fret x-position with true geometry (frets compress towards the body). */
export function fretPosition(fret: number, nutX: number, endX: number, count = FRET_COUNT): number {
  const raw = (n: number) => 1 - Math.pow(2, -n / 12);
  return nutX + (raw(fret) / raw(count)) * (endX - nutX);
}

export function noteX(fret: number, nutX: number, endX: number, count = FRET_COUNT): number {
  if (fret <= 0) return nutX - 22;
  return (fretPosition(fret - 1, nutX, endX, count) + fretPosition(fret, nutX, endX, count)) / 2;
}

/** Nearest MIDI note with pitch class `pc` inside [lo, hi]. */
export function nearestMidi(pc: number, lo: number, hi: number, preferred?: number): number {
  let best = lo;
  let bestDist = Infinity;
  for (let m = lo; m <= hi; m++) {
    if (mod12(m) !== mod12(pc)) continue;
    const d = preferred === undefined ? Math.abs(m - (lo + hi) / 2) : Math.abs(m - preferred);
    if (d < bestDist) { bestDist = d; best = m; }
  }
  return best;
}
