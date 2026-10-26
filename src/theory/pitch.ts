/** Pitch-class helpers: numbers 0-11 (C = 0), plus key-aware spelling. */

export const NAMES_SHARP = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
export const NAMES_FLAT = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];

export const mod12 = (n: number) => ((n % 12) + 12) % 12;

export function pcName(pc: number, flats = false): string {
  return (flats ? NAMES_FLAT : NAMES_SHARP)[mod12(pc)];
}

export function midiToName(midi: number, flats = false): string {
  return pcName(midi, flats);
}

const LETTER_PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** Parse a note token such as "C", "F#", "Bb", "E♭". Returns null when it isn't a note. */
export function parseNote(token: string): number | null {
  const m = /^([A-Ga-g])([#♯b♭]?)$/.exec(token.trim());
  if (!m) return null;
  const base = LETTER_PC[m[1].toUpperCase()];
  if (base === undefined) return null;
  const acc = m[2];
  if (acc === '#' || acc === '♯') return mod12(base + 1);
  if (acc === 'b' || acc === '♭') return mod12(base - 1);
  return base;
}

/** Fraction of the twelve pitches a set of pitch classes covers. */
export function coverage(pcs: number[], universe: number[]): number {
  if (!pcs.length) return 1;
  const u = new Set(universe);
  return pcs.filter((p) => u.has(p)).length / pcs.length;
}

export function pcSet(pcs: number[]): Set<number> {
  return new Set(pcs.map(mod12));
}

export function symmetricDiff(a: number[], b: number[]): number {
  const A = pcSet(a);
  const B = pcSet(b);
  let n = 0;
  A.forEach((p) => { if (!B.has(p)) n++; });
  B.forEach((p) => { if (!A.has(p)) n++; });
  return n;
}

export function preferFlatsFor(tonic: number, mode: 'major' | 'minor'): boolean {
  // Keys whose signature is flat: F, Bb, Eb, Ab, Db, Gb + their relative minors
  const flatsMajor = [5, 10, 3, 8, 1, 6]; // F Bb Eb Ab Db Gb
  if (mode === 'major') return flatsMajor.includes(mod12(tonic));
  return flatsMajor.includes(mod12(tonic + 3));
}
