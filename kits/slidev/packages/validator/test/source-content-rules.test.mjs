// Unit tests for the five content rules that moved from rendered (browser) to
// source (static). Each rule exposes a pure core so these run with node:test only,
// no server. Coverage parity with the old rendered checks is the point: the source
// scan must catch what reached the DOM before.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { findEmDashes } from '../src/rules/source/no-em-dash.mjs'
import { findEmojis } from '../src/rules/source/no-emoji.mjs'
import { findInlineFonts } from '../src/rules/source/no-inline-font.mjs'
import { findRestyledBullets } from '../src/rules/source/no-restyled-bullets.mjs'
import { countNestedLists } from '../src/rules/source/no-nested-bullets.mjs'

// --- no-em-dash -------------------------------------------------------------

test('em-dash: literal em-dash in body is flagged with its line', () => {
  assert.deepEqual(findEmDashes('# Title\n\nA sentence — with a dash.'), [3])
})

test('em-dash: a frontmatter title em-dash is caught (renders as a heading)', () => {
  assert.deepEqual(findEmDashes('---\ntitle: Before — after\nlayout: content\n---\n\nBody'), [2])
})

test('em-dash: em-dash inside a speaker-note comment is exempt', () => {
  assert.deepEqual(findEmDashes('Body text\n\n<!-- note — in another language -->'), [])
  // a real em-dash on the same line as a note still counts
  assert.deepEqual(findEmDashes('Real — dash <!-- and — a noted one -->'), [1])
})

test('em-dash: a plain hyphen or double hyphen is not an em-dash', () => {
  assert.deepEqual(findEmDashes('foo-bar and a -- b'), [])
})

// --- no-emoji ---------------------------------------------------------------

test('emoji: a literal emoji is flagged; plain text is clean', () => {
  assert.deepEqual(findEmojis('Ship it 🚀 now'), [1])
  assert.deepEqual(findEmojis('Ship it now'), [])
})

test('emoji: emoji inside a speaker-note comment is exempt', () => {
  assert.deepEqual(findEmojis('Body\n\n<!-- note 🎉 -->'), [])
})

// --- no-inline-font ---------------------------------------------------------

test('inline-font: a style attribute setting font-family is flagged', () => {
  assert.deepEqual(findInlineFonts('<Card style="font-family: serif">x</Card>'), [1])
  assert.deepEqual(findInlineFonts(`<Card :style="'font-family: serif'">x</Card>`), [1])
})

test('inline-font: a spacing-only style attribute passes', () => {
  assert.deepEqual(findInlineFonts('<Card style="margin-top: 2rem">x</Card>'), [])
})

test('inline-font: font-family inside a fenced code block is not applied, so not flagged', () => {
  assert.deepEqual(findInlineFonts('```html\n<div style="font-family: serif"></div>\n```'), [])
})

test('inline-font: a data-style / other-suffix attribute is not the style attribute', () => {
  assert.deepEqual(findInlineFonts('<Widget data-style="font-family: serif">x</Widget>'), [])
})

// --- no-restyled-bullets ----------------------------------------------------

test('restyled-bullets: a style attribute overriding list-style is flagged', () => {
  assert.deepEqual(findRestyledBullets('<ul style="list-style: none"><li>x</li></ul>'), [1])
})

test('restyled-bullets: list-style inside inline code is not flagged', () => {
  assert.deepEqual(findRestyledBullets('Use `list-style: none` sparingly.'), [])
})

// --- no-nested-bullets ------------------------------------------------------

test('nested-bullets: a single-level list is clean', () => {
  assert.equal(countNestedLists('- one\n- two\n- three'), 0)
})

test('nested-bullets: an indented sub-bullet is a nested level', () => {
  assert.equal(countNestedLists('- one\n  - nested a\n  - nested b\n- two'), 1)
})

test('nested-bullets: ordered-under-bullet also counts', () => {
  assert.equal(countNestedLists('- one\n  1. step a\n  2. step b'), 1)
})

test('nested-bullets: empty or non-string content is a no-op', () => {
  assert.equal(countNestedLists(''), 0)
  assert.equal(countNestedLists(undefined), 0)
})
