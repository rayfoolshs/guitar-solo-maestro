# Guitar Solo Maestro

A practice companion for soloing over changes: type a chart, get a scale for every chord,
see it on a 24-fret neck, and play the progression with piano, bass and drums.

**v0.3.0** · made by Ray Foo · [www.rayfooproductions.com](https://www.rayfooproductions.com)

![](guitar-solo-maestro-screen.jpg)

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production bundle in dist/
npm test         # theory / arrangement tests
```

## What it does

**Leadsheet**
- 32-bar default: **Blue Bossa** in C minor, two choruses, three flats on the stave.
- Fit view (8 bars per system) or Comfortable (4 bars per system).
- Click any beat to type a chord; empty slots appear on hover. Enter commits, Escape cancels.
- `− / +` bar stepper, 4–32 bars. Hidden bars keep their chords.
- **Drag across the stave to set an A–B loop.**
- Chart menu: reset to 4 bars, new chart, load Blue Bossa, clear chords, fit/comfortable.
- Key auto-detection with confidence, overridable from the Key pill. Charts autosave.

**Theory**
- Key-aware chord parsing (`B♭maj7`, `F#m7b5`, `C6/9`, `D/F#`; `H7` is reported, not crashed).
- Chord-scale suggestions per bar with mode-of-parent labels ("5th mode of C harmonic
  minor"), borrowed-note flags and transition arrows.
- Whole-progression suggestion plus pentatonic/blues alternatives.

**Fretboard**
- 24 frets with true geometric spacing, inlays at the standard positions.
- Tonic ringed in amber, chord tones teal, other scale tones sand, tensions dashed.
- Degree or note labels; eight position windows.

**Playback**
- **General MIDI soundfont** — GeneralUser GS played through Spessasynth's WASM synth,
  with the built-in synth as a fallback.
- Piano comping (root-position, scale-aware voicings, **OCT −/+** shifter), root-based bass
  with chromatic approach, style-specific drums:
  - **Jazz Swing** — six-hit ride (1 · 2 · 2& · 3 · 4 · 4&), hi-hat foot on 2 and 4
  - **Rock** — kick 1 and 3 (+ the & of 3), snare 2 and 4, closed hats
  - **Bossa Nova** — 3-2 son clave on the cross-stick, 16th shaker, surdo kick
- Three styles, tempo 40–220, count-in, loop (visible bars or A–B), swing 0–100 %.
- Compact mixer rail: three channels with dB sliders, mutes and the piano octave control.

**Print** — A4 landscape, one page, mirroring the on-screen leadsheet.

## Layout

```
src/
  theory/     pitch, chords, scales, keys, suggestions, fretboard mapping
  chart/      chart model, Blue Bossa default, editing helpers
  arrange/    chart + style -> note events (comping, bass, drums, swing)
  audio/      lookahead scheduler, built-in synth, Spessasynth soundfont
  ui/         Header, Leadsheet, Mixer, Fretboard, VersionModal
  version.ts  version + release history
tests/        theory + arrangement tests (vitest)
```

Theory, chart and arrangement are pure TypeScript — no React, no audio — and are unit
tested directly.

## Deployment

- Source: <https://github.com/rayfoolshs/guitar-solo-maestro> (public)
- Live: <https://rayfoolshs.github.io/guitar-solo-maestro/>

Pushes to `main` run tests, build, and deploy to GitHub Pages via
`.github/workflows/deploy.yml`. The bundle uses a relative base, so it runs from any
sub-path.

## Docs

- [`BUILD_PLAN.md`](BUILD_PLAN.md) — architecture, theory engine, arrangement, roadmap
- [`CHANGELOG.md`](CHANGELOG.md) — version history

## Credits

- Notation glyphs: **Bravura** (Steinberg, SIL OFL)
- Chord lettering: **MuseJazzText** (MuseScore, SIL OFL)
- Soundfont: **GeneralUser GS** by S. Christian Collins
- Synth: **spessasynth_lib** (Apache-2.0)
- Default tune: *Blue Bossa* by Kenny Dorham (chord changes only)
