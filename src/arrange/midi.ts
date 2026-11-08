import type { ChannelId, NoteEvent } from './buildScore';
import type { Chart } from '../chart/model';
import { slugify } from '../chart/io';

const PPQ = 480;
const DEFAULT_VELOCITY = 96;

const TRACKS: Array<{ channel: ChannelId; name: string; midiChannel: number; program: number | null }> = [
  { channel: 'piano', name: 'Piano', midiChannel: 0, program: 0 },
  { channel: 'bass', name: 'Bass', midiChannel: 1, program: 32 },
  { channel: 'drums', name: 'Drums', midiChannel: 9, program: null },
];

const encodeVlq = (value: number): number[] => {
  let v = Math.max(0, Math.floor(value));
  const bytes = [v & 0x7f];
  v >>>= 7;
  while (v > 0) {
    bytes.unshift((v & 0x7f) | 0x80);
    v >>>= 7;
  }
  return bytes;
};

const be32 = (value: number): number[] => [
  (value >>> 24) & 0xff,
  (value >>> 16) & 0xff,
  (value >>> 8) & 0xff,
  value & 0xff,
];

const ascii = (text: string): number[] => [...text].map((c) => c.charCodeAt(0) & 0x7f);

class TrackWriter {
  private bytes: number[] = [];
  private lastTick = 0;

  event(tick: number, data: number[]) {
    const at = Math.max(0, Math.round(tick));
    this.bytes.push(...encodeVlq(at - this.lastTick), ...data);
    this.lastTick = at;
  }

  meta(type: number, payload: number[]) {
    this.event(this.lastTick, [0xff, type, ...encodeVlq(payload.length), ...payload]);
  }

  finished(): number[] {
    this.event(this.lastTick, [0xff, 0x2f, 0x00]);
    return this.bytes;
  }
}

const chunk = (id: string, data: number[]): number[] => [
  ...ascii(id),
  ...be32(data.length),
  ...data,
];

const trackChunk = (data: number[]): number[] => chunk('MTrk', data);

const clampVelocity = (velocity: number): number =>
  Math.max(1, Math.min(127, Math.round(Number.isFinite(velocity) ? velocity : DEFAULT_VELOCITY)));

const toTick = (beats: number): number => Math.max(0, Math.round(beats * PPQ));

function metaTrack(chart: Chart): number[] {
  const track = new TrackWriter();
  track.meta(0x03, ascii('Conductor'));

  const tempo = Math.round(60_000_000 / Math.max(40, Math.min(220, chart.tempo)));
  track.event(0, [0xff, 0x51, 0x03, (tempo >>> 16) & 0xff, (tempo >>> 8) & 0xff, tempo & 0xff]);

  const [numerator, denominator] = chart.timeSignature === '3/4' ? [3, 4] : [4, 4];
  const denominatorPower = Math.log2(denominator);
  track.event(0, [0xff, 0x58, 0x04, numerator, denominatorPower, 24, 8]);

  return trackChunk(track.finished());
}

function noteTrack(events: NoteEvent[], midiChannel: number, program: number | null, name: string): number[] {
  const track = new TrackWriter();
  track.meta(0x03, ascii(name));
  if (program !== null) track.event(0, [0xc0 | midiChannel, program & 0x7f]);

  const messages = events.flatMap((event) => {
    const onTick = toTick(event.beat);
    const offTick = Math.max(onTick + 1, toTick(event.beat + event.dur));
    const midi = Math.max(0, Math.min(127, Math.round(event.midi)));
    return [
      {
        tick: onTick,
        order: 1,
        data: [0x90 | midiChannel, midi, clampVelocity(event.velocity)],
      },
      {
        tick: offTick,
        order: 0,
        data: [0x80 | midiChannel, midi, 0],
      },
    ];
  });

  // Note-offs sort before note-ons at the same tick so repeated pitches retrigger cleanly.
  messages.sort((a, b) => a.tick - b.tick || a.order - b.order);
  for (const message of messages) track.event(message.tick, message.data);

  return trackChunk(track.finished());
}

/** Build a format-1 Standard MIDI File from the same events the transport plays. */
export function buildMidiFile(chart: Chart, events: NoteEvent[]): Uint8Array {
  const header = chunk('MThd', [0, 1, 0, TRACKS.length + 1, (PPQ >>> 8) & 0xff, PPQ & 0xff]);

  const tracks = [metaTrack(chart)];
  for (const spec of TRACKS) {
    tracks.push(noteTrack(events.filter((e) => e.channel === spec.channel), spec.midiChannel, spec.program, spec.name));
  }

  const bytes = [...header, ...tracks.flat()];
  return new Uint8Array(bytes);
}

/** Serialize and download the arrangement as a .mid file. */
export function downloadMidi(chart: Chart, events: NoteEvent[]): void {
  const bytes = buildMidiFile(chart, events);
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'audio/midi' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${slugify(chart.name || 'chart')}.mid`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export const MIDI_PPQ = PPQ;
