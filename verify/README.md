# Design-system verification

Guardrails that keep the deck on-brand and well-structured. Two kinds of checks:

- **Rendered checks** (browser) — walk every slide of `deck/slides.md` and measure
  the DOM-checkable rules, capturing a screenshot + checklist per slide.
- **Source guardrails** (`@source`, no browser) — one `Rule` per file under
  `rules/`, run by the validator over the slide and diagram sources.

## Run

```bash
npm run verify          # full: boots Slidev, checks every slide, opens the HTML report
npm run verify:source   # fast: source guardrails only, no dev server or browser
```

`verify:source` also runs in CI (`.github/workflows/build-and-deploy.yml`, so forks
inherit it) and is the `verify-source` Conductor Run target. `VERIFY_PORT=<port>`
targets a specific dev server; `VERIFY_PAGES="4-6"` (or `"2,5,9"`) limits the
rendered run to some slides.

## Rendered checks (per slide)

| Check | Rule |
|---|---|
| Fits the 16:9 canvas | no content past the 980x552 canvas |
| No em-dashes | no `—` in slide content |
| No emoji icons | use inline SVG or Iconify classes |
| Headings black, not blue | blue only for kickers/accents/labels |
| Cards stay white | no colored/gradient bg, no colored left-border |
| Typography not overridden | no inline `font-family` |
| Bullets not restyled | no per-slide inline list-style |
| No nested bullets | max one list level |

Each slide becomes a collapsible step in the HTML report (`verify/playwright-report/`)
holding one composed image: the slide on the left, its checklist on the right (green
when all pass, red on any fail, each item ✓/✗ with how to fix). Screenshots land in
`verify/screenshots/<slug>/NN.png` (gitignored).

## Source guardrails (`rules/`)

| Rule | Enforces |
|---|---|
| `sanctioned-layout` | every slide's `layout:` is a theme archetype (from `packages/toolkit/layouts/*.vue`) or the built-in `default`; `src:` stubs exempt |
| `no-raw-html` | slide bodies are markdown + components only; raw tags (`<div>`, `<span>`, …) are flagged. Code fences and comments exempt, so HTML can be shown as an example |
| `no-html-entities` | write the literal character, never `&#39;`/`&amp;`/… |
| `excalidraw-committed-light` | committed `.excalidraw.svg` previews light (no dark `filter`, baked light background) |
| `excalidraw-built-transparent` | built `.excalidraw.svg` has its background stripped (transparent on the slide) |

Failures name the offending `file:line` and how to fix it.

## Architecture

- `rules/` — one guardrail per file, each exporting a `Rule`
  (`{ id, title, message, check() }`) whose `check()` returns a list of violations
  (`[]` = pass). **Add a guardrail:** drop a file here and list it in
  `rules/index.ts` — it becomes an `@source` test automatically.
- `validator.ts` — framework-agnostic engine (`runRules`, `formatFailure`); knows
  nothing about Playwright.
- `slides.spec.ts` — the rendered per-slide checks (`runChecks` + `renderSlideReport`),
  plus a loop that turns every `Rule` into an `@source` test via the validator.
- `playwright.config.ts` — boots the Slidev dev server (skipped when
  `VERIFY_SOURCE_ONLY` is set).
- `helpers.ts` — shared repo paths, deck/chapter enumeration, and constants.

## Not covered

Editorial rules (English only, one focal point, hero-as-question, scenario
discipline, speaker-note transitions, one green accent word) need human eyes — the
per-slide screenshots are for exactly that. No pixel-diff regression either: the
animated `BrandMeshBackground` shader would make baselines flaky.
