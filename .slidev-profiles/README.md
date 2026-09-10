# Speaker profiles

**Several people present this deck and each wants a different cut of it.** Pick
the slides you want, save them, and from then on the deck is yours on your
machine. Nobody else's selection changes, and the deck on `main` does not
change either.

## First time, three commands

```bash
git pull
echo thomas > .slidev-profiles/.current   # your name, lower case. Once per machine.
npm run dev:profile
```

`dev:profile` is the deck plus editing controls, bottom right:

- **Hide this slide** switches off the slide you are looking at, right there.
  One click, saved immediately.
- **The chip next to it** opens the full list, grouped by chapter, with
  **all on / all off** per chapter. Bulk edits there need **Save profile**.

**Present with plain `npm run dev`.** The arrow keys, space and PageDown step
straight over the switched-off slides, and there is nothing on screen to
mis-click in front of the room.

Your own PDF spells the name out, so a plain `npm run build` can never produce
a shortened deck by accident:

```bash
SLIDEV_PROFILE=thomas npm run export
```

## Committing

```bash
git add .slidev-profiles/thomas.json
```

One file per speaker, so two people editing at the same time touch different
files and git cannot put them in conflict. `.current` stays on your machine.

## Slide ids

Nobody types these. Every slide carries an `id: s-xxxxxxxx` in its frontmatter,
written by `npm run dev` before the server starts, and that is what a profile
stores. It survives retitling a slide, reordering slides and moving one to
another chapter, so a selection can only ever point at the slide it was made
for. Do not edit an id, and do not copy a slide including its id.

The full documentation is in
[`@miragon/slidev-speaker-profiles`](https://www.npmjs.com/package/@miragon/slidev-speaker-profiles).
