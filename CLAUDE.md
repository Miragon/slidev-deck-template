# CLAUDE.md: Miragon brand toolbox

This repo holds everything other Miragon repositories install from the brand: one kit per concern under `kits/`, each with its npm packages (`kits/<kit>/packages/*`), a reference project and, where it has one, a Claude Code plugin. Layout and release rules: `CONTRIBUTING.md`. CI, release and npm publishing: `.github/WORKFLOWS.md`.

## Per kit

- **Slidev** (`kits/slidev/`): the guide is **`kits/slidev/CLAUDE.md`**. Read it before touching the deck, the toolkit, the validator or the plugin. Its paths (`deck/`, `packages/toolkit/`, `scripts/shot.mjs`) are relative to `kits/slidev/`, which is laid out like a deck repository. Always invoke the `slides` skill before editing a slide.
- **Docs** (`kits/docs/`): `@miragon/docs-starter` and its example site. Never edit `theme/cd-tokens.generated.css` or `shared/tokens/` by hand; they come from Miragon/corporate-identity (`node shared/scripts/tokens.mjs`).
- **Hub** (`kits/hub/packages/hub-template/`): see its README.

## Rules for the whole repo

- Root scripts work from the repo root: `npm run dev`, `npm run build`, `npm run verify:ci`, `npm run check:ids` (reference deck), `npm run check:release` (release setup of every package).
- A new package needs its release-please entry, `repository.url` / `repository.directory`, and a `beta_package` choice in the same PR; `npm run check:release` fails until they agree.
- The repository was renamed from `Miragon/slidev-deck-template` and `Miragon/brand-packages`. Never create a repository with either name (see `.github/WORKFLOWS.md`).
- Commit messages and PR titles are Conventional Commits, scoped to the package they touch.
