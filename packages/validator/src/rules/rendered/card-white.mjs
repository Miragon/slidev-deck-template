/** Cards stay white: no colored/gradient background, no colored left-accent border. */
export const cardWhite = {
  id: 'card-white',
  type: 'rendered',
  title: 'cards stay white',
  message: 'Cards must be white with the accent on the title text only',
  meta: { category: 'required', default: 'error' },
  evaluate(m, ctx) {
    return m.badCards > 0
      ? [{ file: ctx.file, slide: ctx.slide, message: `${m.badCards} card(s) have a colored/gradient background or a colored left-accent border. Cards are always white with the accent on the title text only.` }]
      : []
  },
}
