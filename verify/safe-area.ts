/**
 * Safe-area geometry evaluator — the pure core of the "no content collides with a
 * global template overlay" guardrail.
 *
 * WHY THIS EXISTS
 * The template injects global chrome onto (almost) every slide: the page-/chapter
 * display bottom-left (global/ChapterFooter.vue) and the progress bar top
 * (global/ProgressBar.vue). Both are `position: fixed`, `pointer-events: none`
 * overlays that paint ON TOP of slide content. The older rendered checks
 * (slides.spec.ts) deliberately SKIP fixed elements and only enforce a uniform
 * 16px bottom band, so an author-placed card or diagram can sit 16-27px from the
 * bottom, pass every check, and still render its text through the page display.
 * There is no left-edge check and no z-order check at all. This module closes
 * that gap.
 *
 * DESIGN — measured boxes, not declared positions
 * The evaluator is intentionally framework-agnostic: it takes already-measured
 * rectangles (the caller reads real getBoundingClientRect()s in the browser) plus
 * a central config, and returns typed violations. Because the caller measures the
 * live, fully-revealed, post-transform geometry, grouped / translated / rotated /
 * scaled elements are handled for free — a rotated card's axis-aligned bounding
 * box is exactly what getBoundingClientRect() returns. This satisfies the rule
 * "use the actually-rendered geometry, do not trust declared positions".
 *
 * COORDINATE SYSTEM
 * All rectangles handed to this module are in CANVAS pixels: origin top-left of
 * the 980x552 Slidev canvas (see helpers.CANVAS), x right, y down. The caller is
 * responsible for converting raw viewport px -> canvas px with the single visual
 * scale (viewportWidth / canvasWidth). Keeping this module in one unit makes the
 * config (margins in canvas px) and the messages (clearances in canvas px)
 * consistent and viewport-independent — the same rule holds at any render size.
 */

// -----------------------------------------------------------------------------
// Geometry primitives
// -----------------------------------------------------------------------------

/** An axis-aligned rectangle in canvas pixels. */
export interface Rect {
  left: number
  top: number
  right: number
  bottom: number
}

export function width(r: Rect): number {
  return Math.max(0, r.right - r.left)
}
export function height(r: Rect): number {
  return Math.max(0, r.bottom - r.top)
}
export function isEmpty(r: Rect): boolean {
  return width(r) <= 0 || height(r) <= 0
}

/** Intersection of two rectangles (may be empty; check with isEmpty). */
export function intersect(a: Rect, b: Rect): Rect {
  return {
    left: Math.max(a.left, b.left),
    top: Math.max(a.top, b.top),
    right: Math.min(a.right, b.right),
    bottom: Math.min(a.bottom, b.bottom),
  }
}

/** True when the two rectangles share any area beyond `tolerance` px on each axis. */
export function overlaps(a: Rect, b: Rect, tolerance = 0): boolean {
  const i = intersect(a, b)
  return width(i) > tolerance && height(i) > tolerance
}

// -----------------------------------------------------------------------------
// Overlay model — the machine-readable description of a global template element
// -----------------------------------------------------------------------------

/**
 * How an overlay occupies each canvas axis:
 *   - 'top' | 'bottom' | 'left' | 'right' — anchored to that edge. The reserved
 *     zone is extended to the edge (so a sub-pixel gap can never leak) and the
 *     opposite (interior) side carries the configurable margin buffer that content
 *     must stay clear of; a guard on that side produces the directional code.
 *   - 'full' — the overlay effectively spans the whole axis, so the zone covers
 *     the full width/height and there is NO guard on that axis. Used for the
 *     progress bar horizontally: its width is the deck's progress, not a fixed
 *     chrome extent, so it must never impose a horizontal clearance requirement.
 *   - null — free-floating on that axis: buffer both sides, no guard.
 */
export interface Anchor {
  vertical: 'top' | 'bottom' | 'full' | null
  horizontal: 'left' | 'right' | 'full' | null
}

/** A configurable safe-area buffer, in canvas px, on the overlay's interior sides. */
export interface Margins {
  top: number
  right: number
  bottom: number
  left: number
}

/** Central, machine-readable description of one global overlay. */
export interface OverlayDescriptor {
  /** Stable id used in error codes and exceptions, e.g. 'page-display'. */
  id: string
  /** Human label for messages, e.g. 'page / chapter display'. */
  label: string
  /** DOM selector the caller measures to get the painted rect (browser side). */
  selector: string
  /** Canvas edges the overlay hugs. */
  anchor: Anchor
  /** Extra clearance beyond the painted rect, on the interior sides (canvas px). */
  margins: Margins
  /** The overlay's CSS z-index — used to reason about front/behind. */
  zIndex: number
  /** Layouts on which the overlay is NOT rendered (so no zone is reserved). */
  hiddenLayouts: string[]
}

// -----------------------------------------------------------------------------
// Runtime inputs
// -----------------------------------------------------------------------------

/** A measured overlay instance for one slide (null rect = not rendered here). */
export interface OverlayInstance {
  descriptor: OverlayDescriptor
  /** The painted rect in canvas px, or null when the overlay is hidden/absent. */
  rect: Rect | null
}

/** A measured piece of author content to test against the overlays. */
export interface ContentBox {
  /** A short identifier for messages: tag + classes, or a component name. */
  label: string
  /** Bounding box in canvas px (already post-transform). */
  rect: Rect | null
  /** Effective stacking z-index (numeric) or null when 'auto'. */
  zIndex: number | null
  /** Whether the element paints an opaque background (can hide what's under it). */
  opaque: boolean
}

/** A per-slide, per-overlay exception the author opted into (see the slides skill). */
export interface Exception {
  /** Overlay id this exception applies to. */
  overlay: string
  /** Required human justification (kept in the report; never silent). */
  reason: string
}

export type ViolationCode =
  | 'overlap'
  | 'insufficient-bottom-margin'
  | 'insufficient-top-margin'
  | 'insufficient-left-margin'
  | 'insufficient-right-margin'
  | 'hidden-by-overlay'
  | 'missing-geometry'

export interface Violation {
  code: ViolationCode
  overlayId: string
  overlayLabel: string
  /** The offending content element (or a note for missing-geometry). */
  content: string
  /** How deep the content reaches into the reserved zone, in canvas px. */
  intrusionPx: number
  /** Actual vs required clearances, in canvas px, for the human message. */
  detail: string
  /** True when an explicit, documented exception downgrades this to a warning. */
  excepted: boolean
  /** The exception's reason, when excepted. */
  reason?: string
}

// -----------------------------------------------------------------------------
// Reserved-zone construction
// -----------------------------------------------------------------------------

const CANVAS = { width: 980, height: 552 }

/**
 * Build the reserved zone for an overlay: the painted rect grown by its margins
 * on the interior sides and extended to the canvas edges it is anchored to. For
 * the page display (anchored bottom-left) this is the bottom-left corner box that
 * covers the label plus a top/right breathing buffer.
 */
export function reservedZone(o: OverlayDescriptor, rect: Rect, canvas = CANVAS): Rect {
  const { anchor: a, margins: m } = o
  return {
    left: a.horizontal === 'left' || a.horizontal === 'full' ? 0 : rect.left - m.left,
    right: a.horizontal === 'right' || a.horizontal === 'full' ? canvas.width : rect.right + m.right,
    top: a.vertical === 'top' || a.vertical === 'full' ? 0 : rect.top - m.top,
    bottom: a.vertical === 'bottom' || a.vertical === 'full' ? canvas.height : rect.bottom + m.bottom,
  }
}

/** The interior vertical safe line and the margin code it enforces, or null. */
function verticalGuard(o: OverlayDescriptor, rect: Rect) {
  // Anchored bottom -> interior side is the TOP line; content dipping below it is
  // too close to the bottom edge -> 'insufficient-bottom-margin'.
  if (o.anchor.vertical === 'bottom')
    return { line: rect.top - o.margins.top, code: 'insufficient-bottom-margin' as const }
  if (o.anchor.vertical === 'top')
    return { line: rect.bottom + o.margins.bottom, code: 'insufficient-top-margin' as const }
  return null // 'full' / null: no vertical guard
}

/** The interior horizontal safe line and the margin code it enforces, or null. */
function horizontalGuard(o: OverlayDescriptor, rect: Rect) {
  if (o.anchor.horizontal === 'left')
    return { line: rect.right + o.margins.right, code: 'insufficient-left-margin' as const }
  if (o.anchor.horizontal === 'right')
    return { line: rect.left - o.margins.left, code: 'insufficient-right-margin' as const }
  return null // 'full' / null: no horizontal guard (e.g. the progress bar's width is dynamic)
}

// -----------------------------------------------------------------------------
// Evaluation
// -----------------------------------------------------------------------------

const round = (n: number) => Math.round(n)

/**
 * Evaluate every content box against one overlay instance. Returns one violation
 * per offending element (empty = clean). An overlay whose rect is null (hidden on
 * this layout) reserves nothing. A content box with a null rect yields a
 * `missing-geometry` violation so incomplete measurements fail loud, not silent.
 *
 * `tolerance` absorbs the ~1px jitter of layout measurement; real collisions are
 * many px, so it never masks them.
 */
export function evaluateOverlay(
  instance: OverlayInstance,
  content: ContentBox[],
  opts: { exceptions?: Exception[]; canvas?: typeof CANVAS; tolerance?: number } = {},
): Violation[] {
  const { descriptor: o, rect: overlay } = instance
  if (!overlay) return []
  const canvas = opts.canvas ?? CANVAS
  const tol = opts.tolerance ?? 1
  const exception = (opts.exceptions ?? []).find((e) => e.overlay === o.id)
  const zone = reservedZone(o, overlay, canvas)
  const vGuard = verticalGuard(o, overlay)
  const hGuard = horizontalGuard(o, overlay)

  const out: Violation[] = []
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
    let code: ViolationCode
    let intrusion: number
    let detail: string

    if (!isEmpty(painted) && width(painted) > tol && height(painted) > tol) {
      // Content sits under (or over) the painted overlay itself.
      const coversOpaque = c.zIndex != null && c.zIndex > o.zIndex && c.opaque
      code = coversOpaque ? 'hidden-by-overlay' : 'overlap'
      intrusion = round(Math.min(width(painted), height(painted)))
      detail = coversOpaque
        ? `element paints an opaque background at z-index ${c.zIndex} over the overlay (z-index ${o.zIndex}), hiding it across ${round(width(painted))}x${round(height(painted))}px.`
        : `element's box enters the overlay's painted area by ${round(width(painted))}x${round(height(painted))}px, so the two render on top of each other.`
    } else {
      // Content sits in the margin buffer (not on the painted overlay). Decide
      // which directional code to report. When BOTH guards are crossed, attribute
      // it to the vertical axis if the content overlaps the overlay's painted
      // horizontal span (it sits ABOVE/BELOW the overlay -> "too close to the
      // edge"), otherwise to the horizontal axis (it sits BESIDE the overlay).
      // This gives actionable advice: a wide panel that dips low is told to clear
      // the bottom, a chip beside the label is told to clear sideways.
      const penV = vGuard ? intrusionPastLine(c.rect, vGuard, o) : -Infinity
      const penH = hGuard ? intrusionPastLine(c.rect, hGuard, o) : -Infinity
      const vViol = penV > tol
      const hViol = penH > tol
      const overlapsX = c.rect.right > overlay.left + tol && c.rect.left < overlay.right - tol
      let axis: 'v' | 'h'
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

    out.push({
      code,
      overlayId: o.id,
      overlayLabel: o.label,
      content: c.label,
      intrusionPx: intrusion,
      detail,
      excepted: !!exception,
      reason: exception?.reason,
    })
  }
  return out
}

/** How far (px) a content rect reaches past an interior safe line (>0 = violating). */
function intrusionPastLine(
  c: Rect,
  guard: { line: number; code: ViolationCode },
  o: OverlayDescriptor,
): number {
  switch (guard.code) {
    case 'insufficient-bottom-margin':
      return c.bottom - guard.line // content dips below the top safe line
    case 'insufficient-top-margin':
      return guard.line - c.top // content rises above the bottom safe line
    case 'insufficient-left-margin':
      return guard.line - c.left // content reaches left past the right safe line
    case 'insufficient-right-margin':
      return c.right - guard.line
    default:
      return -Infinity
  }
}

/**
 * A human, actionable sentence for a buffer intrusion: how deep it reaches, plus
 * the actual and required clearances on every guarded edge of this overlay (so an
 * author sees the full picture, matching the prompt's "keep >= X from the bottom
 * and >= Y from the left" phrasing).
 */
function clearanceDetail(
  c: Rect,
  o: OverlayDescriptor,
  overlay: Rect,
  canvas: typeof CANVAS,
  intrusion: number,
): string {
  const clauses: string[] = []
  if (o.anchor.vertical === 'bottom')
    clauses.push(`>= ${round(canvas.height - overlay.top + o.margins.top)}px from the bottom (now ${round(canvas.height - c.bottom)}px)`)
  if (o.anchor.vertical === 'top')
    clauses.push(`>= ${round(overlay.bottom + o.margins.bottom)}px from the top (now ${round(c.top)}px)`)
  if (o.anchor.horizontal === 'left')
    clauses.push(`>= ${round(overlay.right + o.margins.right)}px from the left (now ${round(c.left)}px)`)
  if (o.anchor.horizontal === 'right')
    clauses.push(`>= ${round(canvas.width - overlay.left + o.margins.left)}px from the right (now ${round(canvas.width - c.right)}px)`)
  return `element reaches ${intrusion}px into the ${o.label}'s reserved zone. Keep it ${clauses.join(' and ')}.`
}

/** Evaluate every overlay on a slide and flatten the violations. */
export function evaluateSlide(
  overlays: OverlayInstance[],
  content: ContentBox[],
  opts: { exceptions?: Exception[]; canvas?: typeof CANVAS; tolerance?: number } = {},
): Violation[] {
  return overlays.flatMap((o) => evaluateOverlay(o, content, opts))
}
