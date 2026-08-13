import { evaluateSlide } from './safe-area/model.mjs'
import { loadSafeAreaConfig } from './safe-area/config.mjs'

/**
 * Author content must clear the global template overlays (page/chapter display,
 * progress bar) — not just fit the canvas. This rule consumes the dedicated
 * safe-area measurement (`consumes: 'safeArea'`) and the toolkit-owned safe-area
 * model. The model is read from the TOOLKIT, so a deck cannot switch the protection
 * off; the only escape hatch is a per-slide, per-overlay `safeAreaExceptions`
 * frontmatter entry (a reason is required), which downgrades a collision to an
 * allowed exception — reported, never failing.
 */
export const overlaySafeArea = {
  id: 'overlay-safe-area',
  type: 'rendered',
  consumes: 'safeArea',
  title: 'content clears the global overlays',
  message: 'Author content must clear the global template overlays (page display, progress bar)',
  meta: { category: 'required', default: 'error' },
  evaluate(data, ctx) {
    if (!data) return []
    const config = loadSafeAreaConfig()
    if (!config) return []

    const rectMap = new Map(data.overlays.map((o) => [o.id, o.rect]))
    const instances = config.overlays.map((descriptor) => ({ descriptor, rect: rectMap.get(descriptor.id) ?? null }))
    const all = evaluateSlide(instances, data.content, { exceptions: data.exceptions, canvas: config.canvas })

    const out = []
    for (const o of config.overlays) {
      const real = all.filter((v) => v.overlayId === o.id && !v.excepted)
      if (!real.length) continue
      const worst = [...real].sort((a, b) => b.intrusionPx - a.intrusionPx)[0]
      const more = real.length > 1 ? ` (+${real.length - 1} more)` : ''
      out.push({
        file: ctx.file,
        slide: ctx.slide,
        message: `does not clear the ${o.label}: [${worst.code}] ${worst.content} ${worst.detail}${more} Move or shrink the element to clear the reserved zone.`,
      })
    }
    return out
  },
}
