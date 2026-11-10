import { describe, expect, it } from 'vitest';
import { COMPUTER_PIANO, midiForKey } from '../src/audio/computerKeys';

describe('computer keyboard piano', () => {
  it('maps A–K to one octave from C4', () => {
    expect(midiForKey('a')).toBe(60);
    expect(midiForKey('w')).toBe(61);
    expect(midiForKey('s')).toBe(62);
    expect(midiForKey('k')).toBe(72);
  });

  it('is chromatic and has 13 keys', () => {
    expect(COMPUTER_PIANO).toHaveLength(13);
    COMPUTER_PIANO.forEach((entry, i) => expect(entry.midi).toBe(60 + i));
  });

  it('ignores upper case and keys outside the layout', () => {
    expect(midiForKey('A')).toBe(60);
    expect(midiForKey('l')).toBeNull();
    expect(midiForKey(' ')).toBeNull();
  });
});
