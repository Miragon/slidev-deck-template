---
layout: section
index: "06"
eyebrow: Chapter 06
accent: blue
---

# **Components**

Every building block, live and briefly explained.

---
layout: content
title: Card and CardGrid
eyebrow: 06 - Components
accent: blue
---

<!--
  Self-demonstrating: this row IS a CardGrid of Cards. White background always,
  accent on the title only, stepping blue to teal to green across the row.
  Transition: "Next, a labelled sequence."
-->

<CardGrid cols="3">

<Card title="Always white" accent="blue">The background never changes. The accent lands on the title text only, never the card.</Card>

<Card title="Accent walks" accent="teal">Across a row the title colour steps blue, teal, green, so the eye reads left to right.</Card>

<Card title="No raw markup" accent="green">You write a component, not a div with hex colours and grid classes.</Card>

</CardGrid>

---
layout: content
title: StepList and Step
eyebrow: 06 - Components
accent: blue
---

<!--
  Self-demonstrating: the list below is a StepList. Bold label, muted body.
  Transition: "A titled, captioned visual comes next."
-->

A labelled sequence for the narrow column next to a diagram.

<StepList>
<Step label="Label">a bold lead word that names each line</Step>
<Step label="Body">the muted explanation that sits beside it</Step>
<Step label="Rhythm">even spacing and type set by the theme, not the slide</Step>
</StepList>

---
layout: content
title: Figure
eyebrow: 06 - Components
accent: blue
---

<!--
  Self-demonstrating: this is a Figure. Title above, visual centred, caption below.
  Transition: "Put a Figure and its explanation side by side with SplitView."
-->

<Figure title="A titled, captioned visual" src="resources/06-components/example.excalidraw.svg" alt="A service routing to two pods" caption="Wraps any image or **.excalidraw.svg**: title above, visual centred, caption below." max-height="230px"></Figure>

---
layout: content
title: SplitView
eyebrow: 06 - Components
accent: blue
---

<!--
  Self-demonstrating: diagram on the left via #visual, explanation on the right.
  Transition: "A few pieces you have already met."
-->

<SplitView ratio="1/1">
<template #visual>
<Figure src="resources/06-components/example.excalidraw.svg" alt="A service routing to two pods" max-height="220px"></Figure>
</template>

- A visual on one side, the explanation on the other
- One tag instead of a hand-rolled two-column grid
- Both columns are vertically centred by default
- Set `ratio` when the diagram wants more width

</SplitView>

---
layout: content
title: The rest, at a glance
eyebrow: 06 - Components
accent: blue
---

<!--
  The full-slide and always-on pieces. The stepper bar and footer are visible on
  this very slide. Transition: "And the twelve layouts that host them."
-->

<CardGrid cols="3">

<Card title="Agenda" accent="blue">The clickable chapter map you saw after the cover. It reads the deck live, so it updates itself.</Card>

<Card title="Progress chrome" accent="teal">The thin bar on top and the chapter line at the bottom of this slide. On every content slide.</Card>

<Card title="BrandMeshBackground" accent="green">The animated shader on the cover and closing. Brand-locked, so its colours never change.</Card>

</CardGrid>

---
layout: content
title: Twelve layouts host them
eyebrow: 06 - Components
accent: blue
---

<!--
  The whole-slide archetypes the components live inside, each a `layout:` value.
  All are demoed across this deck: bpmn and dmn in chapter 04, the openers and
  content layouts everywhere. Transition: "That is the whole toolkit."
-->

<v-clicks>

- **Openers:** `cover`, `hero`, `person`, `section`
- **Content:** `content`, `content-image`
- **Decisions:** `compare`, `goodbad`
- **Process and rules:** `bpmn`, `dmn`
- **Explore and close:** `showcase`, `closing`

</v-clicks>
