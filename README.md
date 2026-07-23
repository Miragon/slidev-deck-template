# Miragon Slidev Deck Template

[![License: MIT](https://img.shields.io/github/license/Miragon/slidev-deck-template)](LICENSE)
[![Build Deck](https://github.com/Miragon/slidev-deck-template/actions/workflows/build-and-deploy.yml/badge.svg)](https://github.com/Miragon/slidev-deck-template/actions/workflows/build-and-deploy.yml)
[![npm](https://img.shields.io/npm/v/@miragon/slidev-toolkit)](https://www.npmjs.com/package/@miragon/slidev-toolkit)

A reusable [Slidev](https://sli.dev) template in the Miragon corporate design. Fill in your content — the design, animations and colours are done.

![Cover slide preview](docs/assets/cover.png)

## Quick start

Scaffold a fresh deck with one command. Needs **Node 20+** and a modern browser (WebGL2 for the animated background, with a CSS-gradient fallback).

```bash
npm create @miragon/slidev-deck@latest my-talk
# equivalently:
npx @miragon/create-slidev-deck@latest my-talk
```

```bash
cd my-talk
npm install
npm run dev      # opens the deck on http://localhost:3030 with live reload
```

You get a lean repo with **only** the files a deck needs (`deck/`, `.claude/`, `CLAUDE.md`, `verify/`, the Build Deck + Pin Check workflows) and `@miragon/slidev-toolkit` pulled from npm — no toolkit source, no release tooling to prune. Then:

1. Replace the demo content under `deck/`; keep the `REQUIRED / OPTIONAL / LIMIT / HOW TO USE` comment-block guardrails on each demo slide.
2. Point the `seoMeta` block in `deck/slides.md` at your own domain, or delete it — it still carries this template's link preview.
3. Commit the generated `package-lock.json` after the first `npm install` so CI (`npm ci`) is reproducible.
4. Or open the repo with Claude Code and let it draft the first pass from your outline.

> **Fallback — "Use this template":** the GitHub button still works, but it copies *every* file, including the toolkit source, the release tooling and the `LICENSE`, which you then prune by hand. Prefer `npm create` unless you specifically want to fork the toolkit itself.

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

A slide is frontmatter + headings + bullets + component tags, never raw `<div>`/CSS/hex. Full props in the `slides` skill (`.claude/skills/slides/reference/components.md`).

| Component | What it's for |
|---|---|
| `Card` | The canonical white card; accent on the title only |
| `CardGrid` | Column wrapper for a row of `Card`s |
| `StepList` / `Step` | A compact labelled sequence beside a diagram |
| `Figure` | A titled, captioned wrapper around a visual (incl. `.excalidraw.svg`) |
| `SplitView` | Two columns: a visual and an explanation |

## Present, build, export

Run these in your deck:

| Command | Result |
|---|---|
| `npm run dev` | Live preview on `:3030`; press `p` for presenter mode, `o` for overview |
| `npm run build` | Static `dist/` you can host anywhere (Mesh animation included, no Node at runtime) |
| `npm run export` | `slidev-exported.pdf` locally (needs Chromium; kept out of `build` so CI stays green) |
| `npm run verify` | Screenshot + checklist per slide against the design rules |

Every push and PR to your deck is built and verified in CI (**Build Deck**, **Pin Check**); hosting is up to you (any static host, or wire up Netlify / GitHub Pages).

## Working with Claude

The scaffold ships `CLAUDE.md` and the `slides` skill, so a Claude Code session knows the design system on the first prompt. It respects the white-card, no-em-dash, heading-colour and `leftIsGood` rules automatically. Starter prompts:

> Outline a 30-minute talk on [topic] using `cover`, three `section` chapters with two `content` slides each, then `closing`. Split into chapter files under `deck/chapter/`.

> Add a `content` slide "Three habits of a clean release" with a `CardGrid` of 3 white cards.

> Build a `goodbad` slide asking "Which error message helps the user more?" Make Model A the avoid side.

## Troubleshooting

- **`npm install` fails (node-gyp / build tools).** Check `node --version` (needs 20+); on macOS run `xcode-select --install`.
- **Port 3030 in use.** `npm run dev -- --port 3031`.
- **Export produces an empty PDF.** Run `npm run build` once to warm the pre-bundle, then `npm run export`.
- **Cover renders white.** WebGL2 is blocked and the gradient fallback too — update or switch browsers.

## Contributing

Working on the template itself — the `@miragon/slidev-toolkit` design system, the `@miragon/create-slidev-deck` scaffolder, or the verification suite? See [CONTRIBUTING.md](CONTRIBUTING.md) for the monorepo layout, local development and how releases are published.

## License

MIT — see [LICENSE](LICENSE). It covers this repository: the template scaffolding and the reference deck. `@miragon/slidev-toolkit` ships its own copy ([`packages/toolkit/LICENSE`](packages/toolkit/LICENSE)) inside the npm package, and the bundled Geist fonts are OFL ([`packages/toolkit/assets/fonts/LICENSE.txt`](packages/toolkit/assets/fonts/LICENSE.txt)).

**Decks scaffolded with `npm create` carry no `LICENSE`** — a talk usually wants all rights reserved, and no license file means exactly that. Only the **"Use this template"** fallback copies this `LICENSE` (*MIT, Copyright (c) Miragon GmbH*, which would declare your slides free to copy, sell and sublicense); if you went that route, delete it. Add one back only if you deliberately publish your deck under specific terms.
