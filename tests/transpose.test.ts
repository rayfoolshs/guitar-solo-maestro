import { describe, expect, it } from 'vitest';
import { transposeChordSymbol } from '../src/theory/chords';
import { blueBossa, transposeChart } from '../src/chart/model';

describe('transposeChordSymbol', () => {
  it('moves roots and preserves the quality suffix', () => {
    expect(transposeChordSymbol('Cmaj7', 2)).toBe('Dmaj7');
    expect(transposeChordSymbol('F#m7b5', 1)).toBe('Gm7b5');
    expect(transposeChordSymbol('Bb7', -2, true)).toBe('A♭7');
    expect(transposeChordSymbol('A7b9', 3)).toBe('C7b9');
    expect(transposeChordSymbol('Ebmaj7#11', 1, true)).toBe('Emaj7#11');
  });

  it('handles slash chords', () => {
    expect(transposeChordSymbol('D/F#', 2)).toBe('E/G♯');
    expect(transposeChordSymbol('D/F#', 1, true)).toBe('E♭/G');
  });

  it('does not mistake 6/9 for a slash bass', () => {
    expect(transposeChordSymbol('C6/9', 2)).toBe('D6/9');
  });

  it('uses the requested spelling', () => {
    expect(transposeChordSymbol('C', 1)).toBe('C♯');
    expect(transposeChordSymbol('C', 1, true)).toBe('D♭');
  });

  it('leaves unparseable tokens alone', () => {
    expect(transposeChordSymbol('N.C.', 2)).toBe('N.C.');
    expect(transposeChordSymbol('', 2)).toBe('');
    expect(transposeChordSymbol('?', 2)).toBe('?');
  });

  it('is a no-op for whole octaves', () => {
    expect(transposeChordSymbol('Cm7', 12)).toBe('Cm7');
  });
});

describe('transposeChart', () => {
  it('moves every chord and tracks the offset', () => {
    const up = transposeChart(blueBossa(), 2);
    expect(up.bars[0].slots[0].input).toBe('Dm7');
    expect(up.bars[2].slots[0].input).toBe('Gm7');
    expect(up.transpose).toBe(2);
  });

  it('updates a manual key', () => {
    const chart = { ...blueBossa(), keyManual: { tonic: 0, mode: 'major' as const } };
    expect(transposeChart(chart, 3).keyManual?.tonic).toBe(3);
  });

  it('round-trips back to the original pitch classes', () => {
    const there = transposeChart(blueBossa(), 5);
    const back = transposeChart(there, -5);
    expect(back.bars[0].slots[0].input).toBe('Cm7');
    expect(back.transpose).toBe(0);
  });

  it('preserves pins, slot ids and bar structure', () => {
    const chart = blueBossa();
    chart.pins = { [chart.bars[0].slots[0].id]: 'dorian' };
    const up = transposeChart(chart, 1);
    expect(up.pins).toEqual(chart.pins);
    expect(up.bars.length).toBe(chart.bars.length);
    expect(up.bars[0].slots[0].id).toBe(chart.bars[0].slots[0].id);
  });

  it('wraps the cumulative offset to the shortest interval', () => {
    expect(transposeChart(blueBossa(), 6).transpose).toBe(6);
    expect(transposeChart(blueBossa(), 7).transpose).toBe(-5);
    expect(transposeChart(blueBossa(), 12).transpose).toBe(0);
  });
});
