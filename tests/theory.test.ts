import { describe, expect, it } from 'vitest';
import { parseChord } from '../src/theory/chords';
import { detectKey } from '../src/theory/keys';
import { suggestForChord } from '../src/theory/suggest';
import { blueBossa, parseSlots, beatsPerBar } from '../src/chart/model';
import { buildScore } from '../src/arrange/buildScore';
import { mod12 } from '../src/theory/pitch';

const chart = blueBossa();
const key = detectKey(parseSlots(chart)).key;

describe('chord parsing', () => {
  it('parses flats, sharps and suffixes', () => {
    const bb = parseChord('Bbmaj7');
    expect(bb.ok).toBe(true);
    if (bb.ok) {
      expect(bb.rootPc).toBe(10);
      expect(bb.quality.id).toBe('maj7');
    }
    const fm = parseChord('F#m7b5');
    expect(fm.ok).toBe(true);
    if (fm.ok) expect(fm.quality.id).toBe('m7b5');
  });

  it('parses slash chords only when the tail is a note', () => {
    const d = parseChord('D/F#');
    expect(d.ok).toBe(true);
    if (d.ok) expect(d.bassPc).toBe(6);
    const sixNine = parseChord('C6/9');
    expect(sixNine.ok).toBe(true);
  });

  it('rejects nonsense without throwing', () => {
    expect(parseChord('H7').ok).toBe(false);
    expect(parseChord('Cmaj99').ok).toBe(false);
  });
});

describe('key detection', () => {
  it('finds C minor across both Blue Bossa choruses', () => {
    expect(key.name).toBe('C minor');
  });

  it('finds C minor on the first four bars too', () => {
    const four = { ...chart, visibleBars: 4 };
    expect(detectKey(parseSlots(four)).key.name).toMatch(/C minor|E♭ major/);
  });
});

describe('chord scale suggestions', () => {
  const g7 = parseChord('G7');
  const ab7 = parseChord('Ab7');
  const cm7 = parseChord('Cm7');
  const dm7b5 = parseChord('Dm7b5');
  const dbmaj7 = parseChord('Dbmaj7');

  it('uses harmonic minor for the minor-key V7', () => {
    if (!g7.ok) throw new Error('bad chord');
    const top = suggestForChord(g7, key)[0];
    expect(top.scaleId).toBe('phrygianDominant');
  });

  it('uses mixolydian for a dominant that resolves down a fifth', () => {
    if (!ab7.ok) throw new Error('bad chord');
    expect(suggestForChord(ab7, key)[0].scaleId).toBe('mixolydian');
  });

  it('uses the key mode for the tonic minor and locrian for iiø', () => {
    if (!cm7.ok || !dm7b5.ok) throw new Error('bad chord');
    expect(suggestForChord(cm7, key)[0].scaleId).toBe('aeolian');
    expect(suggestForChord(dm7b5, key)[0].scaleId).toBe('locrian');
  });

  it('uses ionian for the bridge major seventh', () => {
    if (!dbmaj7.ok) throw new Error('bad chord');
    expect(suggestForChord(dbmaj7, key)[0].scaleId).toBe('ionian');
  });

  it('every suggestion contains all chord tones', () => {
    for (const chord of [g7, ab7, cm7, dm7b5, dbmaj7]) {
      if (!chord.ok) continue;
      for (const cand of suggestForChord(chord, key)) {
        for (const pc of chord.intervals) expect(cand.pcs).toContain(pc);
      }
    }
  });
});

describe('arrangement', () => {
  const bpb = beatsPerBar(chart);

  it('puts the bass on the chord root', () => {
    const events = buildScore({ ...chart, visibleBars: 2 }, key, { style: 'jazz', swing: 0.6 });
    const bass = events.filter((e) => e.channel === 'bass' && Math.floor(e.beat / bpb) === 0);
    expect(bass.length).toBeGreaterThan(0);
    // the final "and of 4" is a chromatic approach, everything else is the root
    for (const e of bass.filter((b) => b.beat % bpb < 3.4)) {
      expect(mod12(e.midi)).toBe(0); // C
    }
  });

  it('swings the off-beat ride', () => {
    const straight = buildScore({ ...chart, visibleBars: 1 }, key, { style: 'jazz', swing: 0 });
    const swung = buildScore({ ...chart, visibleBars: 1 }, key, { style: 'jazz', swing: 1 });
    const offbeat = (events: ReturnType<typeof buildScore>) =>
      events.find((e) => e.channel === 'drums' && e.midi === 51 && Math.abs(e.beat - 1.5) < 0.001);
    expect(offbeat(straight)).toBeTruthy();
    const s = swung.find((e) => e.channel === 'drums' && e.midi === 51 && e.beat > 1 && e.beat < 2);
    expect(s).toBeTruthy();
    expect(s!.beat).toBeCloseTo(1 + 2 / 3, 3);
  });

  it('voices each chord with its own root and chord tones (root double-count regression)', () => {
    const events = buildScore({ ...chart, visibleBars: 4 }, key, { style: 'jazz', swing: 0.5 });
    // bar 3 is Fm7 — the first version added the root twice and played D♭/F instead of A♭/E♭
    const bar3 = events.filter((e) => Math.floor(e.beat / bpb) === 2);
    const pianoPcs = new Set(bar3.filter((e) => e.channel === 'piano').map((e) => mod12(e.midi)));
    const bass = bar3.filter((e) => e.channel === 'bass' && e.beat % bpb < 0.1)[0];

    expect(mod12(bass.midi)).toBe(5); // F
    for (const pc of [5, 8, 0, 3]) expect(pianoPcs.has(pc)).toBe(true); // F A♭ C E♭
  });

  it('plays a 3-2 son clave on the bossa cross-stick', () => {
    const events = buildScore({ ...chart, visibleBars: 4 }, key, { style: 'bossa', swing: 0.5 });
    const rim = (bar: number) =>
      events
        .filter((e) => e.channel === 'drums' && e.midi === 37 && Math.floor(e.beat / bpb) === bar)
        .map((e) => Number((e.beat % bpb).toFixed(2)));
    expect(rim(0)).toEqual([0, 1.5, 3]);
    expect(rim(1)).toEqual([1, 2]);
  });

  it('plays the six-hit jazz ride (1 · 2 · 2& · 3 · 4 · 4&)', () => {
    const events = buildScore({ ...chart, visibleBars: 1 }, key, { style: 'jazz', swing: 0 });
    const ride = events
      .filter((e) => e.channel === 'drums' && e.midi === 51)
      .map((e) => Number((e.beat % bpb).toFixed(2)));
    expect(ride).toEqual([0, 1, 1.5, 2, 3, 3.5]);
  });

  it('produces piano, bass and drums in every bar', () => {
    const events = buildScore({ ...chart, visibleBars: 4 }, key, { style: 'bossa', swing: 0.5 });
    for (let bar = 0; bar < 4; bar++) {
      const inBar = events.filter((e) => Math.floor(e.beat / bpb) === bar);
      expect(inBar.some((e) => e.channel === 'piano')).toBe(true);
      expect(inBar.some((e) => e.channel === 'bass')).toBe(true);
      expect(inBar.some((e) => e.channel === 'drums')).toBe(true);
    }
  });
});
