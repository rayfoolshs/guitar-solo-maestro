# Architecture

## Stack

- **React 18 + TypeScript** on **Vite 6**
- **Vitest** for unit tests
- **Web Audio** scheduler, with General MIDI playback through **Spessasynth** and the
  bundled GeneralUser GS soundfont; a small built-in synth is the fallback
- No backend. Everything runs in the browser and persists to `localStorage`.

The musical core is pure TypeScript with no React and no audio, which keeps it testable.

## Module map

```
src/
  theory/       pure music theory
    pitch.ts      note names, pitch classes, mod12
    chords.ts     chord symbol parsing and quality table
    scales.ts     scale definitions, parent labels, degree rows
    keys.ts       key signature helpers, detection
    suggest.ts    chord-scale ranking and transitions
    fretboard.ts  pitch-class -> fretboard positions, nearestMidi

  chart/        the document model
    model.ts      Chart / Bar / ChordSlot, presets, edit helpers
    standards.ts  Core 100 dataset and standardToChart()
    io.ts         JSON serialization, validation, download
    library.ts    saved-chart library over localStorage

  arrange/      arrangement engine
    styles.ts     StyleDef table: label, group, tempo, swing, feel
    buildScore.ts chart + key + style -> NoteEvent[]
    midi.ts       NoteEvent[] -> Standard MIDI File

  audio/        playback
    soundfont.ts  GM channel map, program changes, soundfont loading
    engine.ts     lookahead scheduler over Web Audio

  ui/           React components
    Header.tsx, Leadsheet.tsx, Mixer.tsx, Fretboard.tsx,
    StandardsModal.tsx, ChartsModal.tsx, VersionModal.tsx

  App.tsx       state wiring between the model, UI and audio
  version.ts    version + release history
  styles.css    all styling (screen + print)
```

## Data flow

```
localStorage (working chart)
        │
        ▼
   Chart ──► parseSlots ──► detectKey ──► KeyInfo
        │                                  │
        │                                  ▼
        └──────────────► suggestForChord(chord, key) ──► Candidate[]
                                      │
                                      ▼
                             Leadsheet / Fretboard / Why lane

Chart + KeyInfo + Style ──► buildScore() ──► NoteEvent[]
                                                    │
                                                    ▼
                                          AudioEngine.play()
```

1. `App` holds the working `Chart`.
2. `parseSlots(chart)` flattens visible bars into ordered chord slots.
3. `detectKey(slots)` ranks all 24 keys and returns a key plus confidence; a manual key
   override bypasses detection.
4. For each chord, `suggestForChord` ranks scales by chord-tone coverage, key membership,
   family fit and transition distance.
5. `buildScore` turns the chart into timed notes for piano, bass and drums.
6. `AudioEngine` schedules those notes bar by bar, ~250 ms ahead.

## Theory engine

### Chord parsing

`parseChord` accepts a root (`A–G`, `♯/♭`), a suffix aliased through `SUFFIX_ALIASES`, and
an optional slash bass (`D/F#`). It returns pitch-class intervals, a quality family
(`major`, `minor`, `dominant`, `dim`, `aug`, `sus`, `power`) and the raw symbol.

Supported colours include triads, 6/9, 7ths, 9ths, 11ths, 13ths, sus, altered dominants
(`7♭9`, `7♯9`, `7♯11`, `7♭13`, `7♭5`, `7♯5`, `alt`), `9♯11`, `13♯11`, `m11`,
`maj7♯11`, `m(maj7)`, `m(add9)` and `add11`.

### Scale ranking

`suggestForChord` iterates every scale in `scales.ts`:

- a scale is a candidate only if it contains **every chord tone**;
- score starts at 100, then subtracts for notes outside the key, rewards key membership,
  family fit (e.g. Mixolydian for dominants) and common modes, and gives a large bonus to
  the natural mode of the key;
- candidates are de-duplicated by pitch-class set, so the best name for a set survives.

`suggestGlobal` offers one scale for the whole chart plus pentatonic/blues alternatives.
`transitionScore` is a Jaccard similarity between two pitch-class sets.

## Transposition

`transposeChordSymbol(input, semitones, flats)` rewrites a chord's root and slash bass
while preserving the quality suffix; it ignores `6/9` when looking for a slash bass.
`transposeChart(chart, semitones)` applies it to every slot, moves a manual key, and stores
the cumulative offset in `chart.transpose`. Spelling comes from the destination key via
`preferFlatsFor`, so repeated transposition stays readable. Because the symbols themselves
are rewritten, analysis, playback and exports follow with no extra code.

## Arrangement engine

`buildScore(chart, key, { style, swing })`:

1. Places each chord in absolute beats, carrying the previous chord through blank bars.
2. Picks a chord scale per slot (pinned choice or top candidate) and derives a colour tone.
3. Builds a style-specific piano voicing:
   - **jazz / funk / bossa** — rootless guide tones + colour, voice-led near the previous
     voicing;
   - **ballad** — low root under three guide/colour tones;
   - **shuffle** — root–third–seventh/6 shell;
   - **rock** — power chord.
4. Writes comping from per-style two- or four-bar pattern tables.
5. Writes the bass line (walking swing, half notes, 1–5–6–♭7, eighths, funk 16ths or bossa
   roots with approach notes).
6. Writes drums (jazz ride, brushes, shuffle ride, rock backbeat, funk 16ths or bossa
   clave/shaker/surdo).
7. Applies swing to off-beat eighths for `swung8` feels.

All output is a flat `NoteEvent[]` with `beat`, `dur`, `midi`, `velocity` and `channel`.

## Audio

`AudioEngine` keeps `events`, loop bounds and timing state:

- `play(events, opts)` computes bar duration from tempo and starts a 25 ms interval.
- `tick()` schedules every bar whose start is within the next 250 ms.
- `scheduleBar()` filters events by bar and converts beats to seconds.
- `setEvents()` swaps the arrangement without stopping; the next bar picks it up.
- `setTempo()` changes `barDur`; the sounding bar finishes and later bars use the new
  duration.
- `position()` reads a small bar log rather than deriving from a fixed anchor, so live
  tempo changes stay accurate.

Volumes and mutes apply live through per-channel gain nodes and MIDI CC7.

## Persistence and import

- `gsm.chart.v2` — the working chart, autosaved on every edit.
- `gsm.charts.v1` — up to 100 saved snapshots plus metadata, newest first.
- `io.ts` — versioned JSON envelope, field-by-field normalization, clamping, id
  regeneration, unknown-key stripping and a 1 MB cap.
- `library.ts` — CRUD over snapshots with quota handling and corrupted-entry recovery.

## MIDI export

`buildMidiFile(chart, events)` writes a format-1 SMF at PPQ 480 with a conductor track
(tempo, time signature) and three part tracks. It reuses `buildScore` output directly, so
swing and comping match the transport. See [MIDI export](./MIDI-EXPORT.md).

## Testing

Pure functions are covered by Vitest:

- `theory.test.ts` — parsing, key detection, scale selection, arrangement basics.
- `styles.test.ts` — style descriptors, per-style grooves, comping variation, voicings.
- `standards.test.ts` — dataset integrity, chord parsing, key detection, full arrangement.
- `chords.test.ts` — extended chord qualities.
- `chart-io.test.ts` — round-trip, validation, clamping, prototype safety.
- `library.test.ts` — save/list/rename/duplicate/delete, caps, quota, corruption.
- `midi.test.ts` — header, tempo, meter, tracks, pairing, shuffle ticks.

UI and audio are verified manually in the browser.

## Build and deploy

`npm run build` runs `tsc -b` then `vite build`. The site is static and deployed to GitHub
Pages by `.github/workflows/deploy.yml` on every push to `main`.

## Extension points

- **New style** — add a `StyleDef` to `styles.ts` and a pattern branch in `buildScore`
  (plus a Mixer/`STYLE_ORDER` entry; TypeScript enforces completeness).
- **New chord quality** — add to `QualityId`, `QUALITIES` and `SUFFIX_ALIASES`.
- **New standard** — append a `std(...)` entry to `standards.ts` and run the tests.
- **New export format** — consume `buildScore` events the same way `midi.ts` does.
