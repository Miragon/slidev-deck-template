# Contributing

This repo is the monorepo behind the Miragon Slidev template. Most people never need it — they just run `npm create @miragon/slidev-deck` (see the [README](README.md)). This guide is for working on the template itself: the design system, the scaffolder, or the verification suite.

## Repository layout

An npm workspace with four sub-projects, each with its own README:

| Path | What it is | README |
|---|---|---|
| [`deck/`](deck/) | The reference deck — cover, chapters, closing. Doubles as the demo and the verify target. | [deck/README.md](deck/README.md) |
| [`packages/toolkit/`](packages/toolkit/) | The `@miragon/slidev-toolkit` design system: theme, layouts, components. Fixed by brand. | [packages/toolkit/README.md](packages/toolkit/README.md) |
| [`packages/create-deck/`](packages/create-deck/) | The `@miragon/create-slidev-deck` scaffolder behind `npm create @miragon/slidev-deck`. | [packages/create-deck/README.md](packages/create-deck/README.md) |
| [`verify/`](verify/) | The design-system verification suite (`npm run verify`). | [verify/README.md](verify/README.md) |
| [`.github/`](.github/) | CI, deploy, release and supply-chain automation. | [.github/WORKFLOWS.md](.github/WORKFLOWS.md) |

The reference deck consumes the toolkit by name (`theme: '@miragon/slidev-toolkit'`); in this monorepo the workspace symlink resolves it, so editing `packages/toolkit/` is reflected live in the deck.

## Local development

Needs **Node 20+** and a modern browser (WebGL2 for the animated background).

```bash
npm install      # once — installs every workspace
npm run dev      # previews the reference deck on http://localhost:3030
npm run build    # static build of the reference deck
npm run verify   # full render + checklist per slide against the design rules
```

`npm run verify:source` runs only the fast source-level guardrails (sanctioned layout, no raw HTML, diagrams light/transparent) with no browser — the same check CI runs on every PR.

## Commits and PR titles

PRs are **squash-merged**, so the PR title becomes the commit message on `main` and must be a valid [Conventional Commit](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `ci:`, `build:`, `test:`, `revert:`). The **PR Title** workflow enforces this. Scope changes to the package they touch (`feat(slidev-toolkit): …`, `fix(create-slidev-deck): …`) so they land in the right changelog.

## Releases

Releases are automated with [release-please](https://github.com/googleapis/release-please). Each of the two published packages has its own release line:

- `@miragon/slidev-toolkit` — tags `vX.Y.Z`.
- `@miragon/create-slidev-deck` — tags `create-slidev-deck-vX.Y.Z`.

On every push to `main`, release-please maintains a Release PR per package (version bump + changelog) from the conventional commits since the last release. Merging a Release PR cuts its GitHub release and tag and publishes the package to npm via tokenless OIDC Trusted Publishing. The scaffolder is released deliberately: cut a new `create-slidev-deck` release when you want template content or a newer toolkit pin to reach freshly-scaffolded decks.

A brand-new package's very first publish needs a one-time manual publish (OIDC can't configure a trusted publisher for a package that does not exist yet); every later release is tokenless. Full detail — the App-token auth, the OIDC constraints, and the template-only guards — is in [.github/WORKFLOWS.md](.github/WORKFLOWS.md).

## Hosting

The template's own reference deck is served by Netlify via [`netlify.toml`](netlify.toml). A repo created from the template gets no site until someone connects it in the Netlify UI.
