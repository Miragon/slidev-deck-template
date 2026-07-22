---
layout: section
index: "06"
eyebrow: Chapter 06
accent: blue
---

# **Anatomy** of a slide

Build one slide from components, then read its whole source.

---
layout: content
title: How a request reaches a pod
eyebrow: 06 - Anatomy
accent: blue
---

<!--
  This looks like any content slide: a SplitView with a Figure and a StepList.
  The next slide reveals it is four tags. Transition: "That slide is just this."
-->

<SplitView ratio="1.4/1">
<template #visual>
<Figure src="resources/06-components/example.excalidraw.svg" alt="A service routing to two pods"></Figure>
</template>

<StepList>
<Step label="Client">calls one stable URL</Step>
<Step label="Service">spreads the call across the pods</Step>
<Step label="Pods">identical, replaceable workers</Step>
</StepList>

</SplitView>

---
layout: content
title: That slide is just this
eyebrow: 06 - Anatomy
accent: blue
---

<!--
  The reveal: the whole body of the previous slide, four component tags, no
  markup. Frontmatter picks the layout. Transition: "So the rule is simple."
-->

The whole body of the previous slide, no hand-written HTML in sight:

```md
<SplitView ratio="1.4/1">
<template #visual>
<Figure src="resources/06-components/example.excalidraw.svg" alt="A service routing to two pods"></Figure>
</template>

<StepList>
<Step label="Client">calls one stable URL</Step>
<Step label="Service">spreads the call across the pods</Step>
<Step label="Pods">identical, replaceable workers</Step>
</StepList>
</SplitView>
```

---
layout: content
title: Tags, never markup
eyebrow: 06 - Anatomy
accent: blue
---

<!--
  The rule, delivered through a CardGrid (which is itself the Card component).
  The four building blocks. Transition: "That is the whole toolkit."
-->

<CardGrid cols="3">

<Card title="Pick a layout" accent="blue">Every slide opens with a `layout:` archetype, the frame.</Card>

<Card title="Drop in tags" accent="teal">Card, Figure, StepList and SplitView fill it, the furniture.</Card>

<Card title="No markup" accent="green">No hand-written HTML, no CSS, no hex, on any slide.</Card>

</CardGrid>
