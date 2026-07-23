# @miragon/slidev-toolkit

The Miragon-branded [Slidev](https://sli.dev) design system: a fixed brand theme, twelve layout archetypes, reusable components (`Card`, `CardGrid`, `StepList`, `Figure`, `SplitView`, `Agenda`), the animated `BrandMeshBackground`, and always-on progress chrome (a stepper bar and a chapter footer). One source of design truth, so a Miragon deck stays on-brand without hand-written HTML or CSS.

> Building a **new** deck? The easiest path is the [template repository](https://github.com/Miragon/slidev-deck-template) ("Use this template") — it ships this toolkit together with a demo deck, authoring guidance, and CI. Use the npm package below when you want the brand in an **existing** or standalone Slidev project.

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
- **The components**, auto-imported (use them by tag, no import): `Card`, `CardGrid`, `StepList` / `Step`, `Figure`, `SplitView`, `Agenda`, `BrandMeshBackground`.
- **The global chrome** — a thin progress bar on top and a chapter/position footer at the bottom, on every content slide.

## Layouts

Set `layout:` per slide to one of the twelve archetypes:

| Group | Layouts |
|---|---|
| Openers | `cover`, `hero`, `person`, `section` |
| Content | `content`, `content-image` |
| Decisions | `compare`, `goodbad` |
| Process and rules | `bpmn`, `dmn` |
| Explore and close | `showcase`, `closing` |

`cover` and `closing` run the animated `BrandMeshBackground`; the rest are the calm static world on light grey.

### BPMN and DMN need an addon

The `bpmn` and `dmn` layouts render real diagrams via community addons, which are **not** dependencies of this toolkit. Add whichever you use to your deck:

```bash
npm i slidev-addon-bpmn slidev-addon-dmn
```

```yaml
---
theme: '@miragon/slidev-toolkit'
addons:
  - slidev-addon-bpmn   # for layout: bpmn
  - slidev-addon-dmn    # for layout: dmn
---
```

Then reference the file: `diagram: /resources/<path>/<file>.bpmn` (or `.dmn`).

## Assets and diagrams

This package ships the design system only, not an asset pipeline. Serve your own images, `.bpmn` / `.dmn` files and `.excalidraw.svg` diagrams from Slidev's `public/` folder (or your own Vite setup) and reference them by URL path.

## Editorial conventions

The brand is intentionally fixed: headings are black (blue is for kickers and accents), cards are always white with the accent on the title only, no em-dashes, no emoji. The full authoring guide, demo slides, and a design-system verify suite live in the [template repository](https://github.com/Miragon/slidev-deck-template), not in this package.

## License

MIT. The bundled Geist fonts are OFL (see `assets/fonts/LICENSE.txt`).
