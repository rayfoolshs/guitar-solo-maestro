export const VERSION = '0.11.0';
export const BUILD_DATE = '2026-11-10';

export interface Release {
  version: string;
  date: string;
  title: string;
  items: string[];
}

/** Pre-release milestones. Newest first. */
export const HISTORY: Release[] = [
  {
    version: '0.11.0',
    date: '2026-11-10',
    title: 'Key transposition and analysis line',
    items: [
      'Picking a key in the header now transposes every chord into that key by the shortest interval.',
      'Auto clears the manual key and returns to detection without moving the chords again.',
      'The analysis line now sits inside the Leadsheet card, directly under its heading and above the chart.',
    ],
  },
  {
    version: '0.10.0',
    date: '2026-11-10',
    title: 'Keyboard view and live MIDI input',
    items: [
      'Toggle Keyboard in the board header to see the suggested scale on a piano instead of the neck.',
      'Three octaves are written on a grand stave — bass clef below middle C, treble clef above — with right-hand fingering.',
      'Clefs, brace and accidentals are Bravura SMuFL glyphs; stems and ledger lines follow the stave.',
      'Three octaves of keyboard show the tonic in amber, chord tones in teal and other scale tones in sand.',
      'Live MIDI input plays Piano, Organ, Flute or Saxophone (piano default); the keys and stave light up red while held.',
      'A–K on the computer keyboard and clicking a key work when Web MIDI is unavailable.',
    ],
  },
  {
    version: '0.9.0',
    date: '2026-11-08',
    title: 'Transpose charts',
    items: [
      'Transpose the whole chart up or down a semitone from the mixer; chords, key, analysis and playback follow.',
      'Chord spelling follows the destination key, and the offset shows the cumulative transposition.',
      'Click the offset to reset to the original key. Transposing while playing applies from the next bar.',
    ],
  },
  {
    version: '0.8.0',
    date: '2026-11-08',
    title: 'MIDI export',
    items: [
      'Export the current arrangement as a Standard MIDI File: format 1, PPQ 480, separate piano, bass and drums tracks.',
      'Tempo, time signature and swing match playback; the visible bars are exported without count-in or loop.',
      'Chart ▾ → Export MIDI… downloads name.mid.',
    ],
  },
  {
    version: '0.7.0',
    date: '2026-11-08',
    title: 'Save, load and back up charts',
    items: [
      'My charts library: snapshot the working chart, then update, rename, duplicate, delete and reload saved versions.',
      'Versioned JSON export/import (.gsm.json) with strict validation, value clamping and a 1 MB cap.',
      'Top-level New chart button, with a confirmation before replacing a chart that already has chords.',
      'The library is capped at 100 charts and lives separately from the autosaved working chart.',
    ],
  },
  {
    version: '0.6.1',
    date: '2026-11-08',
    title: 'Better piano comping',
    items: [
      'Piano now plays voice-led rootless voicings for jazz, funk and bossa: guide tones plus a scale colour tone, with the root left to the bass.',
      'Ballads add a low root under the guide tones; the blues shuffle uses a root–third–seventh shell; rock keeps its power chords.',
      'Comping rhythms vary across two- and four-bar cycles instead of repeating the same pattern every bar.',
    ],
  },
  {
    version: '0.6.0',
    date: '2026-11-08',
    title: 'Core 100 standards library',
    items: [
      'A bundled Core 100 standards library with search, style filters and idiom tags, loadable from the header or the Chart menu.',
      'New lead-sheet chord qualities: 7♭9, 7♯9, 7♯11, 7♭13, 7♭5, 7♯5, alt, 9♯11, 13♯11, 11, m11, maj7♯11, m(maj7), m(add9) and add11.',
      'Bar cap raised from 32 to 64 for long forms such as Cherokee (64) and All the Things You Are (36).',
      'Charts now carry composer, year, form and tags, shown in the leadsheet and print header.',
      'Opening a standard stops playback and starts on bar 1.',
    ],
  },
  {
    version: '0.5.1',
    date: '2026-11-08',
    title: 'Live tempo changes',
    items: [
      'Changing the tempo while playing now takes effect from the next bar instead of waiting for the next Play.',
      'The sounding bar finishes at its scheduled tempo; bar position, the bar counter and the fretboard highlight follow the new tempo.',
    ],
  },
  {
    version: '0.5.0',
    date: '2026-11-08',
    title: 'Funk, shuffle and ballad',
    items: [
      'Three new feels: Funk (straight 16ths), Blues Shuffle (12/8 triplet) and Jazz Ballad (sparse brushes).',
      'Style definitions live in one descriptor table; the style menu is grouped Jazz / Groove / Latin and the swing slider enables per style.',
      'New preset charts: Cantaloupe Island, Mr. P.C. and Misty.',
      'Changing style, swing or key while playing now re-arranges from the next bar instead of waiting for the next Play.',
      'Loading a preset stops playback before swapping the chart.',
    ],
  },
  {
    version: '0.4.2',
    date: '2026-11-03',
    title: 'Fretboard oriented like the guitar',
    items: [
      'The fretboard is drawn as the neck looks in playing position: low E on the bottom row, high E on top.',
      'Reading from the lowest string up gives E A D G B E; string thickness and the position dots follow the strings.',
    ],
  },
  {
    version: '0.4.1',
    date: '2026-10-28',
    title: 'Sustain chords through blank bars',
    items: [
      'A blank bar now repeats the chord from the bar before it instead of falling silent.',
      'Chords carry through any run of empty bars, and stop when the next chord is entered.',
    ],
  },
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
