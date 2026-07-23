# __DECK_NAME__

A [Slidev](https://sli.dev) presentation in the Miragon corporate design, scaffolded from
[`@miragon/slidev-deck-template`](https://github.com/Miragon/slidev-deck-template). The design
system ships as the [`@miragon/slidev-toolkit`](https://www.npmjs.com/package/@miragon/slidev-toolkit)
npm package — you fill in the content, the theme is fixed.

## Quick start

Needs **Node 20+** and a modern browser (WebGL2 for the animated background, with a CSS-gradient fallback).

```bash
npm install
npm run dev      # opens the deck on http://localhost:3030 with live reload
```

Edit files under `deck/` and save — the preview updates instantly. Every demo slide carries a
`REQUIRED / OPTIONAL / LIMIT / HOW TO USE` comment block: your in-place authoring guide.

## Layout

| Path | What it is |
|---|---|
| `deck/` | **Your content** — `slides.md` is the entry (cover + one `src:` import per chapter + closing); each chapter is a folder `deck/chapter/NN-name/` with its own `resources/`. |
| `verify/` | Brand guardrails (`npm run verify`) — every slide declares a sanctioned layout, cards stay white, no em-dashes, headings black, diagrams light/transparent. |
| `CLAUDE.md` + `.claude/skills/` | Authoring guidance for Claude Code, so a session knows the design system on the first prompt. |
| `.github/workflows/` | **Build Deck** and **Pin Check** run on every push and PR. |

The deck consumes the toolkit by name (`theme: '@miragon/slidev-toolkit'`); you never touch the theme.

## Commands

| Command | Result |
|---|---|
| `npm run dev` | Live preview on `:3030`; `p` for presenter mode, `o` for overview |
| `npm run build` | Static `dist/` you can host anywhere |
| `npm run export` | `slidev-exported.pdf` locally (needs Chromium) |
| `npm run verify` | Screenshot + checklist per slide against the design rules |

## Next steps

1. Replace the demo content under `deck/`; keep the comment-block guardrails.
2. Point the `seoMeta` block in `deck/slides.md` at your own domain, or delete it.
3. Commit the generated `package-lock.json` after the first `npm install` so CI (`npm ci`) is reproducible.
4. Or open the repo with Claude Code and let it draft the first pass from your outline.

Authoring conventions live in the `slides` skill (`.claude/skills/slides/`). Starter prompts:

> Outline a 30-minute talk on [topic] using `cover`, three `section` chapters with two `content` slides each, then `closing`.

> Build a `goodbad` slide asking "Which error message helps the user more?" Make Model A the avoid side.
