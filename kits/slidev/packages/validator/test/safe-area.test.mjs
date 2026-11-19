// Unit tests for the safe-area geometry evaluator (ported from verify/safe-area.spec.ts).
// Pure, browser-free: feed the evaluator already-measured canvas-pixel rectangles
// and assert the violations. Covers sufficient clearance, a few-px violation,
// content behind / in front of the overlay, transformed/rotated boxes, viewport
// independence, a documented exception, missing geometry, multiple overlays, and a
// clean slide.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { evaluateOverlay, evaluateSlide, reservedZone } from '../src/rules/rendered/safe-area/model.mjs'

const CANVAS = { width: 980, height: 552 }

const pageDisplay = {
  id: 'page-display',
  label: 'page / chapter display',
  selector: '.miragon-footer-text',
  anchor: { vertical: 'bottom', horizontal: 'left' },
  margins: { top: 8, right: 8, bottom: 0, left: 0 },
  zIndex: 40,
  hiddenLayouts: ['cover', 'closing', 'section'],
}
const footerRect = { left: 32, top: 526, right: 120, bottom: 540 }
const footer = () => ({ descriptor: pageDisplay, rect: { ...footerRect } })

const progressBar = {
  id: 'progress-bar',
  label: 'progress bar',
  selector: '.miragon-progress',
  anchor: { vertical: 'top', horizontal: 'full' },
  margins: { top: 0, right: 0, bottom: 6, left: 0 },
  zIndex: 50,
  hiddenLayouts: ['cover', 'closing', 'section'],
}
const barRect = { left: 0, top: 0, right: 400, bottom: 4 }
const bar = () => ({ descriptor: progressBar, rect: { ...barRect } })

const box = (rect, over = {}) => ({
  label: over.label ?? 'div.content',
  rect,
  zIndex: over.zIndex ?? null,
  opaque: over.opaque ?? false,
})

test('reservedZone: bottom-left overlay reserves the corner with the top/right buffer', () => {
  assert.deepEqual(reservedZone(pageDisplay, footerRect, CANVAS), { left: 0, top: 526 - 8, right: 120 + 8, bottom: 552 })
})

test('reservedZone: full-width top strip ignores the overlay width', () => {
  assert.deepEqual(reservedZone(progressBar, barRect, CANVAS), { left: 0, top: 0, right: 980, bottom: 4 + 6 })
})

test('sufficient clearance: content well away from the overlay passes', () => {
  const content = [
    box({ left: 200, top: 100, right: 600, bottom: 300 }),
    box({ left: 200, top: 480, right: 300, bottom: 505 }),
    box({ left: 150, top: 500, right: 400, bottom: 545 }),
  ]
  assert.deepEqual(evaluateOverlay(footer(), content), [])
})

test('few-px violation: content dipping 4px past the safe line is flagged', () => {
  const v = evaluateOverlay(footer(), [box({ left: 60, top: 400, right: 160, bottom: 522 })])
  assert.equal(v.length, 1)
  assert.equal(v[0].code, 'insufficient-bottom-margin')
  assert.equal(v[0].intrusionPx, 4)
  assert.equal(v[0].overlayId, 'page-display')
  assert.equal(v[0].excepted, false)
})

test('content fully behind the overlay (lower z-index) is an overlap', () => {
  const v = evaluateOverlay(footer(), [box({ left: 40, top: 528, right: 100, bottom: 538 }, { zIndex: null })])
  assert.equal(v.length, 1)
  assert.equal(v[0].code, 'overlap')
})

test('content in front covering the overlay (higher z, opaque) hides it', () => {
  const v = evaluateOverlay(footer(), [box({ left: 20, top: 520, right: 200, bottom: 552 }, { zIndex: 60, opaque: true })])
  assert.equal(v.length, 1)
  assert.equal(v[0].code, 'hidden-by-overlay')
})

test('grouped/transformed element: its post-transform AABB in the zone is caught', () => {
  const v = evaluateOverlay(footer(), [box({ left: 50, top: 524, right: 150, bottom: 545 }, { label: 'g.diagram-group' })])
  assert.equal(v.length, 1)
  assert.equal(v[0].code, 'overlap')
})

test('rotated card: the enlarged axis-aligned box is caught', () => {
  const v = evaluateOverlay(footer(), [box({ left: 70, top: 505, right: 210, bottom: 548 }, { label: 'div.mg-card', opaque: true })])
  assert.equal(v.length, 1)
  assert.ok(['overlap', 'insufficient-bottom-margin'].includes(v[0].code))
})

test('different viewports: canvas-space result is scale-independent', () => {
  const toCanvas = (r, scale, ox, oy) => ({ left: (r.left - ox) / scale, top: (r.top - oy) / scale, right: (r.right - ox) / scale, bottom: (r.bottom - oy) / scale })
  const at1 = evaluateOverlay(footer(), [box(toCanvas({ left: 60, top: 400, right: 160, bottom: 522 }, 1, 0, 0))])
  const at2 = evaluateOverlay(footer(), [box(toCanvas({ left: 120, top: 800, right: 320, bottom: 1044 }, 2, 0, 0))])
  assert.equal(at2[0].code, at1[0].code)
  assert.equal(at2[0].intrusionPx, at1[0].intrusionPx)
})

test('explicit documented exception: reported but not silently ignored', () => {
  const content = [box({ left: 60, top: 400, right: 160, bottom: 522 })]
  const v = evaluateOverlay(footer(), content, { exceptions: [{ overlay: 'page-display', reason: 'full-bleed map bleeds behind the label by design' }] })
  assert.equal(v.length, 1)
  assert.equal(v[0].excepted, true)
  assert.ok(v[0].reason.includes('full-bleed map'))
  const other = evaluateOverlay(footer(), content, { exceptions: [{ overlay: 'progress-bar', reason: 'x' }] })
  assert.equal(other[0].excepted, false)
})

test('missing geometry: an element without a box fails loud, not silent', () => {
  const v = evaluateOverlay(footer(), [box(null, { label: 'svg.diagram' })])
  assert.equal(v.length, 1)
  assert.equal(v[0].code, 'missing-geometry')
})

test('progress bar: content far to the right at the top gets only a top-margin code', () => {
  const v = evaluateOverlay(bar(), [box({ left: 600, top: 2, right: 760, bottom: 8 }, { label: 'span.kicker' })])
  assert.equal(v.length, 1)
  assert.equal(v[0].code, 'insufficient-top-margin')
})

test('multiple overlays on one slide: each is evaluated', () => {
  const content = [
    box({ left: 40, top: 528, right: 110, bottom: 545 }, { label: 'p.caption' }),
    box({ left: 100, top: 5, right: 300, bottom: 9 }, { label: 'div.kicker' }),
  ]
  const codes = evaluateSlide([footer(), bar()], content).map((x) => `${x.overlayId}:${x.code}`)
  assert.ok(codes.includes('page-display:overlap'))
  assert.ok(codes.includes('progress-bar:insufficient-top-margin'))
})

test('hidden overlay (null rect) reserves nothing', () => {
  const hidden = { descriptor: pageDisplay, rect: null }
  assert.deepEqual(evaluateOverlay(hidden, [box({ left: 0, top: 540, right: 200, bottom: 552 })]), [])
})

test('previously-green slide: a realistic clean layout stays clean', () => {
  const content = [
    box({ left: 80, top: 60, right: 900, bottom: 110 }, { label: 'h1' }),
    box({ left: 80, top: 160, right: 880, bottom: 200 }, { label: 'li' }),
    box({ left: 80, top: 210, right: 880, bottom: 250 }, { label: 'li' }),
    box({ left: 80, top: 300, right: 500, bottom: 505 }, { label: 'div.mg-card', opaque: true }),
  ]
  assert.deepEqual(evaluateSlide([footer(), bar()], content), [])
})
