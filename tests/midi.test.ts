import { describe, expect, it } from 'vitest';
import { blueBossa } from '../src/chart/model';
import { parseSlots } from '../src/chart/model';
import { detectKey } from '../src/theory/keys';
import { buildScore } from '../src/arrange/buildScore';
import { MIDI_PPQ, buildMidiFile } from '../src/arrange/midi';

const chart = blueBossa();
const key = detectKey(parseSlots(chart)).key;

interface RawEvent {
  tick: number;
  status: number;
  type?: number;
  payload?: Uint8Array;
  data?: number[];
}

interface Chunk {
  id: string;
  data: Uint8Array;
}

const ascii = (bytes: Uint8Array) => new TextDecoder().decode(bytes);

const be32 = (bytes: Uint8Array, offset: number) =>
  ((bytes[offset] << 24) >>> 0) + (bytes[offset + 1] << 16) + (bytes[offset + 2] << 8) + bytes[offset + 3];

const readVlq = (bytes: Uint8Array, offset: number) => {
  let value = 0;
  let cursor = offset;
  let byte = 0;
  do {
    byte = bytes[cursor++];
    value = (value << 7) | (byte & 0x7f);
  } while (byte & 0x80);
  return { value, next: cursor };
};

function chunksOf(bytes: Uint8Array): Chunk[] {
  const chunks: Chunk[] = [];
  let offset = 0;
  while (offset < bytes.length) {
    const id = ascii(bytes.slice(offset, offset + 4));
    const length = be32(bytes, offset + 4);
    chunks.push({ id, data: bytes.slice(offset + 8, offset + 8 + length) });
    offset += 8 + length;
  }
  return chunks;
}

function parseTrack(data: Uint8Array): RawEvent[] {
  const events: RawEvent[] = [];
  let offset = 0;
  let tick = 0;
  while (offset < data.length) {
    const delta = readVlq(data, offset);
    tick += delta.value;
    offset = delta.next;
    const status = data[offset++];

    if (status === 0xff) {
      const type = data[offset++];
      const length = readVlq(data, offset);
      offset = length.next;
      const payload = data.slice(offset, offset + length.value);
      offset += length.value;
      events.push({ tick, status, type, payload });
      continue;
    }

    const high = status & 0xf0;
    if (high === 0xc0 || high === 0xd0) {
      events.push({ tick, status, data: [data[offset++]] });
    } else {
      events.push({ tick, status, data: [data[offset++], data[offset++]] });
    }
  }
  return events;
}

describe('MIDI export', () => {
  const events = buildScore({ ...chart, visibleBars: 2 }, key, { style: 'bossa', swing: 0.5 });
  const bytes = buildMidiFile({ ...chart, visibleBars: 2 }, events);
  const chunks = chunksOf(bytes);

  it('writes a format-1 header with four tracks and PPQ 480', () => {
    expect(ascii(bytes.slice(0, 4))).toBe('MThd');
    expect(be32(bytes, 4)).toBe(6);
    expect(bytes[8]).toBe(0);
    expect(bytes[9]).toBe(1); // format 1
    expect((bytes[10] << 8) + bytes[11]).toBe(4); // conductor + 3 parts
    expect((bytes[12] << 8) + bytes[13]).toBe(MIDI_PPQ);
    expect(chunks.map((c) => c.id)).toEqual(['MThd', 'MTrk', 'MTrk', 'MTrk', 'MTrk']);
  });

  it('writes tempo and time signature in the conductor track', () => {
    const meta = parseTrack(chunks[1].data);
    const tempo = meta.find((e) => e.type === 0x51);
    expect(tempo).toBeTruthy();
    const microseconds = (tempo!.payload![0] << 16) + (tempo!.payload![1] << 8) + tempo!.payload![2];
    expect(Math.round(60_000_000 / microseconds)).toBe(chart.tempo);

    const signature = meta.find((e) => e.type === 0x58);
    expect(signature?.payload && [...signature.payload.slice(0, 2)]).toEqual([4, 2]);

    expect(meta.some((e) => e.type === 0x2f)).toBe(true);
  });

  it('emits one note-on per scored event on the matching channel', () => {
    const specs = [
      { index: 2, channel: 'piano' as const, status: 0x90 },
      { index: 3, channel: 'bass' as const, status: 0x91 },
      { index: 4, channel: 'drums' as const, status: 0x99 },
    ];
    for (const spec of specs) {
      const track = parseTrack(chunks[spec.index].data);
      const noteOns = track.filter((e) => (e.status & 0xf0) === 0x90);
      expect(noteOns.length).toBe(events.filter((e) => e.channel === spec.channel).length);
      expect(noteOns.every((e) => (e.status & 0x0f) === (spec.status & 0x0f))).toBe(true);
    }
  });

  it('pairs every note-on with a later note-off', () => {
    for (const index of [2, 3, 4]) {
      const active = new Map<number, number>();
      for (const event of parseTrack(chunks[index].data)) {
        const high = event.status & 0xf0;
        if (high === 0x90) {
          const pitch = event.data![0];
          active.set(pitch, (active.get(pitch) ?? 0) + 1);
        } else if (high === 0x80) {
          const pitch = event.data![0];
          expect(active.get(pitch) ?? 0).toBeGreaterThan(0);
          active.set(pitch, (active.get(pitch) ?? 1) - 1);
        }
      }
      expect([...active.values()].every((count) => count === 0)).toBe(true);
    }
  });

  it('places the shuffle ride off-beat on tick 320', () => {
    const shuffleChart = { ...chart, visibleBars: 1 };
    const shuffleEvents = buildScore(shuffleChart, key, { style: 'shuffle', swing: 1 });
    const shuffleChunks = chunksOf(buildMidiFile(shuffleChart, shuffleEvents));
    const ride = parseTrack(shuffleChunks[4].data).filter(
      (e) => (e.status & 0xf0) === 0x90 && e.data![0] === 51,
    );
    expect(ride.some((e) => e.tick === 320)).toBe(true);
  });

  it('writes a 3/4 signature for waltzes', () => {
    const waltz = { ...chart, timeSignature: '3/4' as const, visibleBars: 1 };
    const waltzChunks = chunksOf(buildMidiFile(waltz, buildScore(waltz, key, { style: 'jazz', swing: 0.5 })));
    const signature = parseTrack(waltzChunks[1].data).find((e) => e.type === 0x58);
    expect(signature?.payload && [...signature.payload.slice(0, 2)]).toEqual([3, 2]);
  });
});
