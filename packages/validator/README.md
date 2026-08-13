# @miragon/slidev-validator

The design-system linter for Miragon Slidev decks. It replaces the old
statically-copied `verify/` folder with a **versioned, configurable** package, so
central guardrail improvements reach existing decks over a controlled `npm update`
instead of a frozen copy — and each deck can tune or scope rules without forking.

It runs two kinds of checks:

- **Source rules** — static checks over the deck's Markdown and `.excalidraw.svg`
  sources. Fast, no browser. Most guardrails live here, including the content rules
  (em-dashes, emoji, nested bullets, inline font/list-style): anything an author can
  only introduce through the source is checked here, not in the browser.
- **Rendered rules** — measured on the live, fully-revealed slide in headless
  Chromium (booted against a Slidev dev server). Reserved for what the source truly
  cannot show: real layout geometry (`element-overflow`, `overlay-safe-area`) and
  colours resolved through the CSS cascade (`heading-black`, `card-white`). These
  four require the server; every other guardrail runs without it.

The content rules moved from rendered to source with no loss of author-facing
coverage: Slidev does not enable the markdown-it `typographer` (no `---` → `—`) and
HTML entities are banned at source, so the source text matches the rendered text.
The source scans deliberately do not police the fixed toolkit's own internals — that
is the toolkit's test suite's job.

## Install

Added automatically to decks scaffolded with `npm create @miragon/slidev-deck`.
To adopt it in an existing deck, see [MIGRATION.md](../../MIGRATION.md).

```jsonc
// package.json
{
  "devDependencies": { "@miragon/slidev-validator": "0.1.0" },
  "scripts": {
    "verify": "slidev-validator --rendered",
    "verify:source": "slidev-validator"
  }
}
```

It declares a peer dependency on `@miragon/slidev-toolkit` (`>=1.15.0 <2`) — the
theme whose layouts and brand invariants the rules enforce.

## CLI

```bash
slidev-validator                 # source rules only (fast, CI-safe)
slidev-validator --rendered      # also boot Slidev + Chromium and run rendered rules
slidev-validator --format json   # machine-readable report
slidev-validator --pages "4-6"   # limit the rendered run to some slides
slidev-validator --port 3030     # dev-server port for the rendered run
slidev-validator --config <path> # use a specific config file
slidev-validator --max-warnings 0 # fail if there are any warnings
slidev-validator init            # write a starter slidev-validator.config.mjs
slidev-validator migrate         # adopt the validator in an existing deck
slidev-validator --version       # print validator + resolved toolkit versions
```

Exit code is non-zero on any **error**-severity violation, an **expired exception**,
a **config error**, or warnings above `--max-warnings`.

## Configuration

**The config file is optional.** With no `slidev-validator.config.mjs` present, the
validator behaves as if you had written `extends: ['@miragon/slidev-validator/recommended']`
— every rule runs at its default severity (the report notes `config (defaults:
extends recommended)`). Add a config file only to tune, scope, or waive rules.

`slidev-validator.config.mjs` in the deck root (checked in, versionable), shaped
like ESLint / tsconfig:

```js
export default {
  extends: ['@miragon/slidev-validator/recommended'],
  rules: {
    'no-nested-bullets': 'warn',
    'slide-number-overlap': 'off',
  },
  overrides: [
    { files: ['deck/chapter/99-legacy/**'], rules: { 'element-overflow': 'off' } },
  ],
  exceptions: [
    { rule: 'card-white', files: ['deck/chapter/07-*/**'], reason: 'Customer logo tile', ticket: 'ABC-123', expires: '2026-12-31' },
  ],
}
```

- **Severities:** `off` | `warn` | `error`. `warn` reports but does not fail the
  build; `error` fails.
- **`extends`** merges preset severity maps (in order) before your `rules` block.
- **`overrides`** apply severities to files matching a glob (`**`, `*`, `?`;
  later match wins).
- **`exceptions`** deliberately suppress a rule's violations (optionally scoped to
  files), always with a `reason`, and optional `ticket` / `expires`. Every
  exception is listed in the report and in CI — a suppression is never silent. An
  expired exception becomes an error.

### Required vs recommended, and the disable policy

Each rule has a category. Rules marked **required** encode non-negotiable brand
invariants and **cannot be set below `error`** via `rules`/`overrides` — the only
sanctioned way to suppress one is an `exceptions` entry (which is reported). This
prevents a deck from silently turning off a core guardrail. Recommended rules can
be freely set to `warn` or `off`.

Invalid rule ids, invalid severities, malformed globs, and malformed/expired
exceptions all fail loudly with a clear config error.

### The report distinguishes three states

- **Ran** — pass / warn / error.
- **Deliberately disabled** — `off`, or suppressed by a live exception (listed with
  where + why).
- **Not run** — not applicable (rendered rules without `--rendered`; the built
  Excalidraw check without a prior `npm run build`).

The header records the validator version, the resolved toolkit version, and the
config, so a report — and a CI log — is self-describing.

## Rules

| id | type | category | default |
|---|---|---|---|
| `sanctioned-layout` | source | required | error |
| `no-raw-html` | source | required | error |
| `no-html-entities` | source | required | error |
| `content-heading` | source | required | error |
| `no-em-dash` | source | required | error |
| `no-emoji` | source | required | error |
| `no-nested-bullets` | source | recommended | warn |
| `no-inline-font` | source | recommended | error |
| `no-restyled-bullets` | source | recommended | error |
| `excalidraw-committed-light` | source | recommended | error |
| `excalidraw-built-transparent` | source | recommended | warn |
| `element-overflow` | rendered | recommended | error |
| `heading-black` | rendered | required | error |
| `card-white` | rendered | required | error |
| `overlay-safe-area` | rendered | required | error |

`content-heading` has a per-slide opt-out (`allowMultilineHeading: true` in the
slide frontmatter). `overlay-safe-area` reads the toolkit-owned safe-area model and
cannot be switched off by a deck; its only escape hatch is a per-slide
`safeAreaExceptions` frontmatter entry (with a reason), which is reported.

Ids are the **stable public API** — config files reference them, so they change
only in a major version.

## Compatibility & versioning

The validator resolves the installed toolkit version and warns when it falls
outside the supported peer range; the report records both versions.

SemVer policy for rules:

- Adding a rule with default `warn` → **minor**.
- Promoting a rule to `error`, or adding a new `required` rule → **major**
  (it can newly fail a previously-green deck).

Because the validator is an exact-pinned dependency, a rollback is just
`npm install @miragon/slidev-validator@<previous>`; the lockfile keeps CI
reproducible.

## Architecture

- `src/rules/` — one rule per file (`source/` + `rendered/`), listed in
  `src/rules/index.mjs`. Source rules `check()` files; rendered rules `evaluate()`
  the single per-slide DOM measurement (`rendered/measure.mjs`).
- `src/config.mjs` — loads + validates config, resolves severities, enforces the
  required-rule policy.
- `src/engine.mjs` — classifies each violation (error / warn / suppressed /
  expired / off / skipped).
- `src/rendered-runner.mjs` — boots/reuses Slidev, drives Chromium, measures.
- `src/helpers.mjs` — file discovery. The source-file set is derived from Slidev's
  own FS loader (following every `src:` import to any depth), not a fixed folder
  shape, so a flat `deck/chapter/<chapter>/` deck and a nested
  `deck/content/<topic>/<chapter>/slides.md` deck are both scanned in full. Excalidraw
  discovery recurses all of `deck/` for `*.excalidraw.svg`.
- `bin/index.mjs` — the CLI.

Add a rule: create its file, list it in `src/rules/index.mjs`, document it here.
It becomes configurable and joins both presets automatically.
