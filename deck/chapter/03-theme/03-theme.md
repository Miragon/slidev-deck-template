---
layout: section
index: "03"
eyebrow: Chapter 03
accent: blue
---

# **The Miragon theme**

The brand layer: fixed tokens, twelve layouts, seven components.

---
layout: content
title: The brand is fixed, on purpose
eyebrow: 03 - The Miragon theme
accent: blue
---

<!--
  Why the theme is locked, and the brand moments. Transition: "Pick a layout per slide."
-->

<v-clicks>

- Primary blue **#335DE5**, green used sparingly, Geist typography
- Headings are black; blue is for kickers and accents only
- Cards are always white, accent on the title text only
- `accent: blue | green | mixed` tints the bar and the bold word
- `cover` and `closing` run the animated brand Mesh; the rest stay calm

</v-clicks>

---
layout: content
title: Twelve layouts for twelve jobs
eyebrow: 03 - The Miragon theme
accent: blue
---

<!--
  The archetypes, grouped. Each is a `layout:` value. Transition: "Components fill them."
-->

<v-clicks>

- **Openers:** `cover`, `hero`, `person`, `section`
- **Content:** `content`, `content-image`
- **Decisions:** `compare`, `goodbad`
- **Visuals:** `bpmn`, `dmn`, `showcase`
- **Close:** `closing`

</v-clicks>

---
layout: content
title: Seven components keep markdown clean
eyebrow: 03 - The Miragon theme
accent: blue
---

<!--
  Explain the components precisely; no raw HTML/CSS/hex in slides.
  Transition: "Here they are in action."
-->

<v-clicks>

- **Card / CardGrid**: white cards in a row, accent on the title only
- **StepList / Step**: a labelled, ordered sequence
- **Figure**: a titled, captioned visual (image or diagram)
- **SplitView**: a visual on one side, the explanation on the other
- **BrandMeshBackground**: the animated cover/closing shader (brand-locked)

</v-clicks>

---
layout: content
title: Components in action
eyebrow: 03 - The Miragon theme
accent: blue
---

<!--
  CardGrid + Card: no raw <div>, no hex. Accent walks blue → teal → green.
  OPTIONAL: `icon` sets an Iconify UnoCSS class (i-carbon-*, i-ph-*) above the
  title; it takes the card's accent colour. Omit it for a plain text card.
  Pass the full class literally so UnoCSS generates it at build time.
  A card body can be a lead line followed by a short bullet list: wrap the
  whole body in blank lines and the theme sizes both to the card text with a
  small blue marker. Keep it to a lead + 2 bullets so the grid stays on-canvas.
  Transition: "Why bother with a system at all?"
-->

<CardGrid cols="3">

<Card title="Card / CardGrid" accent="blue" icon="i-carbon-grid">

A row of white cards, written as components.

- Accent on the title only
- Body takes inline `code`

</Card>

<Card title="StepList / Figure" accent="teal" icon="i-carbon-list-boxes">

Ordered steps and captioned visuals.

- Numbered, theme-styled sequence
- Images with a title and caption

</Card>

<Card title="SplitView" accent="green" icon="i-carbon-split-screen">

A diagram beside its explanation.

- One tag, two columns
- Set `ratio` for a wider visual

</Card>

</CardGrid>

---
layout: content
title: Tabular data, on-brand
eyebrow: 03 - The Miragon theme
accent: blue
---

<!--
  Native Markdown tables get the white-card frame automatically: no component,
  no raw HTML, no hex. Header is black with a restrained blue rule; the numeric
  column is right-aligned with a trailing `:` in the divider row.
  Transition: "Why bother with a system at all?"
-->

A plain Markdown table renders in brand CI. No component needed.

| Element | Limit | If exceeded |
|---|---:|---|
| Bullets | 5 | Split with `---` |
| Cards per grid | 3 | Drop one or reword |
| Lines of code | 18 | Trim or reveal with `v-clicks` |
| Nested list levels | 1 | Flatten the list |

---
layout: compare
title: Why a system
eyebrow: 03 - The Miragon theme
leftTitle: Hand-built
rightTitle: With the theme
accent: blue
---

<!--
  compare: two panels. Transition: "Diagrams get the same treatment."
-->

Same content, two ways to get there.

::left::

- Re-pick colours and spacing every time
- Brand drifts from slide to slide
- A design review before every talk

::right::

- Choose an archetype, fill the slots
- Colours and layout are fixed
- Ship the same day, on-brand

::legend::

A system trades a little freedom for a lot of consistency.
