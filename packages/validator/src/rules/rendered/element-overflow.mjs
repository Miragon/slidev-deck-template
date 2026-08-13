import { TOLERANCE, MIN_BOTTOM_MARGIN } from '../../helpers.mjs'

/**
 * The slide must fit the 980x552 canvas AND clear the bottom by a healthy margin.
 * Content jammed against the floor or past the right edge reads as cut off.
 */
export const elementOverflow = {
  id: 'element-overflow',
  type: 'rendered',
  title: 'fits the canvas with a bottom margin',
  message: 'Slide content must fit the 980x552 canvas with breathing room',
  meta: { category: 'recommended', default: 'error' },
  evaluate(m, ctx) {
    const byX = m.right - m.cw
    const bottomMargin = m.ch - m.contentBottom
    const issues = []
    if (bottomMargin < MIN_BOTTOM_MARGIN) {
      issues.push(
        bottomMargin < 0
          ? `content runs ${-bottomMargin}px past the bottom (reaches ${m.contentBottom}px, canvas is ${m.ch}px)`
          : `only ${bottomMargin}px clear of the bottom (content reaches ${m.contentBottom}px; needs >= ${MIN_BOTTOM_MARGIN}px)`,
      )
    }
    if (byX > TOLERANCE) issues.push(`${byX}px past the right edge (content reaches ${m.right}px, canvas is ${m.cw}px)`)
    if (!issues.length) return []
    return [{ file: ctx.file, slide: ctx.slide, message: `${issues.join(' and ')}. Reduce content (split the slide, fewer items, shrink the visual, or move detail to speaker notes).` }]
  },
}
