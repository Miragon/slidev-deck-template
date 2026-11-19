import { test } from 'node:test'
import assert from 'node:assert/strict'
import { scanWindowSlide } from '../src/rules/source/window-tabs.mjs'

test('a window slide with well-formed tabs passes', () => {
  const frontmatter = {
    layout: 'window',
    tabs: [
      { label: 'recruitment.bpmn', caption: '**Happy path**' },
      { label: 'Main.kt', icon: false, lang: 'kotlin' },
      { label: 'notes', icon: 'i-lucide-file-text' },
    ],
  }
  assert.deepEqual(scanWindowSlide(frontmatter), [])
})

test('a window slide without tabs passes', () => {
  assert.deepEqual(scanWindowSlide({ layout: 'window' }), [])
})

test('other layouts are ignored, even with the same keys', () => {
  assert.deepEqual(scanWindowSlide({ layout: 'content', files: ['a'], lang: 'ts' }), [])
  assert.deepEqual(scanWindowSlide({}), [])
})

test('the removed code layout points at window', () => {
  const [reason] = scanWindowSlide({ layout: 'code' })
  assert.ok(reason.includes('renamed to `window`'))
})

test('every removed key of the code layout is named', () => {
  const reasons = scanWindowSlide({ layout: 'window', files: ['a'], icons: ['x'], tabIcon: false, lang: 'ts' })
  for (const key of ['files', 'icons', 'tabIcon', 'lang']) {
    assert.ok(reasons.some((r) => r.startsWith(`\`${key}:\``)), `${key} must be reported`)
  }
})

test('a string shorthand entry is rejected', () => {
  const [reason] = scanWindowSlide({ layout: 'window', tabs: ['Main.kt'] })
  assert.ok(reason.includes('tabs[0] must be an object'))
})

test('a tab without label, with an unknown key or a wrong type is reported', () => {
  const reasons = scanWindowSlide({ layout: 'window', tabs: [{ name: 'Main.kt', icon: 3, caption: 1 }] })
  assert.ok(reasons.some((r) => r.includes('needs a `label`')))
  assert.ok(reasons.some((r) => r.includes('unknown key `name`')))
  assert.ok(reasons.some((r) => r.includes('icon must be')))
  assert.ok(reasons.some((r) => r.includes('caption must be a string')))
})

test('tabs that is not a list is reported', () => {
  const [reason] = scanWindowSlide({ layout: 'window', tabs: { label: 'a' } })
  assert.ok(reason.includes('must be a list'))
})
