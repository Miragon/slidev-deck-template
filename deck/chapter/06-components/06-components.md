---
layout: section
index: "06"
eyebrow: Chapter 06
accent: blue
---

# **Components**

Three kinds, grouped by how you use them.

---
layout: content
title: Card and CardGrid
eyebrow: Drop into a slide
accent: blue
---

<!--
  Group 1, drop-in furniture. Purpose: group a few parallel points as white cards.
  The row below is a live CardGrid. Transition: "Next, a labelled sequence."
-->

Group a few parallel points as equal white cards, the accent stepping across the row.

<CardGrid cols="3">

<Card title="White, always" accent="blue">The background never changes, on any card.</Card>

<Card title="Accent on the title" accent="teal">Blue, teal, green as the eye moves right.</Card>

<Card title="No raw markup" accent="green">A component, not a styled div with hex.</Card>

</CardGrid>

---
layout: content
title: StepList and Step
eyebrow: Drop into a slide
accent: blue
---

<!--
  Group 1, drop-in furniture. Purpose: a compact labelled sequence beside a diagram.
  The list below is a live StepList. Transition: "A titled, captioned visual next."
-->

A compact labelled sequence for the narrow column next to a diagram: a bold label, a muted body.

<StepList>
<Step label="Label">the bold lead word that names each line</Step>
<Step label="Body">the muted explanation beside it</Step>
<Step label="Rhythm">spacing and type set by the theme</Step>
</StepList>

---
layout: content
title: Figure
eyebrow: Drop into a slide
accent: blue
---

<!--
  Group 1, drop-in furniture. Purpose: wrap one visual with a title and caption.
  The block below is a live Figure. Transition: "Pair a visual with text: SplitView."
-->

Wrap one visual, an image or an `.excalidraw.svg`, with a title above and a caption below.

<Figure title="A titled, captioned visual" src="resources/06-components/example.excalidraw.svg" alt="A service routing to two pods" caption="The caption explains the visual in one line." max-height="215px"></Figure>

---
layout: content
title: SplitView
eyebrow: Drop into a slide
accent: blue
---

<!--
  Group 1, drop-in furniture. Purpose: a visual and its explanation, side by side.
  The block below is a live SplitView. Transition: "One you place once: the Agenda."
-->

Put a visual and its explanation side by side, when a diagram needs bullets next to it.

<SplitView ratio="1/1">
<template #visual>
<Figure src="resources/06-components/example.excalidraw.svg" alt="A service routing to two pods" max-height="215px"></Figure>
</template>

- Diagram on one side, text on the other
- One tag, no hand-rolled column grid
- Set `ratio` for a wider diagram

</SplitView>

---
layout: content
title: Agenda
eyebrow: Place once
accent: blue
---

<!--
  Group 2, place once. Purpose: the deck's live chapter map. Shown live after the cover.
  Transition: "Now the chrome the theme adds for you."
-->

The deck's chapter map, and the red thread through a talk. You place it once.

<v-clicks>

- A clickable stepper across the chapters, with a live preview of each one
- It reads the deck live, so adding a chapter updates it automatically
- Used near the start: you saw it right after the cover

</v-clicks>

---
layout: content
title: Stepper bar
eyebrow: Automatic chrome
accent: blue
---

<!--
  Group 3, automatic chrome. Purpose: deck-wide progress. Visible at the top of this slide.
  Transition: "Its partner at the bottom: the footer."
-->

A thin progress bar that tracks your position across the whole deck. You never place it.

<v-clicks>

- A global layer: the theme adds it to every content slide
- Its width grows as you move through the deck
- Look at the very top edge of this slide

</v-clicks>

---
layout: content
title: Footer
eyebrow: Automatic chrome
accent: blue
---

<!--
  Group 3, automatic chrome. Purpose: quiet chapter and position line. Visible at the bottom.
  Transition: "And the animated brand moment: BrandMeshBackground."
-->

A quiet line that keeps the audience oriented, with an optional date.

<v-clicks>

- A global layer too: the chapter and your position within it
- An optional `eventDate` in the headmatter adds the date
- It reads `06 · Components · n / N` at the bottom of this slide right now

</v-clicks>

---
layout: content
title: BrandMeshBackground
eyebrow: Automatic chrome
accent: blue
---

<!--
  Group 3, automatic chrome. Purpose: the animated brand shader, cover/closing only.
  Transition: "That is the whole toolkit."
-->

The animated brand shader, the one moving brand moment, run by the layouts for you.

<v-clicks>

- A full-bleed animated gradient in the Miragon colours
- Brand-locked: the colours and motion never change
- Built into the `cover` and `closing` layouts, as the opening and closing

</v-clicks>
