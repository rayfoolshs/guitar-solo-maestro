/**
 * Computer-keyboard piano layout, used when no MIDI controller is available
 * (or the browser blocks Web MIDI). A W S E D F T G Y H U J K = C4 … C5.
 */
export const COMPUTER_PIANO: ReadonlyArray<{ key: string; midi: number }> = [
  { key: 'a', midi: 60 },
  { key: 'w', midi: 61 },
  { key: 's', midi: 62 },
  { key: 'e', midi: 63 },
  { key: 'd', midi: 64 },
  { key: 'f', midi: 65 },
  { key: 't', midi: 66 },
  { key: 'g', midi: 67 },
  { key: 'y', midi: 68 },
  { key: 'h', midi: 69 },
  { key: 'u', midi: 70 },
  { key: 'j', midi: 71 },
  { key: 'k', midi: 72 },
];

export const COMPUTER_PIANO_MAP: Record<string, number> = Object.fromEntries(
  COMPUTER_PIANO.map((entry) => [entry.key, entry.midi]),
);

/** MIDI note for a keyboard key, or null when the key is not part of the layout. */
export function midiForKey(key: string): number | null {
  return COMPUTER_PIANO_MAP[key.toLowerCase()] ?? null;
}
