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

`verify:source` also runs in CI (`.github/workflows/ci.yml`, so forks
inherit it) and is the `verify-source` Conductor Run target. `VERIFY_PORT=<port>`
targets a specific dev server; `VERIFY_PAGES="4-6"` (or `"2,5,9"`) limits the
rendered run to some slides.

## Rendered checks (per slide)

| Check | Rule |
|---|---|
| Fits the 16:9 canvas | no content past the 980x552 canvas |
| Clears the page/chapter display | no content collides with / crowds / hides the bottom-left overlay's safe area |
| Clears the progress bar | no content collides with / crowds / hides the top progress-bar strip |
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
| `content-heading` | content headings (frontmatter `title:` on `content`/`content-image`/`compare`/`showcase`/`goodbad`/diagram layouts) stay single-line: no explicit break (`<br>`, newline, trailing `\`), and within a per-layout character budget. Opt out one slide with `allowMultilineHeading: true`. The budget is a heuristic; the binding single-line width measurement is a separate rendered check |
| `excalidraw-committed-light` | committed `.excalidraw.svg` previews light (no dark `filter`, baked light background) |
| `excalidraw-built-transparent` | built `.excalidraw.svg` has its background stripped (transparent on the slide) |

Failures name the offending `file:line` and how to fix it.

## Global overlays and safe areas

The template paints global chrome on every content slide: the **page/chapter display**
bottom-left (`toolkit global/ChapterFooter.vue`) and the **progress bar** top
(`ProgressBar.vue`), both `position: fixed` and `pointer-events: none`. The older fit
check deliberately *skips* fixed elements and only enforces a uniform bottom band, so it
cannot see a card or diagram that renders through the page display, and never checks the
left edge or z-order at all. The safe-area check closes that gap.

- **Model** — `packages/toolkit/global/safe-areas.json` (toolkit-owned, so a deck cannot
  disable it) describes each overlay: a selector, which canvas edges it is anchored to,
  the z-index, the layouts where it is hidden, and a margin buffer (canvas px) content
  must keep beyond the overlay's painted rect. The painted geometry itself is **measured
  live** from the DOM, so the zone can never drift from the CSS.
- **Geometry** — `verify/safe-area.ts` is a pure, browser-free evaluator: given measured
  rectangles (canvas px) and the config, it returns typed violations. Because the caller
  measures the real, post-transform `getBoundingClientRect()`, grouped / translated /
  rotated / scaled elements are handled for free. Coordinate frame: the transformed
  `.slidev-slide-content` (the fixed overlays' containing block), so overlays and content
  compare in one space; raw viewport px are normalised to canvas px with the single visual
  scale (`viewportWidth / 980`).
- **Codes** — `overlap`, `insufficient-bottom-margin`, `insufficient-left-margin`,
  `insufficient-top-margin`, `insufficient-right-margin`, `hidden-by-overlay`,
  `missing-geometry`. Each message names the slide, the element, the reserved zone, the
  actual vs required clearance, and how to fix it.
- **Exceptions** — a slide may opt an overlay out in frontmatter
  (`safeAreaExceptions: [{ overlay, reason }]`); the collision is then **reported** (with
  the reason) rather than failed, never silently ignored. No global off switch.
- **Z-order note** — Slidev exposes no general z-order model, so front/behind is
  approximated from the overlays' known CSS z-indices: content stacked above an *opaque*
  region of an overlay is `hidden-by-overlay`; otherwise a geometric overlap is `overlap`.
  The page display's background is transparent, so in practice its collisions are
  `overlap` (label renders through content), which is the visual defect we care about.

`verify/safe-area.spec.ts` unit-tests the evaluator (fast, `@source`); `slides.spec.ts`
measures the live deck and also injects a corner element end-to-end to prove the check fires.

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
