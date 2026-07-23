# @miragon/create-slidev-deck

Scaffold a lean [Miragon Slidev deck](https://github.com/Miragon/slidev-deck-template): a fresh
repo with **only** the files a deck needs, and `@miragon/slidev-toolkit` pulled from npm instead of
vendored.

## Usage

```bash
npm create @miragon/slidev-deck@latest my-talk
# equivalently:
npx @miragon/create-slidev-deck@latest my-talk
```

Then:

```bash
cd my-talk
npm install
npm run dev
```

## Options

| Flag | Default | Effect |
|---|---|---|
| `--ref <tag\|sha\|branch>` | this version's release tag | which template snapshot to fetch the skeleton from |
| `--toolkit-version <x>` | pinned default | pin `@miragon/slidev-toolkit` in the generated `package.json` |
| `-v`, `--version` | — | print the `create-slidev-deck` version |
| `-h`, `--help` | — | show usage |

Launched via `pnpm create` / `yarn create` / `bun create`, the printed next steps use that package manager.

## What it emits

Running `npm create @miragon/slidev-deck@latest my-talk` produces:

```
my-talk/
├── deck/                          # your content — this is what you edit
│   ├── slides.md                  # entry: cover + one src: import per chapter + closing
│   ├── vite.config.ts             # chapter-resources plugin + shaders pre-bundle
│   ├── public/og-image.png
│   ├── chapter/
│   │   ├── 01-intro/01-intro.md
│   │   ├── 02-slidev/…            # each chapter: NN-name.md + its own resources/
│   │   ├── 03-theme/…
│   │   ├── 04-diagrams/…          # .bpmn, .dmn, .excalidraw.svg demos
│   │   └── 05-authoring/…
│   └── README.md
├── verify/                        # brand guardrails — `npm run verify`
│   ├── rules/                     # sanctioned-layout, no-raw-html, excalidraw checks…
│   ├── slides.spec.ts
│   └── …
├── .claude/skills/                # authoring guidance for Claude Code
│   ├── slides/
│   └── excalidraw/
├── .github/workflows/             # only Build Deck + Pin Check
│   ├── build-and-deploy.yml
│   └── pin-check.yml
├── CLAUDE.md                      # design-system rules, auto-loaded by Claude Code
├── .npmrc                         # save-exact=true
├── .gitignore
├── README.md                      # ← generated overlay (deck-focused)
└── package.json                   # ← generated overlay (standalone, toolkit pinned, no workspace)
```

Everything except the two `← generated overlay` files is the shared **skeleton**, fetched from the
template repo (a single source of design truth). It never emits the template-only infrastructure:
`packages/`, the release-please / pr-title workflows and config, `LICENSE`, or `netlify.toml`.

## How it stays a single source of truth

The skeleton is **fetched**, not duplicated here — pinned to the git tag that matches this package's
version, so a given `create-slidev-deck` version always produces an identical deck. Template content
changes reach new decks when a new `create-slidev-deck` version is released (a deliberate snapshot),
keeping the two release lines independent.

**Nothing pins a dependency version by hand in this package.** The generated `package.json` is
*derived* from the fetched skeleton's own manifests at scaffold time:

- Slidev runtime deps (`@slidev/cli`, the addons, `vue`) come from the reference `deck/package.json`.
- The verify tooling (`@playwright/test`, `playwright-chromium`) and the verify scripts come from the
  root `package.json`.
- Only `@miragon/slidev-toolkit` comes from this package's own pinned devDependency (the reference
  deck resolves the toolkit via a workspace symlink, so it has no version to read). `--toolkit-version`
  overrides it.

All of those manifests are kept current by the monorepo's Dependabot, so a freshly-scaffolded deck
always gets the versions the reference deck currently uses — with no version list to maintain in this
package.

For local development, set `CREATE_DECK_SKELETON=/path/to/template-checkout` to copy the skeleton
from a local checkout instead of fetching a tag.
