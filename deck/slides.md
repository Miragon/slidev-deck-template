---
title: Miragon Slidev Deck Template
theme: '@miragon/slidev-toolkit'
colorSchema: light
highlighter: shiki
transition: slide-up
# Optional: show a date in the footer's left segment (global-bottom.vue).
# Uncomment and set an ISO date; leave commented to hide the date segment.
# eventDate: 2026-07-21
# NOTE: PDF export (download: true) is intentionally disabled. It requires a
# Playwright/Chromium browser, which is not available on hosted CI builders
# (e.g. Netlify) and fails `npm run build` there. Export the PDF locally with
# `npm run export` instead. See README → "Presenting and exporting".
addons:
  - slidev-addon-bpmn
  - slidev-addon-dmn
layout: cover
eyebrow: Miragon · Onboarding
# Social/link preview (og:image). Needs an absolute URL, so it points at the
# Netlify production site. The image is served from deck/public/og-image.png.
seoMeta:
  ogTitle: Miragon Slidev Deck Template
  ogDescription: A branded Slidev template. Build decks like code.
  ogImage: https://slidev-template.netlify.app/og-image.png
  ogUrl: https://slidev-template.netlify.app
  twitterCard: summary_large_image
  twitterImage: https://slidev-template.netlify.app/og-image.png
---

<!--
  This deck is its own documentation: it teaches you how to use this repository.
  Entry file = cover + chapter imports + closing. Each chapter is a folder under
  deck/chapter/<name>/ with <name>.md and a resources/ subfolder.
  Speaker notes: open the deck with `npm run dev` and press `p` for presenter mode.
-->

# Build decks like **code**

A branded Slidev template

---
layout: default
title: Agenda
class: agenda-slide
---

<Agenda eyebrow="Chapter overview" title="Agenda" accent="mixed"></Agenda>

<!--
  The red thread of the talk at a glance: the deck's chapters as a clickable
  stepper, each chapter's slides shown as live miniature previews. Chapters are
  discovered automatically from every `layout: section` slide, so this stays in
  sync with the deck. Click a chapter to preview it, click a mini to jump there.
  Transition: "Here is the path we will take."
-->

---
src: ./chapter/01-intro/01-intro.md
---

---
src: ./chapter/02-slidev/02-slidev.md
---

---
src: ./chapter/03-theme/03-theme.md
---

---
src: ./chapter/04-diagrams/04-diagrams.md
---

---
src: ./chapter/05-authoring/05-authoring.md
---

---
src: ./chapter/06-components/06-components.md
---

---
layout: closing
eyebrow: Your turn
contact: hello@miragon.io
---

<!--
  Closing mirrors the cover (animated Mesh). h1 = the call to action.
  Transition: end here.
-->

# Now build **your** deck.

Use this template, edit a chapter, run `npm run verify`, ship.
