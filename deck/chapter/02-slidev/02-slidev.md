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
- A **PDF** for hand-out and the in-deck download button
- A live **GitHub Pages** deploy on every push to `main`

One file, no copy-paste, no separate export step.

---
layout: showcase
title: What you get for free
eyebrow: 02 - Slidev
accent: blue
items:
  - label: Live preview
    body: Slidev recompiles on save, so the deck reflects every edit in real time without restarting.
  - label: Vue inside slides
    body: Drop a Vue component into a slide and it becomes part of the deck, with full reactivity and no detour.
  - label: Click-through reveal
    body: Wrap content in <v-clicks> to walk the audience through a slide one step at a time.
  - label: Code and diagrams
    body: Highlighted snippets, Mermaid charts, BPMN simulations, all rendered natively in the deck.
---

<!--
  showcase: clickable cards, detail panel cross-fades. Transition: "Now the brand layer."
-->
