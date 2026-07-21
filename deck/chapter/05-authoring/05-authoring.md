---
layout: section
index: "05"
eyebrow: Chapter 05
accent: blue
---

# **Author with Claude**

The rules live in skills, so you (and an AI pair) build on-brand by default.

---
layout: content
title: Skills carry the rules
eyebrow: 05 - Author with Claude
accent: blue
---

<!--
  CLAUDE.md + the two skills. Transition: "So the everyday loop is short."
-->

<v-clicks>

- `CLAUDE.md` is loaded every session, so Claude knows the invariants
- The **`slides`** skill: archetypes, components, content rules, verification
- The **`excalidraw`** skill: how to draw and export an on-brand diagram
- Ask in plain language; Claude fills the right archetype for you

</v-clicks>

---
layout: content
title: The everyday loop
eyebrow: 05 - Author with Claude
accent: blue
---

<!--
  StepList: the edit → verify loop. Transition: "Verify is what makes it safe."
-->

<StepList>
<Step label="Add a chapter">create deck/chapter/NN-name/NN-name.md and a src line in slides.md.</Step>
<Step label="Pick an archetype">copy the closest demo slide, swap in your content.</Step>
<Step label="Verify">run npm run verify (headless) and read each slide's checklist.</Step>
<Step label="Ship">green means on-brand and within the canvas; build or present.</Step>
</StepList>

---
layout: content
title: Verify keeps it honest
eyebrow: 05 - Author with Claude
accent: blue
---

<!--
  Surface the verify suite explicitly. Runs headless, fails the build on a violation.
  Transition: "One rule, made concrete."
-->

<v-clicks>

- Walks every slide **headless** and screenshots it with a checklist
- Flags overflow, blue headings, coloured cards, em-dashes, emoji
- Rejects HTML entities in the source and non-transparent diagrams
- Run it on every edit; a red check is unfinished work

</v-clicks>

---
layout: goodbad
title: On-brand or not
eyebrow: 05 - Author with Claude
prompt: Both render fine. Which heading follows the Miragon rules?
leftIsGood: false
accent: blue
---

<!--
  goodbad: neutral panels, verdict + legend on one click. leftIsGood:false → A is "Avoid".
  Transition: "That is the whole loop, go build."
-->

::left::

```md
<span style="color:#335DE5">
# Our results
</span>
```

A blue heading. Blue is reserved for kickers and accents, never headings.

::right::

```md
# Our results
```

A black heading, as the layout sets it. Let the theme own the colour.

::legend::

Headings are **black**; the verify suite flags a blue one.

---
layout: content
title: Start your own deck
eyebrow: 05 - Author with Claude
accent: blue
---

<!--
  Closing instructions before the deck's closing slide. Transition: end of chapters.
-->

<v-clicks>

- **Use this template** on GitHub, then `npm install`
- `npm run dev` to preview, edit a chapter, save, watch it reload
- `npm run verify` until every check is green, then `npm run build`
- Push to `main` and GitHub Pages deploys it; or open it with **Claude Code**

</v-clicks>
