# deck — the presentation content

This is the part you edit. The deck consumes the [`@miragon/slidev-toolkit`](../packages/toolkit/) theme by name and fills it with content. The deck itself *is* its documentation: it teaches this repo while demoing every archetype.

> Never author freehand. Load the **`slides` skill** (`.claude/skills/slides/`) first — it is the authoring guide for layouts, components and editorial rules.

## Structure

- **`slides.md`** — the entry. Deck headmatter (theme, addons, SEO), the `cover` slide, one `src:` import per chapter, and the `closing` slide.
- **`chapter/NN-name/`** — one folder per chapter, holding `NN-name.md` (the slides; each opens with a `section` divider) and a **`resources/`** subfolder with that chapter's own assets (images, photos, `.bpmn`, `.dmn`, `.excalidraw.svg`).
- **`public/`** — deck-wide static assets (e.g. `og-image.png`).
- **`vite.config.ts`** — serves each chapter's `resources/` at `/resources/<chapter>/<file>` and pre-bundles the shader for a stable PDF export.

Reference a resource by that served path, e.g. `photo: /resources/01-intro/me.png`.

## Add a chapter

1. Create `chapter/NN-name/NN-name.md` (start it with a `section` slide) plus a `resources/` folder.
2. Add `src: ./chapter/NN-name/NN-name.md` to `slides.md`, in order.

Current chapters: `01-intro`, `02-slidev`, `03-theme`, `04-diagrams`, `05-authoring`.

## What to edit

| Path | Edit? |
|---|---|
| `slides.md` | ✅ cover, chapter imports, closing, deck headmatter |
| `chapter/NN-name/NN-name.md` | ✅ the slides |
| `chapter/NN-name/resources/` | ✅ that chapter's assets |
| `public/` | ✅ deck-wide assets |
| `vite.config.ts` | ⚠️ rarely (resource serving + shader pre-bundle) |

Everything under `packages/toolkit/` is the brand and off-limits without sign-off.

## Run

From the repo root: `npm run dev` (preview), `npm run build` (static `dist/`), `npm run export` (local PDF). See the [root README](../README.md#present-build-export) for the full table.

## Notes

- **PDF download button is off on purpose.** `download: true` is disabled in `slides.md` headmatter because PDF export needs a Chromium that hosted CI (Netlify) lacks, which would fail `npm run build`. Export locally with `npm run export`, or re-enable it if your build environment installs Chromium first.
- **Speaker notes** live in `<!-- … -->` blocks. Press `p` in the dev server for presenter mode. Notes default to English; ask for another language explicitly.
- **BPMN / DMN** addons are registered in the `slides.md` headmatter and shipped in `package.json`. Put the `.bpmn` / `.dmn` file in the chapter's `resources/` and set `diagram: /resources/<chapter>/<file>`.

## Troubleshooting

- **Cover/closing render white.** WebGL2 is unavailable and the `linear-gradient` fallback is blocked too — update or switch browsers.
- **`npm run export` gives an almost-empty PDF.** Vite re-optimized mid-export. Run `npm run build` once (warms the pre-bundle in `vite.config.ts`), then export.
- **Brand colours look wrong.** The tokens live in `../packages/toolkit/styles/theme.css`, loaded unscoped by `index.css`. Don't move or rename either.
