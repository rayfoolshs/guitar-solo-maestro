# Changelog

All notable changes to Guitar Solo Maestro. Pre-release milestones while the app is
being built; newest first.

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
