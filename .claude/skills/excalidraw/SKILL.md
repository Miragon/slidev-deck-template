---
name: excalidraw
description: Generate Miragon-branded Excalidraw diagrams as a single .excalidraw.svg with the scene embedded (the SVG is the editable source — reopen it in excalidraw.com). Node-only, no Python. Every diagram in the deck is an Excalidraw .excalidraw.svg embedded via <Figure src> — there are no coded SVG-diagram components. Colours match packages/toolkit/styles/theme.css (the brand tokens).
metadata: {"version":"1.0.0"}
---

# Miragon Excalidraw Diagrams

Produce **one artifact per diagram: `deck/chapter/<chapter>/resources/<name>.excalidraw.svg`**
(in the chapter's own `resources/` folder), an SVG with the Excalidraw scene embedded in it. The embedded scene is the editable
source — reopen the SVG at [excalidraw.com](https://excalidraw.com) to edit it.
**There is no separate `.excalidraw` JSON in the repo:** the scene JSON is a
scratch file you author, export from, and discard.

SVG (not PNG): vector colours render crisply at any zoom and the fills are
unambiguous. Convention borrowed from the `texting` repo (a single embedded file
is image + source). **Tooling here is Node-only — no Python.** The render+embed
step uses the Node CLI `excalidraw-brute-export-cli` (Firefox via Playwright); the
`-e` flag embeds the scene.

In-repo example: `deck/chapter/04-diagrams/resources/compose-diagram.excalidraw.svg`,
shown on the "Diagrams" chapter (`deck/chapter/04-diagrams/04-diagrams.md`).

## When to use

**Every diagram in the deck is an Excalidraw `.excalidraw.svg`** — there are no
coded SVG-primitive components. Draw boxes-and-arrows, flows, and schematics here.
For a process with token playback use the `bpmn` archetype instead. Never use it
for emoji, decoration, or a layout a `Card`/`SplitView` already covers.

## Brand palette — the only colours

These are the `packages/toolkit/styles/theme.css` tokens. **Do not invent colours.** Each row
is a node role with its fill/stroke, so diagrams stay consistently on-brand.

| Role | `backgroundColor` | `strokeColor` | Label text |
|---|---|---|---|
| **solid** — component, emphasis | `#FFFFFF` (white) | `#335DE5` (blue) | `#335DE5` |
| **accent** — highlighted node | `#F0F4FF` (blue-light) | `#335DE5` (blue) | `#335DE5` |
| **frame** — zone / container | `#F8FAFC` (gray-light) | `#D6E0F8` (blue-warm) | kicker `#64748B` |
| **plain** — sub-node inside a frame | `#FFFFFF` (white) | `#D6E0F8` (blue-warm) | `#335DE5` |
| **dashed** — virtual boundary (`strokeStyle: "dashed"`) | `#FFFFFF` | `#335DE5` (blue) | `#335DE5` |

**Text colours:** title `#000000`, secondary `#334155`, muted `#64748B`, brand
label `#335DE5`. A box label is blue; a free-floating kicker/caption is muted.

**Green is the accent of last resort** — at most one node per diagram, only for the
key success payoff: fill `#E8F5E9`, stroke `#006838`, label `#006838`. No orange,
no other primaries.

**Arrows:** `strokeColor` `#335DE5`, **always `strokeWidth` 2** (never 1.5 or 3);
`endArrowhead: "triangle"` for a directed flow, solid for data flow,
`strokeStyle: "dashed"` for a control/config relationship (not a data path). A
connector with no head at all is a `type: "line"` (not an arrow). Authoring real
`triangle` arrows keeps them editable as arrows when the SVG is reopened in
excalidraw.com.

**Arrowhead — excalidraw's own `triangle`.** Keep the native `triangle` arrowhead:
the arrows stay real, editable excalidraw arrows everywhere (in the committed file,
on the slide, and when reopened in excalidraw.com). Nothing post-processes the
heads — no per-diagram script, no plugin head-swap. (Excalidraw sizes the head from
`strokeWidth`; keep every arrow at `strokeWidth: 2` so heads stay consistent.)

## Style invariants

- `roughness: 0` always. Miragon is a clean brand — never hand-drawn/sketchy.
- **`fontFamily: 2` (Helvetica) on EVERY text** — closest to the brand's Geist. **Never `1` (Virgil, hand-drawn)** — it renders an off-brand sketchy font. `3` (Cascadia) only for code.
- **Box labels — own label, placed by content.** A box's text is the box's own label. If the box has **no other content**, **centre** the label (`textAlign: "center"`, `x` = box.x, `width` = box.width, on the vertical midline). If the box **contains other content** (sub-boxes or further labels), put its label **top-left** as a kicker (inset to clear the corner, per the padding rule). Never crowd a lone centred label against a border.
- **A centred box label must be BOUND to its box** — set the text's `containerId` to the box id and add `{ id, type: "text" }` to the box's `boundElements`. Then in excalidraw.com clicking the box edits the label and the label moves with the box (a free text floating over the box drags off on its own and can't be edited as the box's label). **Keep the text's explicit centred `x`/`y`/`width`/`height`**: the export CLI places bound text at its stored coordinates (it does NOT re-centre), so binding without coordinates collapses the label to the origin. A box binds at most ONE text — bind the main label; a subtitle/kicker stays free. Top-left kickers stay free (excalidraw always centres a bound label, so a corner label cannot be bound).
- **Label padding — clear the corner.** A top-left kicker must not touch or overlap the box border. Inset it from the box's top-left corner so it sits clear of the rounded corner: left inset `≈ cornerRadius + 6` (minimum ~14px for a frame/dashed container, ~10px for a small accent box), and ~6px down from the top edge. Centred titles/subtitles span the box width (so they self-centre) and sit on the vertical midline; never let any label run under the stroke.
- `fillStyle: "solid"`; rounded corners `"roundness": { "type": 3 }` on rectangles (matches the SVG primitives' `rx`).
- Containers that hold nodes use the **frame** row; the zone label is a free-floating muted text at top-left, never bound to the rectangle.

## Scene JSON

Full format, element types, sizing, binding, arrow routing, and the property
catalogue: [`references/schema-reference.md`](references/schema-reference.md). The skeleton:

```json
{ "type": "excalidraw", "version": 2, "source": "excalidraw",
  "elements": [], "appState": { "viewBackgroundColor": "#F9F7F7" } }
```

- Descriptive string `id`s; unique integer `seed` per element (namespaced 100xxx, 200xxx).
- Text inside a shape: set the text's `containerId` to the shape and add it to the shape's `boundElements`. **Always set the text `strokeColor`** or it renders invisible. Centre a label with `verticalAlign: "middle"` + `textAlign: "center"`.
- Arrows bind both ends; shapes list the arrow in `boundElements`. `points` start at `[0,0]`; compute endpoints at the shape borders (bindings do not clip the static export).
- `boundElements`: `null` when empty. `updated`: `1`. Omit `frameId`, `index`, `versionNonce`, `rawText`.

## Workflow (Node-only)

1. **Author** the scene JSON to a scratch path, e.g. `/tmp/<name>.excalidraw` (not committed).
2. **Export** to the single committed artifact with the scene embedded. Set the
   scene's `appState.viewBackgroundColor` to `#F9F7F7` first, then bake it in
   (`-b true`), so the committed file renders **light** in editor previews:
   ```bash
   excalidraw-brute-export-cli \
     -i /tmp/<name>.excalidraw \
     -o deck/chapter/<chapter>/resources/<name>.excalidraw.svg \
     -f svg -s 1 -e true -d false -b true
   ```
   `-f svg` = vector output; `-e true` embeds the scene (so the SVG reopens in
   excalidraw.com); `-d false` forces light mode; `-b true` bakes the `#F9F7F7`
   background. **Always pass `-d false`** — the tool's Firefox profile sometimes
   leaks a persisted dark mode, so don't rely on the defaults. The committed file is
   thus light with native `triangle` arrows — exactly what you want when editing it.
3. **Normalise — automatic at build time, no script.** The chapter-resources plugin
   (`deck/vite.config.ts`) processes every served/built `.excalidraw.svg`: it strips
   a leaked dark-mode `filter` and removes the baked background (so the diagram is
   **transparent** on the slide and blends on the grey slide AND inside white
   `<Card>`s). It leaves the native `triangle` arrowheads alone. So author + export
   with the plain CLI; the plugin handles filter + transparency. The verify suite
   checks the committed file is light (no dark filter, light background) and the
   built output is transparent (see below).

   For a **full-bleed image** (e.g. a person-avatar placeholder that must fill its
   frame edge-to-edge), also crop the ~10px export padding by setting the `<svg>`
   `viewBox`/`width`/`height` to the content (the export wraps elements in
   `translate(10 10)`, so a 400x500 canvas crops to `viewBox="10 10 400 500"`). The
   frame's `border-radius` + `overflow:hidden` then clip the corners.
4. **Verify the render** — view the SVG, fix clips/overlaps/arrows, re-export.
5. **Embed in the slide** via the `<Figure>` component's `src` prop (the chapter
   resource is served at `/resources/<chapter>/<file>`):
   ```md
   <Figure src="resources/<chapter>/<name>.excalidraw.svg" alt="..." caption="..."></Figure>
   ```
   Do NOT use a Markdown image (`![](/resources/...)`) for the asset: Slidev compiles it into a Vite build-time `import` that resolves outside `server.fs.allow` and breaks `npm run build`. `<Figure src>` resolves the path through `import.meta.env.BASE_URL`, so it stays base-aware on the GitHub Pages deploy and never becomes a build-time import. The SVG must exist before building.
6. **To edit later:** reopen `deck/chapter/<chapter>/resources/<name>.excalidraw.svg` at excalidraw.com (the scene is embedded), change it, re-export over the same file.

### One-time setup for the exporter (Node, Firefox)

```bash
npm install -g excalidraw-brute-export-cli
npx playwright install firefox
# macOS one-time patch (Control → Meta in the CLI):
CLI_MAIN=$(npm root -g)/excalidraw-brute-export-cli/src/main.js
sed -i '' 's/keyboard.press("Control+O")/keyboard.press("Meta+O")/' "$CLI_MAIN"
sed -i '' 's/keyboard.press("Control+Shift+E")/keyboard.press("Meta+Shift+E")/' "$CLI_MAIN"
```

> If the export ever comes back dark, excalidraw.com persisted dark mode in the
> Firefox profile. SVG fills are explicit in the file — grep the output for the
> palette hexes to confirm; re-export if a dark fill crept in.

## Verify the render

You cannot judge a diagram from its JSON. After exporting, **inspect the SVG** and
fix it (grep the fills to confirm only palette colours are present):

| Look for | Fix |
|---|---|
| Text clipped / overflowing | Widen the shape (`max(160, charCount * 9)`) |
| Boxes or labels overlapping | Re-space (≥ 40px gap) |
| Arrow cutting through a shape | Move endpoints to the borders, not centres |
| Off-palette colour crept in | Replace with a token from the table above |
| Looks busy / boxed-in | Fewer boxes; free-floating labels + connectors carry hierarchy |

Re-export and repeat until clean. Then run `npm run build` + `npm run verify`.
