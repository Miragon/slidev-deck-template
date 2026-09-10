# Internals

Per-speaker slide selection for a deck several people present. Each speaker
keeps their own profile file, nobody overwrites anybody, and `main` never
changes.

**How to use it is in [`README.md`](README.md).** This file is for whoever
maintains the addon: the traps that shaped the design, so the next change does
not walk into them again.

## The four pieces

| File | Runs | Job |
|---|---|---|
| `setup/preparser.ts` | parse time, every mode | Reads each slide's id, injects `data-profile-off` in dev, sets `hide: true` for build and export |
| `setup/vite-plugins.ts` | dev server only | `GET /@speaker-profiles/state`, `POST /@speaker-profiles/save` |
| `setup/shortcuts.ts` | client | Arrow keys, space and PageDown step over switched-off slides |
| `global-top.vue` | client | Watcher fallback, the cover, the editor overlay |
| `slide-top.vue` | client | Greys out switched-off slides in Slidev's own overview |

One state, two uses: the overlay writes the profile, the runtime reads it for
presenting, the preparser reads the same profile for build and export. Runtime
and export behaviour cannot drift apart.

A fifth piece sits beside the addon: **`bin/slide-ids.mjs`**, the `slide-ids`
command, writes the `id:` that everything here addresses. Consumers wire
`--stamp` into whatever starts their dev server and `--check` into CI.

## Where an id comes from

`<chapter>/<title-slug>` was the first design and it was wrong. Two slides in a
chapter can share a title (a section slide and the content slide after it do it
naturally), so the id needed an occurrence counter, and a counter renumbers when
a slide is inserted or deleted above it. A speaker's selection would then hide a
slide they never chose. Renaming a title had the same effect from the other end.

So the id is a random `s-xxxxxxxx` in the slide's frontmatter, written once by
the `slide-ids` CLI (`bin/slide-ids.mjs`) and never again. It survives retitling, reordering,
moving to another chapter and having anything inserted around it. The derived
form still exists in `identity.mjs` as the fallback for the minutes between
writing a slide and stamping it, and `check:ids` is what stops that fallback
from ever reaching `main`.

Consequence for this addon: **an id no longer tells you which chapter a slide is
in.** The preparser therefore also injects `data-profile-chapter`, and the
editor groups by that rather than by an id prefix.

## Two rules that exist for decks other than this one

Nothing here may assume a particular folder layout. Two places used to:

**The chapter label comes from the folder path, not the file name**
(`chapterLabel` in `identity.mjs`). A deck is free to call every one of its files
`slides.md` and tell them apart by folder, and both developer trainings do
exactly that. A basename would collapse such a deck into a single group of 500
slides and turn "all off per chapter" into "all off". The first path segment is
dropped when it is a container name (`chapter`, `content`, ...), so
`chapter/03-bpmn/03-bpmn.md` reads `03-bpmn` and
`content/1-fundamentals/01-about-miragon/slides.md` reads
`1-fundamentals/01-about-miragon`.

**Hidden slides are stamped too.** Slidev drops a `hide: true` slide while
parsing, so it never reaches the stamper; the CLI therefore parses with
an extension that strips `hide` in memory. Parking with `hide: true` is a normal
way to shelve content (the two developer trainings park dozens of slides that
way), and unstamped, every one of them would come back as a new slide for every
speaker the day the line is deleted. The file on disk keeps its `hide: true`.

## Things that will bite you

**`hide: true` is evaluated while parsing.** A hidden slide never reaches the
client, so `hide` cannot be the source of truth in dev - the editor has to list
switched-off slides so they can be switched back on. Dev injects
`data-profile-off` and skips at runtime; build and export set `hide`.

**A `src:` slide is an import wrapper, not a slide.** Slidev merges its
frontmatter over every imported slide (`{...slide, ...override}` - the override
wins), so anything injected onto a wrapper clobbers the whole chapter. The
preparser skips them.

**`transformSlide` does not get the file path.** The file is identified by
hashing the raw lines handed to `transformRawLines` and looking the hash up in
an index of the deck's markdown files. That keeps Slidev in charge of splitting
slides, which is the part we do not want to re-implement. It feeds
`data-profile-chapter` and the fallback id; the stamped id needs none of it.

**The stamper writes to the SOURCE slide, never to a `src:` wrapper.**
the `slide-ids` CLI (`bin/slide-ids.mjs`) reads `slide.source.filepath` and `slide.source.start`
for exactly that reason. An `id:` on a wrapper would merge over every slide of
the imported chapter and give them all the same one.

**Anything runtime-navigational must be inert while printing.** `GlobalTop` is
rendered by `PrintSlideClick` too, and a watcher that navigates during
`slidev export --per-slide` makes the export time out waiting for a slide
element that has just been left. Guard on `nav.isPrintMode`.

**The watcher needs `immediate: true`.** Without it, a deck opened directly on
a switched-off slide (a pasted URL, a reload) just sits there behind the cover.

**In dev the profile FILE is the truth, not the frontmatter.**
`data-profile-off` is decided while parsing, and saving does not re-parse the
deck. Seeding the client from it would show slides as on that were switched off
minutes ago, and the next save would write that stale picture back and quietly
undo the earlier work. `loadServerState` therefore overrides it, and nothing
navigates until `ready` is set, or the watcher acts on the stale snapshot for
the first few frames.

**`/overview/` is its own page and renders no GlobalTop.** Nothing there would
fetch the profile, so every card would look switched on. `slide-top.vue` calls
`ensureLoaded()` itself; the fetch is memoised per window.

**Editing does not skip.** Both the watcher and the patched shortcuts check
`editable`. If they skipped, a switched-off slide would be unreachable and
could never be turned back on. The red frame carries the state instead;
presenting is what skips.

**Tools that drive the deck slide by slide need `SLIDEV_PROFILE=none`.** The
skip logic navigates away from the slide they are waiting for. Set it in those scripts.

**Frontmatter keys are handed to the layout as props** and unknown ones fall
through onto its root element, which is why the injected keys are named
`data-*`. The stamped `id:` is read and then deleted for the same reason - it
must never land in the DOM, where it would collide with the element ids Slidev
and the layouts use.

## Not implemented

`order` is in the schema and always `null`. Reordering would need the entry file
to be generated per speaker rather than patched, and it only makes sense within
a chapter - across chapters the hub's per-chapter builds have no notion of it.
