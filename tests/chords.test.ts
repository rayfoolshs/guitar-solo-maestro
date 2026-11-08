import { describe, expect, it } from 'vitest';
import { parseChord } from '../src/theory/chords';
import { buildScore } from '../src/arrange/buildScore';
import { blueBossa, parseSlots } from '../src/chart/model';
import { detectKey } from '../src/theory/keys';

describe('extended chord qualities', () => {
  it('parses the altered dominants used in lead sheets', () => {
    for (const symbol of ['A7b9', 'C7#9', 'D7#11', 'G7b13', 'Bb7b5', 'Eb7#5', 'Falt', 'E9#11', 'Ab13#11']) {
      const parsed = parseChord(symbol);
      expect(parsed.ok, symbol).toBe(true);
    }
  });

  it('parses extended minor and major colours', () => {
    for (const symbol of ['Cm11', 'Bbmaj7#11', 'Cm(maj7)', 'CmM7', 'Cmadd9', 'Fadd11', 'G11']) {
      expect(parseChord(symbol).ok, symbol).toBe(true);
    }
  });

  it('puts the alteration into the interval set', () => {
    const a7b9 = parseChord('A7b9');
    if (!a7b9.ok) throw new Error('bad chord');
    expect(a7b9.intervals).toContain(1); // Bb, the flat ninth of A
    const c7s9 = parseChord('C7#9');
    if (!c7s9.ok) throw new Error('bad chord');
    expect(c7s9.intervals).toContain(3); // Eb, the sharp ninth of C
  });

  it('rejects invented suffixes', () => {
    expect(parseChord('C7b99').ok).toBe(false);
    expect(parseChord('Cmaj13#11b9').ok).toBe(false);
  });

  it('arranges a chart full of altered chords without dropping notes', () => {
    const chart = {
      ...blueBossa(),
      bars: [
        { id: 'b1', slots: [{ id: 's1', beat: 0, input: 'C7b9' }] },
        { id: 'b2', slots: [{ id: 's2', beat: 0, input: 'Cm11' }] },
        { id: 'b3', slots: [{ id: 's3', beat: 0, input: 'Ebmaj7#11' }] },
        { id: 'b4', slots: [{ id: 's4', beat: 0, input: 'Falt' }] },
      ],
      visibleBars: 4,
    };
    const key = detectKey(parseSlots(chart)).key;
    const events = buildScore(chart, key, { style: 'jazz', swing: 0.62 });
    expect(events.some((e) => e.channel === 'piano')).toBe(true);
    expect(events.some((e) => e.channel === 'bass')).toBe(true);
    expect(events.some((e) => e.channel === 'drums')).toBe(true);
  });
});
