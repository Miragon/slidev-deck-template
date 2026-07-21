---
name: slides
description: Authoring guide for the Miragon-branded Slidev deck in this repo — deck structure and workflow, the layout archetypes, the reusable components (Card, CardGrid, StepList, Figure, SplitView), brand colours/typography, and the editorial rules. Diagrams are always Excalidraw .excalidraw.svg (see the excalidraw skill). Use whenever creating or editing slides under deck/, or applying Miragon brand and design conventions.
---

# Miragon Slidev Deck

How to build the Miragon-branded Slidev deck in this repo: where things live, which layout/component to reach for, and the rules that keep the deck on-brand.

**Two layers carry the truth and nothing duplicates them:**

1. **Rendering truth (code) — what actually ships:**
   - `packages/toolkit/styles/theme.css` — brand colour tokens (CSS variables).
   - `packages/toolkit/layouts/*.vue` — the layout archetypes (`layout:` in frontmatter).
   - `packages/toolkit/components/*.vue` — the reusable building blocks (`<Card>`, `<CardGrid>`, `<StepList>`, `<Figure>`, `<SplitView>`, `<BrandMeshBackground>`).
2. **System truth (this skill)** — how to compose the deck from that code and the editorial rules code can't enforce.

If a value disagrees, **`packages/toolkit/styles/theme.css` wins for colours**, the layout/component `.vue` wins for its prop signature, and this skill wins for editorial/composition rules.

Full prop tables: [`reference/archetypes.md`](reference/archetypes.md) (the 11 layouts) and [`reference/components.md`](reference/components.md) (the components).

---

## Repo structure

A **single deck**. The design system is the **`@miragon/slidev-toolkit`** package in **`packages/toolkit/`**, an npm-workspace package that the deck consumes by name; the deck lives under `deck/` and pulls the theme via `theme: '@miragon/slidev-toolkit'`.

```
packages/toolkit/          the design system (fixed, brand-controlled)
  styles/theme.css         colour tokens
  layouts/*.vue            the 11 archetypes
  components/*.vue         Card, CardGrid, StepList, Step, Figure, SplitView, BrandMeshBackground
  assets/                  brand assets (logo.svg, komet.svg) — bundled with the theme
deck/
  slides.md                entry: headmatter + cover + src imports + closing
  vite.config.ts           serves each chapter's resources/ at /resources/<chapter>/
  chapter/NN-name/
    NN-name.md             the chapter's slides (same name as the folder)
    resources/             this chapter's own assets (images, .bpmn, .svg, …)
  components/*.vue          deck-specific diagram components (optional, auto-imported)
```

There is **one deck and no manifest**. The entry `deck/slides.md` holds only the cover and the closing; everything else is imported from the chapter files. **Each chapter is a self-contained folder** `deck/chapter/NN-name/` with its slides in `NN-name.md` and its assets in `resources/`. The Vite plugin in `deck/vite.config.ts` serves every `resources/<file>` at `/resources/<chapter>/<file>` (dev) and copies it into the build, so frontmatter just points at that path.

### Add a chapter

```md
<!-- deck/slides.md: headmatter + cover, then src imports, then closing -->
---
theme: '@miragon/slidev-toolkit'
layout: cover
eyebrow: Template · Showcase
---

# Deck Title

Subtitle

---
src: ./chapter/01-foundations/01-foundations.md
---

---
src: ./chapter/02-content/02-content.md
---
```

Each chapter file **begins with a `section` archetype slide** (the chapter divider) and then its content slides. To add a chapter, create `deck/chapter/NN-<name>/NN-<name>.md` (plus a `resources/` folder for its assets) and add a matching `src:` line in `deck/slides.md`. Reference that chapter's assets as `/resources/NN-<name>/<file>`. Diagrams are `.excalidraw.svg` files in the chapter's `resources/` (see the `excalidraw` skill).

---

## The non-negotiables (one screen)

- **Every slide declares a layout archetype.** Set `layout:` in the slide's frontmatter to one of the 11 theme archetypes; no freehand slides. (Only the built-in `default` is also allowed, for full-bleed component slides like the Agenda; `src:` import stubs carry no layout.) The verify suite enforces this.
- **English only on slide content** (titles, bullets, labels, diagram text). Speaker notes (`<!-- … -->`) may be in another language if requested. Code, brand names, and standard technical terms stay as-is.
- **Cards are always white** — use `<Card>` (in a `<CardGrid>` for multiple); never a coloured/gradient tile, never a coloured left-border. Accent goes on the **title only**.
- **Headings are BLACK, never blue.** Blue is for kickers/eyebrows, accents, small labels. The layouts set heading colour — don't override.
- **Heroes pose an active question** the next slides answer (`layout: hero`, `# …**bold**?`).
- **No em-dashes** (`—`). Use commas, colons, parentheses. **No emoji** — use inline SVG or Iconify `i-*` classes.
- **Bullets are plain `<ul><li>`.** The layout provides the marker. Never override list styling per slide.
- **Never reduce font size to fit.** Reduce content, split the slide, or use `<v-clicks>`.
- **No hardcoded hex** in slide markdown. Use components and CSS variables. (The one sanctioned hex lives inside `Card.vue`, not in slides.)
- **Components on a single line in `.md`, with explicit closing tags** (`<Card>…</Card>`, never self-closing in markdown).
- **Never start, restart, or kill the dev server.** Reuse the author's running `npm run dev` (HMR picks up edits automatically); to check, run `npm run verify`. No `npm run dev`/`slidev --open`, no `pkill`/`kill`/`lsof` on port 3030. (Details in [Verifying](#verifying).)

---

## Choosing a layout (cheat sheet)

| You want | Use |
|---|---|
| Open the deck | `cover` (animated) |
| Pose a key thesis / transition | `hero` (`# **bold** question?`) |
| Introduce a speaker or duo | `person` |
| Mark a new chapter | `section` (with `index: "01"`) |
| Workhorse bullets / text / card grid / diagram | `content` |
| Prose or bullets next to an image | `content-image` |
| Before vs. After (two coloured panels) | `compare` |
| "Which one is right, and why?" with reveal | `goodbad` |
| A BPMN process diagram with token playback | `bpmn` (needs `slidev-addon-bpmn`) |
| Click-through feature explorer / mini-quiz | `showcase` |
| Close the deck | `closing` (animated) |
| One memorable number / stat | `hero` with the number as the bold word |

`cover` and `closing` are the only **animated** layouts (the `BrandMeshBackground` shader). Everything else is the calm **static** world on light grey, whose single brand moment is the small gradient accent bar in the header.

Full per-layout prop signatures and limits: [`reference/archetypes.md`](reference/archetypes.md).

---

## Components — reach for these instead of raw markup

The components encode the visual rules so slides stay clean: a slide should be frontmatter + headings + bullets + component tags, with **no `<style>`, no hardcoded hex, and no Tailwind/utility classes** in the `.md`. Write components on one line with explicit closing tags. Full props: [`reference/components.md`](reference/components.md).

### `Card` + `CardGrid` — the canonical white-card grid

`Card` replaces hand-written card `<div>`s: background is always white, the accent lands on the title only. `CardGrid` replaces the raw `<div class="grid grid-cols-N …">` wrapper, so the markdown carries no CSS classes. For 2+ cards, run the accent across them left → right.

```md
<CardGrid cols="3">

<Card title="Deployment" accent="blue">Runs a set of identical pods.</Card>

<Card title="DaemonSet" accent="teal">Exactly one pod per node.</Card>

<Card title="CronJob" accent="green">Starts pods on a schedule.</Card>

</CardGrid>
```

Accent progression: **2 cards** `blue, green` · **3 cards** `blue, teal, green` · **4 cards** `blue, blue-mid, green-deep, green`. (The exact hex stops live inside `Card.vue` — never write them in markdown.)

### `StepList` / `Step` — compact labelled list beside a diagram

Replaces hand-styled side-note `<div>`s. The label is bold; the body is muted. Use in the narrow column next to a diagram.

```md
<StepList>
<Step label="Client">calls the URL</Step>
<Step label="Ingress">terminates TLS and routes to the service</Step>
<Step label="Service">spreads the request across a pod</Step>
</StepList>
```

### `Figure` — titled, captioned wrapper around a visual

Title above, the visual (slot) centred, caption below. The caption understands inline `**bold**`, `*italic*`, `` `code` ``.

Pass a diagram via `src` (a chapter `.excalidraw.svg`), or inline markup in the slot:

```md
<Figure title="Container" src="resources/01-foundations/container.excalidraw.svg" alt="A container" caption="Containers share the **host kernel**."></Figure>
```

### `SplitView` — two-column "visual + explanation"

The standard diagram-left / text-right slide body. The visual goes in the `#visual` slot (a `<Figure src="…">` with the chapter's `.excalidraw.svg`), the bullets or `StepList` in the default slot. Use it instead of a hand-rolled `<div class="grid grid-cols-2 …">`. Both columns are **vertically centred by default** (`align="center"`); set `ratio` for a wider diagram (e.g. `1.5/1`). Keep a blank line before a bullet list so it parses as markdown.

```md
<SplitView ratio="1.5/1">
<template #visual>
<Figure src="resources/01-foundations/runtime.excalidraw.svg" alt="Runtime view"></Figure>
</template>

- First point
- Second point
</SplitView>
```

### Diagrams — always Excalidraw

There are no coded SVG-primitive components. **Every diagram is a `.excalidraw.svg`** generated in the Miragon style and embedded via `<Figure src="resources/<chapter>/<name>.excalidraw.svg">`. See the **`excalidraw`** skill for how to author and export one. (BPMN process diagrams use the `bpmn` archetype instead.)

---

## Editorial rules

**Language** — English on slide content (see non-negotiables). Speaker notes may be in another language if requested.

**Typography in markdown** — headings black; blue only for kickers/accents/labels; never set `font-family`. The accent bar is the one brand moment per slide — don't add extra bars.

**Punctuation / emoji / bullets** — no em-dashes; no emoji (inline SVG or Iconify `i-*`); plain `<ul><li>` with the layout's marker, never per-slide list styling.

**Focal point** — one clear focal point the eye lands on first (a big number, a bold lead, a dominant visual). One bold lead line with at most **one** green accent word. Scale, don't multiply: fewer elements, larger, full slide width.

**Chrome** — don't add opaque header/footer bars in slide content; they obscure the layout. If something looks cut off, fix the content (shrink, split), never the chrome.

**Voice** — calm, confident, modern. No exclamation marks, no marketing fluff. Green is the accent of last resort: at most one green word per bold lead, for the key payoff.

---

## Scenario discipline

Pick **one coherent scenario** for the deck (a single company, product, or domain) and use it consistently across diagrams, code, labels, and exercises. When adapting an example from an external source, re-theme it into your scenario first. If a concept has no sensible framing, fall back to a generic example consciously, not by default.

---

## Overflow — reduce content, never shrink type

Slides overflow when content exceeds the 16:9 canvas. Hard limits per slide:

| Element | Max |
|---|---|
| Bullets (`content`) | 5 |
| Bullets per panel (`compare`, `goodbad`) | 4 |
| Stacked boxes | 3 |
| Cards in a grid | 3 (4 if very short) |
| Lines of code | 18 |
| Sentences in a paragraph | 3 |
| Nested list levels | 1 |

When you exceed a limit: split with `---`, reveal progressively with `<v-clicks>`, move detail to speaker notes, or switch to a layout that compresses (e.g. a `Card` grid instead of bullets).

---

## Speaker notes and transitions

Every content slide gets `<!-- … -->` notes ending with a `Transition: "…"` line that hands off to the next slide.

```md
<!--
What to say: the rule, the reason, the anchor.
Transition: "Next, how the request reaches the pod."
-->
```

---

## Verifying

Two layers, neither optional:

```bash
npm install        # once
npm run build      # compiles the deck (slidev build deck/slides.md)
npm run verify     # the Playwright design-system suite
```

`npm run build` only proves the Markdown/Vue **compiles** — it says nothing about whether a slide overflows or breaks a design rule. For that, `npm run verify` runs the **Playwright design-system suite** (`verify/`, always **headless**). It walks the live, fully-revealed slides and measures the DOM-checkable rules: fits the canvas with a bottom margin (content must clear the 552px floor by >= 16px, not merely fit), no em-dashes, no emoji, headings black, cards white, no inline fonts, no restyled or nested bullets. It also runs source-level checks: **every slide declares a sanctioned layout** (each slide's `layout:` must be a theme archetype or the built-in `default`; `src:` stubs are exempt), **no raw HTML** (slide bodies are markdown + components only; tags like `<div>`/`<span>` are flagged, while code fences and comments are exempt so HTML can be shown as an example), **no HTML entities in the slide source** (write the literal character, never `&#39;`/`&amp;`/…) and **every `.excalidraw.svg` is light and transparent** (no dark-mode filter, no baked white background). These source-level checks run fast on their own via `npm run verify:source` (no dev server) and gate CI so forks inherit them. It captures a slide + checklist screenshot per slide under `verify/screenshots/<slug>/` and opens an HTML report.

The suite starts a fresh Slidev dev server for `deck/slides.md` (or reuses one already running on the same port — set `VERIFY_PORT=<port>` to point elsewhere). Full reference: [`verify/README.md`](../../../verify/README.md).

### Never touch the running dev server

The author almost always has `npm run dev` running on port 3030. **Reuse that instance; never start, restart, or kill it.**

- **Do not run `npm run dev` / `slidev … --open`** yourself, in the foreground or background. Slidev has HMR: your edits to `deck/**` are picked up automatically by the running server, so there is nothing to restart. (Background dev servers you start get reaped at the end of the turn anyway, which is what kills the author's session.)
- **Never free a port or kill a process** — no `pkill -f slidev`, no `kill $(lsof -t -i:3030)`, no `fuser -k`. If port 3030 is busy, that is the author's server doing its job; leave it.
- **To verify, just run `npm run verify`.** Playwright reuses the already-running server (`reuseExistingServer` locally) and tears down only a server it started itself, so the author's instance is never affected. If you truly need an isolated server, run it on a different port via `VERIFY_PORT=<port>` instead of touching 3030.

### Authoring flow — edit, then verify headless, finish only on green

This is the loop for every slide change:

1. **Edit** the slide (`deck/chapter/<chapter>/<chapter>.md`).
2. **Verify headless**: `npm run verify`. It builds nothing extra — it drives the deck headless and reports each slide's checklist plus the source-level checks. (Run `npm run build` too when you want to confirm a clean production build / PDF.) To re-check only the slides you just touched instead of walking the whole deck, scope it with `VERIFY_PAGES` (a range or list, e.g. `VERIFY_PAGES="4-6" npm run verify` or `VERIFY_PAGES="2,5,9"`); the source-level checks still run across the whole deck.
3. If any check is **red**, fix the slide (the checklist spells out what and how) and re-run. The overflow check is measured against the canvas, so trust it over eyeballing: a slide that touches the bottom edge is overflowing, not "just fitting."
4. **Do not stop until every check is green.** A slide left red is unfinished work.

---

## Sacred invariants (do not change without brand sign-off)

- **`BrandMeshBackground`** (`packages/toolkit/components/BrandMeshBackground.vue`): colour stops `#335DE5, #1a1a4e, #00E676, #335DE5, #0d0d2b, #00C853`; DISTORTION 1, SWIRL 0.5, SPEED 0.6. Corporate identity. Used by `cover` and `closing` only.
- **Brand colours** in `packages/toolkit/styles/theme.css`. Primary blue `#335DE5`, sparing green `#00E676`. No orange, no other primaries.
- **Geist** font family (headings and body), **Geist Mono** for code and tables. Bundled OFL variable fonts in `packages/toolkit/assets/fonts/`, wired via `packages/toolkit/styles/fonts.css` + the `--miragon-font` / `--miragon-font-mono` tokens in `theme.css`; fallback `Inter, Helvetica Neue, Arial, sans-serif`.

To change the design: edit `packages/toolkit/styles/theme.css` (colours) or the relevant `packages/toolkit/layouts/*.vue` (structure).
