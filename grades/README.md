# Mathe-Abenteuer — multi-grade development

This folder begins a **non-breaking extension** of the existing German Klasse 4 game to Klassen 1–3.

## Status (foundation)

| Grade | State | Implemented |
| --- | --- | --- |
| 1 | Exercise-bank prototype | Four topic worlds with three levels each, returning the existing choice-question format |
| 2 | Planned | Provisional topic catalogue only |
| 3 | Planned | Provisional topic catalogue only |
| 4 | Existing | Original 3D story/training, unchanged on `main` |

**The new Grade 1 generators are not yet connected to the game's UI.** They are building blocks, not a complete playable Klasse 1 edition. No selector is exposed to children until it has a working destination.

## Architecture and backward compatibility

- Preserve `index.html`, `game.js`, `tasks.js`, `tasks2.js`, `story.js`, `story2.js` and all Klasse 4 gameplay until a separately reviewed integration.
- `catalog.js` records grades, development status and **separate** future save keys.
- `klasse1.js` introduces independent randomized tasks in the existing `choice` format (`q`, `options`, `correct`, `explain`, optional `visual`).
- Never reuse the original storage key `mathe-abenteuer-v2` or mirror cache `mathe-abenteuer-save` for other grades. Do not automatically migrate/swap Klasse 4 progress; keep save, backup/export and restore routines isolated by class.
- A future shared grade-aware game layer should reuse the original 3D scenes, audio, characters and rewards, while loading distinct curricula and story chapters per grade.
- Keep iPad/PWA and offline operation. When new scripts are integrated into the launcher, update the service-worker cache list and version.
- Preserve credit attribution in `CREDITS.md`. The upstream repository does not declare a license; independently confirm reuse/distribution rights before external publication or commercialization.

## Milestones

1. **Foundation** — grade catalogue, first Klasse 1 question generators, lightweight Node tests (this PR).
2. **Shared grade selector** — select 1–4 in the app; allow only playable grades; protect Klasse 4 progress and add per-grade storage, independent backups.
3. **Klasse 1** — complete topic coverage, age-appropriate reading/voice guidance, visual counting, story chapters and reward integration.
4. **Klasse 2** — numbers to 100, addition/subtraction, early multiplication/division, measurements, geometry and story.
5. **Klasse 3** — numbers to 1,000, multiplication/division and written methods, word problems, geometry and story.
6. **Release readiness** — teacher/parent review against the Berlin/Brandenburg mathematics curriculum, accessibility checks and iPad regression/offline tests.

Topic order is a provisional teaching plan, **not yet a verified representation of the official curriculum**. Check class-specific outcomes and boundaries before publishing.

## Test

Run with Node.js 20+:

```sh
node --test tests/grade1.test.cjs
```
