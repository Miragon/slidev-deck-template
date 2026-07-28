---
name: excalidraw
description: Author AND repair Miragon-branded Excalidraw diagrams as a single .excalidraw.svg with the scene embedded (the SVG is the editable source — reopen it in excalidraw.com). Node-only, no Python. Every diagram in the deck is an Excalidraw .excalidraw.svg embedded via <Figure src> — there are no coded SVG-diagram components. Colours match packages/toolkit/styles/theme.css (the brand tokens). The one rule that makes a diagram correct is containment binding: every label lives inside the element it belongs to (containerId + bidirectional boundElements), never floating text or manual groups.
allowed-tools: Bash, Read, Edit, Write, Grep, Glob
metadata: {"version":"1.2.0"}
---

# Skill: excalidraw

Author **one artifact per diagram: `deck/chapter/<chapter>/resources/<name>.excalidraw.svg`**
(in the chapter's own `resources/` folder) — an SVG with the Excalidraw scene embedded in it.
The embedded scene is the editable source: reopen the SVG at [excalidraw.com](https://excalidraw.com),
edit, re-export over the same file. **There is no separate `.excalidraw` JSON in the repo** — the
scene JSON is a scratch file you author, export from, and discard. SVG (not PNG) so colours render
crisply at any zoom and fills are unambiguous. **Tooling is Node-only, no Python**: the render+embed
step is the Node CLI `excalidraw-brute-export-cli` (Firefox via Playwright), whose `-e` flag embeds
the scene.

Use this whenever a deck slide needs a boxes-and-arrows figure, flow, or schematic — **every diagram
in the deck is one of these** (there are no coded SVG-primitive components). The finished `.excalidraw.svg`
is embedded through the **`slides`** skill's `<Figure src>`. For a process with token playback reach for
the `bpmn` archetype instead, for a decision table the `dmn` archetype, and for a standard text-generated
flow brand-styled Mermaid. Never use Excalidraw for emoji, decoration, or a layout a `Card`/`SplitView`
already covers. In-repo example: `deck/chapter/04-diagrams/resources/compose-diagram.excalidraw.svg`,
shown on `deck/chapter/04-diagrams/04-diagrams.md`.

The flow is four phases — **author → export → embed → verify** — over the rules below. Get the rules
right first; they are what make a diagram *correct* rather than merely good-looking.

## The one rule: bind labels, never group

A diagram can **look perfect and be broken.** Generated scenes float every label *over* its box, so
editing falls apart: drag the box in excalidraw.com and the label stays behind; the label can't be
clicked to edit as the box's label. The render hides this; the scene shows it. The fix — how the
Excalidraw UI itself builds a diagram — is **containment binding**:

> A label belongs to exactly one element. Set the text's `containerId` to that element's id, and list
> the text in the element's `boundElements` as `{ "type": "text", "id": … }`. The link is
> **BIDIRECTIONAL.** Then the label moves with the element, is centred by it, and is edited by clicking
> it. `groupIds` stays `[]` — **never manually group a label to its box.**

Everything else follows from this. If you remember one thing: bind labels, never group. Our export CLI
places a bound label at its stored `x`/`y`/`width`/`height` (it does **not** re-centre), so always keep
the label's explicit coordinates — binding without coordinates collapses the label to the origin.

## Anatomy of a correct scene

- **Leaf box (no children) → one centred bound label.** A title + subtitle is **ONE multi-line bound
  label** (`"Services\n(the engine's APIs)"`), `textAlign: "center"`, `verticalAlign: "middle"`. Merging
  a two-tone title/subtitle collapses them to one uniform style — that is expected and correct
  (Excalidraw allows one style per bound text). Only split a subtitle into a separate free text when you
  truly need two tones, and know it will not move with the box.
- **Arrow → real endpoint bindings + an on-arrow caption.** `startBinding`/`endBinding` reference the box
  ids, mirrored in each box's `boundElements`. A caption (Yes/No, a message name) is a bound text whose
  `containerId` is the **ARROW** id, sitting on the arrow near its midpoint. Bind a text as a caption
  **only** if it sits on the arrow. **Two counter-flowing arrows between the same box pair must NOT both
  bind to the boxes** — Excalidraw drags both endpoints to the box centres and they overlap; bind their
  captions instead, or offset one arrow's endpoints manually.
- **Free scaffolding stays free — and that's correct.** Zone/frame kickers, swimlane labels ("Customer"),
  axis ticks ("Day 0"), section headers, frame side-notes: they belong to no single box, so leave them
  unbound (`containerId: null`, box `boundElements: null`). In this repo the frame/zone label is always a
  free top-left muted text, never bound to the container rectangle.
- **Z-order is sacred.** Excalidraw draws elements in array order. **NEVER globally re-sort the `elements`
  array to "tidy" the scene** — a resort puts a filled container on top of its own contents and hides
  them. Insert new elements in place.

## Palette — the only colours

These are the `packages/toolkit/styles/theme.css` tokens. **Do not invent colours.** Each row is a node
role with its fill/stroke, so diagrams stay consistently on-brand.

| Role | `backgroundColor` | `strokeColor` | Label text |
|---|---|---|---|
| **solid** — component, emphasis | `#FFFFFF` (white) | `#335DE5` (blue) | `#335DE5` |
| **accent** — highlighted node | `#F0F4FF` (blue-light) | `#335DE5` (blue) | `#335DE5` |
| **frame** — zone / container | `#F8FAFC` (gray-light) | `#D6E0F8` (blue-warm) | kicker `#64748B` |
| **plain** — sub-node inside a frame | `#FFFFFF` (white) | `#D6E0F8` (blue-warm) | `#335DE5` |
| **dashed** — virtual boundary (`strokeStyle: "dashed"`) | `#FFFFFF` | `#335DE5` (blue) | `#335DE5` |

**Text colours:** title `#000000`, secondary `#334155`, muted `#64748B`, brand label `#335DE5`. A box
label is blue; a free-floating kicker/caption is muted.

**Green is the accent of last resort** — at most one node per diagram, only for the key success payoff:
fill `#E8F5E9`, stroke `#006838`, label `#006838`. No orange, no other primaries.

**Arrows:** `strokeColor` `#335DE5`, **always `strokeWidth` 2** (never 1.5 or 3); `endArrowhead: "triangle"`
for a directed flow, solid for data flow, `strokeStyle: "dashed"` for a control/config relationship (not a
data path). A connector with no head at all is a `type: "line"` (not an arrow). Keep the native `triangle`
arrowhead so arrows stay real, editable Excalidraw arrows everywhere — in the committed file, on the slide,
and when reopened in excalidraw.com. Nothing post-processes the heads (Excalidraw sizes the head from
`strokeWidth`; keep every arrow at `2` so heads stay consistent).

## Style invariants

- `roughness: 0` always. Miragon is a clean brand — never hand-drawn/sketchy.
- **`fontFamily: 2` (Helvetica) on EVERY text** — closest to the brand's Geist. **Never `1` (Virgil,
  hand-drawn)** — it renders an off-brand sketchy font. `3` (Cascadia) only for code. Keep the whole
  diagram on one family.
- **Box labels — own label, placed by content.** A box's text is the box's own label. If the box has **no
  other content**, **centre** the label and **bind** it (see "The one rule": `textAlign: "center"`,
  `x` = box.x, `width` = box.width, on the vertical midline, `containerId` = box id, mirrored in the box's
  `boundElements`). If the box **contains other content** (sub-boxes or further labels), put its label
  **top-left** as a free kicker (inset to clear the corner) — Excalidraw centres a bound label, so a corner
  kicker cannot be bound. A box binds at most ONE text. Never crowd a lone centred label against a border.
- **Label padding — clear the corner.** A top-left kicker must not touch or overlap the box border: left
  inset `≈ cornerRadius + 6` (min ~14px for a frame/dashed container, ~10px for a small accent box), and
  ~6px down from the top edge. Centred titles/subtitles span the box width and sit on the vertical midline;
  never let any label run under the stroke.
- `fillStyle: "solid"`; rounded corners `"roundness": { "type": 3 }` on rectangles.
- Containers that hold nodes use the **frame** row; the zone label is a free-floating muted text at
  top-left, never bound to the rectangle.

## Phase 1 — Author the scene JSON

Author the scene to a scratch path, e.g. `/tmp/<name>.excalidraw` (not committed). Skeleton:

```json
{ "type": "excalidraw", "version": 2, "source": "excalidraw",
  "elements": [], "appState": { "viewBackgroundColor": "#F9F7F7" } }
```

- Descriptive string `id`s; unique integer `seed` per element (namespaced 100xxx, 200xxx).
- Bind every leaf label and arrow caption (§ The one rule). **Always set the text `strokeColor`** or it
  renders invisible.
- Arrows bind both ends; shapes list the arrow in `boundElements`. `points` start at `[0,0]`; compute
  endpoints at the shape borders (bindings do not clip the static export).
- `boundElements`: `null` when empty, never `[]`. `updated`: `1`. Omit `frameId`, `index`,
  `versionNonce`, `rawText`.
- **Layout:** box width fits its text (`≈ max(160, chars * 9)`); ≥ 40px gaps; align equals on a common
  edge/midline; every node has ≥ 1 edge; arrows follow real call/dependency direction and meet borders.

Full element templates, sizing, arrow routing, and the property catalogue:
[`references/schema-reference.md`](references/schema-reference.md).

## Phase 2 — Export the committed artifact

Export to the single committed `.excalidraw.svg` with the scene embedded. Set the scene's
`appState.viewBackgroundColor` to `#F9F7F7` first, then bake it in (`-b true`) so the committed file
renders **light** in editor previews:

```bash
excalidraw-brute-export-cli \
  -i /tmp/<name>.excalidraw \
  -o deck/chapter/<chapter>/resources/<name>.excalidraw.svg \
  -f svg -s 1 -e true -d false -b true
```

`-f svg` = vector output; `-e true` embeds the scene (so the SVG reopens in excalidraw.com); `-d false`
forces light mode; `-b true` bakes the `#F9F7F7` background. **Always pass `-d false`** — the tool's
Firefox profile sometimes leaks a persisted dark mode, so don't rely on the defaults.

**Normalisation is automatic at build time — no script.** The chapter-resources plugin (`deck/vite.config.ts`)
processes every served/built `.excalidraw.svg`: it strips a leaked dark-mode `filter` and removes the baked
background (so the diagram is **transparent** on the slide and blends on the grey slide AND inside white
`<Card>`s). It leaves the native `triangle` arrowheads alone. So author + export with the plain CLI; the
plugin handles filter + transparency. For a **full-bleed image** (e.g. a person-avatar placeholder that must
fill its frame edge-to-edge), also crop the ~10px export padding by setting the `<svg>` `viewBox`/`width`/
`height` to the content (the export wraps elements in `translate(10 10)`, so a 400x500 canvas crops to
`viewBox="10 10 400 500"`); the frame's `border-radius` + `overflow:hidden` then clip the corners.

> If the export ever comes back dark, excalidraw.com persisted dark mode in the Firefox profile. SVG fills
> are explicit in the file — grep the output for the palette hexes to confirm; re-export if a dark fill
> crept in.

**One-time setup for the exporter (Node, Firefox):**

```bash
npm install -g excalidraw-brute-export-cli
npx playwright install firefox
# macOS one-time patch (Control → Meta in the CLI):
CLI_MAIN=$(npm root -g)/excalidraw-brute-export-cli/src/main.js
sed -i '' 's/keyboard.press("Control+O")/keyboard.press("Meta+O")/' "$CLI_MAIN"
sed -i '' 's/keyboard.press("Control+Shift+E")/keyboard.press("Meta+Shift+E")/' "$CLI_MAIN"
```

## Phase 3 — Embed in the slide

Embed via the **`slides`** skill's `<Figure>` component's `src` prop (the chapter resource is served at
`/resources/<chapter>/<file>`):

```md
<Figure src="resources/<chapter>/<name>.excalidraw.svg" alt="..." caption="..."></Figure>
```

Do **not** use a Markdown image (`![](/resources/...)`): Slidev compiles it into a Vite build-time `import`
that resolves outside `server.fs.allow` and breaks `npm run build`. `<Figure src>` resolves the path through
`import.meta.env.BASE_URL`, so it stays base-aware on the GitHub Pages deploy. The SVG must exist before
building. **To edit later:** reopen the committed `.excalidraw.svg` at excalidraw.com (the scene is
embedded), change it, re-export over the same file.

## Repair a generated diagram

You also **fix** diagrams, not just author them — a scene Claude generated (or an older committed one) may
float labels over boxes instead of binding them. Before you trust one, **audit the scene** (decode the
base64 scene embedded in the `.excalidraw.svg`, or inspect the scratch JSON) for these failure signatures,
then re-bind and re-export:

- a `text` element with neither a `containerId` nor a place among the free scaffolding (a label floating
  over a box) → bind it to that box (§ The one rule);
- a one-way / dangling binding — a box lists a text in `boundElements` but the text has no `containerId`
  back (or vice-versa) → make it bidirectional;
- an arrow with no `startBinding`/`endBinding` reaching a real box id → bind both ends;
- a label manually grouped (`groupIds` non-empty) instead of bound → drop the group, bind.

Fix in place — **do not globally re-sort** to "tidy" (that hides fills over content). Re-export and verify.

## Verify, then stop

**A good-looking isolated SVG does NOT mean the diagram is correct.** The isolated export hides two things
that bit hard: a z-order resort that buried boxes behind a filled frame, and a label that drifted onto the
boxes — both looked fine on their own. There are only two real checks:

1. **Render the actual SLIDE it appears on**, through the build + transparency pipeline (the vite plugin
   strips the background), and look at it — that's what the audience sees, and where fractional-dimension
   clipping / overlap / dark-mode leaks surface that an isolated export can't. Use `npm run shot -- <page>`
   (`scripts/shot.mjs`) against the running dev server, or `npm run build`.
2. **Or open the `.excalidraw.svg` at excalidraw.com and move a box** — the label must travel with it. If
   it stays behind, the label isn't bound (§ The one rule).

Eyeball each diagram on the slide: every leaf label INSIDE and centred in its box? every frame/zone kicker
WHERE IT BELONGS (a fix must not move a free label)? captions ON their arrows? nothing hidden behind a fill,
nothing clipped or overlapping? on-palette, one font (`fontFamily: 2`), at most one green node? Common fixes:

| Look for | Fix |
|---|---|
| Text clipped / overflowing | Widen the shape (`max(160, charCount * 9)`) |
| Boxes or labels overlapping | Re-space (≥ 40px gap) |
| Arrow cutting through a shape | Move endpoints to the borders, not centres |
| Off-palette colour crept in | Replace with a token from the palette (grep the fills) |
| Looks busy / boxed-in | Fewer boxes; free-floating labels + connectors carry hierarchy |
| Label drags off its box in excalidraw.com | It isn't bound — add `containerId` + `boundElements` |

**Anti-patterns (each costs a redo):**

- Grouping instead of binding — weaker, and not how the UI builds it. `groupIds` stays `[]`.
- Globally re-sorting z-order for "tidiness" — draws fills over content and hides elements.
- Floating a label over its box instead of binding it — looks fine, drags off on edit.
- A caption bound to a box (or a far header) instead of the arrow it labels.
- Both arrows of a counter-flowing pair bound to the same box pair — they overlap at the centres.
- Trusting the lint or an isolated SVG instead of the rendered slide. This is the big one.

Re-export and repeat until clean. Then run `npm run build` + `npm run verify:ci`, confirm the printed deck
title is this deck, and **do not finish on red.**
