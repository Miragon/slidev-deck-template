# Miragon Slidev Deck Template

[![License: MIT](https://img.shields.io/github/license/Miragon/slidev-deck-template)](LICENSE)
[![Build Deck](https://github.com/Miragon/slidev-deck-template/actions/workflows/build-and-deploy.yml/badge.svg)](https://github.com/Miragon/slidev-deck-template/actions/workflows/build-and-deploy.yml)
[![npm](https://img.shields.io/npm/v/@miragon/slidev-toolkit)](https://www.npmjs.com/package/@miragon/slidev-toolkit)

A reusable [Slidev](https://sli.dev) template in the Miragon corporate design. Fill in your content — the design, animations and colours are done.

![Cover slide preview](docs/assets/cover.png)

> **Authoring guide:** the `slides` skill (`.claude/skills/slides/`). This README onboards you; the skill answers everything else, and the code in [`packages/toolkit/`](packages/toolkit/) is the rendering truth.

## Quick start

Needs **Node 20+** (`node --version`) and a modern browser (WebGL2 for the animated background, with a CSS-gradient fallback).

```bash
npm install      # once, ~30s — pulls Slidev and a Chromium for PDF export
npm run dev      # opens the deck on http://localhost:3030 with live reload
```

Edit files under `deck/` and save — the preview updates instantly. Every demo slide carries a `REQUIRED / OPTIONAL / LIMIT / HOW TO USE` comment block: your in-place authoring guide.

## Repository layout

This is an npm workspace with three sub-projects, each with its own README:

| Path | What it is | README |
|---|---|---|
| [`deck/`](deck/) | **Your content** — cover, chapters, closing. This is what you edit. | [deck/README.md](deck/README.md) |
| [`packages/toolkit/`](packages/toolkit/) | The `@miragon/slidev-toolkit` design system: theme, layouts, components. Fixed by brand. | [packages/toolkit/README.md](packages/toolkit/README.md) |
| [`verify/`](verify/) | The design-system verification suite (`npm run verify`). | [verify/README.md](verify/README.md) |
| [`.github/`](.github/) | CI, deploy, release and supply-chain automation. | [.github/WORKFLOWS.md](.github/WORKFLOWS.md) |

The deck consumes the toolkit by name (`theme: '@miragon/slidev-toolkit'`); you never touch it. Content lives under `deck/` — `slides.md` is the entry (cover + one `src:` import per chapter + closing), and each chapter is a folder `deck/chapter/NN-name/` with its own `resources/`. See [`deck/README.md`](deck/README.md) for the full workflow.

## The 12 archetypes

Set `layout:` per slide. When in doubt, copy the closest demo under `deck/chapter/`.

| Layout | What it's for | Limit |
|---|---|---|
| `cover` | Animated title slide | 1 statement |
| `hero` | One big statement, ideally a question the next slides answer | 1 idea, no bullets |
| `person` | Introduce one or two speakers (solo / duo) | bio ≤ 3 lines |
| `section` | Chapter divider with ghost index | terse subtitle |
| `content` | Workhorse: bullets, prose, or a card grid | ≤ 5 bullets, 1 level |
| `content-image` | Two columns: image on one side, prose/bullets on the other | ≤ 4 bullets, 1 visual |
| `compare` | Side-by-side white panels; title colour carries the distinction | ≤ 4 bullets per panel |
| `goodbad` | "Which one is right, and why?" — neutral panels + one-click reveal | keep panels short |
| `bpmn` | A BPMN file with token simulation (needs `slidev-addon-bpmn`) | 1 diagram, short caption |
| `dmn` | A DMN decision table (needs `slidev-addon-dmn`) | 1 table |
| `showcase` | Interactive feature explorer: clickable cards + detail panel | 3–4 items |
| `closing` | Animated closing slide | 1 CTA |

## Components — keep the markdown clean

A slide is frontmatter + headings + bullets + component tags, never raw `<div>`/CSS/hex. Full props in the `slides` skill (`reference/components.md`).

| Component | What it's for |
|---|---|
| `Card` | The canonical white card; accent on the title only |
| `CardGrid` | Column wrapper for a row of `Card`s |
| `StepList` / `Step` | A compact labelled sequence beside a diagram |
| `Figure` | A titled, captioned wrapper around a visual (incl. `.excalidraw.svg`) |
| `SplitView` | Two columns: a visual and an explanation |

## Present, build, export

| Command | Result |
|---|---|
| `npm run dev` | Live preview on `:3030`; press `p` for presenter mode, `o` for overview |
| `npm run build` | Static `dist/` you can host anywhere (Mesh animation included, no Node at runtime) |
| `npm run export` | `slidev-exported.pdf` locally (needs Chromium; kept out of `build` so CI stays green) |
| `npm run verify` | Screenshot + checklist per slide against the design rules — see [`verify/`](verify/) |

Every push and PR is built and verified in CI ([`.github/`](.github/)); CI itself publishes nowhere. Hosting is opt-in: this template's own deck is served by Netlify via [`netlify.toml`](netlify.toml), but a repo created from the template gets **no** site until you connect it in the Netlify UI.

## Working with Claude

The template ships `CLAUDE.md` and the `slides` skill, so a Claude Code session knows the design system on the first prompt. It respects the white-card, no-em-dash, heading-colour and `leftIsGood` rules automatically. Starter prompts:

> Outline a 30-minute talk on [topic] using `cover`, three `section` chapters with two `content` slides each, then `closing`. Split into chapter files under `deck/chapter/`.

> Add a `content` slide "Three habits of a clean release" with a `CardGrid` of 3 white cards.

> Build a `goodbad` slide asking "Which error message helps the user more?" Make Model A the avoid side.

## Troubleshooting

- **`npm install` fails (node-gyp / build tools).** Check `node --version` (needs 20+); on macOS run `xcode-select --install`.
- **Port 3030 in use.** `npm run dev -- --port 3031`.
- **Export produces an empty PDF.** Run `npm run build` once to warm the pre-bundle, then `npm run export`.
- **Cover renders white.** WebGL2 is blocked and the gradient fallback too — update or switch browsers.

More (PDF button, brand colours, per-file map) in [`deck/README.md`](deck/README.md).

## Creating a new deck from this template

1. Click **Use this template** on GitHub → fresh repo.
2. `npm install`, then `npm run dev` to preview.
3. Replace the demo content under `deck/`; keep the comment-block guardrails.
4. Point the `seoMeta` block in [`deck/slides.md`](deck/slides.md) at your own domain, or delete it — it still carries this template's link preview.
5. Delete the copied `LICENSE` (see below).
6. Or open the repo with Claude Code and let it draft the first pass from your outline.

Your repo builds and verifies the deck (**Build Deck**, **Pin Check**) and does nothing else. **Release** and **PR Title** belong to the template — they maintain the `@miragon/slidev-toolkit` npm package and only ever run in `Miragon/slidev-deck-template`; in your repo they show up as *skipped* and change nothing. Delete `.github/workflows/release-please.yml`, `.github/workflows/pr-title.yml`, `release-please-config.json` and `.release-please-manifest.json` if you want a quiet Actions tab.

## License

MIT — see [LICENSE](LICENSE). It covers this repository: the template scaffolding and the reference deck. `@miragon/slidev-toolkit` ships its own copy ([`packages/toolkit/LICENSE`](packages/toolkit/LICENSE)) inside the npm package, and the bundled Geist fonts are OFL ([`packages/toolkit/assets/fonts/LICENSE.txt`](packages/toolkit/assets/fonts/LICENSE.txt)).

**In a deck created from this template, delete `LICENSE`.** "Use this template" copies every file, so your repo would otherwise ship *MIT, Copyright (c) Miragon GmbH* — declaring that your slides may be copied, sold and sublicensed by anyone. No license file means all rights reserved, which is what a talk usually wants. Replace it only if you deliberately publish your deck under specific terms.
