# CLAUDE.md: Miragon Slidev Deck Template

> This file is read automatically by Claude Code on every task.
> It is intentionally short. **The authoring guide is the `slides` skill**, shipped by the auto-installed `miragon-slidev` Claude Code plugin (invoked as `miragon-slidev:slides`); the rendering truth is the code in `packages/toolkit/` (`styles/theme.css`, `layouts/*.vue`, `components/*.vue`).

This repo is a **template** for a single Miragon-branded Slidev presentation. The design system is the **`@miragon/slidev-toolkit`** package in **`packages/toolkit/`**, an npm-workspace package that the deck consumes by name; the deck lives under **`deck/`** and pulls the theme via `theme: '@miragon/slidev-toolkit'`. Fill the deck with content; the theme is fixed.

The entry **`deck/slides.md`** holds only the cover and the closing; the body is split into **one folder per chapter** under **`deck/chapter/NN-name/`**, each holding `NN-name.md` plus a **`resources/`** subfolder with that chapter's own assets (photos, images, `.bpmn`/`.svg`), imported via `src:`. Resources are served at **`/resources/<chapter>/<file>`** by a small Vite plugin in `deck/vite.config.ts`. Run with `npm run dev`; build with `npm run build`.

---

## Required reading (always, before any task)

**Always invoke the `slides` skill (`miragon-slidev:slides`) before creating or editing any slide.** Editing the deck is never freehand: load the skill first and follow it for every layout, component, and editorial decision.

1. **The `slides` skill** (the `miragon-slidev` plugin; `miragon-slidev:slides`). The authoring guide for everything visual and editorial: repo structure and workflow, the 15 layout archetypes (`cover`, `hero`, `person`, `section`, `subsection`, `content`, `content-image`, `compare`, `goodbad`, `bpmn`, `dmn`, `mermaid`, `excalidraw`, `showcase`, `closing`), the reusable components (`Card`, `CardGrid`, `StepList`, `Figure`, `DiagramFrame`, `SplitView`, `CodeBlock`, `Agenda`), the white-card rule, content rules (one consistent deck language, no em-dashes, no emoji, focal point, hero = active question), scenario discipline, overflow, and verification. Full prop tables are under its `reference/`.
2. **`deck/`**, the reference implementation. Every archetype has a demo slide with a comment block listing `REQUIRED` / `OPTIONAL` / `LIMIT` / `HOW TO USE`. Open the relevant `deck/chapter/<chapter>/<chapter>.md` alongside the skill when in doubt.
3. **The `miragon-brand` skills**, whenever a task touches brand substance rather than deck mechanics:
   - `miragon-brand:corporate-design` for anything visual (colour, logo, typography, icons, imagery). Its `assets/tokens.json` is the machine-readable source of truth for the palette; `assets/design-manual.md` is the prose behind it.
   - `miragon-brand:brand-tone` for wording, claims, and tonality.
   - `miragon-brand:brand-review` for the rule catalogue (A text / B visual / C code) and a PASS/FAIL check before finishing.

Do not duplicate rules across files (this one, the skill, project memory). Brand values come from `tokens.json`, the rendering truth lives in `packages/toolkit/`, and the `slides` skill covers everything else.

---

## Sacred invariants (DO NOT change without brand sign-off)

- **BrandMeshBackground animation** (`packages/toolkit/components/BrandMeshBackground.vue`): colour stops `#335DE5, #1A1A4E, #00E676, #335DE5, #0D0D2B, #00C853`; DISTORTION 1, SWIRL 0.5, SPEED 0.6. Corporate identity. The three off-palette stops (`#1A1A4E`, `#0D0D2B`, `#00C853`) are `gradient.mesh-hero` from `tokens.json` and belong to this shader only, never to a slide, a card, or a diagram.
- **Brand colours come from `tokens.json`** in the `miragon-brand` plugin's `corporate-design` skill (`skills/corporate-design/assets/tokens.json`). `packages/toolkit/styles/theme.css` only **mirrors** them as CSS variables; if the two ever disagree, `tokens.json` wins and `theme.css` is the bug. The whole sanctioned palette:
  - `#335DE5` blue (primary, leads) · `#00E676` green (accent: surface and graphics only, **never text on white**, 1.67:1) · `#F9F7F7` grey · `#1D1D1D` black (CI black, **never** `#000000`) · `#FFFFFF` white
  - derived: `#2B50D4` link blue (6.56:1 on white, for accent text and links) · `#6B8AFF` light blue (on dark grounds)
  - status colours `#0B7A55` success, `#92610A` warning, `#C92A2A` danger, strictly for states, never as a design colour
  - No orange, no teal, no other primaries. Need a tone the palette lacks? Derive it with `color-mix()` from a brand token in `theme.css`, never by inventing a hex.
- **The logo files** in `packages/toolkit/assets/` are the **unaltered official vectors**: `logo.svg` (green wordmark, `miragon-logo-gruen.svg`), `logo-white.svg` (`miragon-logo-weiss.svg`), `logo-blue.svg` (`miragon-logo-blau.svg`), `komet.svg` (the key visual, `miragon-komet-gruen.svg`). Do not recolour, redraw, rotate, stretch, or apply effects (no shadow, no outline, no glow, and no `opacity`). Pick the variant by ground: light ground → green or blue, dark/coloured ground or photo → white, monochrome → black. Clearspace all round is the height of the "M"; minimum size is 96px for the wordmark, 24px for the komet. `cover` and `closing` use `logo-white.svg` because they sit on the mesh background.
- **Geist** as the font family (headings and body), **Geist Mono** for code and tables. Bundled as OFL variable fonts in `packages/toolkit/assets/fonts/`, wired up in `packages/toolkit/styles/fonts.css` + `theme.css` (`--miragon-font`, `--miragon-font-mono`). Fallback `Inter, Helvetica Neue, Arial, sans-serif`.
- **Icons are Lucide** ([lucide.dev](https://lucide.dev)), outline style on the 24px grid, written as an Iconify class `i-lucide-*`. One set for the whole deck: never mix in a second icon family.

---

## The non-negotiables in one screen

If you do nothing else, respect these:

- **One language per deck, applied consistently.** Pick the deck's language (English by default; German or another language is a valid choice) and keep all slide content in it, with no mixing per slide. Code, brand names, and standard technical terms stay as-is regardless. Speaker notes (`<!-- … -->`) may be in another language if requested.
- **Cards are always white.** Use the `<Card>` component (inside `<CardGrid>` for a row). Accent goes on the **title text only**, and the only sanctioned stops are `accent="blue"` (`#335DE5`) and `accent="blue-mid"` (`#2B50D4`), handled by the component. Green is **not** a card-title colour: a card title is text on white, where `#00E676` sits at 1.67:1 and fails WCAG AA. `teal`, `green-deep`, `green-mid` and `green` are deprecated aliases that still render as `blue-mid`; do not write them in new slides. Never a gradient/colored background, never a colored left-border. The `compare` layout is the one place a panel carries semantic colour, and even there the panel stays white: the layout tints only its marker bar and title, and only when `accent: mixed`.
- **Headings BLACK (`#1D1D1D`, the CI black), never blue and never `#000000`.** Blue is reserved for kickers/eyebrows, accents, small labels.
- **Heroes pose an active question** the following slides answer (`layout: hero`, `# …**bold**?`). Several per deck is fine.
- **No em-dashes** (`—`) as punctuation: use a comma, a colon, a full stop, or parentheses. Compound hyphens (Open-Source, BPMN-Training) are fine. **No emoji icons**: use inline SVG or a **Lucide** Iconify class (`i-lucide-*`), outline, 24px grid, never mixed with another icon set.
- **Bullets are plain `<ul><li>`.** The layouts (`content`, `compare`, etc.) provide the markers. Never override list styling per slide.
- **No raw HTML/CSS/hex in the markdown.** A slide is frontmatter + headings + bullets + component tags. Reach for `Card`/`CardGrid`/`StepList`/`Figure`/`SplitView`/`CodeBlock` instead of `<div class="…">`. **Excalidraw `.excalidraw.svg` is the default diagram**, embedded via `<Figure src>` (see the `excalidraw` skill); there are no coded SVG-diagram components. Use a native Slidev ` ```mermaid ` fence when the diagram is a standard graph type that reads as text and wants auto-layout (a flow, a sequence, a state machine); it is brand-styled globally by `packages/toolkit/setup/mermaid.ts` (the brand hex lives there, never in the slide), and the source can be inline or imported from a `.mermaid` file with `<<< @/…`. Excalidraw stays the default: use it when placement carries meaning (architecture sketches, deliberately arranged boxes), which is most deck diagrams. The `slides` skill has the full when-to-use-which.
- **The one sanctioned escape hatch: `class` / `style` on a component nudges its root spacing/layout, nothing else.** Every component forwards `class` and `style` to its own root (native Vue single-root fall-through), so `<Card class="mt-8">` or `<Card style="margin-top: 2rem">` adjusts the gap above a card without touching the theme. Use it sparingly and only for spacing/layout, and stay on the 8-point scale (4/8/16/24/32/48/64/96 px): `mt-*`, `mb-*`, `w-*`, `self-*`, `justify-self-*`, an arbitrary `mt-[24px]` where a utility step does not exist. Never to override brand: no colours, fonts, card backgrounds, borders, or bullet markers this way. See the `slides` skill (`reference/components.md`, "Spacing / custom classes").
- **Components on a single line** in `.md`; **explicit closing tags** (`<Component></Component>`, never self-closing). **Exception:** a body containing inline Markdown (`` `code` ``, `**bold**`, links) must be wrapped in blank lines, or Slidev treats it as raw HTML and the Markdown never renders (backticks show literally). See the `slides` skill (`reference/components.md`, "Markdown inside a component body").
- **Never reduce font size to fit content.** Reduce content, split slides, or use `<v-clicks>`.
- **Keep content clear of the global chrome.** The template paints a page/chapter display bottom-left and a progress bar on top of every content slide; author content must not overlap or crowd them. The verify suite reserves a toolkit-owned safe area (`packages/toolkit/global/safe-areas.json`) around each and flags collisions. Deliberate exceptions are per-slide, justified, and never silent (`safeAreaExceptions` in frontmatter). See the `slides` skill.
- **`deck/slides.md`** is the entry; each chapter is a folder `deck/chapter/NN-name/` with `NN-name.md` + a `resources/` subfolder, imported via `src:`. Every chapter begins with a `section` archetype slide.
- **Vary `leftIsGood` across `goodbad` slides** so "Recommended" doesn't always land on the same side.
- **The `bpmn` archetype requires `slidev-addon-bpmn`**, already in `package.json` and registered in `deck/slides.md` frontmatter. Put `.bpmn` files in the chapter's `resources/` folder and set `diagram: /resources/<chapter>/<file>`.
- **The `dmn` archetype requires `slidev-addon-dmn`** (the sibling of `bpmn`: a decision table instead of a process), already in `package.json` and registered in `deck/slides.md` frontmatter. Put `.dmn` files in the chapter's `resources/` folder and set `diagram: /resources/<chapter>/<file>`.

Everything above is expanded in the `slides` skill.

---

## Pre-flight checklist (before finishing a slide)

- [ ] One language per deck, applied consistently (no per-slide mixing); code, brand names, and technical terms stay as-is
- [ ] No hardcoded hex / raw HTML / utility classes in the markdown (use the components; the sanctioned hex lives in `packages/toolkit/styles/theme.css`, mirroring `tokens.json`, and `Card.vue` only references those tokens). The one exception: a `class`/`style` on a component for **spacing/layout only**, on the 8-point scale (e.g. `<Card class="mt-8">`), never to override brand colours, fonts, or card styling
- [ ] Cards: white, accent on title text only (`blue` or `blue-mid`, never green or teal), no colored background or left-border
- [ ] Headings black `#1D1D1D` (never `#000000`); blue only for kickers/accents/small labels
- [ ] One focal point per slide; green at most once, as a surface or graphic accent, never as text on white
- [ ] Plain `<ul><li>` bullets; no list overrides
- [ ] No em-dashes; no emoji icons; icons are Lucide (`i-lucide-*`) only
- [ ] Images: content-carrying visuals have a descriptive `alt`/`imageAlt`; purely decorative ones get an explicit empty `alt=""`
- [ ] Frontmatter respects the archetype's prop signature (see the `slides` skill, `reference/archetypes.md`)
- [ ] Speaker notes ending with a `Transition: "…"` line where appropriate
- [ ] Visual/CSS change? Eyeball the rendered slide first: `node scripts/shot.mjs <page>` (build and source checks cannot see colours/backgrounds)
- [ ] Build clean: `npm run build`
- [ ] Verify green: `npm run verify:ci`, and confirm the printed deck title is this deck. Do not finish on red.

For anything not covered here, consult the `slides` skill.

---

## How colleagues create a new deck

1. **Scaffold a fresh deck**: `npm create @miragon/slidev-deck@latest my-talk`.
2. `cd my-talk && npm install`.
3. `npm run dev` to preview.
4. Open the new repo with Claude Code. CLAUDE.md is auto-loaded; Claude uses the `slides` skill and the demo slides under `deck/` and is ready to author slides in the Miragon style.
5. Prompt examples (paste into Claude):
   - *"Build a hero slide that asks `What if every meeting was a process?`"*
   - *"Add a three-card grid for the three habits of effective retros."*
   - *"Turn this paragraph into a `goodbad` slide with Model A as the avoid side."*
