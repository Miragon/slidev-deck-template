# __DECK_NAME__

A [Slidev](https://sli.dev) presentation in the Miragon corporate design, scaffolded from
[`@miragon/slidev-deck-template`](https://github.com/Miragon/slidev-deck-template). The design
system ships as the [`@miragon/slidev-toolkit`](https://www.npmjs.com/package/@miragon/slidev-toolkit)
npm package — you fill in the content, the theme is fixed.

## Quick start

Needs **Node 20+** (**Node 24+** for `npm run dev`) and a modern browser (WebGL2 for the animated background, with a CSS-gradient fallback).

```bash
npm install
npm run dev      # serves the deck at https://<this-deck>.localhost with live reload
```

`npm run dev` runs through [portless](https://portless.sh): a stable `.localhost` URL instead of a `:3030` port, so several decks run at once without colliding. The proxy auto-starts on first run (one-time `sudo`); `npx portless service install` makes it permanent. Use `npm run dev:app` to run the raw server without portless.

Edit files under `deck/` and save — the preview updates instantly. Every demo slide carries a
`REQUIRED / OPTIONAL / LIMIT / HOW TO USE` comment block: your in-place authoring guide.

## Layout

| Path | What it is |
|---|---|
| `deck/` | **Your content** — `slides.md` is the entry (cover + one `src:` import per chapter + closing); each chapter is a folder `deck/chapter/NN-name/` with its own `resources/`. |
| `slidev-validator.config.mjs` | Your copy of the guardrail config (extends `@miragon/slidev-validator/recommended`). Brand guardrails ship as the versioned `@miragon/slidev-validator` package (`npm run verify`) — sanctioned layouts, white cards, no em-dashes, black headings, light/transparent diagrams — so central improvements arrive over `npm update`, and you tune or scope rules here without forking. |
| `CLAUDE.md` + `.claude/settings.json` | Authoring guidance for Claude Code. `CLAUDE.md` loads on the first prompt; `settings.json` registers the `miragon-slidev` plugin marketplace so the `slides` + `excalidraw` skills install (and auto-update) instead of shipping as a frozen copy. |
| `.github/workflows/` | **Build Deck** (static build plus `npm run verify:source`) and **Pin Check** run on every push and PR. |

The deck consumes the toolkit by name (`theme: '@miragon/slidev-toolkit'`); you never touch the theme.

## Commands

| Command | Result |
|---|---|
| `npm run dev` | Live preview at `https://<this-deck>.localhost` (portless); `p` for presenter mode, `o` for overview |
| `npm run build` | Static `dist/` you can host anywhere |
| `npm run export` | `slidev-exported.pdf` locally (needs Chromium) |
| `npm run verify` | Full screenshot + checklist per slide against the design rules (local; needs a browser) |
| `npm run verify:source` | Fast source-only guardrail checks, no browser — the subset CI runs |

## Next steps

1. Replace the demo content under `deck/`; keep the comment-block guardrails.
2. Point the `seoMeta` block in `deck/slides.md` at your own domain, or delete it.
3. Commit the generated `package-lock.json` after the first `npm install` so CI (`npm ci`) is reproducible.
4. Or open the repo with Claude Code and let it draft the first pass from your outline.

Authoring conventions live in the `slides` skill (the `miragon-slidev` plugin; `miragon-slidev:slides`). Starter prompts:

> Outline a 30-minute talk on [topic] using `cover`, three `section` chapters with two `content` slides each, then `closing`.

> Build a `goodbad` slide asking "Which error message helps the user more?" Make Model A the avoid side.

## Staying up to date

**Authoring skills.** The `slides` and `excalidraw` skills ship as the `miragon-slidev` Claude Code plugin, not a
frozen copy in this repo, so central improvements reach you automatically. `.claude/settings.json` already
registers the marketplace with auto-update on: the first time you trust this folder in Claude Code you are
prompted to install the plugin, and later versions arrive in the background (run `/reload-plugins` when prompted).
To manage it by hand — or if the prompt does not appear:

```
/plugin marketplace add Miragon/slidev-deck-template
/plugin install miragon-slidev@miragon-slidev
/plugin marketplace update miragon-slidev   # pull the latest catalog on demand
```

The skills are then invoked as `miragon-slidev:slides` and `miragon-slidev:excalidraw` (Claude also selects them
automatically when you work under `deck/`).

**Dependencies.** Your npm dependencies (`@miragon/slidev-toolkit`, `@slidev/cli`, the addons) are exact-pinned so installs stay
reproducible. For a deck you keep around, enable [Dependabot](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates)
so it opens PRs when new versions ship — you get the latest toolkit and Slidev without hunting for updates,
and **Build Deck** + **Pin Check** gate each PR. Add `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
    groups:
      npm:
        patterns: ["*"]
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: monthly
```

For a one-off talk you can skip this — the pinned versions keep working as-is.
