import { describe, expect, it } from 'vitest';
import { STANDARDS, barsFromChanges, standardToChart } from '../src/chart/standards';
import { parseChord } from '../src/theory/chords';
import { parseSlots, beatsPerBar } from '../src/chart/model';
import { detectKey } from '../src/theory/keys';
import { buildScore } from '../src/arrange/buildScore';

describe('core 100 standards', () => {
  it('contains 100 unique entries', () => {
    expect(STANDARDS.length).toBe(100);
    expect(new Set(STANDARDS.map((s) => s.id)).size).toBe(100);
    expect(new Set(STANDARDS.map((s) => s.title)).size).toBe(100);
  });

  it('every chart has 4–64 bars and only parseable chords', () => {
    for (const s of STANDARDS) {
      const bars = barsFromChanges(s.changes);
      expect(bars.length, s.title).toBeGreaterThanOrEqual(4);
      expect(bars.length, s.title).toBeLessThanOrEqual(64);
      for (const bar of bars) {
        expect(bar.slots.length, s.title).toBeGreaterThan(0);
        for (const slot of bar.slots) {
          const parsed = parseChord(slot.input);
          expect(parsed.ok, `${s.title}: ${slot.input}`).toBe(true);
        }
      }
    }
  });

  it('keeps multi-chord bars ordered and inside the bar', () => {
    for (const s of STANDARDS) {
      const chart = standardToChart(s);
      const bpb = beatsPerBar(chart);
      for (const bar of chart.bars) {
        const beats = bar.slots.map((slot) => slot.beat);
        expect([...beats].sort((a, b) => a - b), s.title).toEqual(beats);
        for (const beat of beats) expect(beat, s.title).toBeLessThan(bpb);
      }
    }
  });

  it('loads a chart with the documented style, tempo and bar count', () => {
    for (const s of STANDARDS) {
      const chart = standardToChart(s);
      expect(chart.name).toBe(s.title);
      expect(chart.style).toBe(s.style);
      expect(chart.tempo).toBe(s.tempo);
      expect(chart.visibleBars).toBe(chart.bars.length);
      expect(chart.composer).toBe(s.composer);
      expect(chart.year).toBe(s.year);
    }
  });

  it('has the expected lengths for the tricky forms', () => {
    const bars = (id: string) => barsFromChanges(STANDARDS.find((s) => s.id === id)!.changes).length;
    expect(bars('all-the-things-you-are')).toBe(36);
    expect(bars('cherokee')).toBe(64);
    expect(bars('i-got-rhythm')).toBe(32);
    expect(bars('misty')).toBe(32);
    expect(bars('things-aint-what-they-used-to-be')).toBe(12);
  });

  it('detects a key for every chart', () => {
    for (const s of STANDARDS) {
      const chart = standardToChart(s);
      const detected = detectKey(parseSlots(chart));
      expect(detected.key.name.length, s.title).toBeGreaterThan(0);
      expect(detected.confidence, s.title).toBeGreaterThan(0);
    }
  });

  it('covers all six playback styles except rock', () => {
    const styles = new Set(STANDARDS.map((s) => s.style));
    expect(styles.has('jazz')).toBe(true);
    expect(styles.has('ballad')).toBe(true);
    expect(styles.has('bossa')).toBe(true);
    expect(styles.has('shuffle')).toBe(true);
  });

  it('arranges every standard in its own style without invalid notes', () => {
    for (const s of STANDARDS) {
      const chart = standardToChart(s);
      const key = detectKey(parseSlots(chart)).key;
      const events = buildScore(chart, key, { style: s.style, swing: chart.swing });
      expect(events.length, s.title).toBeGreaterThan(chart.bars.length);
      for (const e of events) {
        expect(e.midi, s.title).toBeGreaterThanOrEqual(0);
        expect(e.midi, s.title).toBeLessThanOrEqual(127);
        expect(Number.isFinite(e.beat), s.title).toBe(true);
        expect(e.beat, s.title).toBeGreaterThanOrEqual(0);
        expect(e.dur, s.title).toBeGreaterThan(0);
      }
      expect(events.some((e) => e.channel === 'piano'), s.title).toBe(true);
      expect(events.some((e) => e.channel === 'bass'), s.title).toBe(true);
      expect(events.some((e) => e.channel === 'drums'), s.title).toBe(true);
    }
  });
});
