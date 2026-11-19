# Contributing

This repo is the monorepo behind the Miragon brand toolbox. Most people never need it: they install a package or run `npm create @miragon/slidev-deck` (see the [README](README.md)). This guide is for working on the kits themselves.

## External contributions

We're currently not accepting pull requests from outside the team. We don't have the resources to fully review and validate external contributions, so we can't guarantee that a merged change keeps the project free of bugs, free of security vulnerabilities or malicious code, and consistent with requirements that make sense for it. Pull requests opened by external contributors will be closed.

If you've found a bug or have an idea, please [open an issue](https://github.com/Miragon/brand-toolbox/issues/new) instead. We read every one, and it's the best way to get something onto our radar.

## Repository layout

An npm workspace. Each concern is a kit under `kits/`, holding its npm packages, its reference project and its Claude Code plugin:

| Path | What it is | README |
|---|---|---|
| [`kits/slidev/deck/`](kits/slidev/deck/) | The reference deck: cover, chapters, closing. Doubles as the demo, the verify target and the `deck/` every scaffolded deck starts from. | [kits/slidev/deck/README.md](kits/slidev/deck/README.md) |
| [`kits/slidev/packages/toolkit/`](kits/slidev/packages/toolkit/) | The `@miragon/slidev-toolkit` design system: theme, layouts, components. Fixed by brand. | [README](kits/slidev/packages/toolkit/README.md) |
| [`kits/slidev/packages/create-deck/`](kits/slidev/packages/create-deck/) | The `@miragon/create-slidev-deck` scaffolder behind `npm create @miragon/slidev-deck`. | [README](kits/slidev/packages/create-deck/README.md) |
| [`kits/slidev/packages/validator/`](kits/slidev/packages/validator/) | The `@miragon/slidev-validator` design-system linter (`npm run verify`), versioned and configurable. | [README](kits/slidev/packages/validator/README.md) |
| [`kits/slidev/packages/speaker-profiles/`](kits/slidev/packages/speaker-profiles/) | The `@miragon/slidev-speaker-profiles` addon: per-speaker slide selections, stable slide ids. | [README](kits/slidev/packages/speaker-profiles/README.md) |
| [`kits/slidev/plugin/`](kits/slidev/plugin/) | The `miragon-slidev` Claude Code plugin: the `slides`, `excalidraw` and `create-training-hub` skills. Listed by [`.claude-plugin/marketplace.json`](.claude-plugin/marketplace.json); consumed by decks via the plugin marketplace, not copied. | [README](kits/slidev/plugin/README.md) |
| [`kits/hub/packages/hub-template/`](kits/hub/packages/hub-template/) | The `@miragon/hub-template` training hub: VitePress site with a sign-in gate. | [README](kits/hub/packages/hub-template/README.md) |
| [`kits/docs/packages/docs-starter/`](kits/docs/packages/docs-starter/) | The `@miragon/docs-starter` VitePress docs kit: config (compiled to `dist/` on `prepack`, because Node does not strip types under `node_modules`) and theme (shipped as source, compiled by Vite). `npm run test:tarball` builds a consumer site from the packed tarball. | [README](kits/docs/packages/docs-starter/README.md) |
| [`kits/docs/example/`](kits/docs/example/) and [`templates/`](kits/docs/templates/) | A consumer `docs/` folder that builds with the package (its `package.json` is the consumer template), and the files a docs repo copies. | [MIGRATION](kits/docs/MIGRATION.md) |
| [`.miragon/`](.miragon/) | Files copied from the `miragon-brand` plugin of Miragon/corporate-identity (the docs token CSS in `docs-starter`), listed in `brand-assets.yaml` with their checksums in `brand-assets.sha256`, the same convention other Miragon repos use. CI runs `sha256sum -c .miragon/brand-assets.sha256`; a new kit version is copied with the plugin's `brand-assets.mjs`. | |
| [`shared/scripts/`](shared/scripts/) | Scripts every kit uses: the release-config check (`npm run check:release`) and the publish step. | |
| [`.github/`](.github/) | CI, release and supply-chain automation. | [.github/WORKFLOWS.md](.github/WORKFLOWS.md) |

`kits/slidev/` is laid out like a deck repository with the toolkit next to it: `deck/`, `packages/`, `CLAUDE.md`, `.slidev-profiles/` and the deck CI template `.github/workflows/ci.yml` (GitHub only runs the root `.github/`). `create-slidev-deck` copies from there, and the validator runs with `kits/slidev/` as its root. The reference deck consumes the toolkit by name (`theme: '@miragon/slidev-toolkit'`); the workspace symlink resolves it, so editing the toolkit is reflected live in the deck. The plugin's skills are the single source of truth under `kits/slidev/plugin/skills/`; `.claude/skills` is a symlink to them.

### Adding a package or a kit

A new package goes to `kits/<kit>/packages/<name>/` and gets, in the same PR: an entry in `release-please-config.json` and `.release-please-manifest.json`, `repository.url` and `repository.directory` in its `package.json`, and a `<kit>/<name>` choice under `beta_package` in `release-please.yml`. `npm run check:release` (in CI) fails until all of them agree. Its very first npm publish is a one-time manual step (see Releases).

## Local development

Needs **Node 22.22+** (**Node 24+** for `npm run dev`, which uses portless) and a modern browser (WebGL2 for the animated background).

```bash
npm install      # once — installs every workspace
npm run dev      # previews the reference deck (kits/slidev/deck) at https://<branch>.slidev-deck.localhost (portless)
npm run build    # static build of the reference deck
npm run verify   # full render + checklist per slide against the design rules
```

`npm run dev` runs through [portless](https://portless.sh): a stable, worktree-aware `.localhost` URL instead of a `:3030` port, so parallel worktrees (e.g. Conductor workspaces) never collide. The proxy auto-starts on first run (one-time `sudo`); run `npx portless service install` once to make it permanent. `npm run dev:plain` runs the raw Slidev server without portless.

`npm run verify:source` runs only the fast source-level guardrails (sanctioned layout, no raw HTML, diagrams light/transparent) with no browser — the same check CI runs on every PR.

## Commits and PR titles

PRs are **squash-merged**, so the PR title becomes the commit message on `main` and must be a valid [Conventional Commit](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `ci:`, `build:`, `test:`, `revert:`). The **PR Title** workflow enforces this. Scope changes to the package they touch (`feat(slidev-toolkit): …`, `fix(create-slidev-deck): …`) so they land in the right changelog. Scope skill changes `miragon-slidev` (`feat(miragon-slidev): …`) so they bump the plugin and land in [`kits/slidev/plugin/CHANGELOG.md`](kits/slidev/plugin/CHANGELOG.md).

## Releases

Releases are automated with [release-please](https://github.com/googleapis/release-please). Each release target has its own release line:

- `@miragon/slidev-toolkit` — tags `vX.Y.Z`.
- `@miragon/create-slidev-deck` — tags `create-slidev-deck-vX.Y.Z`.
- `@miragon/slidev-validator` — tags `slidev-validator-vX.Y.Z`.
- `@miragon/slidev-speaker-profiles` — tags `slidev-speaker-profiles-vX.Y.Z`.
- `@miragon/hub-template` — tags `hub-template-vX.Y.Z`.
- `miragon-slidev` (the Claude Code plugin) — tags `miragon-slidev-plugin-vX.Y.Z`. Bumps `kits/slidev/plugin/.claude-plugin/plugin.json` + `kits/slidev/plugin/CHANGELOG.md`; **not published to npm** — the marketplace serves the plugin straight from this git repo, so the tagged version bump is all consumers need (Claude Code auto-updates installed plugins to it).

On every push to `main`, release-please maintains a Release PR per target (version bump + changelog) from the conventional commits since the last release. Merging a Release PR cuts its GitHub release and tag and, for the npm packages, publishes each released one to npm via tokenless OIDC Trusted Publishing. The scaffolder is released deliberately: cut a new `create-slidev-deck` release when you want template content or a newer toolkit pin to reach freshly-scaffolded decks.

A brand-new package's very first publish needs a one-time manual publish (OIDC can't configure a trusted publisher for a package that does not exist yet); every later release is tokenless. Full detail — the App-token auth, the OIDC constraints, and the template-only guards — is in [.github/WORKFLOWS.md](.github/WORKFLOWS.md).

### Betas

To try a change in a real deck before it is released, publish a beta: run the **Release** workflow manually on the branch, pick the package under `beta_package` (`<kit>/<package>`, e.g. `slidev/speaker-profiles`) and give a `beta_version` such as `0.4.0-beta.0` (the version the change will be released as, plus `-beta.N`). It lands on npm under the `beta` dist-tag with provenance. Nothing is committed, tagged or released, and `latest` stays where it is. A published version can never be overwritten or reused, so the next one is `-beta.1`. A deck pins the exact version (`npm i @miragon/slidev-speaker-profiles@0.4.0-beta.0`); the Pin Check does not accept the `beta` tag in a `package.json`.

## Hosting

The reference deck is served by Netlify via [`netlify.toml`](netlify.toml). A repo created from the template gets no site until someone connects it in the Netlify UI.
