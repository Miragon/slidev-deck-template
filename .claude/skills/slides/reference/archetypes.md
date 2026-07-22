# Layout archetypes — full reference

The theme ships **12 layouts**, each with one clear purpose. Selected per slide via `layout:` in the frontmatter. The `.vue` file in `packages/toolkit/layouts/` is the truth for each prop signature; this is a summary. Every demo slide in `deck/chapter/*/*.md` carries a `REQUIRED` / `OPTIONAL` / `LIMIT` / `HOW TO USE` comment block — match it.

`accent` is `blue` (default) · `green` · `mixed` unless noted; it tints the gradient accent bar and the bold word.

---

## cover — animated title slide

`BrandMeshBackground` full-bleed, white italic h1.

| Frontmatter | Description |
|---|---|
| `eyebrow` (str) | small uppercase kicker |
| `footer` (str) | footer text on the right |
| **slot** | h1 title + optional `<p>` subtitle |

**Limit:** 1 statement, no bullets.

## hero — one big statement (static)

Key theses, motivation, transitions. The "active hero" poses a question the next slides answer.

| Frontmatter | Values |
|---|---|
| `eyebrow` (str) | uppercase kicker |
| `accent` | blue / green / mixed |
| `align` | left (default) / center |
| **slot** | h1 statement + optional `<p>` attribution; `**bold**` becomes the accent word |

**Limit:** 1 statement, no bullets.

## person — introduce one or two people (static)

Solo: `name` + `role` + `photo` + bio slot. Duo: add `name2` / `role2` / `photo2` and it auto-switches.

| Frontmatter | Values |
|---|---|
| `name`, `role`, `photo` (str) | required for solo |
| `name2`, `role2`, `photo2` | activates duo mode |
| `eyebrow` (str) | uppercase kicker |
| `accent` | blue / green / mixed |
| `side` | left (default) / right (solo only) |
| **slot** | bio text (max 3 lines) |

Photos: this chapter's `resources/` folder; `photo:` path is `/resources/<chapter>/<file>`. No `photo` → initials frame.

## section — chapter divider (static)

Large semi-transparent ghost index numeral + accent bar. Each chapter file begins with one.

| Frontmatter | Description |
|---|---|
| `index` (str) | chapter number, rendered as ghost numeral (e.g. `"01"`) |
| `eyebrow` (str) | uppercase kicker (e.g. "Chapter 01") |
| `accent` | blue / green / mixed |
| **slot** | h1 chapter title + optional `<p>` subtitle |

## content — the workhorse (static)

Title + free body. Bullets get an automatic accent-square marker.

| Frontmatter | Values |
|---|---|
| `title` (str) | slide title (h2-level) |
| `eyebrow` (str) | uppercase kicker |
| `accent` | blue / green / mixed |
| **slot** | free markdown body |

**Limit:** max 5 bullets, max 1 nesting level. The layout owns the bullet marker — don't override `<ul>`/`<li>`. Note: `.content-body :deep(p)` sets a body font-size, so a `<p>` inside a child component inherits it; use a `<div>` (as `Figure`'s caption does) when you need a different size.

## content-image — content with a side image (static)

Two columns: image one side, content the other.

| Frontmatter | Values |
|---|---|
| `title`, `eyebrow` (str) | — |
| `accent` | blue / green / mixed |
| `image` (str) | served from the chapter's `resources/` (e.g. `/resources/02-content/team.jpg`) |
| `imageAlt` (str) | alt text (default `""`) |
| `side` | left (default) / right — which column carries the image |
| **slot** | free markdown body |

**Limit:** max 4 bullets. Images: the chapter's `resources/` folder, referenced as `/resources/<chapter>/<file>`. Flip `side` so the visual doesn't always land on the same column.

## compare — two-panel before/after (static)

Left panel neutral blue (problem/before), right panel green-light (solution/after). Panels are white; the title colour carries the semantics.

| Frontmatter | Default |
|---|---|
| `title`, `eyebrow` | — |
| `leftTitle` (str) | "Before" |
| `rightTitle` (str) | "After" |
| `accent` | blue |
| **`::left::` slot** | left panel content |
| **`::right::` slot** | right panel content |
| **default slot** | optional lead paragraph |

**Limit:** max 4 bullets per panel.

## goodbad — "which model is right, and why?" (static, interactive)

Two neutral panels `Model A` / `Model B`, then a one-click reveal of the verdict (Recommended / Avoid) plus a rule legend.

| Frontmatter | Default | Description |
|---|---|---|
| `title`, `eyebrow`, `prompt` (str) | — | title, kicker, italic question |
| `leftIsGood` (bool) | false | true → A recommended, B avoid. **Vary across slides** so "good" isn't always the same side. |
| `accent` | blue | |
| **`::left::` slot** | — | Model A content |
| **`::right::` slot** | — | Model B content |
| **`::legend::` slot** | — | rule revealed with the verdicts |

## bpmn — BPMN diagram with token simulation (static)

A `.bpmn` file rendered via `slidev-addon-bpmn`. The diagram is the focal point.

| Frontmatter | Values |
|---|---|
| `title`, `eyebrow` (str) | — |
| `accent` | blue / green / mixed |
| `diagram` (str) | the `.bpmn` in the chapter's `resources/`, e.g. `/resources/05-diagrams/x.bpmn` |
| `height` (str) | canvas height (default `"380px"`) |
| **slot** | optional caption below the diagram |

**Dependency:** `slidev-addon-bpmn` must be in `package.json` (pre-installed) **and** in deck/slides.md's top-level `addons:` block. Files go in the chapter's `resources/` folder.

## dmn — DMN decision table (static)

A `.dmn` file rendered as a decision table via `slidev-addon-dmn`. The sibling of `bpmn`: BPMN models the process, DMN the decisions inside it. The table is the focal point.

| Frontmatter | Values |
|---|---|
| `title`, `eyebrow` (str) | — |
| `accent` | blue / green / mixed |
| `diagram` (str) | the `.dmn` in the chapter's `resources/`, e.g. `/resources/04-diagrams/x.dmn` |
| `height` (str) | canvas height (default `"360px"`) |
| `decisionId` (str) | which decision to show when the file holds several (optional) |
| `fontSize` (str) | table font size (default `"15px"`) |
| `showAnnotations` (bool) | show the trailing annotations column (default `false`) |
| **slot** | optional caption below the table |

**Dependency:** `slidev-addon-dmn` must be in `package.json` (pre-installed) **and** in deck/slides.md's top-level `addons:` block. Files go in the chapter's `resources/` folder.

## showcase — interactive feature explorer (static, interactive)

A row of clickable cards; one active at a time, cross-fading a detail panel. Fully frontmatter-driven (no body slot).

| Frontmatter | Values |
|---|---|
| `title`, `eyebrow` (str) | — |
| `accent` | blue / green / mixed (default mixed) |
| `items` (array) | YAML array of `{ label, body }` |

**Limit:** 3–4 cards. Keep `label` to one to three words, `body` to a single sentence.

## closing — animated closing slide

Mirror of `cover`. `BrandMeshBackground` full-bleed, white italic h1.

| Frontmatter | Description |
|---|---|
| `eyebrow` (str) | small uppercase kicker |
| `contact` (str) | contact line on the right |
| `footer` (str) | footer text on the left (alternative to `contact`) |
| **slot** | h1 CTA + optional `<p>` |

**Limit:** 1 CTA.