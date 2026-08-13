// Unit tests for the content-heading rule's pure core (ported from #109's spec).
// @source-lane equivalent: no browser. Width-based cases belong to the DOM checks.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { scanHeading } from '../src/rules/source/content-heading.mjs'

test('short single-line heading passes', () => {
  assert.deepEqual(scanHeading('Slides are Markdown', 'content'), [])
})

test('heading exactly at the limit passes; one over fails', () => {
  assert.deepEqual(scanHeading('x'.repeat(50), 'content'), [])
  const reasons = scanHeading('x'.repeat(51), 'content')
  assert.equal(reasons.length, 1)
  assert.ok(reasons[0].includes('51 characters'))
  assert.ok(reasons[0].includes('up to 50'))
})

test('explicit breaks fail: <br>, literal newline, trailing backslash', () => {
  assert.ok(scanHeading('One line<br>Two line', 'content')[0].includes('explicit line break'))
  assert.ok(scanHeading('One line<br />Two line', 'content')[0].includes('explicit line break'))
  assert.ok(scanHeading('One line\nTwo line', 'content')[0].includes('explicit line break'))
  assert.ok(scanHeading('One line \\', 'content')[0].includes('explicit line break'))
})

test('code points count as one: umlauts, accents, emoji', () => {
  assert.deepEqual(scanHeading('ä'.repeat(10), 'content'), [])
  assert.deepEqual(scanHeading('x'.repeat(49) + '🚀', 'content'), [])
  assert.ok(scanHeading('x'.repeat(50) + '🚀', 'content')[0].includes('51 characters'))
})

test('same length, different glyph width: BOTH pass (width is the DOM check)', () => {
  assert.deepEqual(scanHeading('W'.repeat(45), 'content'), [])
  assert.deepEqual(scanHeading('i'.repeat(45), 'content'), [])
})

test('per-layout budgets differ (content-image column is narrower)', () => {
  assert.deepEqual(scanHeading('x'.repeat(40), 'content'), [])
  assert.ok(scanHeading('x'.repeat(40), 'content-image')[0].includes('up to 28'))
})

test('statement layouts are ignored, however long or multiline', () => {
  const long = 'You write the content. The brand is already done, and then some.'
  assert.deepEqual(scanHeading(long, 'hero'), [])
  assert.deepEqual(scanHeading('Big\nStatement', 'section'), [])
  assert.deepEqual(scanHeading(long, undefined), [])
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
