---
id: s-821bed1a
layout: section
index: "05"
eyebrow: Chapter 05
accent: blue
---

# **Author with Claude**

The rules live in skills, so you (and an AI pair) build on-brand by default.

---
id: s-c407ea89
layout: content
title: Skills carry the rules
eyebrow: 05 - Author with Claude
accent: blue
---

<!--
  CLAUDE.md + the two skills. Transition: "Before the loop, a quick question to the room."
-->

<v-clicks>

- `CLAUDE.md` is loaded every session, so Claude knows the invariants
- The **`slides`** skill: archetypes, components, content rules, verification
- The **`excalidraw`** skill: how to draw and export an on-brand diagram
- Ask in plain language; Claude fills the right archetype for you

</v-clicks>

---
id: s-d6164899
layout: interactive
kicker: Over to you · 1 min
---

<!--
  interactive: hands the room to the audience. Unlike hero, whose question the
  next slides answer, here the audience answers; the kicker carries the timer.
  REQUIRED: h1 (the question or task).
  OPTIONAL: icon (Lucide class, default i-lucide-message-square-text), kicker,
  one <p> subline, ::content:: below the question (a <Chip> row of answers or
  materials, or another component such as a small CardGrid).
  LIMIT: one question, one-line subline, up to eight short chips, Lucide icons only.
  HOW TO USE: put the format and the time in the kicker ("Over to you · 1 min").
  Transition: "So the everyday loop is short."
-->

# Which archetype would open your next talk?

Name one, and say why it fits your audience.

::content::

<Chip icon="i-lucide-presentation">cover</Chip>
<Chip icon="i-lucide-quote">hero</Chip>
<Chip icon="i-lucide-user">person</Chip>
<Chip icon="i-lucide-bookmark">section</Chip>

---
id: s-108c44e5
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
id: s-5b1738c7
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
id: s-0ed37a4c
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
id: s-8a89e308
layout: interactive
icon: i-lucide-pencil-ruler
kicker: Exercise · 10 min
---

<!--
  interactive as an exercise: a task instead of a question, a matching icon,
  the materials as chips.
  REQUIRED: h1 (the question or task).
  OPTIONAL: icon (Lucide class, default i-lucide-message-square-text), kicker,
  one <p> subline, ::content:: below the question (a <Chip> row of answers or
  materials, or another component such as a small CardGrid).
  LIMIT: one task, one-line subline, up to eight short chips, Lucide icons only.
  HOW TO USE: pick an icon that names the activity; the time goes in the kicker.
  Transition: "Then take it home and start your own deck."
-->

# Build a hero slide that asks one question

Work in pairs, then run verify until it is green.

::content::

<Chip icon="i-lucide-users">Pairs</Chip>
<Chip icon="i-lucide-terminal">npm run dev</Chip>
<Chip icon="i-lucide-shield-check">npm run verify</Chip>

---
id: s-fb5da4d0
layout: content
title: Start your own deck
eyebrow: 05 - Author with Claude
accent: blue
---

<!--
  Closing instructions before the deck's closing slide. Transition: end of chapters.
-->

<v-clicks>

- **Scaffold a deck** with `npm create @miragon/slidev-deck`, then `npm install`
- Once per machine: `npx portless service install` for the HTTPS dev URL
- `npm run dev` to preview, edit a chapter, save, watch it reload
- `npm run verify` until every check is green, then `npm run build`
- Push to `main`; CI rebuilds and rechecks. Or open it with **Claude Code**

</v-clicks>
