# @miragon/slidev-speaker-profiles

**Several people present the same deck, and each of them wants a different cut
of it.** This addon lets every speaker keep their own selection of slides in a
small JSON file, committed alongside the deck. Nobody overwrites anybody, and
`main` never changes.

It is inert until a profile is selected, and a plain `npm run build` always
produces the complete deck, so a shortened one can never be deployed by
accident.

## Install

```bash
npm i @miragon/slidev-speaker-profiles
```

A dependency, not a devDependency: Slidev compiles the addon into the deck, so
a build needs it the same way it needs the theme.

Register it as an addon in your deck's headmatter:

```yaml
---
addons:
  - '@miragon/slidev-speaker-profiles'
---
```

That is the whole installation. **Ids are stamped by the addon itself**, when a
dev server starts, whatever the script that started it is called - which matters
for a deck with one dev script per chapter, where a `predev` hook would have to
be repeated in each of them and would be forgotten in one.

Add two things to your scripts: a way in for the speaker, and the guard for CI.

```json
{
  "scripts": {
    "dev": "slidev slides.md --open",
    "dev:profile": "SLIDEV_PROFILE_EDIT=1 npm run dev",
    "check:ids": "slide-ids --check",
    "preverify": "npm run check:ids",
    "verify": "SLIDEV_PROFILE=none slidev-validator --rendered"
  }
}
```

`check:ids` belongs in CI: it is what guarantees that everything on `main` is
addressable, for the case where somebody commits a slide without ever having
started the dev server. **Do not stamp in a build** - a build must not mutate
its own sources.

`SLIDEV_PROFILE=none` belongs on anything that drives the deck slide by slide
(the validator, a screenshot run). It switches the addon off for that run, so
the skip logic cannot navigate away from the slide the tool is waiting for, and
so the run cannot leave a modified working tree behind.

Two ways to keep the dev server's hands off your sources, if you want that:
`SLIDEV_SPEAKER_PROFILES_NO_STAMP=1` for a single run, or stamp explicitly with
`slide-ids --stamp` from a `predev` hook.

## What a speaker does

```bash
echo thomas > .slidev-profiles/.current   # once per machine, gitignored
npm run dev:profile
```

Then either walk the deck and click **Hide this slide** bottom right, or open
the chip next to it for the full list, grouped by chapter, with all-on/all-off
per chapter. Bulk edits there need **Save profile**; a single click saves
immediately.

While editing, nothing jumps: you can walk onto a switched-off slide and turn it
back on, which is the point. Slidev's own overview (`o`) greys them out.

**Present with plain `npm run dev`.** The arrow keys, space and PageDown step
straight over the switched-off slides and there is nothing on screen to
mis-click in front of the room.

| | `dev:profile` | `dev` |
|---|---|---|
| Editing controls | yes | **no** |
| Switched-off slides | shown, framed red | skipped |
| What it is for | choosing | presenting |

A personal PDF or build spells the name out:

```bash
SLIDEV_PROFILE=thomas npm run export
SLIDEV_PROFILE=thomas npm run build
```

Here the switched-off slides are really removed, not just skipped.

## When the deck moves on

**New slides are on by default**, so a slide somebody adds shows up rather than
disappearing without a word. `dev:profile` lists the new ones by name with a
**Hide all new** button; plain `dev` shows a short notice that takes itself off
screen again.

**Pick your slides in the full deck.** A deck can have an entry per chapter, and
running one of those shows and skips exactly what your profile says - that part
is right, because the ids live in the slide files. But saving from there only
ever adds to what your profile has seen, never replaces it, so a chapter-sized
run cannot make the other chapters look new. Presenting a single chapter is
fine; choosing is a job for the whole deck.

## Slide ids

Nobody types these. Every slide carries a random id in its frontmatter:

```yaml
---
id: s-4b81f0ac
layout: content
title: Typical modeling errors
---
```

That is what a profile stores, and it is why a selection survives retitling a
slide, reordering slides, moving one to another chapter, renumbering chapter
files and having anything inserted around it. The addon removes the line again
before the slide reaches the layout, so it never lands in the DOM.

Do not edit an id and do not copy a slide including its id; `--check` fails when
two slides claim the same one.

```
slide-ids --stamp    write an id into every slide that has none
slide-ids --check    exit 1 if an id is missing, malformed or duplicated
slide-ids            list the deck with its ids
```

Hidden slides are stamped too. `hide: true` is how a deck parks content it means
to bring back, and an unstamped parked slide would return as a new slide for
every speaker the day the line is deleted. The file keeps its `hide: true`.

### Decks that are not laid out the usual way

The entry defaults to `slides.md`, then `deck/slides.md`. Anything else says so:

```bash
slide-ids --stamp --entry deck/slides.md
```

Nesting does not matter. Ids are written to the file a slide is *written* in,
never to the `src:` wrapper that imports it, so a deck composed of two levels of
imports where every file is called `slides.md` works the same as one chapter
file per chapter.

If your deck parks a chapter by taking its `src:` line out, no entry reaches
that file any more and its slides would go unstamped. Name it so it keeps its
ids:

```bash
slide-ids --stamp --also 'chapter/*/*.md'
```

## The profile file

```json
{
  "schemaVersion": 1,
  "speaker": "thomas",
  "hidden": ["s-4b81f0ac", "s-9d2e77c1"],
  "order": null,
  "knownIds": ["s-29076475", "..."]
}
```

One file per speaker in `.slidev-profiles/`, committed like any other file. Two
speakers editing at the same time touch disjoint files, so git cannot put them
in conflict. Arrays are written sorted and there is deliberately no timestamp:
it would be the one line that changes on every save and would turn "same person,
two machines" into a conflict carrying no information.

`hidden` is what the speaker switched off. `knownIds` is what existed the last
time they saved, which is how "new since your last change" is computed. **Unknown
means visible.** Ids that vanished are reported but never dropped from `hidden`,
because the slide may come back on another branch.

`order` is reserved for reordering and is always `null` today.

Gitignore two entries in `.slidev-profiles/`: `.current`, which says which
profile *this machine* uses and belongs to nobody else, and `.stamp.lock`, the
transient lock that keeps two dev servers starting at once from both minting
ids.

## Environment

| | |
|---|---|
| `SLIDEV_PROFILE=<name>` | pick the profile explicitly; wins over `.current` |
| `SLIDEV_PROFILE=none` | switch the addon off entirely |
| `SLIDEV_PROFILE_EDIT=1` | unlock the editing controls |
| `SLIDEV_SPEAKER_PROFILES_NO_STAMP=1` | the dev server does not write ids this run |

**Anything that drives the deck slide by slide needs `SLIDEV_PROFILE=none`** (a
validator, a screenshot run): the skip logic would navigate away from the slide
they are waiting for.

## Internals

The traps that shaped this design are documented in
[`INTERNALS.md`](INTERNALS.md).
