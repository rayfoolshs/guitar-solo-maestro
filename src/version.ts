export const VERSION = '0.4.0';
export const BUILD_DATE = '2026-10-26';

export interface Release {
  version: string;
  date: string;
  title: string;
  items: string[];
}

/** Pre-release milestones. Newest first. */
export const HISTORY: Release[] = [
  {
    version: '0.4.0',
    date: '2026-10-26',
    title: 'Loop a range by dragging',
    items: [
      'Drag across the chart — chord lane, stave or scale lane — to set an A–B loop range.',
      'The range commits the moment you press, so a single click loops one bar, and it extends live as you drag.',
      'The header tracks it: "A–B 5–8" replaces the plain Loop button while a range is active.',
      'Pointer capture keeps the drag alive outside the chart, with a window-level fallback.',
      'An amber band marks the looped bars on the leadsheet.',
      'Published as a public repository with GitHub Pages deploying on every push.',
    ],
  },
  {
    version: '0.3.0',
    date: '2026-10-26',
    title: 'Print, docs and version history',
    items: [
      'Printing now reproduces the on-screen leadsheet — 8 bars a system on A4 landscape, title block, scale lane and summary.',
      'Staff lines rebuilt as plain boxes: five lines survive the print pipeline again (gradients and SVG both lost hairlines).',
      'Clef → key signature → time signature order fixed, and the left gutter is sized from the key.',
      'Version history in the header.',
      'Added CHANGELOG, BUILD_PLAN and refreshed README.',
    ],
  },
  {
    version: '0.2.0',
    date: '2026-10-26',
    title: 'Sound, groove and layout',
    items: [
      'General MIDI soundfont playback through Spessasynth (GeneralUser GS), with the built-in synth as fallback.',
      'Fixed a voicing bug that added the chord root twice — every chord whose root was not C played wrong notes.',
      'Root-position, scale-aware piano voicings; OCT −/+ shifts the piano by up to two octaves.',
      'Bossa nova now plays a real 3-2 son clave with 16th shaker and surdo kick; jazz ride corrected to 1 · 2 · 2& · 3 · 4 · 4&.',
      'Mixer moved to a compact rail left of the leadsheet.',
      'Drag across the stave to set the A–B loop range.',
      'Save-on-change in local storage.',
    ],
  },
  {
    version: '0.1.0',
    date: '2026-10-26',
    title: 'Core scale advisor',
    items: [
      'Chord parsing with aliases, slash chords and graceful failures.',
      'Key detection across 24 keys with confidence and runner-up.',
      'Per-chord chord-scale ranking with mode-of-parent labels, borrowed-note flags and transition arrows.',
      'Blue Bossa in C minor as the default 32-bar chart.',
      'Editable leadsheet: beat-level chord entry, 4–32 bar stepper, fit/comfortable views.',
      '24-fret fretboard with degrees, tensions, position windows and a ringed tonic.',
      'Three-piece arrangement engine with Jazz Swing, Rock and Bossa styles; tempo, count-in, loop and three-channel mixer.',
      '16 unit tests covering theory, voicings, bass, swing and drum patterns.',
    ],
  },
];
