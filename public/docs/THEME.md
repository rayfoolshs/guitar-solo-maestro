# Guitar Solo Maestro — Visual Theme

Version **0.10.0** · 2026-11-10

The rules behind how the app looks: the palette, the type, the notation artwork and the
small set of semantics that decide which note is which colour. Everything here is taken
from the implementation (`src/styles.css` and the SVG components), so this document is
descriptive rather than aspirational — change the code and update this file.

---

## 1. The idea

A jazz practice room, not a dashboard. The screen is **warm paper**, the type is **ink**,
and colour is spent only on the music:

- one **amber** accent for the brand and the tonic,
- one **teal** accent for chord tones and "on" states,
- **sand** for everything quietly in the scale,
- **red** for exactly one thing — the note you are playing right now.

The rest is neutral: white cards on paper, hairline borders, a dark timber header. Nothing
glows, nothing gradients, nothing moves unless it is a control changing state.

---

## 2. Colour tokens

Defined once in `:root` in `src/styles.css`. Components should use the token, not the hex.

| Token | Hex | Used for |
|---|---|---|
| `--paper` | `#F6F3EA` | App background |
| `--card` | `#FFFFFF` | Panels, popovers, inputs |
| `--ink` | `#14120F` | Primary text, noteheads, selected segments |
| `--ink2` | `#3B362E` | Secondary text, chip labels |
| `--muted` | `#8B8477` | Captions, sub-labels, empty states |
| `--line` | `#E6DFD0` | Default borders and dividers |
| `--line2` | `#D6CEBB` | Hover borders |
| `--amber` | `#B45309` | Brand, tonic, primary action |
| `--amber-deep` | `#8A3E07` | Amber text on light backgrounds, pressed play |
| `--amber-soft` | `#FBF0E1` | Active chips, selected rows, finger chips |
| `--teal` | `#0F766E` | Chord tones, toggle "on", success text |
| `--teal-soft` | `#E8F2F0` | Teal hover fills |
| `--sand` | `#F2ECDD` | Passing scale tones, stepper hover |
| `--red` | `#B03A2E` | A note currently held (see §5) |

Header and dark surfaces:

| Surface | Hex | Notes |
|---|---|---|
| Header | `#171410` | Sticky top bar, dark timber |
| Header text | `#F4EFE3` | 11.5–12 px controls |
| Header muted | `#9C9281` / `#A79C88` | Micro-labels, byline |
| Header border | `rgba(244,239,227,.16)` | Control outlines |

Notation and instrument surfaces:

| Surface | Hex | Used for |
|---|---|---|
| Staff card | `#FDFBF6` | Grand-staff and fretboard card fill |
| Staff border | `#EFE9DC` | 1 px card outline |
| Staff lines | `#D8D0BF` | Five-line staves, fret lines |
| Barline 12th fret | `#B9AF9B` | Octave marker on the neck |
| Inlay dots | `#E7E0D0` | 3-5-7-9-15-17-19-21 and 12/24 |
| Nut / black key | `#1B1712` | Nut, non-scale black keys |
| Strings | `#C3BBAA` | 2.2 → 0.9 px, thicker on the low E |

---

## 3. Surfaces, shape and depth

- **Cards** — 14 px radius, 1 px `#EDE7DA` border, white fill, a barely-there double shadow
  (`0 1px 2px` plus a wide soft drop). Cards are the only elevated element on paper.
- **Controls** — 6–8 px radius, 24–32 px tall. Chips, segmented buttons and steppers are
  all outlined rather than filled, so colour stays meaningful.
- **Header** — 62 px sticky bar, no shadow; the abrupt dark-to-paper edge is the separation.
- **Popovers** — 10 px radius, `0 18px 40px -20px rgba(20,18,15,.5)`; the one place a
  shadow is allowed to be noticeable.
- **Logo** — 32 px rounded square in `--amber` with a four-line fretboard glyph in white.

Spacing is tight and utilitarian: 10–14 px inside cards, 12 px between grid blocks,
4–8 px inside control rows. Nothing is larger than it needs to be.

---

## 4. Typography

| Role | Family | Size / weight |
|---|---|---|
| UI text | `-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif` | 11–13.5 px |
| Brand title | `'Iowan Old Style', Palatino, Georgia, serif` | 18 px / 600 |
| Chord symbols | `'MuseJazzText'` (Bravura family, SIL OFL) | 27 px, line-height .85 |
| Notation | `'Bravura'` (SMuFL, SIL OFL) | sized from the staff space |
| Degree / note labels | UI sans or mono | 6.8–10.5 px, 600–700 |
| Ranges, string names, fret numbers | `ui-monospace, monospace` | 7.5–9.5 px |

Rules:

- Micro-labels are **uppercase, 8–9 px, 0.10–0.12 em tracking** (`RIGHT HAND`, `FINGER`,
  `KEY`, `TEMPO`).
- Numbers that can change are `font-variant-numeric: tabular-nums` (bar numbers, tempo,
  steppers) so the layout does not jitter.
- Two typefaces carry meaning: **MuseJazzText** only for chord symbols, **Bravura** only for
  notation glyphs. Bravura loads with `font-display: block` because its glyphs are
  private-use codepoints — a fallback font would render tofu.
- Body text never goes below 9.5 px, and labels never below 8 px.

---

## 5. Colour is the theory

The same four meanings are used everywhere, so a player can read the neck, the keyboard and
the stave with one vocabulary.

| Meaning | Colour | Shape / redundancy |
|---|---|---|
| **Tonic** | Amber `#B45309` | Largest dot, white ring, halo `#C98136` on the neck |
| **Chord tone** | Teal `#0F766E` | Medium dot, white ring |
| **Other scale tone** | Sand `#F2ECDD` (black keys `#6B6355`) | Small dot, hairline border |
| **Tension / out of scale** | none | Dashed outline `#CBC1AC`, only when *Tensions* is on |
| **Held note** | Red `#B03A2E` on `#FBE9E7` | Filled notehead, ringed finger chip |
| **Selected control** | Ink `#14120F` with cream text | Inverted fill |
| **Warning** | `#B45309` / `#A65840` | Text only |
| **OK / device ready** | `--teal` | Text only |

Colour is never the only signal: the tonic is also the biggest circle, tensions are dashed,
degrees are printed inside the dots, and the stave prints the degree above each note. This
keeps the app usable for colour-blind players and in print.

Red is deliberately scarce. It means "you are sounding this note" and nothing else — not
errors, not emphasis.

---

## 6. Instrument artwork

All three views are hand-built SVG in the same style: cream card, hairline staff/fret lines,
ink marks, no gradients.

### Grand staff (`src/ui/Keyboard.tsx`)

- Card `#FDFBF6`, 1 px `#EFE9DC`, 9 px radius.
- Staff space **12 units**; a five-line stave is 48 units tall.
- Treble stave 72–120, bass stave 178–226 — a 58-unit gap for the middle-C ledger.
- Clefs, brace and accidentals are **Bravura** glyphs, not drawn by hand:
  - G clef `U+E050` at 48 px, baseline on the G line;
  - F clef `U+E062` at 59 px, baseline on the F line;
  - brace `U+E000` stretched to exactly span both staves;
  - accidentals `U+E260`/`U+E261`/`U+E262` at four staff spaces, centred on the notehead.
- Notes: ellipse `rx 7.3 / ry 5.7`, rotated −20°, 34-unit stems, ledger lines ±13 units.
- Degree labels sit above the treble stave in `#A2906B`; right-hand fingering sits below the
  bass stave in `#FBF0E1` chips with `#E3B27C` borders and `#8A3E07` numerals.
- A held pitch class repaints the notehead, stem, ledger, accidental and finger chip red.

### Fretboard (`src/ui/Fretboard.tsx`)

- Low E on the bottom row; true fret spacing from nut to 24th fret.
- Fret lines `#D8D0BF`, heavier `#B9AF9B` at the 12th; nut `#1B1712`.
- Inlay dots `#E7E0D0`; string thickness tapers 2.2 → 0.9 px from low to high E.
- Dots follow the semantic palette in §5; frets outside the selected window drop to 25 %
  opacity, frets outside the position once more to 35 % for the lines.

### Keyboard

- White keys `#FFFFFF`, black keys `#1B1712` when out of the scale.
- In-scale white keys fill `#F2ECDD`; in-scale black keys `#6B6355`.
- Tonic and chord tones take amber and teal (with white text); held keys go red.
- Degree labels are printed on the key, fingering in a ringed chip at the key foot.

---

## 7. Controls

- **Switch** (`Keyboard`, `MIDI`): 26 × 14 px track, 10 px thumb, `#DDD5C4` off, `--teal` on,
  150 ms transition.
- **Chip / segmented**: 24 px tall, 6 px radius, ink fill when active.
- **Stepper**: 24 px tall, 18 px square buttons, disabled at 30 % opacity.
- **Primary action** (`Play`): solid amber, white 12 px 650 text, amber-tinted drop shadow.
- **Selects**: transparent in the dark header, white with `--line` border in cards.
- Hover is a border/fill change (`#FBF8F0`, `--line2`), never a transform.
- Focus is left to the browser's default ring; nothing removes it.

---

## 8. Motion

- 150 ms `ease` for switch tracks and thumbs.
- 120 ms for hover fades on quiet controls.
- No entrance animations, parallax, or transition on data changes. The one animated thing
  in the app that matters is the playhead, and that is driven by audio time, not CSS.

---

## 9. Print theme

The leadsheet is a first-class output, not a screenshot:

- A4 landscape, 10 mm margins, white background.
- Header, mixer, analysis lane, board, steppers and chips are hidden.
- A print-only title block names the tune, key, tempo and style.
- Colours are forced with `print-color-adjust: exact`, so chord tints and scale lanes
  survive printing.

---

## 10. Extending the theme

1. **Use the tokens.** New UI should reference `--ink`, `--line`, `--amber`, etc. Hard-coded
   hex is reserved for SVG artwork, where tokens do not resolve predictably.
2. **Do not add hues.** The palette is closed: paper, ink, amber, teal, sand, red. A new
   colour needs a new meaning, and there is no spare meaning.
3. **Keep colour redundant.** Any new state must also read by shape, weight, label or
   position.
4. **Notation is Bravura.** New musical symbols come from the SMuFL ranges and are sized in
   staff spaces (4 spaces = font-size), never eyeballed.
5. **Stay quiet.** Borders before shadows, shadows before gradients, and no motion that does
   not communicate a state change.

---

## Credits

- **Bravura** — SMuFL music font, Steinberg, SIL Open Font License.
- **MuseJazzText** — chord-symbol font, MuseScore, SIL Open Font License.
- Interface type is the operating system's UI sans (SF Pro / Segoe UI / system stack).
