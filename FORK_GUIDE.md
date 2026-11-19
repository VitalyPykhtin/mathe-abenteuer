# Mathe-Abenteuer — personal multi-grade fork

This repository is a fork of [dreef3/mathe-abenteuer](https://github.com/dreef3/mathe-abenteuer). The fork is for personal iPad use, not an App Store release.

## Current playable state

| Grade | Status | Entry point |
| --- | --- | --- |
| **1. Klasse** | **Playable first version**: 4 topic worlds, 3 levels each, 4 short story chapters, question feedback, German spoken instructions, coins and stars | [klasse1.html](klasse1.html) |
| **2. Klasse** | **Playable first version:** 6 worlds × 3 levels, 6 story chapters, independent save and backup | [klasse2.html](klasse2.html) |
| **3. Klasse** | **Playable first version:** 6 worlds × 3 levels, 6 story chapters, independent save and backup | [klasse3.html](klasse3.html) |
| **4. Klasse** | **Complete original game**, unchanged engine and progress key | [klasse4.html](klasse4.html) |

Open [index.html](index.html) for the shared grade selector. Grades 1, 2 and 3 are **early playable builds**, not yet full annual curricula. The exercise sequences are prototypes aligned to broad Berlin/Brandenburg learning areas, but need deeper age-specific curriculum review and additional story scenes.

The game is German-language, iPad-friendly and PWA/offline-capable. No backend, account or App Store is required. Progress is stored locally (not synchronized across devices).

## Running on iPad

1. In the repository's **Settings → Pages**, choose **Deploy from a branch**, then **main / (root)** and **Save**. GitHub Pages must become active; this action is not performed automatically by copying the files.
2. When Pages reports a live address, open that **fork address** (not the original author's Cloudflare address) in Safari on iPad.
3. Share → **Add to Home Screen** (German: *Zum Home-Bildschirm*), then **Add** (*Hinzufügen*).
4. Choose any of the **four classes**. Open each class once while online before testing airplane mode; offline files are cached after service worker installation.
5. For Grades 1–3, open **⚙️ Eltern** to copy the backup code. For Grade 4, use its original parent section (10 fast taps on Version).

**Important:** No progress moves automatically from the author's website to the fork because the origin differs. The existing Grade 4 in-browser storage key stays \`mathe-abenteuer-v2\` in the fork. If you already played the original and want progress here, use the original game's parent backup/export/restore code.

A GitHub Pages web address is generally publicly reachable even if you are only using the app privately; do not share personal backup codes.

## Developer workflow

\`\`\`sh
node --test tests/*.test.cjs
node --check grades/klasse1-app.js
python3 -m http.server 8000
\`\`\`

Then open \`http://localhost:8000/\`. Offline PWA behavior is supported over HTTPS or localhost, not ordinary LAN HTTP.

### Architecture

- \`index.html\`: grade selection (Klasse 2/3 disabled until ready).
- \`klasse4.html\`: unchanged original Klasse 4 HTML and engine scripts.
- \`klasse1.html\`: Grade 1 using the original Three.js world and image assets.
- \`grades/catalog.js\`: independent grade metadata and storage keys.
- \`grades/klasse1.js\`: randomized question generators.
- \`grades/klasse1-app.js\`: training, story, voice, scoring, save/restore.
- \`sw.js\`: mandatory core offline cache for the launcher and playable grades; keeps both backup mirrors.
- \`tests/\`: deterministic invariants and randomized questions.

### Next planned work

- Validate and complete Klasse 1 curriculum coverage and add visual exercises for money, time and lengths.
- Teacher/parent review, accessibility and actual iPad offline testing.
- Expand Klasse 2 and 3 topics and story content beyond the first playable prototypes, based on parent/teacher review.

The upstream source has no explicit top-level LICENSE file; this fork retains upstream credits and is not intended for redistribution.
