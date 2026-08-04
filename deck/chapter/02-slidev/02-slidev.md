---
layout: section
index: "02"
eyebrow: Chapter 02
accent: blue
---

# **Slidev**

The engine: slides written as Markdown, rendered in the browser.

---
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
layout: content
title: A slide is just Markdown
eyebrow: 02 - Slidev
accent: blue
---

<!--
  Shows the CodeBlock component: a titled code window in Miragon CI (filename
  left, language badge right, white brand card frame). The bare fence below it
  picks up the same frame globally via code.css. Transition: "And one source
  gives you every output."
-->

The body of a slide is plain Markdown, headings and bullets. Reach for a `<Card>` or `<Figure>` when text alone is not enough.

<CodeBlock file="deck/chapter/02-slidev/02-slidev.md" lang="md">

```md
# Three habits of great **retros**

- Look back before looking forward
- One action item, not ten
- Rotate the facilitator
```

</CodeBlock>

---
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
layout: showcase
title: What you get for free
eyebrow: 02 - Slidev
accent: blue
items:
  - label: Live preview
    body:
      - Slidev recompiles on every save
      - The deck reflects each edit in real time
      - No restart, no manual refresh
  - label: Vue inside slides
    body: Drop a Vue component into a slide and it becomes part of the deck, with
      full reactivity and no detour.
  - label: Click-through reveal
    body: Wrap content in `<v-clicks>` to walk the audience through a slide one step
      at a time.
  - label: Code and diagrams
    body: Highlighted snippets, Mermaid charts, BPMN simulations, all rendered
      natively in the deck.
---

<!--
showcase: clickable cards, detail panel cross-fades.
  item.body is a string (one paragraph) OR a YAML list of strings (bullet list,
  as on card 01 here). Transition: "Now the brand layer."
-->
