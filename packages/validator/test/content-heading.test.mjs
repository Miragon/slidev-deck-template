// Unit tests for the content-heading rule's pure core (ported from #109's spec).
// @source-lane equivalent: no browser. Width-based cases belong to the DOM checks.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { scanHeading } from '../src/rules/source/content-heading.mjs'

test('short single-line heading passes', () => {
  assert.deepEqual(scanHeading('Slides are Markdown', 'content'), [])
})

test('heading exactly at the limit passes; one over fails', () => {
  assert.deepEqual(scanHeading('x'.repeat(44), 'content'), [])
  const reasons = scanHeading('x'.repeat(45), 'content')
  assert.equal(reasons.length, 1)
  assert.ok(reasons[0].includes('45 characters'))
  assert.ok(reasons[0].includes('up to 44'))
})

test('a heading that fits headless but wraps in Geist (the ~47-char band) is flagged', () => {
  // "Four things quietly break, each yours to handle" — 47 chars, wraps in the browser.
  const reasons = scanHeading('Four things quietly break, each yours to handle', 'content')
  assert.equal(reasons.length, 1)
  assert.ok(reasons[0].includes('47 characters'))
  assert.ok(reasons[0].includes('up to 44'))
})

test('explicit breaks fail: <br>, literal newline, trailing backslash', () => {
  assert.ok(scanHeading('One line<br>Two line', 'content')[0].includes('explicit line break'))
  assert.ok(scanHeading('One line<br />Two line', 'content')[0].includes('explicit line break'))
  assert.ok(scanHeading('One line\nTwo line', 'content')[0].includes('explicit line break'))
  assert.ok(scanHeading('One line \\', 'content')[0].includes('explicit line break'))
})

test('code points count as one: umlauts, accents, emoji', () => {
  assert.deepEqual(scanHeading('ä'.repeat(10), 'content'), [])
  assert.deepEqual(scanHeading('x'.repeat(43) + '🚀', 'content'), [])
  assert.ok(scanHeading('x'.repeat(44) + '🚀', 'content')[0].includes('45 characters'))
})

test('same length, different glyph width: BOTH pass (width is the DOM check)', () => {
  assert.deepEqual(scanHeading('W'.repeat(44), 'content'), [])
  assert.deepEqual(scanHeading('i'.repeat(44), 'content'), [])
})

test('per-layout budgets differ (content-image column is narrower, wide layouts roomier)', () => {
  assert.deepEqual(scanHeading('x'.repeat(24), 'content-image'), [])
  assert.ok(scanHeading('x'.repeat(25), 'content-image')[0].includes('up to 24'))
  assert.deepEqual(scanHeading('x'.repeat(49), 'showcase'), [])
  assert.ok(scanHeading('x'.repeat(50), 'bpmn')[0].includes('up to 49'))
})

test('statement layouts are ignored, however long or multiline', () => {
  const long = 'You write the content. The brand is already done, and then some.'
  for (const layout of ['hero', 'section', 'subsection', 'cover', 'closing', 'default']) {
    assert.deepEqual(scanHeading(long, layout), [], `${layout} must not be budget-checked`)
  }
  assert.deepEqual(scanHeading('Big\nStatement', 'section'), [])
  assert.deepEqual(scanHeading(long, undefined), [])
})

test('non-statement, title-bearing layouts default to the base limit, not a silent pass', () => {
  // A layout without its own entry (e.g. a deck-local archetype) uses BASE_LIMIT (44).
  assert.deepEqual(scanHeading('x'.repeat(44), 'person'), [])
  assert.ok(scanHeading('x'.repeat(45), 'person')[0].includes('up to 44'))
  assert.deepEqual(scanHeading('x'.repeat(44), 'deck-local-archetype'), [])
  assert.ok(scanHeading('x'.repeat(45), 'deck-local-archetype')[0].includes('up to 44'))
})

test('opt-out suppresses both checks', () => {
  const bad = 'x'.repeat(80) + '<br>more'
  assert.ok(scanHeading(bad, 'content').length > 0)
  assert.deepEqual(scanHeading(bad, 'content', true), [])
})

test('empty / whitespace-only title is a no-op', () => {
  assert.deepEqual(scanHeading(undefined, 'content'), [])
  assert.deepEqual(scanHeading('   ', 'content'), [])
})
