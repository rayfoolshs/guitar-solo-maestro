# Chart format

Charts are plain JSON. The same shape is used for the working chart, saved snapshots, and
exported backup files.

## TypeScript shape

```ts
type Style = 'jazz' | 'ballad' | 'shuffle' | 'rock' | 'funk' | 'bossa';

interface ChordSlot {
  id: string;
  beat: number;   // 0-based within the bar
  input: string;  // chord symbol as typed
}

interface Bar {
  id: string;
  slots: ChordSlot[];  // sorted by beat
}

interface Chart {
  id: string;
  name: string;
  timeSignature: '4/4' | '3/4';
  bars: Bar[];
  visibleBars: number;      // 4–64
  keyManual: { tonic: number; mode: 'major' | 'minor' } | null;
  tempo: number;            // 40–220
  style: Style;
  swing: number;            // 0–1
  countIn: boolean;
  metronome: boolean;
  pianoOctave: number;      // −2…+2
  pins: Record<string, string>; // slotId -> scaleId
  transpose?: number;           // cumulative semitones applied to the chord symbols

  // optional metadata
  composer?: string;
  year?: number;
  form?: string;
  tags?: string[];
}
```

## Export envelope

```json
{
  "format": "guitar-solo-maestro/chart",
  "version": 1,
  "savedAt": "2026-11-08T09:00:00.000Z",
  "chart": { "...": "Chart object" }
}
```

Import also accepts a **bare chart object** (the legacy/autosave shape), so hand-made
files and older exports still load.

## Example

```json
{
  "format": "guitar-solo-maestro/chart",
  "version": 1,
  "savedAt": "2026-11-08T09:00:00.000Z",
  "chart": {
    "id": "c-example",
    "name": "My Tune",
    "timeSignature": "4/4",
    "bars": [
      { "id": "b1", "slots": [{ "id": "s1", "beat": 0, "input": "Cmaj7" }] },
      { "id": "b2", "slots": [{ "id": "s2", "beat": 0, "input": "Dm7" }, { "id": "s3", "beat": 2, "input": "G7" }] },
      { "id": "b3", "slots": [{ "id": "s4", "beat": 0, "input": "Em7" }] },
      { "id": "b4", "slots": [{ "id": "s5", "beat": 0, "input": "A7b9" }] }
    ],
    "visibleBars": 4,
    "keyManual": null,
    "tempo": 120,
    "style": "jazz",
    "swing": 0.62,
    "countIn": true,
    "metronome": false,
    "pianoOctave": 0,
    "pins": {},
    "composer": "Example",
    "year": 1960,
    "form": "AABA 32",
    "tags": ["swing", "standard"]
  }
}
```

## Chord symbols

`parseChord` understands:

- roots `A`–`G` with `#`/`♯` or `b`/`♭`
- `maj`, `m`, `7`, `maj7`, `m7`, `m7b5`, `dim7`, `dim`, `aug`, `6`, `m6`, `6/9`,
  `sus4`, `sus2`, `9`, `maj9`, `m9`, `13`, `add9`, `7sus4`, `5`
- `7♭9`, `7♯9`, `7♯11`, `7♭13`, `7♭5`, `7♯5`, `alt`, `9♯11`, `13♯11`, `11`,
  `m11`, `maj7♯11`, `m(maj7)` / `mM7`, `m(add9)`, `add11`
- slash chords when the tail is a note, e.g. `D/F#`

Unknown symbols are kept as typed and simply skipped by the theory engine — they are not
an import error.

## Validation on import

`normalizeChart` builds a **fresh** object field by field (never spreads the input), so
unknown keys cannot reach app state.

| Field | Rule |
|---|---|
| `bars` | required, 1–256 bars; padded to at least 4 |
| `bar.slots` | max 8 per bar; empty/invalid slots dropped; sorted by beat |
| `slot.beat` | clamped to `0 … beatsPerBar − 0.25`, rounded to 2 dp |
| `slot.input` | string, max 40 chars |
| `timeSignature` | `4/4` or `3/4` (anything else becomes `4/4`) |
| `visibleBars` | clamped 4–64 and not beyond the bar count |
| `tempo` | clamped 40–220, rounded |
| `swing` | clamped 0–1 |
| `pianoOctave` | clamped −2…2, integer |
| `style` | must exist in `STYLES`, else `jazz` |
| `keyManual` | tonic 0–11 + `major`/`minor`, else `null` |
| `pins` | only ids that exist in the chart, string values, safe id pattern |
| `transpose` | integer, wrapped to the shortest interval (−5…+6) |
| `composer` | string, max 120 |
| `year` | integer 1001–2999 |
| `form` | string, max 60 |
| `tags` | up to 8 strings, max 24 chars each |
| ids | must match `[A-Za-z0-9_-]{1,40}`, be unique, and not be `__proto__`, `constructor` or `prototype`; otherwise regenerated |
| file size | 1 MB maximum |

## Compact authoring format

Core 100 entries use a one-line `changes` string:

- `|` separates bars
- `,` puts multiple chords in one bar, spread evenly: two chords land on beats 1 and 3

```
Ebmaj7|Bbm7,Eb7|Abmaj7|Abm7,Db7
```

becomes four bars, with two slots in bars 2 and 4.

## Storage

| Key | Contents |
|---|---|
| `gsm.chart.v2` | the working chart, autosaved on every edit |
| `gsm.charts.v1` | saved snapshots: `{ version: 1, charts: SavedChart[] }` |

A saved snapshot is `{ id, name, savedAt, chart }`. Limits: **100 charts** and
**1 MB** of JSON. Reads normalize every entry and silently drop corrupted ones.

## Backup files

- Filename: `slugify(chart.name).gsm.json` (falls back to `chart.gsm.json`).
- `Export JSON` and `Import JSON` live in the My charts modal.
- Import loads the chart into the editor; it does not automatically save a snapshot.
