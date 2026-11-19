# Mathe-Abenteuer — multiple grades

This folder powers the personal multi-grade fork. Start at the [fork guide](../FORK_GUIDE.md).

## Status

| Grade | Status |
| --- | --- |
| 1 | **Playable first version** — 4 worlds × 3 levels (12 sets), 4 mini-story chapters, 3D stage reusing original assets, stars, coins, spoken German hints, separate progress and backup code |
| 2 | **Playable first version:** 6 worlds, 3 levels per world, 6 stories, independent grade 2 save |
| 3 | **Playable first version:** 6 worlds, 3 levels per world, 6 stories, independent grade 3 save |
| 4 | Original complete game preserved on \`klasse4.html\`, untouched engine and storage key |

The current editions for Klassen 1–3 are **not complete grade-year curricula**. For example, money, time and lengths still need dedicated worlds, more visual exercise styles and parent/teacher review.

## Architecture

- \`../index.html\`: grade launcher. Never link to unfinished grades.
- \`../klasse1.html\`: first-grade adventure; \`../klasse4.html\`: the original HTML preserved.
- \`catalog.js\`: all four grades and separated progress storage keys.
- \`klasse1.js\`: exercise generators returning existing engine-compatible choice question objects.
- \`klasse1-app.js\`: dedicated browser runtime. It reuses \`../world3d.js\`, \`../three.min.js\`, original character artwork, but never calls \`../game.js\` or mutates the original state.
- \`klasse1.css\`, \`launcher.css\`: touch-first layouts.
- \`../sw.js\`: caches launcher plus both playable pages, preserves progress mirrors.
- \`../tests\`: generator and safety checks.

The original 4th-grade progress remains \`mathe-abenteuer-v2\` and its mirror cache \`mathe-abenteuer-save\`. Each new grade must use a separate save key and backup format. Never silently overwrite or migrate saves.

## Planned milestones

1. Validate this playable Klasse 1 first version on iPad, including offline and German speech.
2. Extend Klasse 1 to the full expected mathematics curriculum and richer visual questions.
3. Extend the playable Klasse 2 edition to full curriculum coverage.
4. Extend the playable Klasse 3 edition to full curriculum coverage.
5. Review material against the Berlin/Brandenburg Rahmenlehrplan, test accessibility and iPad reliability.

Source credit: [dreef3/mathe-abenteuer](https://github.com/dreef3/mathe-abenteuer). Personal use only; upstream has no explicit top-level LICENSE file.

Run tests:

\`\`\`sh
node --test tests/*.test.cjs
\`\`\`
