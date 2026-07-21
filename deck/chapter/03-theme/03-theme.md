---
layout: section
index: "03"
eyebrow: Chapter 03
accent: blue
---

# **The Miragon theme**

The brand layer: fixed tokens, eleven layouts, seven components.

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
title: Eleven layouts for eleven jobs
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
- **Visuals:** `bpmn`, `showcase`
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
  Transition: "Why bother with a system at all?"
-->

<CardGrid cols="3">

<Card title="Card / CardGrid" accent="blue">
A row of white cards, written as components, not raw HTML or hex.
</Card>

<Card title="StepList / Figure" accent="teal">
Ordered steps and captioned visuals, styled by the theme, not the slide.
</Card>

<Card title="SplitView" accent="green">
A diagram on one side, the explanation on the other, in one tag.
</Card>

</CardGrid>

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
