/** Headings (h1/h2) must render black. Blue is only for kickers, accents, small labels. */
export const headingBlack = {
  id: 'heading-black',
  type: 'rendered',
  title: 'headings are black, not blue',
  message: 'Headings must render black, never blue',
  meta: { category: 'required', default: 'error' },
  evaluate(m, ctx) {
    return m.blueHeads > 0
      ? [{ file: ctx.file, slide: ctx.slide, message: `${m.blueHeads} heading(s) render blue. Headings must be black; blue is only for kickers, accents, and small labels.` }]
      : []
  },
}
