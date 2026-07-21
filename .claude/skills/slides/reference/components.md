# Components — full reference

Reusable building blocks in `packages/toolkit/components/` (auto-imported into every deck). Diagrams are not components — they are `.excalidraw.svg` files embedded via `<Figure src>` (see the `excalidraw` skill). Write all components on a single line in markdown with explicit closing tags.

All colours come from `packages/toolkit/styles/theme.css`; never pass raw hex from a slide.

---

## Card

The canonical white card (white background always, accent on the title only). For 2+ cards in a grid, step the accent left → right.

| Prop | Values | Default | Notes |
|---|---|---|---|
| `title` (str) | — | — | card title (gets the accent colour) |
| `accent` | `blue` · `blue-mid` · `teal` · `green-deep` · `green-mid` · `green` | `blue` | a stop on the blue→teal→green progression; the only place the sanctioned hex lives |
| `padding` | `compact` · `standard` · `generous` | `standard` | 16 / 20 / 24 px |
| **slot** | — | — | body text |

Progression by card count: **2** → blue, green · **3** → blue, teal, green · **4** → blue, blue-mid, green-deep, green · **6** → blue, blue-mid, teal, green-deep, green-mid, green.

```md
<Card title="DaemonSet" accent="teal">Exactly one pod per node.</Card>
```

## CardGrid

The column wrapper for a row of `Card`s (or `Figure`s). Replaces the raw `<div class="grid grid-cols-N …">` so the markdown carries no CSS classes. Cards stretch to equal height.

| Prop | Values | Default | Notes |
|---|---|---|---|
| `cols` (number) | — | `3` | number of equal columns |
| `gap` | `compact` · `standard` · `generous` | `standard` | 16 / 24 / 32 px between cells |
| **slot** | — | — | the `Card`s (one blank line between them so they parse as markdown) |

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

---

## Diagrams

There are no coded SVG-primitive components. **Every diagram is a `.excalidraw.svg`** authored in the Miragon style and embedded via `<Figure src="resources/<chapter>/<name>.excalidraw.svg">`. The full authoring + export workflow (palette, scene format, Node export with embedded scene) lives in the **`excalidraw`** skill. BPMN process diagrams use the `bpmn` archetype instead.