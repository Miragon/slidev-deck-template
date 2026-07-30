# Components — full reference

Reusable building blocks in `packages/toolkit/components/` (auto-imported into every deck). Diagrams are not components — they are `.excalidraw.svg` files embedded via `<Figure src>` (see the `excalidraw` skill). Write all components on a single line in markdown with explicit closing tags — **except when the body contains inline Markdown** (see below).

All colours come from `packages/toolkit/styles/theme.css`; never pass raw hex from a slide.

---

## Markdown inside a component body

Slidev renders the Markdown file first, then hands the result to Vue. A component whose opening tag and body share a line (or sit on adjacent lines with no gap) is parsed as a **raw HTML block**: everything inside is passed through verbatim, so inline Markdown never runs — `` `code` `` shows its backticks, `**bold**` shows its asterisks, `[text](url)` stays literal. This is [documented Slidev/CommonMark behaviour](https://slidev.dev/builtin/components), not a theme bug, and no CSS can fix it.

The fix is to **surround the body with blank lines** so Slidev parses it as a Markdown block:

```md
<!-- BROKEN — backticks render literally -->
<Card title="Runtime" accent="blue">Confirm `newsletter.bpmn` deploys.</Card>

<!-- CORRECT — inline code renders as an on-brand chip -->
<Card title="Runtime" accent="blue">

Confirm `newsletter.bpmn` deploys.

</Card>
```

A **plain-text** body (no inline Markdown) is unaffected — keep it on the tag line. Inline code renders as a Geist Mono chip in brand blue (`styles/code.css`), the same in body text and inside cards. This applies to every component with a Markdown body: `Card`, `SplitView`, `CodeBlock`, and the `content`/`compare` layout slots (which is why bullet lists already need a preceding blank line).

---

## Card

The canonical white card (white background always, accent on the title only). For 2+ cards in a grid, step the accent left → right.

| Prop | Values | Default | Notes |
|---|---|---|---|
| `title` (str) | — | — | card title (gets the accent colour) |
| `accent` | `blue` · `blue-mid` · `teal` · `green-deep` · `green-mid` · `green` | `blue` | a stop on the blue→teal→green progression; the only place the sanctioned hex lives |
| `padding` | `compact` · `standard` · `generous` | `standard` | 16 / 20 / 24 px |
| `icon` (str) | an Iconify UnoCSS class, e.g. `i-carbon-grid`, `i-ph-cube` | — | optional icon shown above the title in the accent colour; omit for a plain text card |
| `align` | `left` · `center` · `right` | `left` | horizontal alignment of icon, title, and body |
| **slot** | — | — | body text (wrap in blank lines if it contains inline Markdown — see "Markdown inside a component body") |

Progression by card count: **2** → blue, green · **3** → blue, teal, green · **4** → blue, blue-mid, green-deep, green · **6** → blue, blue-mid, teal, green-deep, green-mid, green.

`icon` is optional. When set it renders above the title, sized `1.6rem`, tinted with the card's accent colour; leave it off and the card stays purely textual as before. Use it to make card-only slides less flat and to set cards apart thematically. It obeys the brand no-emoji rule: pass an **Iconify `i-*` class** (the installed collections are `carbon`, `ph`, `svg-spinners`), never an emoji. Write the **full class literally** in the slide (e.g. `icon="i-carbon-grid"`) so UnoCSS finds it in its static scan and generates the CSS; a name assembled at runtime would not render.

`align` is optional and defaults to `left` (the previous behaviour). Set `center` or `right` to align the icon, title, and body together; it only touches horizontal alignment and leaves the white background, accent logic, and everything else untouched.

```md
<Card title="DaemonSet" accent="teal" icon="i-carbon-container-services">Exactly one pod per node.</Card>
<Card title="Centered" accent="blue" align="center">Icon, title, and body all centered.</Card>
```

## CardGrid

The wrapper for a group of `Card`s (or `Figure`s). Replaces the raw `<div class="grid grid-cols-N …">` so the markdown carries no CSS classes. Cards stretch to equal height.

| Prop | Values | Default | Notes |
|---|---|---|---|
| `direction` | `row` · `column` | `row` | `row` = cards side by side (uses `cols`); `column` = cards stacked top to bottom in one column |
| `cols` (number) | — | `3` | number of equal columns (ignored when `direction="column"`) |
| `gap` | `compact` · `standard` · `generous` | `standard` | 16 / 24 / 32 px between cells |
| **slot** | — | — | the `Card`s (one blank line between them so they parse as markdown) |

Use `direction="column"` to stack cards vertically (e.g. two labelled cards filling a narrow SplitView column):

```md
<CardGrid direction="column">

<Card title="Error" accent="blue">Always interrupts: the source process stops.</Card>

<Card title="Escalation" accent="teal">Default non-interrupting: the source continues.</Card>

</CardGrid>
```

```md
<CardGrid cols="3">

<Card title="Pick one scenario" accent="blue">Keep all examples in one coherent world.</Card>

<Card title="Show, don't tell" accent="teal">A diagram beats a paragraph.</Card>

<Card title="One focal point" accent="green">One bold lead, one green accent word.</Card>

</CardGrid>
```

## StepList / Step

Compact labelled list for the narrow column next to a diagram. `StepList` sets the font context and spacing; each `Step` is a bold label + muted body.

| Component | Prop | Notes |
|---|---|---|
| `StepList` | — | wrapper; slot holds the `Step`s |
| `Step` | `label` (str) | bold label; slot holds the body text |

```md
<StepList>
<Step label="Service">spreads the request across a pod</Step>
</StepList>
```

## Figure

Titled, captioned wrapper around a visual (title above, visual centred, caption below). The caption is a `<div>` (not `<p>`) so the `content` layout's paragraph size doesn't override it.

| Prop | Notes |
|---|---|
| `title` (str) | shown above the visual |
| `caption` (str) | shown below, same size as `StepList` text (0.8rem); inline `**bold**`/`*italic*`/`` `code` `` |
| `src` (str) | a public asset (e.g. an `.excalidraw.svg`), resolved base-aware via `BASE_URL`; renders an `<img>` instead of the slot |
| `alt` (str) | alt text when `src` is used |
| `maxHeight` (str) | CSS max-height for the `src` image (default `340px`) |
| **slot** | inline markup as the visual, used only when `src` is not set |

The visual is normally a chapter Excalidraw diagram via `src` (served from the chapter's `resources/` at `/resources/<chapter>/<file>` — see the `excalidraw` skill). Never a Markdown image for such an asset: Slidev turns `![](/resources/…)` into a build-time import that breaks `npm run build`.

```md
<Figure title="Pod" src="resources/01-foundations/pod.excalidraw.svg" alt="A pod" caption="The **smallest** deployable unit."></Figure>
```

## DiagramFrame

The branded white card as a standalone container: white background, subtle border, rounded corners (1.1rem), soft blue shadow, contents centred. It is the **single source of that surface**: the `bpmn` / `dmn` / `mermaid` / `excalidraw` diagram layouts all frame their diagram by using this component internally (their `.*-canvas` class now only sets the flex-fill), so the card lives in one place. Exposed as a component so you can also frame **part** of a slide (e.g. one `SplitView` column) rather than a whole one. Reach for it when a visual needs that white card but a `Card` is wrong (a `Card` is for text, with a title and a title-accent; `DiagramFrame` has neither and just frames a nested visual). Nest anything inside: a `Figure`, an image, a ` ```mermaid ` fence.

| Prop | Values | Default | Notes |
|---|---|---|---|
| `padding` | `compact` · `standard` · `generous` | `standard` | inner padding around the nested visual |
| `height` | CSS length (e.g. `19rem`) | — | fixed frame height; omit to size to the content. Prefer an explicit length over `class="h-full"`/`height="100%"` — a percentage height inside an auto-height `SplitView` column is circular and destabilises the layout |
| **slot** | the visual to frame | — | a `Figure`, image, or diagram (size it yourself: `Figure`/mermaid do, or set the image `max-height`) |

Like every component it forwards `class`/`style` to its root, so nudge spacing with the sanctioned escape hatch (`class="mt-6"` for air above). Use the `height` prop, not a utility class, to give it more height. Never `class`/`style` for colours or borders.

```md
<SplitView ratio="1/1">
<template #visual>
<DiagramFrame height="19rem">
<Figure src="resources/04-diagrams/service.excalidraw.svg" alt="A service routing to two pods" max-height="220px"></Figure>
</DiagramFrame>
</template>

- First point
- Second point
</SplitView>
```

## SplitView

The two-column "visual + explanation" container: a diagram (or `Figure`) on the left via the `#visual` slot, the explaining text (bullets or a `StepList`) in the default slot on the right. Use it instead of a hand-rolled `<div class="grid grid-cols-2 …">`. Both columns are **vertically centred by default**, so the bullets sit centred against the diagram.

| Prop | Values | Default | Notes |
|---|---|---|---|
| `ratio` (str) | `"a/b"` | `1/1` | left/right column width, e.g. `1.5/1` for a wider diagram |
| `align` | `center` · `start` · `end` · `stretch` | `center` | vertical alignment of the columns |
| `gap` (str) | CSS length | `2.5rem` | space between the columns |

Unlike inline components, `SplitView` is a multi-line container (like `StepList`/`Figure`): the `#visual` template holds the diagram, the default slot holds the markdown body. Keep a blank line before the bullet list so it parses as markdown. The bullet markers still come from the `content` layout; do not restyle the list.

```md
<SplitView ratio="1.5/1">
<template #visual>
<Figure src="resources/01-foundations/runtime.excalidraw.svg" alt="Runtime view"></Figure>
</template>

- First point
- Second point
</SplitView>
```

## CodeBlock

A titled code "window" in Miragon CI: a white brand card (like `Card`) with a header showing an optional filename (left, muted mono) and an optional language badge (right, blue). It wraps a Markdown code fence in the default slot; Shiki still highlights the code. Use it when a snippet needs a filename or language label. For a bare snippet, just write a plain ` ```lang ` fence: it already picks up the same white-card frame globally (`styles/code.css`), so `CodeBlock` is only for the labelled case.

| Prop | Values | Default | Notes |
|---|---|---|---|
| `file` (str) | — | — | filename / path shown left in the header (muted mono) |
| `lang` (str) | — | — | language badge shown right (blue pill, e.g. `md`, `ts`) |
| `size` (str) | CSS length | — | font size of the code, e.g. `"0.9rem"` / `"14px"`; omit for the default |
| `hideHeader` (bool) | — | `false` | hide the filename/language header even when `file`/`lang` are set |
| **slot** | — | — | a single Markdown code fence, on its own lines with blank lines around it |

Fenced code renders in pure form: Shiki syntax colours on the white card, no background behind the tokens (the layouts' blue inline-code pill is scoped to real inline code, `:not(pre) > code`, so it never leaks onto a fence).

The fence must sit on its own lines with a blank line before and after (like the bullet rule in `SplitView`) so it parses as Markdown. Keep to the 18-line code limit.

````md
<CodeBlock file="deck/slides.md" lang="md">

```md
# Build decks like **code**
```

</CodeBlock>
````

## Agenda

The clickable chapter stepper: the deck's own table of contents, rendered from the live deck. Unlike every other component it **owns the whole slide**, so its slide uses the built-in `layout: default` (the one sanctioned non-archetype) plus `class: agenda-slide` — a theme archetype's header and padding would fight it. There is one per deck, right after the cover.

Chapters are **discovered automatically**: every `layout: section` slide opens a chapter and the slides up to the next `section` belong to it, so the agenda never goes stale as you add chapters. `layout: subsection` slides deliberately do *not* open a chapter; they are collected onto the enclosing chapter instead.

| Prop | Values | Default | Notes |
|---|---|---|---|
| `eyebrow` (str) | — | `Agenda` | the kicker above the title |
| `title` (str) | — | — | the `h2` heading |
| `accent` | `blue` · `green` · `mixed` | `mixed` | tints the gradient bar and the active chapter |
| `preview` | `slides` · `subsections` | `slides` | what the miniatures show: every slide of a chapter, or only its `subsection` dividers (a sparse overview for long chapters; chapters without a subsection fall back to their full slide list) |
| `gap` (str) | CSS length | `1.4rem` | space between the head and the stepper below it |

Layout adapts to the chapter count: **up to six** chapters the rail is one clickable row driving live miniature previews below; **past six** it wraps into balanced rows and drops the previews, becoming a static top-aligned overview. Click a chapter to preview it, click a miniature to jump there.

```md
---
layout: default
title: Agenda
class: agenda-slide
---

<Agenda eyebrow="Chapter overview" title="Agenda" accent="mixed"></Agenda>
```

## BrandMeshBackground

The animated WebGL2 mesh-gradient shader behind the `cover` and `closing` slides. **Takes no props and is never written in a slide**: those two layouts mount it themselves as their bottom layer (`z-index: 0`, `pointer-events: none`), which is the whole reason they are the only animated archetypes. Listed here for completeness, not as something to reach for.

Its colour stops and the DISTORTION / SWIRL / SPEED parameters are a **sacred brand invariant** (see "Sacred invariants" in [`SKILL.md`](../SKILL.md)) — do not change them without brand sign-off. Without WebGL2 it falls back to navy `#0d0d2b`, so the cover never renders white.

---

## Tables (no component — plain Markdown)

There is **no table component**, and you don't need one: a native Markdown table already renders in brand CI. The theme styles every `<table>` (in `packages/toolkit/styles/table.css`) as a white card, thin grey border, soft blue brand shadow, rounded corners, with a light-blue header band, a black bold header row over a blue accent rule, subtle zebra striping, and Geist Mono body text (the "Geist Mono for code and tables" rule). This keeps the slide source clean — a Markdown table is markdown, so it passes the no-raw-html check; a hand-rolled `<table>`/`<div>` grid would not.

Write a plain Markdown table. Set column alignment with the divider row (`:---` left, `:--:` centre, `---:` right); right-align numeric columns. Keep it modest so it clears the canvas floor: aim for **<= 6 body rows** and short cells (see the overflow limits in `SKILL.md`). Inline `` `code` ``, `**bold**` and `*italic*` work in cells.

```md
| Element | Limit | If exceeded |
|---|---:|---|
| Bullets | 5 | Split with `---` |
| Cards per grid | 3 | Drop one or reword |
```

For a table beside a diagram, drop it into a `SplitView`'s default slot like any other body content. Never restyle a table per slide (no `<style>`, no inline colours, no wrapper `<div>`); the theme owns the look.

---

## Spacing / custom classes (the escape hatch)

Every component here has a **single root element** and does not override `inheritAttrs`, so Vue forwards a `class` or `style` you put on the tag straight onto that root (and merges it with the component's own classes). Slidev bundles UnoCSS, so utility classes resolve out of the box. This is the one sanctioned way to break the "no utility classes / no inline CSS" rule — and it is deliberately **open**: any CSS property is reachable.

Keep it to **spacing and layout nudges** — the gap above/below a component, its width, or how it aligns in a grid cell. Never restyle brand surface through it: no colours, fonts, card backgrounds, borders, or bullet markers (those live in the theme and the components).

| Want | Write |
|---|---|
| More air above a card | `<Card title="…" accent="blue" class="mt-8">…</Card>` |
| An exact top margin | `<Card title="…" accent="blue" class="mt-[18px]">…</Card>` |
| Same, as inline style | `<Figure src="…" style="margin-top: 2rem"></Figure>` |
| Nudge a grid cell down | `<Figure src="…" class="self-end"></Figure>` inside a `CardGrid`/`SplitView` |

`class` (UnoCSS: `mt-*`, `mb-*`, `w-*`, `self-*`, `justify-self-*`, arbitrary `mt-[18px]`, …) is preferred over inline `style` because it reads cleaner and stays on the spacing scale, but both work. It passes `npm run verify` — the design-system suite only flags inline `font-family` and per-slide `list-style`, not margins.

```md
<CardGrid cols="2">
<Card title="Kept close to the heading" accent="blue">Default spacing.</Card>
<Card title="Pushed down a touch" accent="green" class="mt-6">A nudge, nothing more.</Card>
</CardGrid>
```

---

## Diagrams

There are no coded SVG-primitive components. **The default diagram is a `.excalidraw.svg`** authored in the Miragon style and embedded via `<Figure src="resources/<chapter>/<name>.excalidraw.svg">`. The full authoring + export workflow (palette, scene format, Node export with embedded scene) lives in the **`excalidraw`** skill. BPMN process diagrams use the `bpmn` archetype instead.

For a standard graph type that reads as text and wants auto-layout (a flow, a sequence, a state machine), a native Slidev ` ```mermaid ` fence is the alternative, brand-styled globally by `packages/toolkit/setup/mermaid.ts`. The source can be inline or imported from a `.mermaid` file with `<<< @/chapter/<chapter>/resources/<name>.mermaid`. Excalidraw stays the default when placement carries meaning. Full when-to-use-which: the "Diagrams" section in [`SKILL.md`](../SKILL.md).