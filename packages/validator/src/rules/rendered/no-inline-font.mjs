/** Layouts own typography: no inline font-family in author slide content. */
export const noInlineFont = {
  id: 'no-inline-font',
  type: 'rendered',
  title: 'typography not overridden',
  message: 'Slide content must not set font-family inline',
  meta: { category: 'recommended', default: 'error' },
  evaluate(m, ctx) {
    return m.inlineFonts > 0
      ? [{ file: ctx.file, slide: ctx.slide, message: `${m.inlineFonts} element(s) set font-family inline. Let the layout own typography.` }]
      : []
  },
}
