import { describe, expect, it } from 'vitest';
import { blueBossa } from '../src/chart/model';
import { normalizeChart, parseChartText, serializeChart, slugify } from '../src/chart/io';

const chart = blueBossa();

describe('chart io', () => {
  it('round-trips a chart through the versioned envelope', () => {
    const parsed = parseChartText(JSON.stringify(serializeChart(chart)));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.chart.name).toBe('Blue Bossa');
    expect(parsed.chart.bars.length).toBe(32);
    expect(parsed.chart.bars[0].slots[0].input).toBe('Cm7');
    expect(parsed.chart.style).toBe('bossa');
    expect(parsed.chart.tempo).toBe(140);
  });

  it('accepts a legacy bare chart object', () => {
    const parsed = parseChartText(JSON.stringify(chart));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.chart.name).toBe('Blue Bossa');
  });

  it('rejects malformed files', () => {
    expect(parseChartText('not json').ok).toBe(false);
    expect(parseChartText('[]').ok).toBe(false);
    expect(parseChartText('{"name":"empty"}').ok).toBe(false);
    expect(parseChartText(JSON.stringify({ chart: { name: 'no bars' } })).ok).toBe(false);
  });

  it('rejects oversized input before parsing', () => {
    const result = parseChartText('x'.repeat(1_000_001));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/too large/i);
  });

  it('clamps out-of-range values', () => {
    const normalized = normalizeChart({ ...chart, tempo: 999, swing: 5, visibleBars: 999, pianoOctave: 9 });
    expect(normalized).not.toBeNull();
    expect(normalized!.tempo).toBe(220);
    expect(normalized!.swing).toBe(1);
    expect(normalized!.visibleBars).toBe(32);
    expect(normalized!.pianoOctave).toBe(2);
  });

  it('strips unknown keys and prototype tricks', () => {
    const raw = JSON.parse('{"name":"X","bars":[{"slots":[{"input":"C"}]}],"polluted":true,"__proto__":{"hacked":true}}');
    const normalized = normalizeChart(raw);
    expect(normalized).not.toBeNull();
    expect((normalized as unknown as Record<string, unknown>).polluted).toBeUndefined();
    expect(({} as Record<string, unknown>).hacked).toBeUndefined();
  });

  it('regenerates unsafe or duplicate ids', () => {
    const raw = {
      name: 'Ids',
      bars: [
        { id: '__proto__', slots: [{ id: 'same', input: 'C' }] },
        { id: 'b', slots: [{ id: 'same', input: 'F' }] },
      ],
    };
    const normalized = normalizeChart(raw);
    expect(normalized).not.toBeNull();
    expect(normalized!.bars[0].id).not.toBe('__proto__');
    expect(normalized!.bars[0].slots[0].id).not.toBe(normalized!.bars[1].slots[0].id);
  });

  it('keeps two chords per bar in order', () => {
    const raw = { name: 'Two', bars: [{ slots: [{ beat: 2, input: 'G7' }, { beat: 0, input: 'Cm7' }] }] };
    const normalized = normalizeChart(raw);
    expect(normalized!.bars[0].slots.map((s) => s.input)).toEqual(['Cm7', 'G7']);
  });

  it('slugifies filenames', () => {
    expect(slugify('My Tune!')).toBe('my-tune');
    expect(slugify('  ')).toBe('chart');
    expect(slugify('A/B:C')).toBe('a-b-c');
  });
});
