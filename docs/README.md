# Guitar Solo Maestro — Documentation

Version **0.11.0** · 2026-11-10

| Document | What it covers |
|---|---|
| [User guide](./USER-GUIDE.md) | Every control, playback styles, libraries, MIDI export |
| [Visual theme](./THEME.md) | Palette, type, notation artwork, colour semantics, print rules |
| [Architecture](./ARCHITECTURE.md) | Module map, data flow, theory and arrangement engines |
| [Core 100 standards](./STANDARDS.md) | The bundled library: data shape, styles, verification, full list |
| [Chart format](./CHART-FORMAT.md) | JSON schema, validation rules, storage keys, compact changes syntax |
| [MIDI export](./MIDI-EXPORT.md) | SMF layout, tracks, tick math, what is and isn't included |

## Other project docs

- [`../README.md`](../README.md) — product overview and quick start
- [`../CHANGELOG.md`](../CHANGELOG.md) — released history
- [`../BUILD_PLAN.md`](../BUILD_PLAN.md) — original architecture notes and roadmap
- [`../UPDATES.md`](../UPDATES.md) — milestone plan and shipped status

## In the deployed app

A copy of this folder is served at `/docs/` in the built site. The canonical sources live
in `docs/`; regenerate the copy with:

```bash
npm run docs:sync
```
