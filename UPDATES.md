# Updates

Planned and in-progress work for Guitar Solo Maestro, grouped into version
milestones. Released history lives in [`CHANGELOG.md`](./CHANGELOG.md); this file
tracks what is coming next so each milestone can be copied into the changelog and
`src/version.ts` when it ships.

- **Current release:** `0.10.0` (2026-11-10)
- **Drafted:** 2026-11-08
- **Versioning:** pre-1.0, one minor bump per feature set; patches for fixes.

| Version | Theme | Status |
|---|---|---|
| `0.5.0` | Styles and repertoire | **Shipped 2026-11-08** |
| `0.5.1` | Live tempo | **Shipped 2026-11-08** |
| `0.6.0` | Core 100 standards library | **Shipped 2026-11-08** |
| `0.6.1` | Better piano comping | **Shipped 2026-11-08** |
| `0.7.0` | Chart library and chart management | **Shipped 2026-11-08** |
| `0.8.0` | MIDI export | **Shipped 2026-11-08** |
| `0.9.0` | Transpose charts | **Shipped 2026-11-08** |
| `0.10.0` | Keyboard view and live MIDI input | **Shipped 2026-11-10** |

---

## 0.5.0 — Styles and repertoire

**Status:** shipped in `0.5.0` (2026-11-08) — see `CHANGELOG.md`.

**Goal:** three new playback feels, three matching demo charts, and live style
switching while the transport is running.

### 0.5.0.1 Style descriptor refactor

- Add `src/arrange/styles.ts` with a `StyleDef` record:

  ```ts
  interface StyleDef {
    id: Style;
    label: string;
    group: 'Jazz' | 'Groove' | 'Latin';
    defaultTempo: number;
    defaultSwing: number;
    swingEnabled: boolean;
    feel: 'straight' | 'swung8';
  }
  ```

- Extend `Style` in `src/chart/model.ts` with `funk`, `shuffle`, `ballad`.
- Replace the duplicated label maps in `src/ui/Header.tsx` (`STYLE_LABEL`) and
  `src/ui/Leadsheet.tsx` (inline ternary) with `styleLabel()`.
- Group the style `<select>` options by `group` with `<optgroup>`; drive the swing
  slider's disabled state from `swingEnabled` instead of `style !== 'jazz'`.
- Make `rhythm()` in `src/arrange/buildScore.ts` feel-driven (`straight` vs
  `swung8`) rather than jazz-only.

**Acceptance:** the three existing styles sound unchanged; type-check fails if a
style is missing from either the union or the record.

### 0.5.0.2 Funk

- Straight 16ths, default 100 bpm, swing disabled.
- Piano: short stabs at `0.5 · 1.75 · 2.5 · 3.75`, duration ~0.15 beat.
- Bass: 16th syncopation on root with octave pops at `0.75`, `2.25`, `3.5`.
- Drums: 16th hats (42), snare 2 and 4 (38) with ghost notes, kick (36) on
  `1 · e-of-2 · &-of-3 · e-of-4`, occasional open hat (46).

### 0.5.0.3 Blues Shuffle

- 12/8 feel, default 120 bpm, swing = 1 (off-beats at 2/3 of the beat). The swing
  slider is disabled because a shuffle is a fixed feel; the score always uses full
  triplet placement.
- Piano: comp on 1 and 3 plus a pickup on 3.5.
- Bass: root–5–6–♭7 shuffle line with a chromatic approach into the next root.
- Drums: ride (51) on each beat and its triplet "a", hi-hat foot (44) and snare
  (38) on 2 and 4, feathered kick (36) on 1 and 3.

### 0.5.0.4 Jazz Ballad

- Default 66 bpm, swing 0.62.
- Piano: sustained voicings at `0` and `2.5`, durations 1.8 and 1.2 beats.
- Bass: half notes on 1 and 3 plus a chromatic approach on 3.5.
- Drums: brushes — soft ride (51) each beat, ghost snare (38) on 2 and 4,
  feathered kick (36). Fall back to low-velocity ride/snare if the soundfont has
  no brush kit; document the note mapping used.

### 0.5.0.5 Preset charts

Add three built-in charts in `src/chart/model.ts`, wired into the `Chart ▾` menu
(`Header.tsx`) and the action map (`App.tsx`). All use chord symbols only — no
melody or lyrics — consistent with the existing presets.

| Chart | Bars | Style | Tempo | Changes |
|---|---|---|---|---|
| **Cantaloupe Island** | 16 | `funk` | 100 | `Fm7` ×4, `Db7` ×4, `Dm7` ×4, `Fm7` ×4 |
| **Mr. P.C.** | 12 | `shuffle` | 152 | `Cm7 Fm7 Cm7 Cm7 Fm7 Fm7 Cm7 Cm7 Ab7 G7 Cm7 G7` |
| **Misty** | 32 | `ballad` | 66 | AABA in E♭ (see below) |

**Misty (32 bars, AABA):**

```
A1  1 Ebmaj7 | 2 Bbm7 Eb7 | 3 Abmaj7 | 4 Abm7 Db7
    5 Ebmaj7 Cm7 | 6 Fm7 Bb7 | 7 Gm7 C7 | 8 Fm7 Bb7
A2  9–16  same as 1–8
B   17 Bbm7 | 18 Eb7 | 19 Abmaj7 | 20 Abmaj7
    21 Am7 | 22 D7 | 23 Gm7 | 24 C7
A3  25 Ebmaj7 | 26 Bbm7 Eb7 | 27 Abmaj7 | 28 Abm7 Db7
    29 Ebmaj7 Cm7 | 30 Fm7 Bb7 | 31 Ebmaj7 | 32 Ebmaj7
```

Two-chord bars use slots at beat 0 and beat 2.

### 0.5.0.6 Live style switching during playback

Today `App.play()` builds the score once and the engine keeps it until the next
Play. Change to hot-swap at the bar line:

- `src/audio/engine.ts`: add `setEvents(events: NoteEvent[])` that replaces
  `this.events` while running; the next `scheduleBar()` picks it up.
- `src/App.tsx`: effect on `[playing, chart.style, chart.swing, key]` that rebuilds
  `buildScore(...)` and calls `engine.setEvents(...)`.
- Style, swing and manual key changes now apply from the next bar (up to ~1 bar of
  latency from the scheduler's 250 ms lookahead).

**Follow-up:** live tempo changes shipped in `0.5.1` (see below).

### 0.5.0 verification

- `npm test` — add arrangement tests: every style produces events in all three
  channels; funk is straight under swing 0.62; shuffle lands off-beats at 2/3;
  ballad has fewer piano events than jazz; jazz/rock/bossa regressions unchanged.
- `npm run build`.
- Manual: audition each style on Blue Bossa and Autumn Leaves; switch style
  mid-chorus and confirm the groove changes at the next bar.

---

## 0.5.1 — Live tempo (shipped 2026-11-08)

- `engine.setTempo(bpm)` changes `barDur` without stopping: the sounding bar finishes
  at its scheduled tempo, the next bar starts at its queued time, and later bars use
  the new duration.
- `position()` now reads a small bar log (`time`, `bar`, `dur`) instead of deriving
  position from a fixed anchor/duration, so it stays correct when consecutive bars
  have different durations.
- `App.tsx` calls `engine.setTempo(chart.tempo)` in an effect while playing.

**Verification:** `npm test`, `npm run build`, and a manual check that the bar counter
keeps advancing after changing tempo mid-playback.

---

## 0.6.0 — Core 100 standards library (shipped 2026-11-08)

**Status:** shipped in `0.6.0` (2026-11-08) — see `CHANGELOG.md`.

- `src/chart/standards.ts`: 100 `Standard` entries with rank, composer, year, style,
  tempo, form, tags and a compact `changes` line (`|` separates bars, `,` puts two chords
  in one bar).
- `src/ui/StandardsModal.tsx`: search plus style and idiom filters; loading stops playback
  and selects bar 1. Reachable from the header **Standards** button and `Chart ▾`.
- Parser additions: `7♭9`, `7♯9`, `7♯11`, `7♭13`, `7♭5`, `7♯5`, `alt`, `9♯11`, `13♯11`,
  `11`, `m11`, `maj7♯11`, `m(maj7)`, `m(add9)`, `add11`.
- Bar cap raised 32 → 64; `Chart` gained optional `composer`, `year`, `form` and `tags`.
- Verification: `tests/standards.test.ts` (100 unique entries, 4–64 bars, every chord
  parses, multi-chord beats ordered, key detection) and `tests/chords.test.ts`.

---

## 0.6.1 — Better piano comping (shipped 2026-11-08)

- Rootless guide-tone voicings with scale colour tones for jazz, funk and bossa; low-root
  ballad voicings; root–third–seventh shuffle shells; power chords for rock.
- Two- and four-bar comping cycles per style replace the single repeated pattern.
- Verification: `npm test` (44 tests) and `npm run build`.

---

## 0.7.0 — Chart library and chart management (shipped 2026-11-08)

**Status:** shipped in `0.7.0` (2026-11-08) — see `CHANGELOG.md`.

**Goal:** users can save their own charts, reopen them later, and back them up or
share them as files. A prominent New Chart button starts a blank leadsheet.

### 0.7.0.1 My Charts library

- New module `src/chart/library.ts` over `localStorage['gsm.charts.v1']`:

  ```ts
  interface SavedChart { id: string; name: string; savedAt: string; chart: Chart }
  interface LibraryFile { version: 1; charts: SavedChart[] }
  ```

- API: `listSaved()`, `saveNew(chart, name)`, `overwrite(id, chart)`,
  `rename(id, name)`, `duplicate(id)`, `remove(id)`, `read(id)`.
- Working-chart autosave (`gsm.chart.v2`) stays as-is; the library stores explicit
  snapshots so experimenting cannot corrupt saved versions.
- Guards: 100-chart cap, ~1 MB total, typed `QuotaExceededError` handling, and
  field-by-field normalisation on read so a corrupted entry cannot crash the app.
- Name defaults to `chart.name || autoName(chart)`.

### 0.7.0.2 Charts modal

- New `src/ui/ChartsModal.tsx` following the `VersionModal.tsx` pattern.
- Opened from `Chart ▾` → **My Charts…**.
- Save-as-new row with a name input; **Update "<name>"** when the working chart
  came from a saved entry.
- Rows show name, bar count and last-saved date with **Load**, **Rename**,
  **Duplicate**, **Delete** (confirm).
- Loading stops playback, replaces the chart, resets selection and closes the
  modal.

### 0.7.0.3 JSON backup (export / import)

- New `src/chart/io.ts`: `serializeChart()`, `parseChartText()`, `downloadChart()`,
  `slugify()`.
- Envelope `{ format, version, savedAt, chart }`; import also accepts a bare chart
  object for old autosave dumps.
- Strict validation: bars ≤ 256, `timeSignature` in `4/4 | 3/4`, `visibleBars`
  4–32, `tempo` 40–220, `swing` 0–1, `pianoOctave` −2…2, `style` in the union,
  `pins` string→string; regenerate missing/duplicate ids; 1 MB size cap.
- Build fresh objects field by field (never spread the parsed object) to avoid
  prototype pollution.
- Shown as **Export JSON** / **Import JSON** in the Charts modal footer:
  `my-tune.gsm.json`.

### 0.7.0.4 New Chart button

- Add a top-level **New chart** button in the header, left of `Chart ▾`, styled
  like the existing `.ctl btn` / `.btn-print` controls.
- Clicking stops playback, calls `makeEmptyChart()`, selects bar 0 and clears
  status, so the user can type a chord immediately.
- Confirm first if the current chart has any chords:
  *"Start a new chart? The current chart will be replaced."*
- Hide the label below 720 px and keep the icon.
- Keep or remove the duplicate item in the `Chart ▾` menu (one path preferred).

### 0.7.0.5 Fix: stop playback when replacing the chart

`loadBlueBossa`, `loadAutumnLeaves`, `newChart` and library loads must stop the previous
arrangement. Preset loads already call `stop()` (delivered with 0.5.0); keep that behaviour
for every new chart-replacement path.

### 0.7.0 verification

- `tests/library.test.ts`: save/list/rename/duplicate/remove, newest-first order,
  100-chart cap, quota error path, corrupted entry ignored.
- `tests/chart-io.test.ts`: round-trip, legacy bare chart, malformed input,
  out-of-range clamping, unknown keys and `__proto__` stripped, id regeneration.
- Manual: save, rename, load, delete; export → import round-trip; New Chart from a
  dirty chart shows the confirm and yields 4 empty bars.

---

## 0.8.0 — MIDI export (shipped 2026-11-08)

**Status:** shipped in `0.8.0` (2026-11-08) — see `CHANGELOG.md`.

**Goal:** export the current arrangement as a Standard MIDI File that matches what
the app plays, including swing, for use in a DAW or another practice tool.

### 0.8.0.1 SMF writer (no dependency)

- New `src/arrange/midi.ts`: `exportMidi(chart, key, opts): Blob` (`audio/midi`).
- Consume the same `buildScore()` output; swing is already baked into `beat`.
- Format 1, PPQ 480 (2/3 shuffle = exactly 320 ticks).
- Track 0: tempo (`FF 51 03`) and time signature (`FF 58 04`, 4/4 or 3/4).
- Tracks 1–3: piano, bass, drums.
- Channels/programs mirror playback (`src/audio/soundfont.ts`): piano ch 0 /
  program 0, bass ch 1 / program 32, drums ch 9 (GM percussion).
- Note on/off from `beat` and `beat + dur`; sort by tick with note-offs before
  note-ons at equal ticks; VLQ delta encoding; `FF 2F 00` end-of-track.
- Export the **visible bars** to match playback; exclude count-in, loop and mixer
  volume/mute state.
- File name `slug(chart.name).mid`.

### 0.8.0.2 UI

- `Chart ▾` → **Export MIDI…** (optionally a small MIDI button next to Print).
- One click, no dialog; show an error status if the chart has no chords.

### 0.8.0 verification

- `tests/midi.test.ts` with a minimal reader: header/format/division/track count,
  tempo decodes back to `chart.tempo`, 4/4 vs 3/4 signature bytes, note-on count
  equals `buildScore()` events, every note-on has a note-off, shuffle off-beat at
  tick 320, no note-off before its note-on.
- Manual: open the `.mid` in a DAW; confirm tempo, 3 tracks, drums on channel 10,
  and that swing matches in-app playback.

---

## 0.9.0 — Transpose charts (shipped 2026-11-08)

**Status:** shipped in `0.9.0` (2026-11-08) — see `CHANGELOG.md`.

- Mixer stepper transposes the whole chart in semitone steps, shows the cumulative offset
  and resets on click.
- `transposeChordSymbol()` keeps suffixes and slash basses intact; `transposeChart()`
  rewrites the chart, updates a manual key and records the offset.
- Spelling follows the destination key so repeated transposition stays readable.
- `transpose` is persisted and validated with the rest of the chart schema.

**Verification:** `npm test` (78 tests), `npm run build`, and a browser pass over
+1, two separate −1 steps (sharp then flat spelling), reset, and transposing while playing.

---

## 0.10.0 — Keyboard view and live MIDI input (shipped 2026-11-10)

**Status:** shipped in `0.10.0` (2026-11-10) — see `CHANGELOG.md`.

- **Keyboard** toggle in the board header swaps the fretboard for a piano view: three
  octaves of keyboard plus three octaves of the suggested scale written on a grand stave
  (bass clef below middle C, treble clef above) with right-hand fingering.
- Clefs, brace and accidentals use Bravura SMuFL glyphs; stems follow each stave's middle
  line and ledger lines are drawn only where a note needs one.
- **MIDI** input plays Piano, Organ, Flute or Saxophone (piano default) on a dedicated live
  channel; held notes turn red on both the keyboard and the stave. A–K and clicking a key
  cover environments where Web MIDI is blocked.
- `src/theory/keyboard.ts` (spelling, fingering, geometry), `src/audio/midiInput.ts`
  (device list, parsing), `src/audio/computerKeys.ts` (fallback mapping).
- `docs/THEME.md` records the palette, type and colour semantics used across the neck,
  keyboard and stave.

**Verification:** `npm test` (99 tests), `npm run build`, and a browser pass over the
keyboard view, the grand stave at several zoom levels, and the held-note highlight.

---

## Release checklist (every milestone)

1. Bump `VERSION` and `BUILD_DATE` in `src/version.ts`; prepend a `HISTORY` entry.
2. Add the same entry to the top of `CHANGELOG.md`.
3. Update `README.md` where behaviour or controls changed.
4. Run `npm test` and `npm run build`.
5. Deploy is automatic via `.github/workflows/deploy.yml` on push to `main`.
