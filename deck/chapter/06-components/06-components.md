---
layout: section
index: "06"
eyebrow: Chapter 06
accent: blue
---

# **Components**

One slide per building block, with what each is for.

---
layout: content
title: Card and CardGrid
eyebrow: 06 - Components
accent: blue
---

<!--
  Purpose: group a few parallel points as equal white cards.
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
eyebrow: 06 - Components
accent: blue
---

<!--
  Purpose: a compact labelled sequence, usually beside a diagram.
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
eyebrow: 06 - Components
accent: blue
---

<!--
  Purpose: wrap one visual with a title and caption.
  The block below is a live Figure. Transition: "Pair a visual with text: SplitView."
-->

Wrap one visual, an image or an `.excalidraw.svg`, with a title above and a caption below.

<Figure title="A titled, captioned visual" src="resources/06-components/example.excalidraw.svg" alt="A service routing to two pods" caption="The caption explains the visual in one line." max-height="215px"></Figure>

---
layout: content
title: SplitView
eyebrow: 06 - Components
accent: blue
---

<!--
  Purpose: a visual and its explanation, side by side.
  The block below is a live SplitView. Transition: "A full-deck component: Agenda."
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
eyebrow: 06 - Components
accent: blue
---

<!--
  Purpose: the deck's live chapter map. Shown live right after the cover.
  Transition: "The animated brand shader: BrandMeshBackground."
-->

The deck's chapter map, and the red thread through a talk.

<v-clicks>

- A clickable stepper across the chapters, with a live preview of each one
- It reads the deck live, so adding a chapter updates it automatically
- Use it once, near the start: you saw it right after the cover

</v-clicks>

---
layout: content
title: BrandMeshBackground
eyebrow: 06 - Components
accent: blue
---

<!--
  Purpose: the animated brand shader, brand-locked, cover/closing only.
  Transition: "Always-on chrome: the stepper bar."
-->

The animated brand shader, the one moving brand moment in the deck.

<v-clicks>

- A full-bleed animated gradient in the Miragon colours
- Brand-locked: the colours and motion never change
- Used only by the `cover` and `closing` layouts, as the opening and closing

</v-clicks>

---
layout: content
title: Stepper bar
eyebrow: 06 - Components
accent: blue
---

<!--
  Purpose: deck-wide progress, a global layer. Visible at the very top of this slide.
  Transition: "Its partner at the bottom: the footer."
-->

A thin progress bar that tracks your position across the whole deck.

<v-clicks>

- A global layer: automatic on every content slide, nothing to place
- Its width grows as you move through the deck
- Look at the very top edge of this slide

</v-clicks>

---
layout: content
title: Footer
eyebrow: 06 - Components
accent: blue
---

<!--
  Purpose: quiet chapter and position line, a global layer. Visible at the bottom now.
  Transition: "And the twelve layouts that host them."
-->

A quiet line that keeps the audience oriented, with an optional date.

<v-clicks>

- A global layer too: the chapter and your position within it
- An optional `eventDate` in the headmatter adds the date
- It reads `06 · Components · n / N` at the bottom of this slide right now

</v-clicks>

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
