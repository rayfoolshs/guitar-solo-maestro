import { describe, expect, it } from 'vitest';
import { MIDI_INSTRUMENTS, parseMidiMessage, programOf } from '../src/audio/midiInput';

describe('MIDI message parsing', () => {
  it('reads note on with velocity', () => {
    expect(parseMidiMessage(new Uint8Array([0x90, 60, 100]))).toEqual({ midi: 60, velocity: 100, on: true });
  });

  it('reads note off from 0x80 and from note-on with velocity 0', () => {
    expect(parseMidiMessage(new Uint8Array([0x80, 60, 40]))).toEqual({ midi: 60, velocity: 0, on: false });
    expect(parseMidiMessage(new Uint8Array([0x90, 60, 0]))).toEqual({ midi: 60, velocity: 0, on: false });
  });

  it('ignores the channel nibble', () => {
    expect(parseMidiMessage(new Uint8Array([0x93, 64, 90]))).toEqual({ midi: 64, velocity: 90, on: true });
    expect(parseMidiMessage(new Uint8Array([0x85, 64, 0]))).toEqual({ midi: 64, velocity: 0, on: false });
  });

  it('treats controller 123 as all notes off', () => {
    expect(parseMidiMessage(new Uint8Array([0xb0, 123, 0]))).toEqual({
      midi: -1, velocity: 0, on: false, allOff: true,
    });
  });

  it('ignores control changes, pitch bend and empty messages', () => {
    expect(parseMidiMessage(new Uint8Array([0xb0, 64, 127]))).toBeNull();
    expect(parseMidiMessage(new Uint8Array([0xe0, 0, 64]))).toBeNull();
    expect(parseMidiMessage(new Uint8Array([0x90]))).toBeNull();
    expect(parseMidiMessage(null)).toBeNull();
  });
});

describe('MIDI instruments', () => {
  it('offers piano, organ, flute and saxophone', () => {
    expect(MIDI_INSTRUMENTS.map((i) => i.label)).toEqual(['Piano', 'Organ', 'Flute', 'Saxophone']);
  });

  it('defaults to piano', () => {
    expect(programOf('piano')).toBe(0);
  });

  it('maps each instrument to its GM program', () => {
    expect(programOf('organ')).toBe(19);
    expect(programOf('flute')).toBe(73);
    expect(programOf('sax')).toBe(65);
  });
});
