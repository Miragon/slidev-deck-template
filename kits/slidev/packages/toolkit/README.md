# @miragon/slidev-toolkit

The Miragon-branded [Slidev](https://sli.dev) design system: a fixed brand theme, twelve layout archetypes, reusable components (`Card`, `CardGrid`, `StepList`, `Figure`, `SplitView`, `Agenda`), the animated `BrandMeshBackground`, and always-on progress chrome (a stepper bar and a chapter footer). One source of design truth, so a Miragon deck stays on-brand without hand-written HTML or CSS.

> Building a **new** deck? The easiest path is `npm create @miragon/slidev-deck@latest my-talk` (see the [Slidev kit](https://github.com/Miragon/brand-toolbox/tree/main/kits/slidev)) — it scaffolds this toolkit together with a demo deck, authoring guidance, and CI. Use the npm package below when you want the brand in an **existing** or standalone Slidev project.

## Install

```bash
npm i @miragon/slidev-toolkit
```

Peers: Slidev `>= 0.48.0` and Vue 3.5.

## Use

Point your deck at the theme in the headmatter of `slides.md`:

```yaml
---
theme: '@miragon/slidev-toolkit'
---
```

That is all the wiring needed. You now get, automatically:

- **Brand tokens and fonts** — the Miragon colours (primary blue `#335DE5`, sparing green) and the bundled Geist / Geist Mono variable fonts.
- **The components**, auto-imported (use them by tag, no import): `Card`, `CardGrid`, `StepList` / `Step`, `Figure`, `SplitView`, `Chip`, `QuizTime`, `Agenda`, `BrandMeshBackground`.
- **The global chrome** — a thin progress bar on top and a chapter/position footer at the bottom, on every content slide.

## Layouts

Set `layout:` per slide to one of the 17 archetypes:

| Layout | What it's for | Limit |
|---|---|---|
| `cover` | Animated title slide | 1 statement |
| `hero` | One big statement, ideally a question the next slides answer | 1 idea, no bullets |
| `interactive` | Hands the room to the audience: a plenum question or an exercise, with optional answer chips | 1 question, ≤ 8 chips |
| `person` | Introduce one or two speakers (solo / duo) | bio ≤ 3 lines |
| `section` | Chapter divider with ghost index; opens a chapter in the Agenda | terse subtitle |
| `subsection` | Divides a chapter internally; skipped by the Agenda rail | terse subtitle |
| `content` | Workhorse: bullets, prose, or a card grid | ≤ 5 bullets, 1 level |
| `content-image` | Two columns: image on one side, prose/bullets on the other | ≤ 4 bullets, 1 visual |
| `compare` | Side-by-side white panels; with `accent: mixed` the title colour and marker bar carry the distinction | ≤ 4 bullets per panel |
| `goodbad` | "Which one is right, and why?": neutral panels + one-click reveal | keep panels short |
| `bpmn` | A BPMN file with token simulation (needs `slidev-addon-diagram-js`) | 1 diagram, short caption |
| `dmn` | A DMN decision table (needs `slidev-addon-diagram-js`) | 1 table |
| `mermaid` | A Mermaid fence framed as the slide's focal point | 1 diagram, short caption |
| `excalidraw` | An `.excalidraw.svg` framed as the slide's focal point | 1 diagram, short caption |
| `window` | One framed window as the slide's focal point; code fences and diagrams become tabs, each with its own caption | 2–4 tabs, ≤ 18 lines each |
| `showcase` | Interactive feature explorer: clickable cards + detail panel | 3–4 items |
| `closing` | Animated closing slide | 1 CTA |

The built-in `default` layout is the one sanctioned non-archetype, for a full-bleed component slide such as the `Agenda`.

`cover` and `closing` run the animated `BrandMeshBackground`; the rest are the calm static world on light grey.

### BPMN and DMN need an addon

The `bpmn` and `dmn` layouts render real diagrams via the `slidev-addon-diagram-js` community addon, which is **not** a dependency of this toolkit. Add it to your deck:

```bash
npm i slidev-addon-diagram-js
```

```yaml
---
theme: '@miragon/slidev-toolkit'
addons:
  - slidev-addon-diagram-js   # for layout: bpmn and layout: dmn
---
```

Then reference the file: `diagram: /resources/<path>/<file>.bpmn` (or `.dmn`).

The same addon also renders Team Topologies (`.tt`), Wardley Maps (`.owm`) and Event Storming boards (`.storm`). They have no layout of their own: put `<TeamTopologies>`, `<WardleyMap>` or `<EventStorming>` (or the matching `…Modeler`) inside a `<DiagramFrame>` on a `content` slide.

## Components

A slide is frontmatter, headings, bullets and component tags, never raw `<div>`, CSS or hex. Full props are in the `slides` skill of the `miragon-slidev` plugin (`reference/components.md`).

| Component | What it's for |
|---|---|
| `Card` | The canonical white card; accent on the title only |
| `CardGrid` | Column wrapper for a row of `Card`s |
| `StepList` / `Step` | A compact labelled sequence beside a diagram |
| `Figure` | A titled, captioned wrapper around a visual (incl. `.excalidraw.svg`) |
| `DiagramFrame` | The diagram layouts' white card, exposed to frame part of a slide |
| `SplitView` | Two columns: a visual and an explanation |
| `CodeBlock` | A code fence with a filename and a language badge |
| `Agenda` | The chapter stepper with live slide previews (`layout: default`) |
| `BrandMeshBackground` | The animated cover/closing shader (brand-locked) |

Tables need no component: a plain Markdown table is styled on-brand automatically.

## Assets and diagrams

This package ships the design system only, not an asset pipeline. Serve your own images, `.bpmn` / `.dmn` files and `.excalidraw.svg` diagrams from Slidev's `public/` folder (or your own Vite setup) and reference them by URL path.

## Editorial conventions

The brand is intentionally fixed: headings are black (blue is for kickers and accents), cards are always white with the accent on the title only, no em-dashes, no emoji. The full authoring guide, demo slides, and a design-system verify suite live in the [Slidev kit](https://github.com/Miragon/brand-toolbox/tree/main/kits/slidev), not in this package.

## License

MIT. The bundled Geist fonts are OFL (see `assets/fonts/LICENSE.txt`).
