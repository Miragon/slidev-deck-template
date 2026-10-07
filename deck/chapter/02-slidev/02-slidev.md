---
id: s-70b4d393
layout: section
index: "02"
eyebrow: Chapter 02
accent: blue
---

# **Slidev**

The engine: slides written as Markdown, rendered in the browser.

---
id: s-4e469cca
layout: content
title: Slides are Markdown
eyebrow: 02 - Slidev
accent: blue
---

<!--
  Plain-language intro to Slidev. Transition: "And one source gives you every output."
-->

<v-clicks>

- One `.md` file, one slide per `---` block; `npm run dev` reloads on save
- Frontmatter picks the layout; the body is just Markdown
- Drop in a **Vue component** when you need more than text
- `<v-clicks>` reveals content step by step; Shiki highlights code
- Press `p` for **presenter mode** with notes and a next-slide preview

</v-clicks>

---
id: s-bd9b8a2d
layout: content
title: A slide is just Markdown
eyebrow: 02 - Slidev
accent: blue
---

<!--
  Shows the CodeBlock component: a titled code window in Miragon CI (filename
  left, language badge right, white brand card frame). The bare fence below it
  picks up the same frame globally via code.css. `expandable` adds the macOS-style
  expand button (top-right, on hover) that blows the snippet up to fullscreen —
  hover the window and click it to read the code at full size, Esc to close.
  Line highlighting is native Shiki, set on the fence, not a CodeBlock prop:
  `md {3-4}` marks lines statically; `md {3|4|all}` steps through them on click.
  The theme (styles/code.css) gives marked lines a blue band and left bar.
  Transition: "And one source gives you every output."
-->

The body of a slide is plain Markdown, headings and bullets. Reach for a `<Card>` or `<Figure>` when text alone is not enough.

<CodeBlock file="deck/chapter/02-slidev/02-slidev.md" lang="md" expandable>

```md {1,4-5}
# Three habits of great **retros**

- Look back before looking forward
- One action item, not ten
- Rotate the facilitator
```

</CodeBlock>

*Highlight lines on the fence: `{1,4-5}` static, `{1|4|5}` per click.*

---
id: s-c4821064
layout: content-image
title: One source, every output
eyebrow: 02 - Slidev
accent: blue
image: /resources/02-slidev/build-flow.excalidraw.svg
imageAlt: slides.md compiles to HTML and PDF
side: right
---

<!--
  content-image: image one side (right here), narrative the other.
  Transition: "It is reactive too, not just static slides."
-->

The same `deck/slides.md` becomes:

- A **static site** (`npm run build`) you host anywhere
- A **PDF** for hand-out, exported locally with `npm run export`
- A CI **build check** on every push and every pull request

One file, no copy-paste, no parallel set of slides to keep in sync.

---
id: s-f0ac3978
layout: showcase
title: What you get for free
eyebrow: 02 - Slidev
accent: blue
items:
  - label: Live preview
    icon: i-lucide-zap
    body:
      - Slidev recompiles on every save
      - The deck reflects **each edit** in real time
      - No restart, no manual refresh
  - label: Vue inside slides
    icon: i-lucide-box
    body: "**Components are slide content.**\nDrop a Vue component into a slide and
      it becomes part of the deck, with full reactivity and no detour."
  - label: Click-through
    icon: i-lucide-mouse-pointer-2
    body:
      - Wrap content in `<v-clicks>`
      - Each click reveals **one step**
      - The details live in the [Slidev docs](https://sli.dev/guide/animations)
  - label: Code and diagrams
    icon: i-lucide-code
---

::item-4::

<CodeBlock file="packages/toolkit/setup/mermaid.ts" lang="ts" expandable>

```ts {3-5}
export default defineMermaidSetup(() => ({
  theme: 'base',
  themeVariables: {
    fontFamily: 'Geist',
  },
}))
```

</CodeBlock>

<!--
showcase: clickable cards, detail panel cross-fades.
  item.body is a string (one paragraph) OR a YAML list of strings (bullet list,
  as on cards 01 and 03 here). Bodies support inline Markdown: `code`,
  [links](url), **bold**, *italic* (see card 01's bold and card 03's link).
  A newline in a string body ("...\n...") starts a new line: statement, then
  explanation (card 02). One break per body.
  OPTIONAL item.image + item.imageAlt: an image with a string body (shown on
  the next slide). Ignored with a list body; no caption.
  OPTIONAL per-item slot `::item-N::` (1-based) in the slide body: compiled
  Markdown instead of that item's body / image, here a CodeBlock with native
  Shiki highlighting and line marks (card 04). The slot drops the white panel
  card, so the component's own frame sits directly below the cards.
  LIMIT: one framed component per slot; code stays within the 18-line limit.
  Transition: "The same explorer, with room for the picture."
-->

---
id: s-8b354758
layout: showcase
title: From source to stage
eyebrow: 02 - Slidev
accent: blue
cards: left
items:
  - label: Write
    icon: i-lucide-pencil-line
    body: "**Plain Markdown.**\nOne file per chapter, reviewed like any other
      code change."
  - label: Build
    icon: i-lucide-hammer
    body: "**One command.**\n`npm run build` turns the source into a web deck and
      a PDF."
    image: /resources/02-slidev/build-flow.excalidraw.svg
    imageAlt: The build flow from one Markdown file to web deck and PDF
  - label: Present
    icon: i-lucide-presentation
    body: "**Straight from the browser.**\nPresenter view, speaker notes and click
      steps come with Slidev."
---

<!--
showcase with OPTIONAL cards: left (default top): the cards stack in a column
  on the left, the detail panel takes the full height on the right.
  An item.image sits below its text at the full panel width (card 02),
  so reach for this variant when a screenshot or diagram needs room.
  LIMIT: 3 to 4 cards, labels of one to three words.
  Transition: "Now the brand layer."
-->
