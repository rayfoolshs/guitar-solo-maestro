# Build plan — Guitar Solo Maestro

A practice companion for soloing over changes: type a chart, get a scale for every chord,
see it on a 24-fret neck, and play the progression with piano, bass and drums.

Current build: **v0.4.0**. See `CHANGELOG.md` for history and `README.md` for usage.

---

## 1. Product decisions

| Decision | Choice |
| --- | --- |
| Job | Practice companion — playback and per-chord scales are the centre |
| Platform | Web app, desktop-first with a tablet-friendly stack; phone layout is planned |
| Commercial | Product under rayfooproductions.com; permissive licensing only |
| Input | Leadsheet — chords in a lane above a stave, no separate chord box |
| Chords per bar | Up to 4, placed at beat positions |
| Chart length | 4–32 bars; the stepper changes what is shown/played, never deletes |
| Default chart | Blue Bossa, C minor, two 16-bar choruses (32 bars) |
| Notation | Chords + scale lane; no rhythm slashes, no melody |
| Harmony model | One key per chart; sections and modulation deferred |
| Audio | General MIDI soundfont through a WASM synth, with a built-in fallback |
| Document | Named charts, local storage, JSON import/export (planned) |

---

## 2. Architecture

```
src/
  theory/      pure music theory — no React, no audio
    pitch.ts        pitch classes, key-aware spelling
    chords.ts       tokenizer + quality catalogue (21 qualities, aliases, slash chords)
    scales.ts       scale catalogue with parent-mode metadata
    keys.ts         diatonic sets, key ranking, mode-on-degree
    suggest.ts      chord-scale ranking, global suggestion, transition cost
    fretboard.ts    tuning, geometry, degree labels
  chart/       the document
    model.ts        Chart / Bar / ChordSlot, Blue Bossa default, editing helpers
  arrange/     chart + style → note events
    buildScore.ts   voicings, bass line, drum patterns, swing
  audio/       sound out
    engine.ts       lookahead scheduler + built-in synth fallback
    soundfont.ts    Spessasynth worklet, bank loading, CC7 volume
  ui/          React
    Header, Leadsheet, Mixer, Fretboard, VersionModal
  version.ts   version + release history (drives the in-app modal)
```

The rule that keeps this maintainable: **`theory/`, `chart/` and `arrange/` are pure
TypeScript.** They take plain data and return plain data, so the whole musical core is
unit-tested without a DOM or an AudioContext.

---

## 3. Theory engine

### Chords
A real tokenizer, not one regex per quality: `(root, accidental, suffix, /bass)` with an
alias table (`Cmaj7` · `CM7` · `CΔ7`, `Cm7b5` · `Cø7`, `C6/9`, `D/F#`). Unknown suffixes
return a typed error so the slot can turn red without breaking the chart.

### Key detection
Every one of the 24 keys is scored against the chord list:

- chord root in key: **+2**, out of key: **−1**
- chord-tone coverage: **+3 × fraction**, out-of-key tones: **−0.8 each**
- chord quality matches the diatonic family at that degree: **+3**
- first/last chord on the tonic: **+3**, last chord on the dominant: **+2**

The winner is shown with a confidence percentage and the runner-up is kept for the
"ambiguous" case (`Am F C G` should show both A minor and C major).

### Chord-scale ranking
For every scale rooted on the chord root:

1. **Filter** — the scale must contain every chord tone.
2. **Score** — base 100, then:
   - −12 per note outside the key, −1.5 per key note missing from the scale
   - +family bonus (Mixolydian over dominants, Dorian/Aeolian over minors, Ionian/Lydian
     over majors, Locrian over m7♭5)
   - +34 when the scale is the natural mode of that degree in the key
   - +commonness prior, +size fit (pentatonic for triads, seven-note for sevenths)
3. **Bucket** — `in key` (no added notes), `alternative` (≤2 added), `outside` (>2).
4. **De-duplicate** by pitch-class set, keeping the best-scoring name.

Result for Blue Bossa: C Aeolian, F Dorian, D Locrian, **G Phrygian dominant** (from C
harmonic minor), A♭ Mixolydian, D♭ Ionian.

### Transition cost
`1 − Jaccard(note sets)` between neighbouring chords, rendered as an arrow. Low means the
scale can stay; high means shift or resolve to a chord tone.

---

## 4. Leadsheet

- 8 bars per system in Fit view, 4 in Comfortable.
- Chord lane with beat slots; empty slots reveal a `+` on hover, clicking opens an inline
  input. Enter commits, Escape cancels.
- Stave drawn with plain 1 px boxes (five lines) plus an SVG glyph layer for clef, key
  signature and time signature using **Bravura** (SMuFL). Chords use **MuseJazzText**.
- Notation order is clef → key signature → time signature; the gutter is computed from the
  number of accidentals (`64 + 12 × n`).
- Scale lane under each system, aligned to bars, with the selected chord highlighted.
- Drag across the chart (chord lane, stave or scale lane) to set the A–B loop range; it commits on press and extends live.
- Chart menu: reset to 4 bars, new chart, load Blue Bossa, clear chords, fit/comfortable.

---

## 5. Fretboard

Pure SVG, standard tuning, 24 frets with true geometric spacing.

| Element | Treatment |
| --- | --- |
| Tonic | amber fill, white stroke, outer ring |
| Chord tones | teal |
| Other scale tones | sand |
| Tensions | dashed hollow circles, toggle in the header |
| Labels | scale degrees by default, note names on demand |
| Positions | All · 1–5 · 3–7 · 5–9 · 8–12 · 10–15 · 12–17 · 17–24 |

---

## 6. Arrangement and audio

### Voicings
Root-position and scale-aware: root (in the E2–A3 area), third, fifth, seventh and a colour
tone chosen from the *chosen chord scale* (prefers 9, then ♭9, 11, ♯11). Keeping the root in
the voicing means the chord is intelligible on laptop speakers where the bass is inaudible.

The `OCT −/+` control transposes the piano by up to two octaves.

### Bass
Root on beats 1 and 3 in the E1–G2 register nearest the previous note, plus a chromatic
approach a semitone below the next root on the "and of 4". Rock plays root 8ths; bossa uses
1, 2&, 3 plus the approach.

### Drums (General MIDI)

| | Jazz Swing | Rock | Bossa Nova |
| --- | --- | --- | --- |
| Ride / hats / shaker | ride `1 · 2 · 2& · 3 · 4 · 4&`, hi-hat foot on 2 and 4 | closed hats 8ths | 16th shaker |
| Cross-stick | — | — | 3-2 son clave `1 · 2& · 4 / 2 · 3` |
| Kick | feathered quarters | `1, 3, 3&` | `1, 3` (surdo) |
| Snare | — | `2, 4` | — |

Swing applies to jazz off-beats only: position = `0.5 + s/6` of the beat, so 0 is straight
and 1 is a triplet feel.

### Soundfont
GeneralUser GS (31 MB) loaded through Spessasynth's AudioWorklet processor on the first
Play, with MIDI channels 0/1/9 for piano/bass/drums. Mixer levels are MIDI CC7. If the bank
fails to load, playback silently falls back to the built-in oscillator synth.

---

## 7. Print

The printed page mirrors the leadsheet: A4 landscape, 8 bars per system, title block with
name · key · tempo · style · bar count. Interactive chrome is removed (mixer, header,
selection tint, loop band, beat dots, empty-slot markers). Systems avoid page breaks.

---

## 8. Testing

`npm test` runs Vitest over the pure layers (16 tests):

- chord parsing, including `C6/9`, `D/F#` and rejected `H7`
- key detection on the full chart and on a 4-bar excerpt
- chord-scale picks: G7 → Phrygian dominant, A♭7 → Mixolydian, Cm7 → Aeolian,
  Dm7♭5 → Locrian, D♭maj7 → Ionian
- every suggestion contains all chord tones
- voicing regression: Fm7 must sound F A♭ C E♭ (the double-root bug)
- bass on the root, approach note on the & of 4
- swing: off-beat at 1.5 straight, 1.667 at full swing
- bossa clave and jazz ride patterns
- piano, bass and drums present in every bar

---

## 9. Deployment

- Source: private GitHub repository.
- Site: GitHub Pages, built by `.github/workflows/deploy.yml` on every push to `main`.
- The build uses a relative `base`, so it works from a project sub-path
  (`/guitar-solo-maestro/`), and the bank URL is resolved against `document.baseURI`.

---

## 10. Roadmap

Next up, in order:

1. **Offline + bank subset** — service worker caching the shell and bank; trim the 31 MB
   bank to ~8 MB (piano 0–5, bass 32–34, one kit).
2. **Documents** — IndexedDB chart list, JSON import/export, auto-naming.
3. **Pinned scales** — override the engine per slot; pins persist in the document.
4. **Phone layout** — Practice view: current bar, its scale, fretboard and transport.
5. **Insight layer** — avoid-note warnings, cadence detection, guide tones, substitution
   hints, "why this scale" panel.
6. **Positions** — best-window scoring across the progression; CAGED overlays.
7. **Voicings** — drop-2 / drop-3 diagrams.

Deferred: tab export, capo/transpose, 7/8-string tuning, shareable URLs, melody entry,
mid-chart modulation.
