# Changelog

All notable changes to Guitar Solo Maestro. Pre-release milestones while the app is
being built; newest first.

## 0.9.0 — 2026-11-08 · Transpose charts

- **Transpose control in the mixer** — step the whole chart up or down a semitone; the
  offset is shown next to the buttons and clicking it resets to the original key.
- `transposeChart()` rewrites every chord symbol, updates a manual key, and stores the
  cumulative offset on the chart. `transposeChordSymbol()` handles slash basses, keeps the
  quality suffix intact and avoids mistaking `6/9` for a slash chord.
- Spelling follows the destination key (flats for flat keys, sharps otherwise), so repeated
  transposition stays readable.
- The transposed chart feeds the existing analysis, playback and MIDI export. Doing it
  while playing applies from the next bar.
- `transpose` is persisted in saved charts and validated on import.
- Tests: 78 total, adding chord-symbol and chart-transposition coverage.

## 0.8.0 — 2026-11-08 · MIDI export

- **Export MIDI** from `Chart ▾ → Export MIDI…` writes a Standard MIDI File for the
  current arrangement, matching what the transport plays.
- Format 1, **PPQ 480**, with a conductor track (tempo + time signature) and separate
  **piano**, **bass** and **drums** tracks on channels 1, 2 and 10 with the same GM
  programs as playback.
- Swing and comping are already baked into the note events, so shuffle off-beats land on
  exact triplet ticks (2/3 beat = 320 ticks). Only the visible bars are exported — no
  count-in, loop or mixer volume/mute state.
- Hand-rolled SMF writer in `src/arrange/midi.ts`; no new dependencies.
- Added a `docs/` set — user guide, architecture, Core 100, chart format and MIDI export —
  mirrored into `public/docs/` and served at `/docs/` in the built site (`npm run docs:sync`).
- Tests: 67 total, adding MIDI header, tempo, meter, track, pairing and shuffle-tick checks.

## 0.7.0 — 2026-11-08 · Save, load and back up charts

- **My charts library** — open `Chart ▾ → My charts…` or the **Charts** button in the
  header. Snapshot the working chart, then **Update**, **Rename**, **Duplicate**,
  **Delete** or **Load** any saved version. Saved charts persist in
  `localStorage['gsm.charts.v1']`, separate from the working-chart autosave.
- **JSON backup** — **Export JSON** writes a versioned `.gsm.json` file; **Import JSON**
  restores one. Import validates field by field, clamps tempo/swing/bar ranges, strips
  unknown keys and prototype tricks, regenerates unsafe ids, and rejects files over 1 MB.
- **New chart button** in the header, with a confirmation when the current chart has
  chords. Menu entries remain for both libraries.
- Library guards: 100-chart cap, 1 MB storage cap, typed quota errors and corrupted-entry
  recovery.
- Tests: 61 total, adding chart-io and library coverage.

## 0.6.1 — 2026-11-08 · Better piano comping

- **Rootless, voice-led voicings** for jazz, funk and bossa: third + seventh (or sixth)
  plus a scale-aware colour tone, placed near the previous voicing and with the root left
  to the bass. No more stacked root-position chords.
- **Ballad** voicings add a low root under the guide tones; the **blues shuffle** uses a
  root–third–seventh shell; **rock** keeps its power chords.
- **Comping rhythms now vary** over two- and four-bar cycles for every style instead of
  repeating one pattern each bar — syncopated jazz, pushier funk, a second ballad shape,
  a lighter rock bar and a two-bar bossa figure.
- Tests: 44 total, adding comping-variation, rootless-voicing and shell-voicing coverage,
  plus a full arrangement check across all 100 standards.

## 0.6.0 — 2026-11-08 · Core 100 standards library

- **Core 100 standards library** — a bundled, searchable list of 100 jazz standards,
  openable from the **Standards** button in the header or `Chart ▾ → Core 100 standards…`.
  Filter by title/composer/year, by playback style (Swing, Ballad, Blues, Latin) and by
  idiom tag (bebop, latin, blues, standard…).
- 100 charts spanning swing, ballads, blues and Latin feels; each carries composer, year,
  form and tags, which now appear in the leadsheet/print header.
- **New chord qualities** in the parser and chord-scale engine: `7♭9`, `7♯9`, `7♯11`,
  `7♭13`, `7♭5`, `7♯5`, `alt`, `9♯11`, `13♯11`, `11`, `m11`, `maj7♯11`, `m(maj7)`,
  `m(add9)` and `add11`.
- **Bar cap raised from 32 to 64** so long forms load in full — Cherokee (64 bars) and
  All the Things You Are (36 bars) are included.
- Loading a standard stops playback and selects bar 1; the chart keeps its style, tempo,
  metadata and swing defaults.
- Tests: 40 total, adding standards-dataset integrity and extended-chord coverage.

## 0.5.1 — 2026-11-08 · Live tempo changes

- Changing the tempo while playing now applies from the next bar, without stopping the
  transport. The bar already sounding finishes at its scheduled tempo, and the bar
  position, mixer counter and fretboard highlight follow the new tempo.
- Bar position is now derived from the scheduler's bar log instead of a fixed
  anchor/duration pair, so consecutive bars can have different durations safely.

## 0.5.0 — 2026-11-08 · Funk, shuffle and ballad

- Three new playback feels, alongside the existing Jazz Swing, Rock and Bossa Nova:
  - **Funk** — straight 16ths, short piano stabs, syncopated kick and 16th hats.
  - **Blues Shuffle** — 12/8 triplet feel, 1–5–6–♭7 bass, ride on every beat and its
    triplet "a". The swing slider is disabled because a shuffle is a fixed feel.
  - **Jazz Ballad** — sparse sustained voicings, half-note bass and brushes at 66 bpm.
- Style definitions moved into `src/arrange/styles.ts`; `buildScore` reads a style's
  feel and swing policy instead of branching on names, and both style menus are grouped
  **Jazz / Groove / Latin**.
- New preset charts, loadable from `Chart ▾`: **Cantaloupe Island** (16 bars, funk),
  **Mr. P.C.** (12-bar minor blues, shuffle) and **Misty** (32-bar AABA ballad).
- Changing style, swing or key **while playing** now re-arranges from the next scheduled
  bar (`engine.setEvents`), rather than taking effect only on the next Play.
- Loading a preset stops playback before swapping the chart.
- Tests: 28 total, adding style-descriptor, groove and preset-chart coverage.

## 0.4.2 — 2026-11-03 · Fretboard oriented like the guitar

- **Fixed:** the fretboard was mirrored — the low E rendered on the top row. Strings now
  run low E (bottom) up to high E (top), so reading from the lowest string up gives
  E A D G B E, the way the neck looks in playing position. String thickness and the
  position dot markers follow the strings.

## 0.4.1 — 2026-10-28 · Sustain chords through blank bars

- **Fixed:** an empty bar now inherits the previous chord instead of dropping to silence, so
  a chord written once keeps playing across any run of blank bars until the next chord is
  entered.

## 0.4.0 — 2026-10-26 · Loop a range by dragging

- Drag across the chart — chord lane, stave or scale lane — to set an **A–B loop range**.
  It commits on press (a click loops one bar) and extends live as you drag.
- The header shows the active range (`A–B 5–8`); an amber band marks the looped bars.
- Pointer capture on the system keeps the drag alive outside the chart, with a window-level
  fallback for safety.
- Distribution: public source repository, with `.github/workflows/deploy.yml` running tests,
  build and the Pages deploy on every push to `main`.

## 0.3.0 — 2026-10-26 · Print, docs and version history

- Printing reproduces the on-screen leadsheet: 8 bars per system, A4 landscape, title
  block, scale lane and whole-progression line.
- Staff lines rebuilt as plain 1 px boxes. CSS gradients and SVG `<line>`s both lost
  hairlines in the print pipeline.
- Notation order corrected to clef → key signature → time signature; the left gutter is
  now sized from the key signature instead of a fixed 150 px.
- The mobile media query no longer matches the A4 page box (it was hiding the clef and
  key signature when printing).
- Version history added to the header (`v0.3.0` badge → modal).
- Added `CHANGELOG.md`, `BUILD_PLAN.md`; refreshed `README.md`.

## 0.2.0 — 2026-10-26 · Sound, groove and layout

- General MIDI soundfont playback through Spessasynth (`spessasynth_lib`) with GeneralUser
  GS, loaded on first Play and cached in memory; the built-in synth remains the fallback.
- **Fixed:** piano voicings added the chord root twice, so every chord whose root was not C
  played the wrong notes. Voicings are now root-position and scale-aware.
- Piano **OCT −/+** control transposes the voicing up to two octaves.
- **Bossa nova drums** now play a proper 3-2 son clave (1 · 2& · 4 / 2 · 3) with a 16th
  shaker and a surdo-style kick on 1 and 3.
- **Jazz ride** corrected to the six-hit pattern (1 · 2 · 2& · 3 · 4 · 4&).
- Mixer moved to a compact rail to the left of the leadsheet.
- **Drag across the stave** to set the A–B loop range; the header shows the range.
- Chart auto-saves to `localStorage` on every change.

## 0.1.0 — 2026-10-26 · Core scale advisor

- Chord parsing with aliases, slash chords and graceful failures (`H7` is reported, not
  crashed).
- Key detection across 24 keys with confidence and a runner-up key.
- Per-chord chord-scale ranking: mode-of-parent labels, borrowed-note flags, transition
  arrows.
- Blue Bossa in C minor as the default 32-bar chart.
- Editable leadsheet with beat-level chord entry, a 4–32 bar stepper and fit/comfortable
  views.
- 24-fret fretboard with degree labels, tensions, position windows and a ringed tonic.
- Three-piece arrangement engine (piano, bass, drums) with Jazz Swing, Rock and Bossa
  styles; tempo, count-in, loop and a three-channel mixer.
- 16 unit tests covering theory, voicings, bass, swing and drum patterns.
