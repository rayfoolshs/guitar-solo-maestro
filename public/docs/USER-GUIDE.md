# User guide

Guitar Solo Maestro is a practice companion for soloing over chord changes. It shows which
scale to play over every chord, where those notes sit on the neck, and plays the
progression back so you can practise against it.

Current version: **0.8.0**.

## Quick start

```bash
npm install
npm run dev       # http://localhost:5173
npm test
npm run build
```

The app opens on the last working chart from your browser, or **Blue Bossa** on a fresh
install.

## The screen

### Header

| Control | What it does |
|---|---|
| **Key** | Auto-detected key, or pick one of the 24 keys to override it |
| **Tempo** | 40–220 bpm; changing it while playing applies from the next bar |
| **Style** | Six playback feels (see below) |
| **New** | Start a blank 4-bar leadsheet (confirms if the chart has chords) |
| **Charts** | Open **My charts** — saved snapshots and JSON backup |
| **Standards** | Open the bundled **Core 100** library |
| **Chart ▾** | Presets, New chart, both libraries, Export MIDI, Clear chords |
| **Print** | A4 landscape leadsheet |
| **Loop** | Loop off / visible bars / A–B range |
| **Play / Stop** | Transport |

Keyboard: **Space** toggles play/stop, **L** toggles the loop.

### Leadsheet

- Click a beat to type a chord. Supported symbols include `Cmaj7`, `B♭maj7`, `F#m7b5`,
  `C6/9`, `D/F#`, `A7♭9`, `C7♯9`, `Falt`, `Cm11`, `B♭maj7♯11` and more.
- Drag across the chart to set an **A–B loop**.
- The **− / +** stepper changes the number of visible bars (4–64). Hidden bars keep their
  chords.
- **Fit / Comfort** switches between 8 and 4 bars per system.
- Under each chord the app suggests a scale, with a `+n` badge for alternatives and an
  arrow showing how far the next scale is from the current one.

### Mixer

- **Play** and tempo ±5.
- **Style** selector.
- **Piano / Bass / Drums** volume sliders and mute buttons.
- **Transpose** — `−` / `+` move the whole chart a semitone; click the number to reset to
  the original key.
- **Oct** shifts the piano voicing −2…+2 octaves.
- **Swing** 0–100 % for the jazz feels (the shuffle is a fixed 12/8 feel).

### Fretboard

24 frets, low E at the bottom. The tonic is ringed, chord tones are teal, other scale
tones are sand and tensions are dashed. Toggle **Degrees / Notes** and **Tensions**, and
choose a position window from **All** (1–5 … 17–24).

### Keyboard view

Toggle **Keyboard** in the board header to see the same scale on a piano instead of the
neck. Three octaves of the scale are written on a grand stave — bass clef for the lower
notes, treble clef from middle C up — with the right-hand fingering below, and three
octaves of keyboard show the tonic in amber, chord tones in teal and the other scale tones
in sand. The **Degrees / Notes** and **Tensions** toggles work the same way.

### MIDI input

The keyboard view also accepts a hardware MIDI keyboard. Turn on **MIDI** in the MIDI bar,
pick the device, then choose **Piano**, **Organ**, **Flute** or **Saxophone** (piano is the
default). The notes play through the same General MIDI soundfont as the transport, and the
keyboard lights up the keys you are holding. Web MIDI needs a browser that supports it and
a secure context (localhost or HTTPS).

### Why lane

Select a chord to see the chosen scale, its degrees, its parent scale and why it fits.

## Playback styles

| Style | Default tempo | Feel |
|---|---|---|
| Jazz Swing | 132 | Swung eighths; ride pattern and walking bass |
| Jazz Ballad | 66 | Sparse sustained voicings and brushes |
| Blues Shuffle | 120 | Fixed 12/8 triplet feel; 1–5–6–♭7 bass |
| Rock | 120 | Straight eighths; power chords and backbeat |
| Funk | 100 | Straight 16ths; clav-style stabs and syncopated bass |
| Bossa Nova | 140 | 3-2 son clave, shaker and surdo kick |

Style, swing, key and tempo changes made **while playing** take effect from the next bar.

## Core 100 standards

Open **Standards** (or `Chart ▾ → Core 100 standards…`):

- Search by title, composer or year.
- Filter by feel (Swing, Ballad, Blues, Latin) and idiom tag (swing, ballad, bebop, latin,
  blues, standard).
- Click a row to load it — playback stops and the chart opens on bar 1 with its own tempo,
  style and swing.
- A small amber dot marks charts whose changes have not yet been checked against a
  published lead sheet.

## Saving and loading charts

**My charts** stores snapshots in this browser:

- Type a name and **Save as new**.
- **Load**, **Update** (replace a snapshot with the working chart), **Rename**,
  **Duplicate** or **Delete**.
- Up to 100 charts / 1 MB.

The working chart also autosaves on every edit, separately from the snapshots.

### Backup files

- **Export JSON** downloads `name.gsm.json`.
- **Import JSON** loads a backup into the editor.

These files are optional — save/load works entirely in the browser. Use them to move
charts between devices or survive clearing site data.

## MIDI export

`Chart ▾ → Export MIDI…` writes a Standard MIDI File of the current arrangement:

- Format 1, PPQ 480, separate piano/bass/drums tracks.
- Tempo, meter and swing match playback.
- Only the visible bars are exported; count-in, loop and mixer levels are not.

See [MIDI export](./MIDI-EXPORT.md) for the byte-level details.

## Printing

**Print** produces the on-screen leadsheet: title block, eight bars per system, scale lane
under each, A4 landscape.

## Limits

- One key per chart; modulations are flagged as borrowed notes rather than modelled.
- No melody or rhythm notation — chord symbols only.
- 4/4 and 3/4 only.
- Saved charts and settings are per-browser.

## Legal note

Chord changes are practice aids, not publisher lead sheets. The Core 100 charts are chord
symbols only and several are still in copyright; check the changes against your own
reference before using them on a gig.
