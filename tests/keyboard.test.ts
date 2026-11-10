import { describe, expect, it } from 'vitest';
import {
  buildScaleNotes, buildScaleNotesSpan, isBlackKey, keyboardLayout, notationStart, suggestFingering,
} from '../src/theory/keyboard';
import { SCALES, SCALE_BY_ID } from '../src/theory/scales';

describe('keyboard spelling', () => {
  it('spells D phrygian dominant on its own letters', () => {
    const notes = buildScaleNotes(2, SCALE_BY_ID.phrygianDominant, true);
    expect(notes.map((n) => n.name)).toEqual(['D', 'E♭', 'F♯', 'G', 'A', 'B♭', 'C', 'D']);
    expect(notes.map((n) => n.degree)).toEqual(['1', '♭2', '3', '4', '5', '♭6', '♭7', '1']);
  });

  it('spells C major without accidentals', () => {
    const notes = buildScaleNotes(0, SCALE_BY_ID.ionian, false);
    expect(notes.map((n) => n.name)).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C']);
    expect(notes.every((n) => n.acc === 0)).toBe(true);
  });

  it('spells G♭ major with C♭ rather than B', () => {
    const notes = buildScaleNotes(6, SCALE_BY_ID.ionian, true);
    expect(notes.map((n) => n.name)).toEqual(['G♭', 'A♭', 'B♭', 'C♭', 'D♭', 'E♭', 'F', 'G♭']);
  });

  it('keeps the octave seven staff steps above the tonic', () => {
    for (const scale of SCALES.filter((s) => s.intervals.length === 7)) {
      const notes = buildScaleNotes(3, scale, true);
      expect(notes[7].step - notes[0].step).toBe(7);
      expect(notes[7].pc).toBe(notes[0].pc);
    }
  });

  it('writes every tonic inside a readable treble range', () => {
    for (let pc = 0; pc < 12; pc++) {
      const start = notationStart(pc);
      expect(start).toBeGreaterThanOrEqual(55);
      expect(start).toBeLessThanOrEqual(66);
    }
  });
});

describe('right-hand fingering', () => {
  const majors: Array<[number, number[]]> = [
    [0, [1, 2, 3, 1, 2, 3, 4, 5]], // C
    [7, [1, 2, 3, 1, 2, 3, 4, 5]], // G
    [2, [1, 2, 3, 1, 2, 3, 4, 5]], // D
    [9, [1, 2, 3, 1, 2, 3, 4, 5]], // A
    [4, [1, 2, 3, 1, 2, 3, 4, 5]], // E
    [11, [1, 2, 3, 1, 2, 3, 4, 5]], // B
    [5, [1, 2, 3, 4, 1, 2, 3, 4]], // F
    [10, [2, 1, 2, 3, 1, 2, 3, 4]], // B♭
    [3, [3, 1, 2, 3, 4, 1, 2, 3]], // E♭
    [8, [3, 4, 1, 2, 3, 1, 2, 3]], // A♭
    [1, [2, 3, 1, 2, 3, 4, 1, 2]], // D♭
    [6, [2, 3, 4, 1, 2, 3, 1, 2]], // G♭
  ];

  it('uses the textbook major-scale fingerings', () => {
    for (const [pc, expected] of majors) {
      const notes = buildScaleNotes(pc, SCALE_BY_ID.ionian, true);
      expect(notes.map((n) => n.finger)).toEqual(expected);
    }
  });

  it('never puts the thumb or little finger on a black key', () => {
    for (const scale of SCALES) {
      // Pentatonic scales use the 1-2-3-4-5 pattern, so the fifth finger lands
      // on the fifth note even when it is black. The rule is for seven-note scales.
      if (scale.intervals.length !== 7) continue;
      for (let pc = 0; pc < 12; pc++) {
        const notes = buildScaleNotes(pc, scale, true);
        for (const note of notes) {
          expect(note.finger).toBeGreaterThanOrEqual(1);
          expect(note.finger).toBeLessThanOrEqual(5);
          if (note.finger === 1 || note.finger === 5) expect(isBlackKey(note.midi)).toBe(false);
        }
      }
    }
  });

  it('gives every scale a full fingering, one finger per note', () => {
    for (const scale of SCALES) {
      const midis = [0, 2, 4, 5, 7, 9, 11, 12].slice(0, scale.intervals.length + 1)
        .map((i) => 60 + i);
      expect(suggestFingering(midis, scale)).toHaveLength(midis.length);
    }
  });
});

describe('keyboard layout', () => {
  it('lays out three octaves of white keys and the black keys between them', () => {
    const layout = keyboardLayout(48, 3, 1000);
    expect(layout.low).toBe(48);
    expect(layout.high).toBe(84);
    expect(layout.whites).toHaveLength(22);
    expect(layout.blacks).toHaveLength(15);
    expect(layout.whites[0].x).toBe(0);
    expect(layout.whites[1].x).toBeCloseTo(1000 / 22);
    expect(layout.blacks[0].midi).toBe(49);
  });

  it('starts on a white key when the range begins on a black one', () => {
    const layout = keyboardLayout(49, 3, 1000);
    expect(layout.low).toBe(48);
    expect(isBlackKey(layout.low)).toBe(false);
    expect(isBlackKey(layout.high)).toBe(false);
  });
});
