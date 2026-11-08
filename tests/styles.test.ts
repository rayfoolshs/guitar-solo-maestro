import { describe, expect, it } from 'vitest';
import {
  blueBossa, cantaloupeIsland, mrPC, misty, parseSlots, beatsPerBar,
} from '../src/chart/model';
import { parseChord } from '../src/theory/chords';
import { detectKey } from '../src/theory/keys';
import { mod12 } from '../src/theory/pitch';
import { buildScore } from '../src/arrange/buildScore';
import { STYLES, STYLE_ORDER, effectiveSwing, groupedStyles, styleLabel } from '../src/arrange/styles';

const chart = blueBossa();
const key = detectKey(parseSlots(chart)).key;

describe('style descriptors', () => {
  it('has a definition and a label for every style', () => {
    for (const id of STYLE_ORDER) {
      expect(STYLES[id]).toBeTruthy();
      expect(STYLES[id].id).toBe(id);
      expect(styleLabel(id)).toBe(STYLES[id].label);
    }
  });

  it('groups every style exactly once', () => {
    const grouped = groupedStyles().flatMap((g) => g.styles.map((s) => s.id));
    expect(grouped.sort()).toEqual([...STYLE_ORDER].sort());
  });

  it('forces a full triplet feel for the shuffle and a straight feel for funk/rock/bossa', () => {
    expect(effectiveSwing('shuffle', 0)).toBe(1);
    expect(effectiveSwing('shuffle', 0.2)).toBe(1);
    expect(effectiveSwing('jazz', 0.62)).toBeCloseTo(0.62, 6);
    expect(effectiveSwing('funk', 0.62)).toBe(0);
    expect(effectiveSwing('rock', 0.62)).toBe(0);
    expect(effectiveSwing('bossa', 0.62)).toBe(0);
  });
});

describe('new styles', () => {
  const barEvents = (style: 'funk' | 'shuffle' | 'ballad', swing = 0.62) =>
    buildScore({ ...chart, visibleBars: 2 }, key, { style, swing });

  it('writes piano, bass and drums in every bar', () => {
    const bpb = beatsPerBar(chart);
    for (const style of ['funk', 'shuffle', 'ballad'] as const) {
      const events = barEvents(style);
      for (let bar = 0; bar < 2; bar++) {
        const inBar = events.filter((e) => Math.floor(e.beat / bpb) === bar);
        expect(inBar.some((e) => e.channel === 'piano')).toBe(true);
        expect(inBar.some((e) => e.channel === 'bass')).toBe(true);
        expect(inBar.some((e) => e.channel === 'drums')).toBe(true);
      }
    }
  });

  it('keeps funk straight even when a swing value is supplied', () => {
    const events = barEvents('funk', 0.62);
    const offbeatHats = events.filter(
      (e) => e.channel === 'drums' && e.midi === 42 && Math.abs(e.beat % 1 - 0.5) < 1e-6,
    );
    expect(offbeatHats.length).toBeGreaterThan(0);
  });

  it('places shuffle off-beats on the triplet (2/3 of the beat)', () => {
    const events = barEvents('shuffle', 0);
    const ride = events.find(
      (e) => e.channel === 'drums' && e.midi === 51 && e.beat > 1 && e.beat < 2,
    );
    expect(ride).toBeTruthy();
    expect(ride!.beat).toBeCloseTo(1 + 2 / 3, 3);
  });

  it('gives the ballad a sparser piano than jazz', () => {
    const jazz = buildScore({ ...chart, visibleBars: 1 }, key, { style: 'jazz', swing: 0.62 });
    const ballad = buildScore({ ...chart, visibleBars: 1 }, key, { style: 'ballad', swing: 0.62 });
    const piano = (events: ReturnType<typeof buildScore>) => events.filter((e) => e.channel === 'piano').length;
    expect(piano(ballad)).toBeLessThan(piano(jazz));
  });

  it('feathers the ballad kick and keeps it out of the way', () => {
    const events = barEvents('ballad');
    const kicks = events.filter((e) => e.channel === 'drums' && e.midi === 36);
    expect(kicks.length).toBeGreaterThan(0);
    expect(Math.max(...kicks.map((e) => e.velocity))).toBeLessThanOrEqual(20);
  });

  it('varies the jazz comping bar to bar', () => {
    const events = buildScore({ ...chart, visibleBars: 4 }, key, { style: 'jazz', swing: 0.5 });
    const onsets = [0, 1, 2, 3].map((bar) =>
      [...new Set(
        events
          .filter((e) => e.channel === 'piano' && Math.floor(e.beat / beatsPerBar(chart)) === bar)
          .map((e) => Number((e.beat % beatsPerBar(chart)).toFixed(2))),
      )].join(','),
    );
    expect(new Set(onsets).size).toBeGreaterThan(1);
  });

  it('uses rootless voicings for jazz and a low root for the ballad', () => {
    const jazz = buildScore({ ...chart, visibleBars: 1 }, key, { style: 'jazz', swing: 0.5 });
    const jazzPcs = new Set(jazz.filter((e) => e.channel === 'piano').map((e) => mod12(e.midi)));
    expect(jazzPcs.has(0)).toBe(false); // no C root in the Cm7 voicing

    const ballad = buildScore({ ...chart, visibleBars: 1 }, key, { style: 'ballad', swing: 0.5 });
    const balladPcs = new Set(ballad.filter((e) => e.channel === 'piano').map((e) => mod12(e.midi)));
    expect(balladPcs.has(0)).toBe(true); // low root included
  });

  it('gives the shuffle a root–third–seventh shell', () => {
    const events = buildScore({ ...chart, visibleBars: 1 }, key, { style: 'shuffle', swing: 1 });
    const pcs = new Set(events.filter((e) => e.channel === 'piano').map((e) => mod12(e.midi)));
    expect(pcs.has(0)).toBe(true);  // C
    expect(pcs.has(3)).toBe(true);  // E♭
    expect(pcs.has(10)).toBe(true); // B♭
  });
});

describe('preset charts', () => {
  const presets = [
    { build: cantaloupeIsland, name: 'Cantaloupe Island', bars: 16, style: 'funk', tempo: 100 },
    { build: mrPC, name: 'Mr. P.C.', bars: 12, style: 'shuffle', tempo: 152 },
    { build: misty, name: 'Misty', bars: 32, style: 'ballad', tempo: 66 },
  ] as const;

  it('has the documented lengths, styles and tempos', () => {
    for (const p of presets) {
      const c = p.build();
      expect(c.name).toBe(p.name);
      expect(c.bars.length).toBe(p.bars);
      expect(c.visibleBars).toBe(p.bars);
      expect(c.style).toBe(p.style);
      expect(c.tempo).toBe(p.tempo);
    }
  });

  it('only uses chord symbols the parser understands', () => {
    for (const p of presets) {
      const c = p.build();
      const slots = c.bars.flatMap((b) => b.slots);
      expect(slots.length).toBeGreaterThan(0);
      for (const slot of slots) {
        expect(parseChord(slot.input).ok, `${p.name}: ${slot.input}`).toBe(true);
      }
    }
  });

  it('spreads multi-chord bars across the bar (Misty)', () => {
    const c = misty();
    const twoChordBars = c.bars.filter((b) => b.slots.length === 2);
    expect(twoChordBars.length).toBeGreaterThan(0);
    for (const bar of twoChordBars) {
      expect(bar.slots.map((s) => s.beat)).toEqual([0, 2]);
    }
  });

  it('detects a sensible key for each preset', () => {
    expect(detectKey(parseSlots(cantaloupeIsland())).key.name).toBe('F minor');
    expect(detectKey(parseSlots(mrPC())).key.name).toBe('C minor');
    expect(detectKey(parseSlots(misty())).key.name).toBe('E♭ major');
  });
});
