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
| `--toolkit-version <x>` | baked pin | pin `@miragon/slidev-toolkit` in the generated `package.json` |

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

The toolkit version written into the generated `package.json` is this package's own pinned
`@miragon/slidev-toolkit` devDependency, so **Dependabot keeps the default current** — its bump PR
flows into the next `create-slidev-deck` release. Generated decks get the same advice for their own
dependencies (see the deck's README).

For local development, set `CREATE_DECK_SKELETON=/path/to/template-checkout` to copy the skeleton
from a local checkout instead of fetching a tag.
