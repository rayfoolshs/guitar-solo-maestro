/**
 * Keyboard view helpers: spelling a scale on a stave, right-hand fingering and
 * piano-key geometry. Pure data in, pure data out — no React, no audio.
 */
import { mod12, pcName } from './pitch';
import { degreeLabel, type ScaleDef } from './scales';

const BLACK_PCS = new Set([1, 3, 6, 8, 10]);
const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const LETTER_PCS = [0, 2, 4, 5, 7, 9, 11];

export const isBlackKey = (midi: number) => BLACK_PCS.has(mod12(midi));

/** One notated note of the scale, plus the octave repeat. */
export interface ScaleNote {
  midi: number;
  pc: number;
  letter: string;
  /** Accidental in semitones: -2 … 2. */
  acc: number;
  /** Spelled name, e.g. "E♭". */
  name: string;
  /** Degree label, e.g. "♭3". */
  degree: string;
  /** Diatonic staff step: C4 = 28, E4 (bottom line of the treble stave) = 30. */
  step: number;
  /** Right-hand finger, 1 = thumb … 5 = little finger. */
  finger: number;
}

export function accidentalText(acc: number): string {
  if (acc <= -2) return '♭♭';
  if (acc === -1) return '♭';
  if (acc === 1) return '♯';
  if (acc >= 2) return '♯♯';
  return '';
}

/**
 * Spell each scale degree on its own letter, which is what makes notation
 * readable: D phrygian dominant comes out D E♭ F♯ G A B♭ C, not D E♭ G♭.
 * Non-heptatonic scales have no diatonic spelling, so they follow the key.
 */
function spellScale(rootPc: number, scale: ScaleDef, flats: boolean) {
  const rootName = pcName(rootPc, flats);
  const rootLetter = LETTERS.indexOf(rootName[0]);
  const heptatonic = scale.intervals.length === 7;

  return scale.intervals.map((interval, i) => {
    const pc = mod12(rootPc + interval);
    const byKey = () => {
      const name = pcName(pc, flats);
      const acc = name.includes('♯') ? 1 : name.includes('♭') ? -1 : 0;
      return { pc, letter: name[0], acc };
    };
    if (!heptatonic) return byKey();

    const idx = (rootLetter + i) % 7;
    let acc = mod12(pc - LETTER_PCS[idx]);
    if (acc > 6) acc -= 12;
    // more than a double accidental means the letter run does not fit; fall back
    if (Math.abs(acc) > 2) return byKey();
    return { pc, letter: LETTERS[idx], acc };
  });
}

function staffStep(midi: number, letter: string): number {
  const idx = LETTERS.indexOf(letter);
  const octave = Math.round((midi - LETTER_PCS[idx]) / 12) - 1;
  return octave * 7 + idx;
}

/** Octave for the one-octave notation: tonics from C4 up to F♯4, otherwise one below. */
export function notationStart(rootPc: number): number {
  const midi = 60 + mod12(rootPc);
  return midi > 66 ? midi - 12 : midi;
}

/**
 * Textbook right-hand fingerings for the twelve major scales, keyed by tonic
 * pitch class. These are the values method books agree on, so they take
 * precedence over the generated fingering.
 */
const MAJOR_RH: Record<number, number[]> = {
  0: [1, 2, 3, 1, 2, 3, 4, 5], // C
  7: [1, 2, 3, 1, 2, 3, 4, 5], // G
  2: [1, 2, 3, 1, 2, 3, 4, 5], // D
  9: [1, 2, 3, 1, 2, 3, 4, 5], // A
  4: [1, 2, 3, 1, 2, 3, 4, 5], // E
  11: [1, 2, 3, 1, 2, 3, 4, 5], // B
  5: [1, 2, 3, 4, 1, 2, 3, 4], // F
  10: [2, 1, 2, 3, 1, 2, 3, 4], // B♭
  3: [3, 1, 2, 3, 4, 1, 2, 3], // E♭
  8: [3, 4, 1, 2, 3, 1, 2, 3], // A♭
  1: [2, 3, 1, 2, 3, 4, 1, 2], // D♭
  6: [2, 3, 4, 1, 2, 3, 1, 2], // G♭ / F♯
};

/**
 * Right-hand fingering for an ascending scale. The hand is split into runs of
 * consecutive fingers, each starting on the thumb (or 2/3 for a black-key
 * tonic). The thumb and little finger never land on a black key, the thumb
 * prefers the white key that follows a black one, and a run of a single note
 * or a needless position shift costs extra.
 */
function generatedFingering(midis: number[]): number[] {
  const n = midis.length;
  const black = midis.map(isBlackKey);
  const found: Array<{ cost: number; fingers: number[] }> = [];

  const evaluate = (runs: number[]) => {
    for (let start = 1; start <= 3; start++) {
      const fingers: number[] = [];
      let cost = (runs.length - 1) * 60;
      let index = 0;
      let ok = true;

      for (let r = 0; r < runs.length && ok; r++) {
        const len = runs[r];
        const first = r === 0 ? start : 1;
        if (first + len - 1 > 5) { ok = false; break; }
        if (r > 0) cost += (fingers[index - 1] - 1) * 2;
        for (let k = 0; k < len; k++) {
          const f = first + k;
          const i = index + k;
          if ((f === 1 || f === 5) && black[i]) { ok = false; break; }
          if (f === 4 && black[i]) cost += 8;
          fingers.push(f);
        }
        if (len === 1) cost += 30;
        index += len;
      }
      if (!ok || fingers.length !== n) continue;

      for (let i = 1; i < n; i++) {
        if (fingers[i] === 1 && black[i - 1]) cost -= 20;
      }
      // small deterministic tie-breakers: end high, start on the thumb
      cost += (5 - fingers[n - 1]) * 0.5 + (start - 1) * 0.25;

      found.push({ cost, fingers });
    }
  };

  const walk = (index: number, runs: number[]) => {
    if (index === n) { evaluate(runs); return; }
    for (let len = 1; len <= 5 && index + len <= n; len++) walk(index + len, [...runs, len]);
  };
  walk(0, []);

  // A strict "no 1/5 on a black key" rule is unsatisfiable for a pentatonic
  // scale that sits entirely on black keys (G♭, B, E♭, A♭ major pentatonic).
  // Fall back to a 5-note crossing, which is the standard way to play those.
  if (found.length === 0) return midis.map((_, i) => [1, 2, 3, 4, 5][i % 5]);
  return found.reduce((a, b) => (b.cost < a.cost ? b : a)).fingers;
}

export function suggestFingering(midis: number[], scale: ScaleDef): number[] {
  const table = MAJOR_RH[mod12(midis[0])];
  if (scale.id === 'ionian' && midis.length === 8 && table) return table;
  return generatedFingering(midis);
}

/** The notated octave: every scale degree plus the octave above. */
export function buildScaleNotes(rootPc: number, scale: ScaleDef, flats: boolean): ScaleNote[] {
  return buildScaleNotesSpan(rootPc, scale, flats, 1);
}

/**
 * The scale spelled across `octaves` octaves, each octave closed by its own
 * tonic. The first note is the low note of the matching keyboard range, so the
 * stave and the keyboard cover the same pitches.
 */
export function buildScaleNotesSpan(
  rootPc: number,
  scale: ScaleDef,
  flats: boolean,
  octaves: number,
): ScaleNote[] {
  const spelled = spellScale(rootPc, scale, flats);
  const base = notationStart(rootPc) - 12;
  const notes: ScaleNote[] = [];

  for (let oct = 0; oct < octaves; oct++) {
    const midis = [...scale.intervals, 12].map((i) => base + oct * 12 + i);
    const fingers = suggestFingering(midis, scale);
    for (let i = 0; i < midis.length; i++) {
      const s = spelled[i % spelled.length];
      notes.push({
        midi: midis[i],
        pc: s.pc,
        letter: s.letter,
        acc: s.acc,
        name: `${s.letter}${accidentalText(s.acc)}`,
        degree: i === midis.length - 1 ? '1' : degreeLabel(scale.intervals[i % scale.intervals.length]),
        step: staffStep(midis[i], s.letter),
        finger: fingers[i],
      });
    }
  }

  return notes;
}

export interface KeyRect {
  midi: number;
  x: number;
  w: number;
  black: boolean;
}

export interface KeyboardLayout {
  whites: KeyRect[];
  blacks: KeyRect[];
  whiteWidth: number;
  low: number;
  high: number;
}

/**
 * White keys are evenly spaced across `width`; black keys straddle the gap
 * between the two whites either side. The low note is pulled down to a white
 * key so the drawing always starts on one.
 */
export function keyboardLayout(loMidi: number, octaves: number, width: number): KeyboardLayout {
  let low = loMidi;
  while (isBlackKey(low)) low -= 1;
  const high = low + octaves * 12;

  const whites: KeyRect[] = [];
  for (let midi = low; midi <= high; midi++) {
    if (!isBlackKey(midi)) whites.push({ midi, x: 0, w: 0, black: false });
  }
  const whiteWidth = width / whites.length;
  whites.forEach((key, i) => {
    key.x = i * whiteWidth;
    key.w = whiteWidth;
  });

  const blackWidth = whiteWidth * 0.62;
  const blacks: KeyRect[] = [];
  for (let midi = low + 1; midi < high; midi++) {
    if (!isBlackKey(midi)) continue;
    const below = whites.findIndex((key) => key.midi === midi - 1);
    if (below < 0) continue;
    blacks.push({ midi, x: (below + 1) * whiteWidth - blackWidth / 2, w: blackWidth, black: true });
  }

  return { whites, blacks, whiteWidth, low, high };
}
