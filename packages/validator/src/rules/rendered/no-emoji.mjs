/** No emoji icons in rendered slide content. Use inline SVG or Iconify (i-*) classes. */
export const noEmoji = {
  id: 'no-emoji',
  type: 'rendered',
  title: 'no emoji icons',
  message: 'Slide content must not contain emoji',
  meta: { category: 'required', default: 'error' },
  evaluate(m, ctx) {
    return m.emoji ? [{ file: ctx.file, slide: ctx.slide, message: 'contains an emoji. Use inline SVG or Iconify (i-*) icon classes instead.' }] : []
  },
}
