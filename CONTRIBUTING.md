# Contributing

This repo is the monorepo behind the Miragon Slidev template. Most people never need it — they just run `npm create @miragon/slidev-deck` (see the [README](README.md)). This guide is for working on the template itself: the design system, the scaffolder, or the verification suite.

## Repository layout

An npm workspace with the sub-projects below, each with its own README, plus the `miragon-slidev` Claude Code plugin:

| Path | What it is | README |
|---|---|---|
| [`deck/`](deck/) | The reference deck — cover, chapters, closing. Doubles as the demo and the verify target. | [deck/README.md](deck/README.md) |
| [`packages/toolkit/`](packages/toolkit/) | The `@miragon/slidev-toolkit` design system: theme, layouts, components. Fixed by brand. | [packages/toolkit/README.md](packages/toolkit/README.md) |
| [`packages/create-deck/`](packages/create-deck/) | The `@miragon/create-slidev-deck` scaffolder behind `npm create @miragon/slidev-deck`. | [packages/create-deck/README.md](packages/create-deck/README.md) |
| [`packages/validator/`](packages/validator/) | The `@miragon/slidev-validator` design-system linter (`npm run verify`) — versioned + configurable. | [packages/validator/README.md](packages/validator/README.md) |
| [`miragon-slidev-plugin/`](miragon-slidev-plugin/) | The `miragon-slidev` Claude Code plugin: the `slides` + `excalidraw` authoring skills. Listed by [`.claude-plugin/marketplace.json`](.claude-plugin/marketplace.json); consumed by decks via the plugin marketplace, not copied. | [miragon-slidev-plugin/README.md](miragon-slidev-plugin/README.md) |
| [`.github/`](.github/) | CI, deploy, release and supply-chain automation. | [.github/WORKFLOWS.md](.github/WORKFLOWS.md) |

The reference deck consumes the toolkit by name (`theme: '@miragon/slidev-toolkit'`); in this monorepo the workspace symlink resolves it, so editing `packages/toolkit/` is reflected live in the deck. The plugin's skills are the single source of truth under `miragon-slidev-plugin/skills/`; `.claude/skills` is a symlink to them, so editing a skill is reflected live in this repo's own Claude Code sessions.

## Local development

Needs **Node 20+** (**Node 24+** for `npm run dev`, which uses portless) and a modern browser (WebGL2 for the animated background).

```bash
npm install      # once — installs every workspace
npm run dev      # previews the reference deck at https://<branch>.slidev-deck.localhost (portless)
npm run build    # static build of the reference deck
npm run verify   # full render + checklist per slide against the design rules
```

`npm run dev` runs through [portless](https://portless.sh): a stable, worktree-aware `.localhost` URL instead of a `:3030` port, so parallel worktrees (e.g. Conductor workspaces) never collide. The proxy auto-starts on first run (one-time `sudo`); run `npx portless service install` once to make it permanent. `npm run dev:plain` runs the raw Slidev server without portless.

`npm run verify:source` runs only the fast source-level guardrails (sanctioned layout, no raw HTML, diagrams light/transparent) with no browser — the same check CI runs on every PR.

## Commits and PR titles

PRs are **squash-merged**, so the PR title becomes the commit message on `main` and must be a valid [Conventional Commit](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `ci:`, `build:`, `test:`, `revert:`). The **PR Title** workflow enforces this. Scope changes to the package they touch (`feat(slidev-toolkit): …`, `fix(create-slidev-deck): …`) so they land in the right changelog. Scope skill changes `miragon-slidev` (`feat(miragon-slidev): …`) so they bump the plugin and land in [`miragon-slidev-plugin/CHANGELOG.md`](miragon-slidev-plugin/CHANGELOG.md).

## Releases

Releases are automated with [release-please](https://github.com/googleapis/release-please). Each release target has its own release line:

- `@miragon/slidev-toolkit` — tags `vX.Y.Z`.
- `@miragon/create-slidev-deck` — tags `create-slidev-deck-vX.Y.Z`.
- `@miragon/slidev-validator` — tags `slidev-validator-vX.Y.Z`.
- `miragon-slidev` (the Claude Code plugin) — tags `miragon-slidev-plugin-vX.Y.Z`. Bumps `miragon-slidev-plugin/.claude-plugin/plugin.json` + `miragon-slidev-plugin/CHANGELOG.md`; **not published to npm** — the marketplace serves the plugin straight from this git repo, so the tagged version bump is all consumers need (Claude Code auto-updates installed plugins to it).

On every push to `main`, release-please maintains a Release PR per target (version bump + changelog) from the conventional commits since the last release. Merging a Release PR cuts its GitHub release and tag and, for the three npm packages, publishes to npm via tokenless OIDC Trusted Publishing. The scaffolder is released deliberately: cut a new `create-slidev-deck` release when you want template content or a newer toolkit pin to reach freshly-scaffolded decks.

A brand-new package's very first publish needs a one-time manual publish (OIDC can't configure a trusted publisher for a package that does not exist yet); every later release is tokenless. Full detail — the App-token auth, the OIDC constraints, and the template-only guards — is in [.github/WORKFLOWS.md](.github/WORKFLOWS.md).

## Hosting

The template's own reference deck is served by Netlify via [`netlify.toml`](netlify.toml). A repo created from the template gets no site until someone connects it in the Netlify UI.
