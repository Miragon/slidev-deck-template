/**
 * Safe-area geometry evaluator — the pure core of the "no content collides with a
 * global template overlay" guardrail (ported from the original verify/safe-area.ts).
 *
 * The template injects global chrome onto (almost) every slide: the page/chapter
 * display bottom-left and the progress bar top. Both are `position: fixed`,
 * `pointer-events: none` overlays that paint ON TOP of slide content. The generic
 * rendered checks deliberately skip fixed elements and only enforce a uniform 16px
 * bottom band, so content can sit close to the bottom, pass, and still render
 * through the page display. This module closes that gap.
 *
 * It is framework-agnostic: it takes already-measured rectangles (the caller reads
 * real getBoundingClientRect()s in the browser, converted to CANVAS pixels — origin
 * top-left of the 980x552 canvas) plus the central config, and returns violations.
 */

const CANVAS = { width: 980, height: 552 }

export function width(r) {
  return Math.max(0, r.right - r.left)
}
export function height(r) {
  return Math.max(0, r.bottom - r.top)
}
export function isEmpty(r) {
  return width(r) <= 0 || height(r) <= 0
}

/** Intersection of two rectangles (may be empty; check with isEmpty). */
export function intersect(a, b) {
  return {
    left: Math.max(a.left, b.left),
    top: Math.max(a.top, b.top),
    right: Math.min(a.right, b.right),
    bottom: Math.min(a.bottom, b.bottom),
  }
}

/** True when the two rectangles share any area beyond `tolerance` px on each axis. */
export function overlaps(a, b, tolerance = 0) {
  const i = intersect(a, b)
  return width(i) > tolerance && height(i) > tolerance
}

/**
 * Build the reserved zone for an overlay: the painted rect grown by its margins on
 * the interior sides and extended to the canvas edges it is anchored to.
 */
export function reservedZone(o, rect, canvas = CANVAS) {
  const { anchor: a, margins: m } = o
  return {
    left: a.horizontal === 'left' || a.horizontal === 'full' ? 0 : rect.left - m.left,
    right: a.horizontal === 'right' || a.horizontal === 'full' ? canvas.width : rect.right + m.right,
    top: a.vertical === 'top' || a.vertical === 'full' ? 0 : rect.top - m.top,
    bottom: a.vertical === 'bottom' || a.vertical === 'full' ? canvas.height : rect.bottom + m.bottom,
  }
}

/** The interior vertical safe line and the margin code it enforces, or null. */
function verticalGuard(o, rect) {
  if (o.anchor.vertical === 'bottom') return { line: rect.top - o.margins.top, code: 'insufficient-bottom-margin' }
  if (o.anchor.vertical === 'top') return { line: rect.bottom + o.margins.bottom, code: 'insufficient-top-margin' }
  return null
}

/** The interior horizontal safe line and the margin code it enforces, or null. */
function horizontalGuard(o, rect) {
  if (o.anchor.horizontal === 'left') return { line: rect.right + o.margins.right, code: 'insufficient-left-margin' }
  if (o.anchor.horizontal === 'right') return { line: rect.left - o.margins.left, code: 'insufficient-right-margin' }
  return null
}

const round = (n) => Math.round(n)

/**
 * Evaluate every content box against one overlay instance. Returns one violation
 * per offending element (empty = clean). A null overlay rect (hidden on this
 * layout) reserves nothing; a null content rect yields a `missing-geometry`
 * violation so incomplete measurements fail loud, not silent.
 */
export function evaluateOverlay(instance, content, opts = {}) {
  const { descriptor: o, rect: overlay } = instance
  if (!overlay) return []
  const canvas = opts.canvas ?? CANVAS
  const tol = opts.tolerance ?? 1
  const exception = (opts.exceptions ?? []).find((e) => e.overlay === o.id)
  const zone = reservedZone(o, overlay, canvas)
  const vGuard = verticalGuard(o, overlay)
  const hGuard = horizontalGuard(o, overlay)

  const out = []
  for (const c of content) {
    if (!c.rect) {
      out.push({
        code: 'missing-geometry',
        overlayId: o.id,
        overlayLabel: o.label,
        content: c.label,
        intrusionPx: 0,
        detail: 'element reported no bounding box; geometry could not be verified.',
        excepted: !!exception,
        reason: exception?.reason,
      })
      continue
    }
    const inZone = intersect(c.rect, zone)
    if (isEmpty(inZone) || width(inZone) <= tol || height(inZone) <= tol) continue

    const painted = intersect(c.rect, overlay)
    let code
    let intrusion
    let detail

    if (!isEmpty(painted) && width(painted) > tol && height(painted) > tol) {
      const coversOpaque = c.zIndex != null && c.zIndex > o.zIndex && c.opaque
      code = coversOpaque ? 'hidden-by-overlay' : 'overlap'
      intrusion = round(Math.min(width(painted), height(painted)))
      detail = coversOpaque
        ? `element paints an opaque background at z-index ${c.zIndex} over the overlay (z-index ${o.zIndex}), hiding it across ${round(width(painted))}x${round(height(painted))}px.`
        : `element's box enters the overlay's painted area by ${round(width(painted))}x${round(height(painted))}px, so the two render on top of each other.`
    } else {
      const penV = vGuard ? intrusionPastLine(c.rect, vGuard) : -Infinity
      const penH = hGuard ? intrusionPastLine(c.rect, hGuard) : -Infinity
      const vViol = penV > tol
      const hViol = penH > tol
      const overlapsX = c.rect.right > overlay.left + tol && c.rect.left < overlay.right - tol
      let axis
      if (vViol && hViol) axis = overlapsX ? 'v' : 'h'
      else if (vViol) axis = 'v'
      else axis = 'h'

      if (axis === 'v' && vGuard) {
        code = vGuard.code
        intrusion = round(penV)
      } else if (hGuard) {
        code = hGuard.code
        intrusion = round(penH)
      } else {
        code = 'overlap'
        intrusion = round(Math.min(width(inZone), height(inZone)))
      }
      detail = clearanceDetail(c.rect, o, overlay, canvas, intrusion)
    }

    out.push({ code, overlayId: o.id, overlayLabel: o.label, content: c.label, intrusionPx: intrusion, detail, excepted: !!exception, reason: exception?.reason })
  }
  return out
}

/** How far (px) a content rect reaches past an interior safe line (>0 = violating). */
function intrusionPastLine(c, guard) {
  switch (guard.code) {
    case 'insufficient-bottom-margin':
      return c.bottom - guard.line
    case 'insufficient-top-margin':
      return guard.line - c.top
    case 'insufficient-left-margin':
      return guard.line - c.left
    case 'insufficient-right-margin':
      return c.right - guard.line
    default:
      return -Infinity
  }
}

/** A human, actionable sentence for a buffer intrusion. */
function clearanceDetail(c, o, overlay, canvas, intrusion) {
  const clauses = []
  if (o.anchor.vertical === 'bottom') clauses.push(`>= ${round(canvas.height - overlay.top + o.margins.top)}px from the bottom (now ${round(canvas.height - c.bottom)}px)`)
  if (o.anchor.vertical === 'top') clauses.push(`>= ${round(overlay.bottom + o.margins.bottom)}px from the top (now ${round(c.top)}px)`)
  if (o.anchor.horizontal === 'left') clauses.push(`>= ${round(overlay.right + o.margins.right)}px from the left (now ${round(c.left)}px)`)
  if (o.anchor.horizontal === 'right') clauses.push(`>= ${round(canvas.width - overlay.left + o.margins.left)}px from the right (now ${round(canvas.width - c.right)}px)`)
  return `element reaches ${intrusion}px into the ${o.label}'s reserved zone. Keep it ${clauses.join(' and ')}.`
}

/** Evaluate every overlay on a slide and flatten the violations. */
export function evaluateSlide(overlays, content, opts = {}) {
  return overlays.flatMap((o) => evaluateOverlay(o, content, opts))
}
