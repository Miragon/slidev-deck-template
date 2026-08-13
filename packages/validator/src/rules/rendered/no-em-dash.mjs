/** No em-dashes in rendered slide content. Use commas, periods, parentheses, or colons. */
export const noEmDash = {
  id: 'no-em-dash',
  type: 'rendered',
  title: 'no em-dashes',
  message: 'Slide content must not contain an em-dash (—)',
  meta: { category: 'required', default: 'error' },
  evaluate(m, ctx) {
    return m.emDash ? [{ file: ctx.file, slide: ctx.slide, message: 'contains an em-dash (—). Use commas, periods, parentheses, or colons.' }] : []
  },
}
