---
layout: section
index: "04"
eyebrow: Chapter 04
accent: blue
---

# **Diagrams**

Hand-drawn schematics and real BPMN, both on-brand.

---
layout: content
title: Draw it, drop it in
eyebrow: 04 - Diagrams
accent: blue
---

<!--
  A diagram is one .excalidraw.svg with the scene embedded, in the Miragon palette.
  Transition: "And you edit it without leaving your editor."
-->

<Figure src="resources/04-diagrams/compose-diagram.excalidraw.svg" alt="Client to gateway to service with two pods" caption="A diagram is one **.excalidraw.svg** with the scene embedded, in the Miragon palette." max-height="230px"></Figure>

---
layout: content
title: Edit it right in your IDE
eyebrow: 04 - Diagrams
accent: blue
---

<!--
  KEY POINT: .excalidraw.svg files open and edit in the IDE via the Excalidraw plugin.
  SplitView: diagram left, explanation right. Transition: "Need a process? Use BPMN."
-->

<SplitView ratio="1/1">
<template #visual>
<Figure src="resources/04-diagrams/service.excalidraw.svg" alt="A service routing to two pods" max-height="220px"></Figure>
</template>

- Install the **Excalidraw plugin** for **VS Code** or **IntelliJ**
- Open the `.excalidraw.svg`, edit it visually, save; the slide reloads
- The scene stays embedded, so the file is both image and source
- No photoshop, no separate tool, no export dance

</SplitView>

---
layout: content
title: Always on-brand, always transparent
eyebrow: 04 - Diagrams
accent: blue
---

<!--
  How diagrams stay consistent + the excalidraw skill. Transition: "Or a real process: BPMN."
-->

<v-clicks>

- Colours come from the Miragon palette, the same tokens the SVG layouts use
- Exports are light and transparent, so they sit on any slide
- The headless verify suite rejects a dark or opaque diagram
- Or describe it in words and let the **`excalidraw` skill** draw it for you

</v-clicks>

---
layout: bpmn
title: Or a real BPMN process
eyebrow: 04 - Diagrams
accent: blue
diagram: /resources/04-diagrams/recruitment.bpmn
height: 330px
---

<!--
  bpmn archetype: renders a .bpmn file with token simulation (slidev-addon-bpmn).
  File lives in this chapter's resources/. Transition: "And the decisions inside it: DMN."
-->

A real BPMN file with token simulation, straight from Camunda Modeler or bpmn.io.

---
layout: dmn
title: And the decisions inside it
eyebrow: 04 - Diagrams
accent: blue
diagram: /resources/04-diagrams/hiring.dmn
height: 300px
---

<!--
  dmn archetype: renders a .dmn decision table (slidev-addon-dmn), the sibling of
  the bpmn archetype. BPMN models the process, DMN models the decisions inside it.
  File lives in this chapter's resources/. Transition: "Now: how do you write all this?"
-->

A DMN decision table, the business rules behind a process step, from any DMN modeler.
