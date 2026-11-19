import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { rmSync } from 'node:fs'
import { join } from 'node:path'
import { BUILD_DIR, buildSite, newSite } from './support.mjs'
import { assertExampleSite } from './example-site.mjs'

after(() => rmSync(BUILD_DIR, { recursive: true, force: true }))

test('the example site builds with the package: anchors, legal row, head, favicon, Mermaid, base', () => {
  const site = newSite('example')
  const result = buildSite(site, '/beispiel/')
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assertExampleSite(join(site, '.vitepress/dist'))
})
