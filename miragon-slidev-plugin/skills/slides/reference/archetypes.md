# Layout archetypes: full reference

The theme ships **15 layouts**, each with one clear purpose. Selected per slide via `layout:` in the frontmatter. The `.vue` file in `packages/toolkit/layouts/` is the truth for each prop signature; this is a summary. Every demo slide in `deck/chapter/*/*.md` carries a `REQUIRED` / `OPTIONAL` / `LIMIT` / `HOW TO USE` comment block; match it.

`accent` is `blue` (default) · `green` · `mixed` unless noted. It tints the **gradient accent bar and the bullet markers**, never the type: the text accent (eyebrow, bold word) is always the brand blue `#335DE5`, because green `#00E676` reaches 1.67:1 on a light ground and fails WCAG AA. So `accent: green` buys a green bar, not green words. The one text tone that is not brand blue is the `compare` right panel title, which takes the success status colour `#0B7A55` when `accent` is `mixed` or `green` (see that archetype).

---

## cover: animated title slide

`BrandMeshBackground` full-bleed, white italic h1.

| Frontmatter | Description |
|---|---|
| `eyebrow` (str) | small uppercase kicker |
| `footer` (str) | footer text on the right |
| **slot** | h1 title + optional `<p>` subtitle |

**Limit:** 1 statement, no bullets.

## hero: one big statement (static)

Key theses, motivation, transitions. The "active hero" poses a question the next slides answer.

| Frontmatter | Values |
|---|---|
| `eyebrow` (str) | uppercase kicker |
| `accent` | blue / green / mixed |
| `align` | left (default) / center |
| **slot** | h1 statement + optional `<p>` attribution; `**bold**` becomes the accent word (always brand blue, export-safe) |

**Limit:** 1 statement, no bullets.

## person: introduce one or two people (static)

Solo: `name` + `role` + `photo` + bio slot. Duo: add `name2` / `role2` / `photo2` and it auto-switches.

| Frontmatter | Values |
|---|---|
| `name`, `role`, `photo` (str) | required for solo |
| `name2`, `role2`, `photo2` | activates duo mode |
| `eyebrow` (str) | uppercase kicker |
| `accent` | blue / green / mixed |
| `side` | left (default) / right (solo only) |
| **slot** | bio text (max 3 lines) |

Photos: this chapter's `resources/` folder; `photo:` path is `/resources/<chapter>/<file>`. No `photo` → initials frame. The layout renders the name as the photo's alt text, so a person photo needs no extra prop.

## section: chapter divider (static)

Large semi-transparent ghost index numeral + accent bar. Each chapter file begins with one.

| Frontmatter | Description |
|---|---|
| `index` (str) | chapter number, rendered as ghost numeral (e.g. `"01"`) |
| `eyebrow` (str) | uppercase kicker (e.g. "Chapter 01") |
| `accent` | blue / green / mixed |
| **slot** | h1 chapter title + optional `<p>` subtitle |

## subsection: sub-chapter divider (static)

The little sibling of `section`: divides a chapter **internally** without opening a new chapter in the Agenda (which counts only `layout: section`). Visually subordinate: smaller title, fainter ghost numeral. Use for the second-level structure inside a long chapter.

| Frontmatter | Description |
|---|---|
| `index` (str) | number, rendered as ghost numeral (e.g. `"2.1"`) |
| `eyebrow` (str) | uppercase kicker (e.g. the parent chapter) |
| `accent` | blue / green / mixed |
| **slot** | h1 sub-chapter title + optional `<p>` subtitle |

The Agenda can render these dividers as a chapter's preview instead of every slide: `<Agenda preview="subsections">`.

## content: the workhorse (static)

Title + free body. Bullets get an automatic accent-square marker.

| Frontmatter | Values |
|---|---|
| `title` (str) | slide title (h2-level) |
| `eyebrow` (str) | uppercase kicker |
| `accent` | blue / green / mixed |
| **slot** | free markdown body |

**Limit:** max 5 bullets, max 1 nesting level. The layout owns the bullet marker, so don't override `<ul>`/`<li>`. Note: `.content-body :deep(p)` sets a body font-size, so a `<p>` inside a child component inherits it; use a `<div>` (as `Figure`'s caption does) when you need a different size.

## content-image: content with a side image (static)

Two columns: image one side, content the other.

| Frontmatter | Values |
|---|---|
| `title`, `eyebrow` (str) | free text |
| `accent` | blue / green / mixed |
| `image` (str) | served from the chapter's `resources/` (e.g. `/resources/02-content/team.jpg`) |
| `imageAlt` (str) | alt text. **Fill it in whenever the image carries content** (say what it shows, not "image"); leave the default `""` only for a purely decorative photo, so screen readers skip it |
| `side` | left (default) / right: which column carries the image |
| **slot** | free markdown body |

**Limit:** max 4 bullets. Images: the chapter's `resources/` folder, referenced as `/resources/<chapter>/<file>`. Flip `side` so the visual doesn't always land on the same column.

## compare: two-panel before/after (static)

Both panels are white. Brand green `#00E676` is deliberately never a panel-title colour, since panel titles are text on white (1.67:1); the green/blue semantics ride on the marker bars instead.

The panel tones follow `accent`, so pick it deliberately (verified against `packages/toolkit/layouts/compare.vue`):

| `accent` | Left title / marker | Right title / marker |
|---|---|---|
| `blue` (**default**) | blue `#335DE5` / blue gradient | blue `#335DE5` / blue gradient |
| `mixed` | blue `#335DE5` / blue gradient | success `#0B7A55` / green gradient |
| `green` | success `#0B7A55` / green gradient | success `#0B7A55` / green gradient |

Use **`accent: mixed`** when the slide really is problem-versus-solution: that is the only value that gives the two sides different tones. The default `blue` renders both sides identically, which is right for a neutral A/B comparison but carries no verdict.

| Frontmatter | Default |
|---|---|
| `title`, `eyebrow` | free text |
| `leftTitle` (str) | "Before" |
| `rightTitle` (str) | "After" |
| `accent` | blue / green / mixed (default blue; `mixed` for problem vs. solution) |
| **`::left::` slot** | left panel content |
| **`::right::` slot** | right panel content |
| **default slot** | optional lead paragraph |

**Limit:** max 4 bullets per panel.

## goodbad: "which model is right, and why?" (static, interactive)

Two neutral panels `Model A` / `Model B`, then a one-click reveal of the verdict (Recommended / Avoid) plus a rule legend.

| Frontmatter | Default | Description |
|---|---|---|
| `title`, `eyebrow`, `prompt` (str) | free text | title, kicker, italic question |
| `leftIsGood` (bool) | false | true → A recommended, B avoid. **Vary across slides** so "good" isn't always the same side. |
| `accent` | blue | |
| **`::left::` slot** | none | Model A content |
| **`::right::` slot** | none | Model B content |
| **`::legend::` slot** | none | rule revealed with the verdicts |

## bpmn: BPMN diagram (static / token simulation / modeler)

A `.bpmn` file rendered via `slidev-addon-bpmn`. The diagram is the focal point.

| Frontmatter | Values |
|---|---|
| `title`, `eyebrow` (str) | free text |
| `accent` | blue / green / mixed |
| `diagram` (str) | the `.bpmn` in the chapter's `resources/`, e.g. `/resources/05-diagrams/x.bpmn` |
| `height` (str) | canvas height (default `"380px"`) |
| `mode` | `static` (still image) / `token` (playable token flow, **default**) / `modeler` (editable canvas) |
| `engine` | `camunda7` / `zeebe`, `modeler` mode only. Mounts an engine-specific properties panel in the modeler's fullscreen "Edit" view. Omit for a panel-less modeler. |
| `tokenSimulation` (bool) | run the token simulation inside the modeler (`modeler` mode, default `false`) |
| `transactionBoundaries` (bool) | overlay Camunda 7 transaction boundaries in the modeler's fullscreen "Edit" view (`modeler` mode, requires `engine: camunda7`, default `false`) |
| `side` | `left` / `right`, **split mode**: frame the diagram on that side, the slot becomes the content column opposite. Omit for full-width + caption below. |
| `ratio` (str) | diagram/content column ratio in split mode (default `"1/1"`) |
| **slot** | full mode: optional caption below the diagram. **split mode**: the content column beside the diagram (bullets / `<StepList>` / `<Card>`, styled like a content slide). |

**Split mode** (`side`) puts the framed diagram on one side and your points on the other, without the `content` + `SplitView` scaffolding. Vary `side` across slides so the diagram is not always on the same edge, and keep the content column short (~4 bullets) so it clears the bottom-left page chrome (verify flags collisions).

**Dependency:** `slidev-addon-bpmn` must be in `package.json` (pre-installed) **and** in deck/slides.md's top-level `addons:` block. Files go in the chapter's `resources/` folder.

## dmn: DMN decision (table / live simulation / DRD / modeler)

A `.dmn` file rendered via `slidev-addon-dmn`. The sibling of `bpmn`: BPMN models the process, DMN the decisions inside it. Like `bpmn`, the `mode` prop dynamically controls which addon component is rendered. The decision is the focal point.

| Frontmatter | Values |
|---|---|
| `title`, `eyebrow` (str) | free text |
| `accent` | blue / green / mixed |
| `diagram` (str) | the `.dmn` in the chapter's `resources/`, e.g. `/resources/04-diagrams/x.dmn` |
| `height` (str) | table/canvas height (default `"360px"`) |
| `mode` | `table` (static decision table, **default**) / `simulate` (live input form: pick inputs, evaluate the decision, highlight the firing rule, DMN's answer to bpmn's `token` simulation; ships a built-in Fullscreen button next to the form) / `drd` (static requirement diagram, bpmn's `static` equivalent) / `modeler` (editable canvas) |
| `decisionId` (str) | which decision to show when the file holds several (optional; `table` / `simulate` modes) |
| `fontSize` (str) | table/diagram font size (default `"15px"`; `table` / `simulate` / `drd` modes) |
| `fullscreenFontSize` (str) | table font size when the simulation is blown up to the full viewport (default `"18px"`; `simulate` mode) |
| `showAnnotations` (bool) | show the trailing annotations column (default `false`; `table` / `simulate` modes) |
| `showDrdButton` (bool) | show the built-in "View DRD" button (default `false`; `table` / `simulate` modes) |
| `engine` | `camunda`, mounts the Camunda properties panel in the modeler (`modeler` mode only; omit for a panel-less modeler) |
| `side` | `left` / `right`, **split mode**: frame the decision on that side, the slot becomes the content column opposite. Omit for full-width + caption below. |
| `ratio` (str) | decision/content column ratio in split mode (default `"1/1"`) |
| **slot** | full mode: optional caption below the decision. **split mode**: the content column beside the decision (bullets / `<StepList>` / `<Card>`, styled like a content slide). |

**Split mode** works exactly like `bpmn`'s (`side` + `ratio`); keep the content column short so it clears the bottom-left page chrome.

**Dependency:** `slidev-addon-dmn` must be in `package.json` (pre-installed) **and** in deck/slides.md's top-level `addons:` block. Files go in the chapter's `resources/` folder.

## mermaid: Mermaid diagram framed on-brand (static)

The sibling of `bpmn` / `dmn`, but for a text-generated Mermaid diagram: header above, the diagram framed in a branded white card, optional caption below. Unlike bpmn/dmn (which take a `diagram:` file path), the diagram comes from a ` ```mermaid ` fence (or a `<<< @/…/x.mermaid` import) in the **default slot**. The diagram is the focal point.

| Frontmatter | Values |
|---|---|
| `title`, `eyebrow` (str) | free text |
| `accent` | blue / green / mixed |
| `side` | `left` / `right`, **split mode**: frame the diagram on that side; the `::caption::` slot becomes the content column opposite. Omit for full-width + caption below. |
| `ratio` (str) | diagram/content column ratio in split mode (default `"1/1"`) |
| `height` (str) | height of the framed diagram card in split mode (default `"22rem"`; ignored in full mode) |
| **default slot** | the ` ```mermaid ` fence (or a `<<<` import), framed in the white card |
| **`::caption::` slot** | full mode: optional caption below the diagram. **split mode**: the content column beside the diagram. |

In full mode there is no file-path/height prop: the Mermaid SVG sizes itself and is centered in the card; shrink a tall diagram with the fence's scale option (` ```mermaid {scale: 0.8} `), never by editing the theme. In **split mode** the diagram still comes from the default slot, while the `::caption::` slot moves beside it as the content column (bounded by `height`). The diagram is brand-styled globally by `packages/toolkit/setup/mermaid.ts` (Miragon palette mirrored from `tokens.json`, Geist, rounded box corners), so no per-slide styling. Use this layout when the diagram should be the framed focal point; a Mermaid fence still renders inline in a plain `content` layout when it sits alongside bullets.

## excalidraw: Excalidraw diagram framed on-brand (static)

The sibling of `bpmn` / `dmn` / `mermaid`, but for a hand-drawn `.excalidraw.svg`: header above, the diagram framed in a branded white card, optional caption below. Like bpmn/dmn it takes a file path in frontmatter (named `diagram`, **not** `src`, because `src` is Slidev's reserved slide-import key); the default slot holds the caption.

| Frontmatter | Values |
|---|---|
| `title`, `eyebrow` (str) | free text |
| `accent` | blue / green / mixed |
| `diagram` (str) | the `.excalidraw.svg` in the chapter's `resources/`, e.g. `resources/04-diagrams/x.excalidraw.svg` |
| `alt` (str) | alt text for the diagram image. **A diagram always carries content, so always write one** (what it shows, not "diagram"); an empty `alt=""` is reserved for purely decorative visuals |
| `side` | `left` / `right`, **split mode**: frame the diagram on that side, the slot becomes the content column opposite. Omit for full-width + caption below. |
| `ratio` (str) | diagram/content column ratio in split mode (default `"1/1"`) |
| `height` (str) | height of the framed diagram card in split mode (default `"22rem"`; ignored in full mode) |
| **slot** | full mode: optional caption below the diagram. **split mode**: the content column beside the diagram (bullets / `<StepList>` / `<Card>`, styled like a content slide). |

Internally it frames the diagram with the `DiagramFrame` component (see `reference/components.md`). Use full mode when an Excalidraw diagram should be the framed focal point of a whole slide, and **split mode** (`side`) when it should sit beside its explanation without hand-building a `content` + `SplitView` layout. To frame one *part* of a slide manually reach for `DiagramFrame` directly. A transparent `.excalidraw.svg` via `<Figure src>` still sits directly on the grey `content` layout when it needs no frame.

## showcase: interactive feature explorer (static, interactive)

A row of cards; one active at a time, cross-fading a detail panel. Fully frontmatter-driven (no body slot). The active card advances **either by clicking a card OR by advancing the slide** (arrow keys / space / v-click), and both drive the same Slidev click counter, so mouse and keyboard stay in sync. The layout registers `items.length - 1` click steps itself, so you do **not** add a `clicks:` frontmatter; walking to the last card is the slide's final click before Slidev moves on.

| Frontmatter | Values |
|---|---|
| `title`, `eyebrow` (str) | free text |
| `accent` | blue / green / mixed (default mixed) |
| `items` (array) | YAML array of `{ label, body, icon? }` |
| `hint` (bool/str) | navigation footer, hidden by default; `true` shows the standard "Click a card or press the arrow keys" line, a string shows custom text |
| `gap` (str) | CSS length between the card row and the detail panel; default `1rem` (matches the card gap) |

`body` is either a **string** (renders as one paragraph) or a **YAML list of strings** (renders as a plain bullet list with the standard accent-square markers, same as the `content` layout). Use the list form only for genuinely enumerable detail; keep it to three to four short items. Inline Markdown works in either form: `` `code` ``, `**bold**`, and `*italic*` are rendered (angle brackets are escaped, so `` `<v-clicks>` `` shows as a literal code chip). Wrap any HTML-like term in backticks rather than writing it raw.

`icon` (optional, per item) is a **Lucide Iconify UnoCSS class** (`i-lucide-*`). Lucide is the one sanctioned icon set (outline, 24px grid) and ships with the toolkit as `@iconify-json/lucide`; never mix in a second family such as Carbon or Phosphor, even though other collections happen to resolve. When set it **replaces** that card's numbered `01/02/03` index, sits top-left above the label, and takes the accent colour (muted → accent when active) just like the index. Cards without `icon` keep the number, so use all-or-none per slide. Write the class **literally** (e.g. `icon: i-lucide-cpu`) so UnoCSS generates it; no emoji.

```yaml
items:
  - label: Ticket schreiben
    icon: i-lucide-file-text
    body:
      - Anforderungen entstehen in Jira
      - KI analysiert Tickets, Doku und Code
      - Daraus entstehen Akzeptanzkriterien
  - label: Operations
    icon: i-lucide-settings
    body: Ein Satz genuegt hier auch weiterhin.
```

**Limit:** 3–4 cards. Keep `label` to one to three words; `body` is a single sentence or a short bullet list (3–4 items).

## closing: animated closing slide

Mirror of `cover`. `BrandMeshBackground` full-bleed, white italic h1.

| Frontmatter | Description |
|---|---|
| `eyebrow` (str) | small uppercase kicker |
| `contact` (str) | contact line on the right |
| `footer` (str) | footer text on the left (alternative to `contact`) |
| **slot** | h1 CTA + optional `<p>` |

**Limit:** 1 CTA.