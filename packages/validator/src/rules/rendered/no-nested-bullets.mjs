/** Keep bullet lists to one level. Split the slide instead of sub-bullets. */
export const noNestedBullets = {
  id: 'no-nested-bullets',
  type: 'rendered',
  title: 'no nested bullets',
  message: 'Bullet lists must stay at one level',
  meta: { category: 'recommended', default: 'warn' },
  evaluate(m, ctx) {
    return m.nestedLists > 0
      ? [{ file: ctx.file, slide: ctx.slide, message: `${m.nestedLists} nested list(s). Keep to one level; split the slide instead of sub-bullets.` }]
      : []
  },
}
