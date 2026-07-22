# CLAUDE.md — Miragon Slidev Deck Template

> This file is read automatically by Claude Code on every task.
> It is intentionally short. **The authoring guide is the `slides` skill** (`.claude/skills/slides/`); the rendering truth is the code in `packages/toolkit/` (`styles/theme.css`, `layouts/*.vue`, `components/*.vue`).

This repo is a **template** for a single Miragon-branded Slidev presentation. The design system is the **`@miragon/slidev-toolkit`** package in **`packages/toolkit/`**, an npm-workspace package that the deck consumes by name; the deck lives under **`deck/`** and pulls the theme via `theme: '@miragon/slidev-toolkit'`. Fill the deck with content; the theme is fixed.

The entry **`deck/slides.md`** holds only the cover and the closing; the body is split into **one folder per chapter** under **`deck/chapter/NN-name/`**, each holding `NN-name.md` plus a **`resources/`** subfolder with that chapter's own assets (photos, images, `.bpmn`/`.svg`), imported via `src:`. Resources are served at **`/resources/<chapter>/<file>`** by a small Vite plugin in `deck/vite.config.ts`. Run with `npm run dev`; build with `npm run build`.

---

## Required reading (always, before any task)

**Always invoke the `slides` skill before creating or editing any slide.** Editing the deck is never freehand: load the skill first and follow it for every layout, component, and editorial decision.

1. **The `slides` skill** (`.claude/skills/slides/SKILL.md`) — the authoring guide for everything visual and editorial: repo structure and workflow, the 12 layout archetypes (`cover`, `hero`, `person`, `section`, `content`, `content-image`, `compare`, `goodbad`, `bpmn`, `dmn`, `showcase`, `closing`), the reusable components (`Card`, `CardGrid`, `StepList`, `Figure`, `SplitView`), the white-card rule, content rules (English, no em-dashes, no emoji, focal point, hero = active question), scenario discipline, overflow, and verification. Full prop tables are under its `reference/`.
2. **`deck/`** — the reference implementation. Every archetype has a demo slide with a comment block listing `REQUIRED` / `OPTIONAL` / `LIMIT` / `HOW TO USE`. Open the relevant `deck/chapter/<chapter>/<chapter>.md` alongside the skill when in doubt.

Do not duplicate rules across files (this one, the skill, project memory). The rendering truth lives in `packages/toolkit/`; point at the `slides` skill for everything else.

---

## Sacred invariants (DO NOT change without brand sign-off)

- **BrandMeshBackground animation** (`packages/toolkit/components/BrandMeshBackground.vue`): colour stops `#335DE5, #1a1a4e, #00E676, #335DE5, #0d0d2b, #00C853`; DISTORTION 1, SWIRL 0.5, SPEED 0.6. Corporate identity.
- **Brand colours** in `packages/toolkit/styles/theme.css`. Primary blue `#335DE5`, sparing green `#00E676`. No orange, no other primaries.
- **Geist** as the font family (headings and body), **Geist Mono** for code and tables. Bundled as OFL variable fonts in `packages/toolkit/assets/fonts/`, wired up in `packages/toolkit/styles/fonts.css` + `theme.css` (`--miragon-font`, `--miragon-font-mono`). Fallback `Inter, Helvetica Neue, Arial, sans-serif`.

---

## The non-negotiables in one screen

If you do nothing else, respect these:

- **English only** on slide content. Speaker notes (`<!-- … -->`) may be in another language if requested.
- **Cards are always white** — use the `<Card>` component (inside `<CardGrid>` for a row). Accent goes on the **title text only** (blue → teal → green progression, handled by the component). Never a gradient/colored background, never a colored left-border. The only exception is the `compare` layout's left/right panels, which are semantically coloured by the layout itself.
- **Headings BLACK, never blue.** Blue is reserved for kickers/eyebrows, accents, small labels.
- **Heroes pose an active question** the following slides answer (`layout: hero`, `# …**bold**?`). Several per deck is fine.
- **No em-dashes** (`—`). **No emoji icons** — use inline SVG or Iconify icon classes.
- **Bullets are plain `<ul><li>`** — the layouts (`content`, `compare`, etc.) provide the markers. Never override list styling per slide.
- **No raw HTML/CSS/hex in the markdown.** A slide is frontmatter + headings + bullets + component tags. Reach for `Card`/`CardGrid`/`StepList`/`Figure`/`SplitView` instead of `<div class="…">`. **Diagrams are always Excalidraw `.excalidraw.svg`**, embedded via `<Figure src>` (see the `excalidraw` skill); there are no coded SVG-diagram components.
- **Components on a single line** in `.md`; **explicit closing tags** (`<Component></Component>`, never self-closing).
- **Never reduce font size to fit content.** Reduce content, split slides, or use `<v-clicks>`.
- **`deck/slides.md`** is the entry; each chapter is a folder `deck/chapter/NN-name/` with `NN-name.md` + a `resources/` subfolder, imported via `src:`. Every chapter begins with a `section` archetype slide.
- **Vary `leftIsGood` across `goodbad` slides** so "Recommended" doesn't always land on the same side.
- **The `bpmn` archetype requires `slidev-addon-bpmn`** — already in `package.json` and registered in `deck/slides.md` frontmatter. Put `.bpmn` files in the chapter's `resources/` folder and set `diagram: /resources/<chapter>/<file>`.
- **The `dmn` archetype requires `slidev-addon-dmn`** (the sibling of `bpmn`: a decision table instead of a process) — already in `package.json` and registered in `deck/slides.md` frontmatter. Put `.dmn` files in the chapter's `resources/` folder and set `diagram: /resources/<chapter>/<file>`.

Everything above is expanded in the `slides` skill.

---

## Pre-flight checklist (before finishing a slide)

- [ ] English only on slide content
- [ ] No hardcoded hex / raw HTML / utility classes in the markdown (use the components; the sanctioned hex lives inside `Card.vue`)
- [ ] Cards: white, accent on title text only, no colored background or left-border
- [ ] Headings black; blue only for kickers/accents/small labels
- [ ] One focal point per slide; at most one green accent word
- [ ] Plain `<ul><li>` bullets; no list overrides
- [ ] No em-dashes; no emoji icons
- [ ] Frontmatter respects the archetype's prop signature (see the `slides` skill, `reference/archetypes.md`)
- [ ] Speaker notes ending with a `Transition: "…"` line where appropriate
- [ ] Build clean: `npm run build`
- [ ] Verify suite green: `npm run verify`. Do not finish on red.

For anything not covered here, consult the `slides` skill.

---

## How colleagues create a new deck

1. **Use this template** (GitHub "Use this template" button) → fresh repo.
2. `npm install`.
3. `npm run dev` to preview.
4. Open the new repo with Claude Code. CLAUDE.md is auto-loaded; Claude uses the `slides` skill and the demo slides under `deck/` and is ready to author slides in the Miragon style.
5. Prompt examples (paste into Claude):
   - *"Build a hero slide that asks `What if every meeting was a process?`"*
   - *"Add a three-card grid for the three habits of effective retros."*
   - *"Turn this paragraph into a `goodbad` slide with Model A as the avoid side."*
