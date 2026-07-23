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

The scaffold pulls the shared **skeleton** from the template repo and lays a small **overlay** on top:

- **Skeleton** (fetched, single source of truth): `deck/`, `.claude/`, `CLAUDE.md`, `verify/`,
  `.npmrc`, `.gitignore`, and the `build-and-deploy.yml` + `pin-check.yml` workflows.
- **Overlay** (this package's `templates/`): a standalone `package.json` (no npm workspace, toolkit
  added as an exact-pinned dependency) and a deck-focused `README.md`.

It never emits the template-only infrastructure: `packages/`, the release-please / pr-title
workflows and config, `LICENSE`, or `netlify.toml`.

## How it stays a single source of truth

The skeleton is **fetched**, not duplicated here — pinned to the git tag that matches this package's
version, so a given `create-slidev-deck` version always produces an identical deck. Template content
changes reach new decks when a new `create-slidev-deck` version is released (a deliberate snapshot),
keeping the two release lines independent.

For local development, set `CREATE_DECK_SKELETON=/path/to/template-checkout` to copy the skeleton
from a local checkout instead of fetching a tag.
