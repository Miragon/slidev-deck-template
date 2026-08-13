/** Bullets: the layout owns the marker; no per-slide inline list-style override. */
export const noRestyledBullets = {
  id: 'no-restyled-bullets',
  type: 'rendered',
  title: 'bullets not restyled',
  message: 'Slide content must not override bullet styling inline',
  meta: { category: 'recommended', default: 'error' },
  evaluate(m, ctx) {
    return m.listOverrides > 0
      ? [{ file: ctx.file, slide: ctx.slide, message: `${m.listOverrides} list element(s) override bullet styling inline. Use plain <ul>/<li>; the layout provides the marker.` }]
      : []
  },
}
