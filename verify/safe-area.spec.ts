/**
 * Unit tests for the safe-area geometry evaluator (verify/safe-area.ts).
 *
 * These are pure, browser-free tests: they feed the evaluator already-measured
 * canvas-pixel rectangles and assert the violations. Tagged @source so they run in
 * the fast lane (`npm run verify:source`, and CI) with no dev server. Between them
 * they cover every case the brief asks for: sufficient clearance, a few-px
 * violation, content fully behind the overlay, content in front covering it, a
 * grouped/transformed box, a rotated card, different viewports, an explicit
 * documented exception, missing geometry, several overlays on one slide, and a
 * previously-green slide.
 */

import { test, expect } from '@playwright/test'
import {
  evaluateOverlay,
  evaluateSlide,
  reservedZone,
  type ContentBox,
  type OverlayDescriptor,
  type OverlayInstance,
  type Rect,
} from './safe-area'

const CANVAS = { width: 980, height: 552 }

// The page/chapter display: bottom-left, small 8px breathing buffer. Its painted
// rect matches what the live check measures on a content slide (footer text).
const pageDisplay: OverlayDescriptor = {
  id: 'page-display',
  label: 'page / chapter display',
  selector: '.miragon-footer-text',
  anchor: { vertical: 'bottom', horizontal: 'left' },
  margins: { top: 8, right: 8, bottom: 0, left: 0 },
  zIndex: 40,
  hiddenLayouts: ['cover', 'closing', 'section'],
}
const footerRect: Rect = { left: 32, top: 526, right: 120, bottom: 540 }
const footer = (): OverlayInstance => ({ descriptor: pageDisplay, rect: { ...footerRect } })

// The progress bar: a full-width top strip; its width is dynamic (deck progress)
// so it must impose NO horizontal clearance, only a top one.
const progressBar: OverlayDescriptor = {
  id: 'progress-bar',
  label: 'progress bar',
  selector: '.miragon-progress',
  anchor: { vertical: 'top', horizontal: 'full' },
  margins: { top: 0, right: 0, bottom: 6, left: 0 },
  zIndex: 50,
  hiddenLayouts: ['cover', 'closing', 'section'],
}
const barRect: Rect = { left: 0, top: 0, right: 400, bottom: 4 }
const bar = (): OverlayInstance => ({ descriptor: progressBar, rect: { ...barRect } })

const box = (rect: Rect | null, over: Partial<ContentBox> = {}): ContentBox => ({
  label: over.label ?? 'div.content',
  rect,
  zIndex: over.zIndex ?? null,
  opaque: over.opaque ?? false,
})

test('reservedZone: bottom-left overlay reserves the corner with the top/right buffer @source', () => {
  const z = reservedZone(pageDisplay, footerRect, CANVAS)
  expect(z).toEqual({ left: 0, top: 526 - 8, right: 120 + 8, bottom: 552 })
})

test('reservedZone: full-width top strip ignores the overlay width @source', () => {
  const z = reservedZone(progressBar, barRect, CANVAS)
  expect(z).toEqual({ left: 0, top: 0, right: 980, bottom: 4 + 6 })
})

test('sufficient clearance: content well away from the overlay passes @source', () => {
  const content = [
    box({ left: 200, top: 100, right: 600, bottom: 300 }),
    box({ left: 200, top: 480, right: 300, bottom: 505 }), // low but above the 518 safe line
    box({ left: 150, top: 500, right: 400, bottom: 545 }), // low but right of the 128 safe line
  ]
  expect(evaluateOverlay(footer(), content)).toEqual([])
})

test('few-px violation: content dipping 4px past the safe line is flagged @source', () => {
  const content = [box({ left: 60, top: 400, right: 160, bottom: 522 })] // safe line = 518
  const v = evaluateOverlay(footer(), content)
  expect(v).toHaveLength(1)
  expect(v[0].code).toBe('insufficient-bottom-margin')
  expect(v[0].intrusionPx).toBe(4)
  expect(v[0].overlayId).toBe('page-display')
  expect(v[0].excepted).toBe(false)
})

test('content fully behind the overlay (lower z-index) is an overlap @source', () => {
  const content = [box({ left: 40, top: 528, right: 100, bottom: 538 }, { zIndex: null })]
  const v = evaluateOverlay(footer(), content)
  expect(v).toHaveLength(1)
  expect(v[0].code).toBe('overlap')
})

test('content in front covering the overlay (higher z, opaque) hides it @source', () => {
  const content = [box({ left: 20, top: 520, right: 200, bottom: 552 }, { zIndex: 60, opaque: true })]
  const v = evaluateOverlay(footer(), content)
  expect(v).toHaveLength(1)
  expect(v[0].code).toBe('hidden-by-overlay')
})

test('grouped/transformed element: its post-transform AABB in the zone is caught @source', () => {
  // A translated group whose declared position is elsewhere but whose rendered
  // bounding box (what getBoundingClientRect returns) lands on the footer.
  const content = [box({ left: 50, top: 524, right: 150, bottom: 545 }, { label: 'g.diagram-group' })]
  const v = evaluateOverlay(footer(), content)
  expect(v).toHaveLength(1)
  expect(v[0].code).toBe('overlap')
})

test('rotated card: the enlarged axis-aligned box is caught @source', () => {
  // A rotated card's AABB is wider/taller than the card; it reaches into the zone.
  const content = [box({ left: 70, top: 505, right: 210, bottom: 548 }, { label: 'div.mg-card', opaque: true })]
  const v = evaluateOverlay(footer(), content)
  expect(v).toHaveLength(1)
  expect(['overlap', 'insufficient-bottom-margin']).toContain(v[0].code)
})

test('different viewports: canvas-space result is scale-independent @source', () => {
  // The caller converts viewport px -> canvas px with one scale; the same physical
  // layout at 1x and at 2x must yield the identical violation.
  const toCanvas = (r: Rect, scale: number, ox: number, oy: number): Rect => ({
    left: (r.left - ox) / scale,
    top: (r.top - oy) / scale,
    right: (r.right - ox) / scale,
    bottom: (r.bottom - oy) / scale,
  })
  const viewportRect = { left: 60, top: 400, right: 160, bottom: 522 } // at scale 1
  const at1 = evaluateOverlay(footer(), [box(toCanvas(viewportRect, 1, 0, 0))])
  const scale = 2
  const at2 = evaluateOverlay(footer(), [
    box(toCanvas({ left: 120, top: 800, right: 320, bottom: 1044 }, scale, 0, 0)),
  ])
  expect(at2[0].code).toBe(at1[0].code)
  expect(at2[0].intrusionPx).toBe(at1[0].intrusionPx)
})

test('explicit documented exception: reported but not silently ignored @source', () => {
  const content = [box({ left: 60, top: 400, right: 160, bottom: 522 })]
  const v = evaluateOverlay(footer(), content, {
    exceptions: [{ overlay: 'page-display', reason: 'full-bleed map bleeds behind the label by design' }],
  })
  expect(v).toHaveLength(1)
  expect(v[0].excepted).toBe(true)
  expect(v[0].reason).toContain('full-bleed map')
  // An exception for a DIFFERENT overlay does not apply here.
  const other = evaluateOverlay(footer(), content, { exceptions: [{ overlay: 'progress-bar', reason: 'x' }] })
  expect(other[0].excepted).toBe(false)
})

test('missing geometry: an element without a box fails loud, not silent @source', () => {
  const v = evaluateOverlay(footer(), [box(null, { label: 'svg.diagram' })])
  expect(v).toHaveLength(1)
  expect(v[0].code).toBe('missing-geometry')
})

test('progress bar: content far to the right at the top gets only a top-margin code @source', () => {
  // Regression guard: the bar's dynamic width must never demand horizontal clearance.
  const content = [box({ left: 600, top: 2, right: 760, bottom: 8 }, { label: 'span.kicker' })]
  const v = evaluateOverlay(bar(), content)
  expect(v).toHaveLength(1)
  expect(v[0].code).toBe('insufficient-top-margin')
})

test('multiple overlays on one slide: each is evaluated @source', () => {
  const content = [
    box({ left: 40, top: 528, right: 110, bottom: 545 }, { label: 'p.caption' }), // hits page display
    box({ left: 100, top: 5, right: 300, bottom: 9 }, { label: 'div.kicker' }), // in the bar's 6px buffer
  ]
  const v = evaluateSlide([footer(), bar()], content)
  const codes = v.map((x) => `${x.overlayId}:${x.code}`)
  expect(codes).toContain('page-display:overlap')
  expect(codes).toContain('progress-bar:insufficient-top-margin')
})

test('hidden overlay (null rect) reserves nothing @source', () => {
  const hidden: OverlayInstance = { descriptor: pageDisplay, rect: null }
  expect(evaluateOverlay(hidden, [box({ left: 0, top: 540, right: 200, bottom: 552 })])).toEqual([])
})

test('previously-green slide: a realistic clean layout stays clean @source', () => {
  const content = [
    box({ left: 80, top: 60, right: 900, bottom: 110 }, { label: 'h1' }),
    box({ left: 80, top: 160, right: 880, bottom: 200 }, { label: 'li' }),
    box({ left: 80, top: 210, right: 880, bottom: 250 }, { label: 'li' }),
    box({ left: 80, top: 300, right: 500, bottom: 505 }, { label: 'div.mg-card', opaque: true }),
  ]
  expect(evaluateSlide([footer(), bar()], content)).toEqual([])
})
